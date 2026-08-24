-- ============================================================
-- Migration 0021: Fix credit limit for lifetime/founder_circle users
--
-- Two bugs fixed:
--
-- 1. check_ai_quota used GREATEST(v_limit, 600) for is_lifetime users,
--    giving them 600 credits/month.  The frontend (getCreditLimit in
--    supabase.ts) correctly returns 500 for these users.  The SQL is
--    now aligned to 500.
--
-- 2. Some lifetime users had a stale ai_requests_this_month counter
--    carrying over from their free/trial period (migration 0020 only
--    reset plan IN ('hobbyist','founder_circle') and may have run
--    before the row was marked is_lifetime = true).
--    We reset those counters here so every lifetime user starts with
--    their full 500 credit allocation.
-- ============================================================

-- ── 1. Update check_ai_quota ──────────────────────────────────────────────────
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
  -- Lifetime / Founder's Circle: always 500/month (matches getCreditLimit() in supabase.ts)
  IF COALESCE(v_profile.is_lifetime, false) OR v_profile.plan = 'founder_circle' THEN
    v_limit := 500;
  ELSE
    v_limit := CASE v_profile.plan
      WHEN 'hobbyist' THEN 300
      ELSE 50
    END;
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


-- ── 2. Reset monthly counter for all lifetime users ───────────────────────────
-- Gives every lifetime user their full 500-credit allocation immediately,
-- clearing any free/trial-era spend that carried over.
UPDATE public.profiles
SET
  ai_requests_this_month = 0,
  requests_reset_at      = now()
WHERE
  (is_lifetime = true OR plan = 'founder_circle')
  AND ai_requests_this_month > 0;
