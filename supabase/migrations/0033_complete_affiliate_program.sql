-- Complete paid affiliate program.
--
-- Attribution is first-touch and immutable once claimed. Commissions are earned
-- on the referred writer's first paid plan purchase, clear after 30 days, and
-- can be withdrawn as cash or exchanged for an existing credit-store pack.

ALTER TABLE public.referrals
  ADD COLUMN IF NOT EXISTS attribution_source TEXT NOT NULL DEFAULT 'signup',
  ADD COLUMN IF NOT EXISTS attributed_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE OR REPLACE FUNCTION public.claim_affiliate_referral(
  p_referred_id UUID,
  p_code TEXT,
  p_source TEXT DEFAULT 'affiliate_link'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referred public.profiles%ROWTYPE;
  v_referrer_id UUID;
  v_code TEXT := upper(trim(COALESCE(p_code, '')));
BEGIN
  IF v_code !~ '^[A-Z0-9]{8}$' THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'invalid_code');
  END IF;

  SELECT * INTO v_referred
  FROM public.profiles
  WHERE id = p_referred_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'profile_not_found');
  END IF;
  IF v_referred.referred_by IS NOT NULL THEN
    RETURN jsonb_build_object('ok', true, 'linked', false, 'reason', 'already_attributed');
  END IF;

  SELECT id INTO v_referrer_id
  FROM public.profiles
  WHERE referral_code = v_code;

  IF v_referrer_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'code_not_found');
  END IF;
  IF v_referrer_id = p_referred_id THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'self_referral');
  END IF;

  UPDATE public.profiles
  SET referred_by = v_referrer_id, updated_at = now()
  WHERE id = p_referred_id AND referred_by IS NULL;

  INSERT INTO public.referrals (
    referrer_id,
    referred_id,
    status,
    attribution_source,
    attributed_at
  ) VALUES (
    v_referrer_id,
    p_referred_id,
    'pending',
    left(COALESCE(NULLIF(trim(p_source), ''), 'affiliate_link'), 50),
    now()
  ) ON CONFLICT (referred_id) DO NOTHING;

  RETURN jsonb_build_object('ok', true, 'linked', true);
END;
$$;

REVOKE ALL ON FUNCTION public.claim_affiliate_referral(UUID, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_affiliate_referral(UUID, TEXT, TEXT) TO service_role;

ALTER TABLE public.affiliate_commissions DROP CONSTRAINT IF EXISTS affiliate_commissions_status_check;
ALTER TABLE public.affiliate_commissions
  ADD CONSTRAINT affiliate_commissions_status_check
  CHECK (status IN ('pending', 'held', 'payout_pending', 'paid', 'reversed', 'credit_converted'));

ALTER TABLE public.affiliate_commissions
  ADD COLUMN IF NOT EXISTS reversed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reversal_reason TEXT;

ALTER TABLE public.affiliate_withdrawals
  ADD COLUMN IF NOT EXISTS payout_email TEXT;

CREATE TABLE IF NOT EXISTS public.affiliate_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  pack_key TEXT NOT NULL CHECK (pack_key IN ('credits_100', 'credits_200', 'credits_400', 'credits_600', 'credits_1750', 'credits_4000')),
  amount_cents INT NOT NULL CHECK (amount_cents IN (500, 1000, 1500, 2000, 5000, 10000)),
  credits INT NOT NULL CHECK (credits IN (100, 200, 400, 600, 1750, 4000)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS affiliate_redemptions_user_idx
  ON public.affiliate_redemptions(user_id, created_at DESC);

ALTER TABLE public.affiliate_redemptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own affiliate redemptions" ON public.affiliate_redemptions;
CREATE POLICY "Users can view own affiliate redemptions"
  ON public.affiliate_redemptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.get_my_affiliate_summary()
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH totals AS (
    SELECT
      COALESCE(SUM(commission_amount_cents) FILTER (
        WHERE status <> 'reversed'
      ), 0)::INT AS lifetime_earned,
      COALESCE(SUM(commission_amount_cents) FILTER (
        WHERE status NOT IN ('reversed', 'held') AND available_at > now()
      ), 0)::INT AS pending,
      COALESCE(SUM(commission_amount_cents) FILTER (
        WHERE status = 'held'
      ), 0)::INT AS held,
      COALESCE(SUM(commission_amount_cents) FILTER (
        WHERE status NOT IN ('reversed', 'held') AND available_at <= now()
      ), 0)::INT AS matured
    FROM public.affiliate_commissions
    WHERE referrer_id = auth.uid()
  ), withdrawal_totals AS (
    SELECT
      COALESCE(SUM(amount_cents) FILTER (WHERE status <> 'rejected'), 0)::INT AS reserved,
      COALESCE(SUM(amount_cents) FILTER (WHERE status IN ('requested', 'processing')), 0)::INT AS pending,
      COALESCE(SUM(amount_cents) FILTER (WHERE status = 'paid'), 0)::INT AS paid
    FROM public.affiliate_withdrawals
    WHERE user_id = auth.uid()
  ), redemption_totals AS (
    SELECT
      COALESCE(SUM(amount_cents), 0)::INT AS cents,
      COALESCE(SUM(credits), 0)::INT AS credits
    FROM public.affiliate_redemptions
    WHERE user_id = auth.uid()
  )
  SELECT jsonb_build_object(
    'pending_cents', totals.pending,
    'held_cents', totals.held,
    'available_cents', GREATEST(0, totals.matured - withdrawal_totals.reserved - redemption_totals.cents),
    'balance_cents', totals.matured - withdrawal_totals.reserved - redemption_totals.cents,
    'lifetime_earned_cents', totals.lifetime_earned,
    'payout_pending_cents', withdrawal_totals.pending,
    'paid_out_cents', withdrawal_totals.paid,
    'converted_cents', redemption_totals.cents,
    'converted_credits', redemption_totals.credits
  )
  FROM totals, withdrawal_totals, redemption_totals;
$$;

REVOKE ALL ON FUNCTION public.get_my_affiliate_summary() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_affiliate_summary() TO authenticated;

DROP FUNCTION IF EXISTS public.request_affiliate_withdrawal(UUID);
CREATE OR REPLACE FUNCTION public.request_affiliate_withdrawal(
  p_user_id UUID,
  p_payout_email TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_matured INT;
  v_reserved INT;
  v_redeemed INT;
  v_available INT;
  v_withdrawal_id UUID;
  v_email TEXT := lower(trim(COALESCE(p_payout_email, '')));
BEGIN
  PERFORM 1 FROM public.profiles WHERE id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Profile not found'; END IF;
  IF v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'invalid_payout_email');
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.affiliate_withdrawals
    WHERE user_id = p_user_id AND status IN ('requested', 'processing')
  ) THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'payout_already_pending');
  END IF;

  SELECT COALESCE(SUM(commission_amount_cents), 0)::INT INTO v_matured
  FROM public.affiliate_commissions
  WHERE referrer_id = p_user_id
    AND status NOT IN ('reversed', 'held')
    AND available_at <= now();

  SELECT COALESCE(SUM(amount_cents), 0)::INT INTO v_reserved
  FROM public.affiliate_withdrawals
  WHERE user_id = p_user_id AND status <> 'rejected';

  SELECT COALESCE(SUM(amount_cents), 0)::INT INTO v_redeemed
  FROM public.affiliate_redemptions
  WHERE user_id = p_user_id;

  v_available := GREATEST(0, v_matured - v_reserved - v_redeemed);
  IF v_available < 5000 THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'minimum_not_reached', 'available_cents', v_available);
  END IF;

  INSERT INTO public.affiliate_withdrawals (user_id, amount_cents, payout_email)
  VALUES (p_user_id, v_available, v_email)
  RETURNING id INTO v_withdrawal_id;

  RETURN jsonb_build_object('ok', true, 'withdrawal_id', v_withdrawal_id, 'amount_cents', v_available);
END;
$$;

REVOKE ALL ON FUNCTION public.request_affiliate_withdrawal(UUID, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.request_affiliate_withdrawal(UUID, TEXT) TO service_role;

CREATE OR REPLACE FUNCTION public.convert_affiliate_commission_to_credits(
  p_user_id UUID,
  p_pack_key TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_amount INT;
  v_credits INT;
  v_matured INT;
  v_reserved INT;
  v_redeemed INT;
  v_available INT;
  v_profile public.profiles%ROWTYPE;
  v_debt_paid INT;
  v_credits_added INT;
  v_redemption_id UUID;
BEGIN
  SELECT
    CASE p_pack_key
      WHEN 'credits_100' THEN 500 WHEN 'credits_200' THEN 1000
      WHEN 'credits_400' THEN 1500 WHEN 'credits_600' THEN 2000
      WHEN 'credits_1750' THEN 5000 WHEN 'credits_4000' THEN 10000
    END,
    CASE p_pack_key
      WHEN 'credits_100' THEN 100 WHEN 'credits_200' THEN 200
      WHEN 'credits_400' THEN 400 WHEN 'credits_600' THEN 600
      WHEN 'credits_1750' THEN 1750 WHEN 'credits_4000' THEN 4000
    END
  INTO v_amount, v_credits;

  IF v_amount IS NULL OR v_credits IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'invalid_pack');
  END IF;

  SELECT * INTO v_profile FROM public.profiles WHERE id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Profile not found'; END IF;

  SELECT COALESCE(SUM(commission_amount_cents), 0)::INT INTO v_matured
  FROM public.affiliate_commissions
  WHERE referrer_id = p_user_id
    AND status NOT IN ('reversed', 'held')
    AND available_at <= now();
  SELECT COALESCE(SUM(amount_cents), 0)::INT INTO v_reserved
  FROM public.affiliate_withdrawals
  WHERE user_id = p_user_id AND status <> 'rejected';
  SELECT COALESCE(SUM(amount_cents), 0)::INT INTO v_redeemed
  FROM public.affiliate_redemptions
  WHERE user_id = p_user_id;

  v_available := GREATEST(0, v_matured - v_reserved - v_redeemed);
  IF v_available < v_amount THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'insufficient_balance', 'available_cents', v_available);
  END IF;

  v_debt_paid := LEAST(COALESCE(v_profile.topup_credit_debt, 0), v_credits);
  v_credits_added := v_credits - v_debt_paid;

  INSERT INTO public.affiliate_redemptions (user_id, pack_key, amount_cents, credits)
  VALUES (p_user_id, p_pack_key, v_amount, v_credits)
  RETURNING id INTO v_redemption_id;

  UPDATE public.profiles SET
    topup_credits = topup_credits + v_credits_added,
    topup_credit_debt = topup_credit_debt - v_debt_paid,
    updated_at = now()
  WHERE id = p_user_id;

  RETURN jsonb_build_object(
    'ok', true,
    'redemption_id', v_redemption_id,
    'amount_cents', v_amount,
    'credits', v_credits,
    'credits_added', v_credits_added,
    'debt_paid', v_debt_paid
  );
END;
$$;

REVOKE ALL ON FUNCTION public.convert_affiliate_commission_to_credits(UUID, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.convert_affiliate_commission_to_credits(UUID, TEXT) TO service_role;

CREATE OR REPLACE FUNCTION public.set_affiliate_commission_risk(
  p_payment_id TEXT,
  p_action TEXT,
  p_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_commission public.affiliate_commissions%ROWTYPE;
BEGIN
  SELECT c.* INTO v_commission
  FROM public.affiliate_commissions c
  JOIN public.orders o ON o.id = c.order_id
  WHERE o.dodo_payment_id = p_payment_id
  FOR UPDATE OF c;

  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'reason', 'commission_not_found'); END IF;

  IF p_action = 'hold' AND v_commission.status = 'pending' THEN
    UPDATE public.affiliate_commissions SET status = 'held' WHERE id = v_commission.id;
  ELSIF p_action = 'release' AND v_commission.status = 'held' THEN
    UPDATE public.affiliate_commissions SET status = 'pending' WHERE id = v_commission.id;
  ELSIF p_action = 'reverse' AND v_commission.status <> 'reversed' THEN
    UPDATE public.affiliate_commissions SET
      status = 'reversed',
      reversed_at = now(),
      reversal_reason = left(COALESCE(p_reason, 'refund_or_dispute'), 200),
      settled_at = now()
    WHERE id = v_commission.id;
    UPDATE public.profiles SET
      referral_count = (
        SELECT COUNT(*)::INT FROM public.affiliate_commissions
        WHERE referrer_id = v_commission.referrer_id AND status <> 'reversed'
      ),
      updated_at = now()
    WHERE id = v_commission.referrer_id;
  END IF;

  RETURN jsonb_build_object('ok', true, 'commission_id', v_commission.id, 'action', p_action);
END;
$$;

REVOKE ALL ON FUNCTION public.set_affiliate_commission_risk(TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_affiliate_commission_risk(TEXT, TEXT, TEXT) TO service_role;

CREATE OR REPLACE FUNCTION public.resolve_affiliate_withdrawal(
  p_withdrawal_id UUID,
  p_status TEXT,
  p_admin_note TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_status NOT IN ('processing', 'paid', 'rejected') THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'invalid_status');
  END IF;

  UPDATE public.affiliate_withdrawals SET
    status = p_status,
    processed_at = CASE WHEN p_status IN ('paid', 'rejected') THEN now() ELSE processed_at END,
    admin_note = left(p_admin_note, 1000)
  WHERE id = p_withdrawal_id AND status IN ('requested', 'processing');

  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'reason', 'withdrawal_not_found'); END IF;
  RETURN jsonb_build_object('ok', true);
END;
$$;

REVOKE ALL ON FUNCTION public.resolve_affiliate_withdrawal(UUID, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_affiliate_withdrawal(UUID, TEXT, TEXT) TO service_role;
