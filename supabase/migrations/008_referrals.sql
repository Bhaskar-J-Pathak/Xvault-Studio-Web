-- ============================================================
-- Migration 008: Referral System
-- ============================================================
-- Adds:
--   1. referral_code, referred_by, bonus_credits, referral_count to profiles
--   2. referrals table (tracks pending/completed referrals)
--   3. complete_referral() function (awards +30 referrer, +15 referred)
--   4. Updates consume_ai_request to respect bonus_credits in cap
--   5. Updates handle_new_user to auto-generate referral_code
-- Rules:
--   - Max 3 completed referrals per user
--   - Referral completes on the referred user's first real AI action
--     (triggered from /api/user/onboarding when done=true)
-- ============================================================

-- ── 1. New columns on profiles ────────────────────────────────────────────

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS referral_code   TEXT    UNIQUE,
  ADD COLUMN IF NOT EXISTS referred_by     UUID    REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS bonus_credits   INT     NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS referral_count  INT     NOT NULL DEFAULT 0;

-- Backfill existing users with a referral code
UPDATE profiles
SET referral_code = upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 8))
WHERE referral_code IS NULL;

ALTER TABLE profiles ALTER COLUMN referral_code SET NOT NULL;
CREATE INDEX IF NOT EXISTS profiles_referral_code_idx ON profiles(referral_code);

-- ── 2. Referrals table ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS referrals (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id  UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referred_id  UUID        NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  status       TEXT        NOT NULL DEFAULT 'pending'
                             CHECK (status IN ('pending', 'completed')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS referrals_referrer_id_idx ON referrals(referrer_id);

ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- Users can see referrals where they are the referrer (to show their stats)
CREATE POLICY "Users can view own referrals as referrer"
  ON referrals FOR SELECT
  USING (auth.uid() = referrer_id);

-- ── 3. Update handle_new_user to auto-generate referral_code ──────────────

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (id, email, plan, trial_ends_at, referral_code)
  VALUES (
    NEW.id,
    NEW.email,
    'free',
    now() + INTERVAL '14 days',
    upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 8))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- ── 4. complete_referral() — awards credits to both parties ──────────────
--
-- Called server-side (service role) when the referred user completes the
-- tutorial (onboarding_done = true). Safe to call multiple times — no-ops
-- if referral is already completed or not found.
--
-- Awards:  +30 bonus_credits to referrer
--          +15 bonus_credits to referred user
-- Cap:     referrer must have < 3 completed referrals

CREATE OR REPLACE FUNCTION complete_referral(p_referred_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_referral     referrals%ROWTYPE;
  v_referrer_cap INT;
BEGIN
  -- Find the pending referral for this user (lock for update)
  SELECT * INTO v_referral
  FROM referrals
  WHERE referred_id = p_referred_id
    AND status = 'pending'
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'no_pending_referral');
  END IF;

  -- Check the referrer is within the 3-referral cap
  SELECT referral_count INTO v_referrer_cap
  FROM profiles
  WHERE id = v_referral.referrer_id
  FOR UPDATE;

  IF v_referrer_cap >= 3 THEN
    -- Cap exceeded — mark complete but don't award
    UPDATE referrals
    SET status = 'completed', completed_at = now()
    WHERE id = v_referral.id;
    RETURN jsonb_build_object('ok', false, 'reason', 'cap_exceeded');
  END IF;

  -- Award +30 to referrer
  UPDATE profiles
  SET bonus_credits  = bonus_credits + 30,
      referral_count = referral_count + 1,
      updated_at     = now()
  WHERE id = v_referral.referrer_id;

  -- Award +15 to referred user
  UPDATE profiles
  SET bonus_credits = bonus_credits + 15,
      updated_at    = now()
  WHERE id = p_referred_id;

  -- Mark referral as completed
  UPDATE referrals
  SET status = 'completed', completed_at = now()
  WHERE id = v_referral.id;

  RETURN jsonb_build_object('ok', true, 'referrer_id', v_referral.referrer_id);
END;
$$;

-- ── 5. Update consume_ai_request to honour bonus_credits ─────────────────
--
-- bonus_credits permanently raise the user's effective cap:
--   trial:      100 + bonus_credits  (lifetime total)
--   post-trial: plan_limit + bonus_credits  (monthly)

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

  -- Reset monthly counter at calendar month boundary
  IF date_trunc('month', now()) > date_trunc('month', v_profile.requests_reset_at) THEN
    UPDATE profiles
    SET ai_requests_this_month = 0,
        requests_reset_at = now()
    WHERE id = p_user_id;
    v_profile.ai_requests_this_month := 0;
  END IF;

  -- ── Trial path ────────────────────────────────────────────────────────────
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
        ai_requests_total      = ai_requests_total + p_credits,
        updated_at             = now()
    WHERE id = p_user_id;

    RETURN jsonb_build_object(
      'allowed',   true,
      'remaining', v_trial_cap - v_profile.ai_requests_total - p_credits
    );
  END IF;

  -- ── Post-trial path ───────────────────────────────────────────────────────
  v_limit := CASE v_profile.plan
    WHEN 'scribe' THEN 300
    WHEN 'pro'    THEN 1200
    ELSE 15
  END + v_profile.bonus_credits;

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
