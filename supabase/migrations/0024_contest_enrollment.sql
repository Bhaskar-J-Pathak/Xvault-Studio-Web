-- A contest allowance is temporary and separate from the normal trial/plan.
-- While active, AI calls use this pool exclusively. The ordinary allowance is
-- preserved and becomes available again after the contest window ends.
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS contest_slug TEXT,
  ADD COLUMN IF NOT EXISTS contest_credits_remaining INT NOT NULL DEFAULT 0
    CHECK (contest_credits_remaining >= 0),
  ADD COLUMN IF NOT EXISTS contest_ends_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS contest_project_id UUID REFERENCES projects(id) ON DELETE SET NULL;

CREATE OR REPLACE FUNCTION check_ai_quota(p_user_id UUID, p_credits INT DEFAULT 1)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_profile profiles%ROWTYPE;
  v_limit INT;
  v_in_trial BOOLEAN;
  v_trial_cap INT;
  v_monthly INT;
BEGIN
  SELECT * INTO v_profile FROM profiles WHERE id = p_user_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Profile not found for user %', p_user_id; END IF;

  IF v_profile.contest_slug IS NOT NULL AND v_profile.contest_ends_at > now() THEN
    IF v_profile.contest_credits_remaining < p_credits THEN
      RETURN jsonb_build_object('allowed', false, 'reason', 'contest_limit',
        'remaining', v_profile.contest_credits_remaining);
    END IF;
    RETURN jsonb_build_object('allowed', true,
      'remaining', v_profile.contest_credits_remaining - p_credits);
  END IF;

  v_monthly := v_profile.ai_requests_this_month;
  IF date_trunc('month', now()) > date_trunc('month', v_profile.requests_reset_at) THEN
    v_monthly := 0;
  END IF;
  v_in_trial := v_profile.trial_ends_at IS NOT NULL AND v_profile.trial_ends_at > now();
  IF v_in_trial THEN
    v_trial_cap := 100 + COALESCE(v_profile.bonus_credits, 0);
    IF v_profile.ai_requests_total + p_credits > v_trial_cap THEN
      RETURN jsonb_build_object('allowed', false, 'reason', 'trial_limit',
        'remaining', GREATEST(0, v_trial_cap - v_profile.ai_requests_total));
    END IF;
    RETURN jsonb_build_object('allowed', true,
      'remaining', GREATEST(0, v_trial_cap - v_profile.ai_requests_total - p_credits));
  END IF;
  IF v_profile.trial_ends_at IS NOT NULL AND v_profile.trial_ends_at <= now()
     AND v_profile.requests_reset_at < v_profile.trial_ends_at THEN v_monthly := 0; END IF;
  IF COALESCE(v_profile.is_lifetime, false) OR v_profile.plan = 'founder_circle' THEN
    v_limit := 500;
  ELSE
    v_limit := CASE v_profile.plan WHEN 'hobbyist' THEN 300 ELSE 50 END;
  END IF;
  v_limit := v_limit + COALESCE(v_profile.bonus_credits, 0);
  IF v_monthly + p_credits > v_limit THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'plan_limit',
      'remaining', GREATEST(0, v_limit - v_monthly));
  END IF;
  RETURN jsonb_build_object('allowed', true,
    'remaining', GREATEST(0, v_limit - v_monthly - p_credits));
END;
$$;

CREATE OR REPLACE FUNCTION commit_ai_request(p_user_id UUID, p_credits INT DEFAULT 1)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_profile profiles%ROWTYPE;
BEGIN
  SELECT * INTO v_profile FROM profiles WHERE id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Profile not found for user %', p_user_id; END IF;

  IF v_profile.contest_slug IS NOT NULL AND v_profile.contest_ends_at > now() THEN
    IF v_profile.contest_credits_remaining < p_credits THEN
      RAISE EXCEPTION 'Insufficient contest credits';
    END IF;
    UPDATE profiles SET
      contest_credits_remaining = contest_credits_remaining - p_credits,
      ai_requests_total = ai_requests_total + p_credits,
      updated_at = now()
    WHERE id = p_user_id;
    RETURN jsonb_build_object('ok', true);
  END IF;

  IF date_trunc('month', now()) > date_trunc('month', v_profile.requests_reset_at) THEN
    UPDATE profiles SET ai_requests_this_month = 0, requests_reset_at = now() WHERE id = p_user_id;
    v_profile.ai_requests_this_month := 0;
  END IF;
  IF v_profile.trial_ends_at IS NOT NULL AND v_profile.trial_ends_at <= now()
     AND v_profile.requests_reset_at < v_profile.trial_ends_at THEN
    UPDATE profiles SET ai_requests_this_month = 0, requests_reset_at = v_profile.trial_ends_at
      WHERE id = p_user_id;
  END IF;
  UPDATE profiles SET
    ai_requests_this_month = ai_requests_this_month + p_credits,
    ai_requests_total = ai_requests_total + p_credits,
    updated_at = now()
  WHERE id = p_user_id;
  RETURN jsonb_build_object('ok', true);
END;
$$;
