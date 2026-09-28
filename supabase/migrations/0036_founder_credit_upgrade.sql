-- Upgrade Founder's Circle to 1,000 resetting monthly credits and grant every
-- Founder a one-time, non-expiring 500-credit welcome balance.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS founder_welcome_credits_granted_at TIMESTAMPTZ;

CREATE OR REPLACE FUNCTION public.grant_founder_welcome_credits()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (
    COALESCE(NEW.is_lifetime, false)
    OR NEW.plan = 'founder_circle'
  ) AND NEW.founder_welcome_credits_granted_at IS NULL THEN
    NEW.topup_credits := COALESCE(NEW.topup_credits, 0) + 500;
    NEW.founder_welcome_credits_granted_at := now();
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS grant_founder_welcome_credits_on_profile ON public.profiles;
CREATE TRIGGER grant_founder_welcome_credits_on_profile
  BEFORE INSERT OR UPDATE OF plan, is_lifetime
  ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.grant_founder_welcome_credits();

-- Existing Founder accounts receive the same welcome balance exactly once.
UPDATE public.profiles
SET topup_credits = COALESCE(topup_credits, 0) + 500,
    founder_welcome_credits_granted_at = now(),
    updated_at = now()
WHERE (COALESCE(is_lifetime, false) OR plan = 'founder_circle')
  AND founder_welcome_credits_granted_at IS NULL;

DROP FUNCTION IF EXISTS public.check_ai_quota(UUID, INT);
DROP FUNCTION IF EXISTS public.check_ai_quota(UUID, INT, UUID);
CREATE FUNCTION public.check_ai_quota(
  p_user_id UUID,
  p_credits INT DEFAULT 1,
  p_project_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile public.profiles%ROWTYPE;
  v_limit INT;
  v_used INT;
  v_paid BOOLEAN;
  v_in_trial BOOLEAN;
  v_base_remaining INT;
  v_total_remaining INT;
BEGIN
  SELECT * INTO v_profile FROM public.profiles WHERE id = p_user_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Profile not found for user %', p_user_id; END IF;

  v_paid := COALESCE(v_profile.is_lifetime, false) OR v_profile.plan IN ('hobbyist', 'founder_circle');
  v_in_trial := NOT v_paid AND v_profile.trial_ends_at IS NOT NULL AND v_profile.trial_ends_at > now();

  IF v_in_trial THEN
    v_limit := 100 + COALESCE(v_profile.bonus_credits, 0);
    v_used := v_profile.ai_requests_total;
  ELSE
    v_limit := CASE
      WHEN COALESCE(v_profile.is_lifetime, false) OR v_profile.plan = 'founder_circle' THEN 1000
      WHEN v_profile.plan = 'hobbyist' THEN 300
      ELSE 50
    END + COALESCE(v_profile.bonus_credits, 0);
    v_used := CASE
      WHEN v_profile.credits_reset_at IS NOT NULL AND v_profile.credits_reset_at <= now() THEN 0
      ELSE v_profile.ai_requests_this_month
    END;
  END IF;

  v_base_remaining := GREATEST(0, v_limit - v_used);
  v_total_remaining := v_base_remaining + COALESCE(v_profile.topup_credits, 0);

  IF p_credits > v_total_remaining THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', CASE WHEN v_in_trial THEN 'trial_limit' ELSE 'plan_limit' END,
      'remaining', v_total_remaining,
      'topup_remaining', COALESCE(v_profile.topup_credits, 0)
    );
  END IF;

  RETURN jsonb_build_object(
    'allowed', true,
    'remaining', v_total_remaining - p_credits,
    'topup_remaining', GREATEST(0, COALESCE(v_profile.topup_credits, 0) - GREATEST(0, p_credits - v_base_remaining))
  );
END;
$$;

DROP FUNCTION IF EXISTS public.commit_ai_request(UUID, INT);
DROP FUNCTION IF EXISTS public.commit_ai_request(UUID, INT, UUID);
CREATE FUNCTION public.commit_ai_request(
  p_user_id UUID,
  p_credits INT DEFAULT 1,
  p_project_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile public.profiles%ROWTYPE;
  v_next_reset TIMESTAMPTZ;
  v_paid BOOLEAN;
  v_in_trial BOOLEAN;
  v_limit INT;
  v_used INT;
  v_base_remaining INT;
  v_topup_spend INT;
BEGIN
  SELECT * INTO v_profile FROM public.profiles WHERE id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Profile not found for user %', p_user_id; END IF;

  IF v_profile.credits_reset_at IS NULL OR v_profile.credits_reset_at <= now() THEN
    v_next_reset := public.next_monthly_credit_reset(
      COALESCE(v_profile.credits_reset_at, date_trunc('month', now()) + INTERVAL '1 month'), now()
    );
    UPDATE public.profiles SET
      ai_requests_this_month = 0,
      requests_reset_at = now(),
      credits_reset_at = v_next_reset
    WHERE id = p_user_id;
    v_profile.ai_requests_this_month := 0;
  END IF;

  v_paid := COALESCE(v_profile.is_lifetime, false) OR v_profile.plan IN ('hobbyist', 'founder_circle');
  v_in_trial := NOT v_paid AND v_profile.trial_ends_at IS NOT NULL AND v_profile.trial_ends_at > now();

  IF v_in_trial THEN
    v_limit := 100 + COALESCE(v_profile.bonus_credits, 0);
    v_used := v_profile.ai_requests_total;
  ELSE
    v_limit := CASE
      WHEN COALESCE(v_profile.is_lifetime, false) OR v_profile.plan = 'founder_circle' THEN 1000
      WHEN v_profile.plan = 'hobbyist' THEN 300
      ELSE 50
    END + COALESCE(v_profile.bonus_credits, 0);
    v_used := v_profile.ai_requests_this_month;
  END IF;

  v_base_remaining := GREATEST(0, v_limit - v_used);
  v_topup_spend := GREATEST(0, p_credits - v_base_remaining);
  IF v_topup_spend > COALESCE(v_profile.topup_credits, 0) THEN
    RAISE EXCEPTION 'Insufficient credits';
  END IF;

  UPDATE public.profiles SET
    ai_requests_this_month = ai_requests_this_month + p_credits,
    ai_requests_total = ai_requests_total + p_credits,
    topup_credits = topup_credits - v_topup_spend,
    updated_at = now()
  WHERE id = p_user_id;

  RETURN jsonb_build_object('ok', true, 'topup_spent', v_topup_spend);
END;
$$;

REVOKE ALL ON FUNCTION public.check_ai_quota(UUID, INT, UUID) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.commit_ai_request(UUID, INT, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_ai_quota(UUID, INT, UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.commit_ai_request(UUID, INT, UUID) TO service_role;
