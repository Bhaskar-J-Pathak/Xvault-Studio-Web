-- ============================================================
-- Migration 0018: Split consume_ai_request into check + commit
--
-- Problem: consume_ai_request deducts credits atomically BEFORE
-- the AI call. If the AI call fails (Gemini rate limit, timeout,
-- etc.) the credit is permanently lost even though no response
-- was generated.
--
-- Solution: Two separate functions:
--   check_ai_quota   — read-only quota check, no side effects
--   commit_ai_request — credit deduction, called only after AI
--                       returns a successful response
-- ============================================================

-- ── 1. check_ai_quota ─────────────────────────────────────────────────────────
-- Mirrors consume_ai_request logic exactly but performs NO writes.
-- All resets (month rollover, trial transition) are computed virtually
-- on the local variable without touching the DB.
CREATE OR REPLACE FUNCTION check_ai_quota(
  p_user_id UUID,
  p_credits  INT DEFAULT 1
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_profile   profiles%ROWTYPE;
  v_limit     INT;
  v_in_trial  BOOLEAN;
  v_trial_cap INT;
  v_monthly   INT;  -- effective monthly counter after virtual resets
BEGIN
  SELECT * INTO v_profile FROM profiles WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found for user %', p_user_id;
  END IF;

  -- ── Virtual calendar-month reset ──────────────────────────────────────────
  v_monthly := v_profile.ai_requests_this_month;
  IF date_trunc('month', now()) > date_trunc('month', v_profile.requests_reset_at) THEN
    v_monthly := 0;
  END IF;

  -- ── Trial path: 100-credit lifetime cap ───────────────────────────────────
  v_in_trial := v_profile.trial_ends_at IS NOT NULL
                AND v_profile.trial_ends_at > now();

  IF v_in_trial THEN
    v_trial_cap := 100 + COALESCE(v_profile.bonus_credits, 0);

    IF v_profile.ai_requests_total + p_credits > v_trial_cap THEN
      RETURN jsonb_build_object(
        'allowed',   false,
        'reason',    'trial_limit',
        'remaining', GREATEST(0, v_trial_cap - v_profile.ai_requests_total)
      );
    END IF;

    RETURN jsonb_build_object(
      'allowed',   true,
      'remaining', GREATEST(0, v_trial_cap - v_profile.ai_requests_total - p_credits)
    );
  END IF;

  -- ── Virtual trial-to-post-trial transition reset ──────────────────────────
  IF v_profile.trial_ends_at IS NOT NULL
     AND v_profile.trial_ends_at <= now()
     AND v_profile.requests_reset_at < v_profile.trial_ends_at THEN
    v_monthly := 0;
  END IF;

  -- ── Post-trial monthly cap ─────────────────────────────────────────────────
  v_limit := CASE v_profile.plan
    WHEN 'hobbyist'       THEN 300
    WHEN 'founder_circle' THEN 600
    ELSE 50
  END;

  IF COALESCE(v_profile.is_lifetime, false) THEN
    v_limit := GREATEST(v_limit, 600);
  END IF;

  v_limit := v_limit + COALESCE(v_profile.bonus_credits, 0);

  IF v_monthly + p_credits > v_limit THEN
    RETURN jsonb_build_object(
      'allowed',   false,
      'reason',    'plan_limit',
      'remaining', GREATEST(0, v_limit - v_monthly)
    );
  END IF;

  RETURN jsonb_build_object(
    'allowed',   true,
    'remaining', GREATEST(0, v_limit - v_monthly - p_credits)
  );
END;
$$;


-- ── 2. commit_ai_request ──────────────────────────────────────────────────────
-- Called after a successful AI response. Applies any pending resets
-- (month rollover, trial transition) then increments the counters.
-- Uses FOR UPDATE to prevent concurrent double-spend at the boundary.
-- Does NOT re-validate the quota — trust that check_ai_quota passed.
CREATE OR REPLACE FUNCTION commit_ai_request(
  p_user_id UUID,
  p_credits  INT DEFAULT 1
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_profile profiles%ROWTYPE;
BEGIN
  SELECT * INTO v_profile FROM profiles WHERE id = p_user_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found for user %', p_user_id;
  END IF;

  -- ── Calendar-month reset ──────────────────────────────────────────────────
  IF date_trunc('month', now()) > date_trunc('month', v_profile.requests_reset_at) THEN
    UPDATE profiles
    SET ai_requests_this_month = 0,
        requests_reset_at      = now()
    WHERE id = p_user_id;
    v_profile.ai_requests_this_month := 0;
  END IF;

  -- ── Trial-to-post-trial transition reset ──────────────────────────────────
  IF v_profile.trial_ends_at IS NOT NULL
     AND v_profile.trial_ends_at <= now()
     AND v_profile.requests_reset_at < v_profile.trial_ends_at THEN
    UPDATE profiles
    SET ai_requests_this_month = 0,
        requests_reset_at      = v_profile.trial_ends_at
    WHERE id = p_user_id;
    v_profile.ai_requests_this_month := 0;
  END IF;

  -- ── Deduct credits ────────────────────────────────────────────────────────
  UPDATE profiles
  SET ai_requests_this_month = ai_requests_this_month + p_credits,
      ai_requests_total      = ai_requests_total      + p_credits,
      updated_at             = now()
  WHERE id = p_user_id;

  RETURN jsonb_build_object('ok', true);
END;
$$;
