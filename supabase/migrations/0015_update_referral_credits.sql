-- ============================================================
-- Migration 0015: Update referral credit amounts and cap
-- ============================================================
-- Changes:
--   Referrer reward:   +30 → +50 per referral
--   Referred reward:   +15 → +30 on signup
--   Referral cap:       3  → 10 per user
-- ============================================================

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

  -- Check the referrer is within the 10-referral cap
  SELECT referral_count INTO v_referrer_cap
  FROM profiles
  WHERE id = v_referral.referrer_id
  FOR UPDATE;

  IF v_referrer_cap >= 10 THEN
    -- Cap exceeded — mark complete but don't award
    UPDATE referrals
    SET status = 'completed', completed_at = now()
    WHERE id = v_referral.id;
    RETURN jsonb_build_object('ok', false, 'reason', 'cap_exceeded');
  END IF;

  -- Award +50 to referrer
  UPDATE profiles
  SET bonus_credits  = bonus_credits + 50,
      referral_count = referral_count + 1,
      updated_at     = now()
  WHERE id = v_referral.referrer_id;

  -- Award +30 to referred user
  UPDATE profiles
  SET bonus_credits = bonus_credits + 30,
      updated_at    = now()
  WHERE id = p_referred_id;

  -- Mark referral as completed
  UPDATE referrals
  SET status = 'completed', completed_at = now()
  WHERE id = v_referral.id;

  RETURN jsonb_build_object('ok', true, 'referrer_id', v_referral.referrer_id);
END;
$$;
