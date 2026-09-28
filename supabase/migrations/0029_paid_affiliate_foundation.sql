-- Paid affiliate foundation.
-- Commission is earned on the referred writer's first successful paid order,
-- held for 30 days, and may be withdrawn once at least $50 is available.

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS amount_cents INT,
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'USD';

ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_amount_cents_check;
ALTER TABLE public.orders
  ADD CONSTRAINT orders_amount_cents_check
  CHECK (amount_cents IS NULL OR amount_cents > 0);
UPDATE public.orders
SET amount_cents = CASE plan_purchased
  WHEN 'founder_circle' THEN 4900
  WHEN 'hobbyist' THEN 1199
  ELSE amount_cents
END
WHERE amount_cents IS NULL;

CREATE TABLE IF NOT EXISTS public.affiliate_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  order_id UUID NOT NULL UNIQUE REFERENCES public.orders(id) ON DELETE CASCADE,
  gross_amount_cents INT NOT NULL CHECK (gross_amount_cents > 0),
  commission_rate_bps INT NOT NULL DEFAULT 4000 CHECK (commission_rate_bps BETWEEN 1 AND 10000),
  commission_amount_cents INT NOT NULL CHECK (commission_amount_cents > 0),
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'payout_pending', 'paid', 'reversed', 'credit_converted')),
  available_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '30 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  settled_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS affiliate_commissions_referrer_idx
  ON public.affiliate_commissions(referrer_id, status, available_at);

CREATE TABLE IF NOT EXISTS public.affiliate_withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount_cents INT NOT NULL CHECK (amount_cents >= 5000),
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'requested'
    CHECK (status IN ('requested', 'processing', 'paid', 'rejected')),
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ,
  admin_note TEXT
);

CREATE INDEX IF NOT EXISTS affiliate_withdrawals_user_idx
  ON public.affiliate_withdrawals(user_id, requested_at DESC);

ALTER TABLE public.affiliate_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_withdrawals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own affiliate commissions" ON public.affiliate_commissions;
CREATE POLICY "Users can view own affiliate commissions"
  ON public.affiliate_commissions FOR SELECT
  USING (auth.uid() = referrer_id);

DROP POLICY IF EXISTS "Users can view own affiliate withdrawals" ON public.affiliate_withdrawals;
CREATE POLICY "Users can view own affiliate withdrawals"
  ON public.affiliate_withdrawals FOR SELECT
  USING (auth.uid() = user_id);

-- Old referral rows remain for attribution/history. New referrals retain the
-- existing ten-referral MVP cap but are not rewarded merely for onboarding.
CREATE OR REPLACE FUNCTION public.complete_referral(p_referred_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN jsonb_build_object('ok', false, 'reason', 'paid_conversion_required');
END;
$$;

CREATE OR REPLACE FUNCTION public.request_affiliate_withdrawal(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_amount INT;
  v_withdrawal_id UUID;
BEGIN
  PERFORM 1 FROM public.profiles WHERE id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.affiliate_withdrawals
    WHERE user_id = p_user_id AND status IN ('requested', 'processing')
  ) THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'payout_already_pending');
  END IF;

  SELECT COALESCE(SUM(commission_amount_cents), 0)::INT INTO v_amount
  FROM public.affiliate_commissions
  WHERE referrer_id = p_user_id
    AND status = 'pending'
    AND available_at <= now();

  IF v_amount < 5000 THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'minimum_not_reached', 'available_cents', v_amount);
  END IF;

  INSERT INTO public.affiliate_withdrawals (user_id, amount_cents)
  VALUES (p_user_id, v_amount)
  RETURNING id INTO v_withdrawal_id;

  UPDATE public.affiliate_commissions
  SET status = 'payout_pending'
  WHERE referrer_id = p_user_id
    AND status = 'pending'
    AND available_at <= now();

  RETURN jsonb_build_object(
    'ok', true,
    'withdrawal_id', v_withdrawal_id,
    'amount_cents', v_amount
  );
END;
$$;

REVOKE ALL ON FUNCTION public.request_affiliate_withdrawal(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.request_affiliate_withdrawal(UUID) TO service_role;

-- Replace the paid-order activation RPC so plan activation and commission
-- creation occur in the same database transaction.
CREATE OR REPLACE FUNCTION public.activate_paid_order(
  p_order_id UUID,
  p_user_id UUID,
  p_payment_id TEXT DEFAULT NULL,
  p_subscription_id TEXT DEFAULT NULL,
  p_purchased_at TIMESTAMPTZ DEFAULT now()
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order public.orders%ROWTYPE;
  v_next_reset TIMESTAMPTZ;
  v_referrer_id UUID;
  v_commission_cents INT;
BEGIN
  SELECT * INTO v_order
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND OR v_order.user_id <> p_user_id THEN
    RAISE EXCEPTION 'Paid order does not belong to supplied user';
  END IF;
  IF v_order.plan_purchased NOT IN ('hobbyist', 'founder_circle') THEN
    RAISE EXCEPTION 'Unsupported paid plan: %', v_order.plan_purchased;
  END IF;
  IF v_order.amount_cents IS NULL OR v_order.amount_cents <= 0 THEN
    RAISE EXCEPTION 'Paid order is missing its purchase amount';
  END IF;

  IF v_order.status = 'paid' THEN
    RETURN jsonb_build_object('ok', true, 'already_active', true);
  END IF;

  v_next_reset := p_purchased_at + INTERVAL '1 month';

  UPDATE public.orders
  SET status = 'paid',
      dodo_payment_id = COALESCE(p_payment_id, dodo_payment_id),
      updated_at = now()
  WHERE id = p_order_id;

  UPDATE public.profiles
  SET plan = v_order.plan_purchased,
      is_lifetime = CASE WHEN v_order.plan_purchased = 'founder_circle' THEN true ELSE is_lifetime END,
      subscription_status = 'active',
      dodo_subscription_id = COALESCE(p_subscription_id, dodo_subscription_id),
      trial_ends_at = NULL,
      ai_requests_this_month = 0,
      requests_reset_at = p_purchased_at,
      credits_reset_at = v_next_reset,
      updated_at = now()
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found for paid order user';
  END IF;

  SELECT referred_by INTO v_referrer_id
  FROM public.profiles
  WHERE id = p_user_id;

  IF v_referrer_id IS NOT NULL AND v_referrer_id <> p_user_id THEN
    v_commission_cents := ROUND(v_order.amount_cents * 0.40)::INT;

    INSERT INTO public.affiliate_commissions (
      referrer_id,
      referred_id,
      order_id,
      gross_amount_cents,
      commission_rate_bps,
      commission_amount_cents,
      currency,
      available_at
    ) VALUES (
      v_referrer_id,
      p_user_id,
      p_order_id,
      v_order.amount_cents,
      4000,
      v_commission_cents,
      v_order.currency,
      p_purchased_at + INTERVAL '30 days'
    ) ON CONFLICT DO NOTHING;

    UPDATE public.referrals
    SET status = 'completed', completed_at = COALESCE(completed_at, now())
    WHERE referred_id = p_user_id;

    UPDATE public.profiles
    SET referral_count = (
      SELECT COUNT(*)::INT
      FROM public.affiliate_commissions
      WHERE referrer_id = v_referrer_id
    ),
    updated_at = now()
    WHERE id = v_referrer_id;
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'plan', v_order.plan_purchased,
    'credits_reset_at', v_next_reset,
    'affiliate_commission_cents', COALESCE(v_commission_cents, 0)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.activate_paid_order(UUID, UUID, TEXT, TEXT, TIMESTAMPTZ) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.activate_paid_order(UUID, UUID, TEXT, TEXT, TIMESTAMPTZ) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.activate_paid_order(UUID, UUID, TEXT, TEXT, TIMESTAMPTZ) TO service_role;
