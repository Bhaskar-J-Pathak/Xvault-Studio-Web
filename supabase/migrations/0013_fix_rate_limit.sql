-- ============================================================
-- Migration 0013: Fix consume_ai_request
-- SUPERSEDED BY 0014 — run 0014 instead (it includes all fixes here plus plan cleanup).
-- ============================================================
-- Problems fixed:
--   1. Wrong post-trial plan limits:
--        free         → was 15,   now 50
--        pro          → was 1200, now 600 (matches frontend)
--        hobbyist     → was 15,   now 300 (was missing from CASE)
--        founder_circle → was 15, now 600 (was missing from CASE)
--        is_lifetime  → now always gets 600 minimum
--   2. Trial usage bleeds into ai_requests_this_month.
--      When a user's trial expires, their monthly counter still
--      holds all trial-period usage, so they immediately hit the
--      post-trial limit and see 429s despite appearing to have credits.
--      Fix: on the first post-trial request, reset the monthly counter.
-- ============================================================

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
  -- On the first post-trial request, ai_requests_this_month still holds all
  -- trial-period usage (which can be 80-100 credits). Reset it so the user
  -- starts their free/paid monthly allowance from zero.
  -- Condition: had a trial (trial_ends_at IS NOT NULL), trial has now expired
  --            (trial_ends_at <= now()), and the monthly counter was last reset
  --            before the trial ended (meaning no post-trial reset has happened yet).
  IF v_profile.trial_ends_at IS NOT NULL
     AND v_profile.trial_ends_at <= now()
     AND v_profile.requests_reset_at < v_profile.trial_ends_at THEN

    UPDATE profiles
    SET ai_requests_this_month = 0,
        requests_reset_at      = v_profile.trial_ends_at
    WHERE id = p_user_id;
    v_profile.ai_requests_this_month := 0;
  END IF;

  -- ── 4. Post-trial monthly cap (correct plan limits) ────────────────────────
  v_limit := CASE v_profile.plan
    WHEN 'hobbyist'       THEN 300
    WHEN 'scribe'         THEN 300
    WHEN 'pro'            THEN 600
    WHEN 'founder_circle' THEN 600
    ELSE 50  -- 'free' or any unrecognised value
  END;

  -- Lifetime flag always ensures at least 600
  IF COALESCE(v_profile.is_lifetime, false) THEN
    v_limit := GREATEST(v_limit, 600);
  END IF;

  -- Referral bonus credits stack on top of the plan limit
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
