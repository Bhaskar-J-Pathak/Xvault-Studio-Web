-- ============================================================
-- Migration 004: Credits System, Beta Config + Feedback
-- ============================================================
-- Changes:
--   1. Plan rename: pro → scribe, pro_plus → pro, ultra removed
--   2. Trial: 28 days unlimited → 14 days, 100 credits total
--   3. consume_ai_request: accepts p_credits weight, enforces credit cap
--   4. Feedback table for user feedback collection
-- ============================================================

-- ── 1. Rename plan values to match new tier names ─────────────────────────
-- Must happen BEFORE the CHECK constraint is changed.
UPDATE profiles SET plan = 'scribe' WHERE plan = 'pro';
UPDATE profiles SET plan = 'pro'    WHERE plan = 'pro_plus';
UPDATE profiles SET plan = 'pro'    WHERE plan = 'ultra';

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_plan_check;
ALTER TABLE profiles
  ADD CONSTRAINT profiles_plan_check
  CHECK (plan IN ('free', 'scribe', 'pro'));

-- ── 2. Update handle_new_user trigger → 14-day trial ─────────────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (id, email, plan, trial_ends_at)
  VALUES (
    NEW.id,
    NEW.email,
    'free',
    now() + INTERVAL '14 days'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- ── 3. Rewrite consume_ai_request to support credit weights ───────────────
--
-- Trial users: 100 credits total (tracked via ai_requests_total from signup)
-- Paid users:  monthly credit allotment per plan
--
-- p_credits defaults to 1. Pass higher values for expensive operations:
--   chat=1, suggest short=1, suggest long=2, global-change=3,
--   worldboard auto=4, worldboard reextract=10
--
CREATE OR REPLACE FUNCTION consume_ai_request(
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
  v_remaining INT;
BEGIN
  -- Lock the profile row — prevents double-spend from concurrent requests
  SELECT * INTO v_profile
  FROM profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found for user %', p_user_id;
  END IF;

  -- Reset monthly counter at calendar month boundary
  IF date_trunc('month', now()) > date_trunc('month', v_profile.requests_reset_at) THEN
    UPDATE profiles
    SET ai_requests_this_month = 0,
        requests_reset_at = now()
    WHERE id = p_user_id;
    v_profile.ai_requests_this_month := 0;
  END IF;

  -- ── Trial path: 100-credit total cap ─────────────────────────────────────
  -- We use ai_requests_total as the lifetime credit counter.
  -- It is never reset, so it accurately reflects total usage since signup.
  v_in_trial := v_profile.trial_ends_at IS NOT NULL
                AND v_profile.trial_ends_at > now();

  IF v_in_trial THEN
    IF v_profile.ai_requests_total + p_credits > 100 THEN
      RETURN jsonb_build_object(
        'allowed',   false,
        'reason',    'trial_limit',
        'remaining', GREATEST(0, 100 - v_profile.ai_requests_total)
      );
    END IF;

    UPDATE profiles
    SET ai_requests_this_month = ai_requests_this_month + p_credits,
        ai_requests_total      = ai_requests_total + p_credits,
        updated_at             = now()
    WHERE id = p_user_id;

    RETURN jsonb_build_object(
      'allowed',   true,
      'remaining', 100 - v_profile.ai_requests_total - p_credits
    );
  END IF;

  -- ── Post-trial path: monthly plan cap ────────────────────────────────────
  v_limit := CASE v_profile.plan
    WHEN 'scribe' THEN 300
    WHEN 'pro'    THEN 1200
    ELSE 15   -- 'free' or any unknown plan
  END;

  IF v_profile.ai_requests_this_month + p_credits > v_limit THEN
    RETURN jsonb_build_object(
      'allowed',   false,
      'reason',    'plan_limit',
      'remaining', GREATEST(0, v_limit - v_profile.ai_requests_this_month)
    );
  END IF;

  UPDATE profiles
  SET ai_requests_this_month = ai_requests_this_month + p_credits,
      ai_requests_total      = ai_requests_total + p_credits,
      updated_at             = now()
  WHERE id = p_user_id;

  v_remaining := v_limit - v_profile.ai_requests_this_month - p_credits;
  RETURN jsonb_build_object(
    'allowed',   true,
    'remaining', GREATEST(0, v_remaining)
  );
END;
$$;

-- ── 4. Feedback table ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS feedback (
  id         UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID    REFERENCES auth.users(id) ON DELETE SET NULL,
  mood       TEXT    NOT NULL CHECK (mood IN ('good', 'meh', 'bad')),
  text       TEXT,
  page       TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Users can insert feedback (user_id may be null for anonymous)
CREATE POLICY "Users can submit feedback"
  ON feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Service role reads all feedback for admin review (no SELECT policy = only service role)
