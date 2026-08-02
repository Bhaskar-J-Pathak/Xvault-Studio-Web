-- ============================================================
-- Migration 0014: Remove scribe and pro plans
-- ============================================================
-- Active plans going forward: free, hobbyist, founder_circle
-- Scribe mapped to hobbyist (same 300-credit limit).
-- Pro mapped to hobbyist (no active pro subscribers at launch).
-- ============================================================

-- ── 1. Migrate any existing rows ──────────────────────────────────────────────
UPDATE profiles SET plan = 'hobbyist' WHERE plan = 'scribe';
UPDATE profiles SET plan = 'hobbyist' WHERE plan = 'pro';

-- ── 2. Replace the plan check constraint ──────────────────────────────────────
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_plan_check;
ALTER TABLE profiles
  ADD CONSTRAINT profiles_plan_check
  CHECK (plan IN ('free', 'hobbyist', 'founder_circle'));

-- ── 3. Update consume_ai_request — remove scribe/pro branches ─────────────────
CREATE OR REPLACE FUNCTION consume_ai_request(
  p_user_id UUID,
  p_credits  INT DEFAULT 1
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_profile    profiles%ROWTYPE;
  v_limit      INT;
  v_in_trial   BOOLEAN;
  v_trial_cap  INT;
  v_remaining  INT;
BEGIN
  SELECT * INTO v_profile
  FROM profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found for user %', p_user_id;
  END IF;

  -- ── 1. Calendar-month reset ────────────────────────────────────────────────
  IF date_trunc('month', now()) > date_trunc('month', v_profile.requests_reset_at) THEN
    UPDATE profiles
    SET ai_requests_this_month = 0,
        requests_reset_at      = now()
    WHERE id = p_user_id;
    v_profile.ai_requests_this_month := 0;
  END IF;

  -- ── 2. Trial path: 100-credit lifetime cap ─────────────────────────────────
  v_in_trial := v_profile.trial_ends_at IS NOT NULL
                AND v_profile.trial_ends_at > now();

  IF v_in_trial THEN
    v_trial_cap := 100 + v_profile.bonus_credits;

    IF v_profile.ai_requests_total + p_credits > v_trial_cap THEN
      RETURN jsonb_build_object(
        'allowed',   false,
        'reason',    'trial_limit',
        'remaining', GREATEST(0, v_trial_cap - v_profile.ai_requests_total)
      );
    END IF;

    UPDATE profiles
    SET ai_requests_this_month = ai_requests_this_month + p_credits,
        ai_requests_total      = ai_requests_total      + p_credits,
        updated_at             = now()
    WHERE id = p_user_id;

    RETURN jsonb_build_object(
      'allowed',   true,
      'remaining', v_trial_cap - v_profile.ai_requests_total - p_credits
    );
  END IF;

  -- ── 3. Trial-to-post-trial transition reset ────────────────────────────────
  IF v_profile.trial_ends_at IS NOT NULL
     AND v_profile.trial_ends_at <= now()
     AND v_profile.requests_reset_at < v_profile.trial_ends_at THEN

    UPDATE profiles
    SET ai_requests_this_month = 0,
        requests_reset_at      = v_profile.trial_ends_at
    WHERE id = p_user_id;
    v_profile.ai_requests_this_month := 0;
  END IF;

  -- ── 4. Post-trial monthly cap ──────────────────────────────────────────────
  v_limit := CASE v_profile.plan
    WHEN 'hobbyist'       THEN 300
    WHEN 'founder_circle' THEN 600
    ELSE 50  -- 'free' or any unrecognised value
  END;

  IF COALESCE(v_profile.is_lifetime, false) THEN
    v_limit := GREATEST(v_limit, 600);
  END IF;

  v_limit := v_limit + COALESCE(v_profile.bonus_credits, 0);

  IF v_profile.ai_requests_this_month + p_credits > v_limit THEN
    RETURN jsonb_build_object(
      'allowed',   false,
      'reason',    'plan_limit',
      'remaining', GREATEST(0, v_limit - v_profile.ai_requests_this_month)
    );
  END IF;

  UPDATE profiles
  SET ai_requests_this_month = ai_requests_this_month + p_credits,
      ai_requests_total      = ai_requests_total      + p_credits,
      updated_at             = now()
  WHERE id = p_user_id;

  v_remaining := v_limit - v_profile.ai_requests_this_month - p_credits;
  RETURN jsonb_build_object(
    'allowed',   true,
    'remaining', GREATEST(0, v_remaining)
  );
END;
$$;
