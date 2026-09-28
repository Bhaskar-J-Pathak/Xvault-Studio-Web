-- Refund safety for immediately usable top-up credits. If refunded credits
-- were already consumed, the shortfall becomes credit debt and is repaid by
-- future top-ups before new spendable credits are added.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS topup_credit_debt INT NOT NULL DEFAULT 0;

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_topup_credit_debt_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_topup_credit_debt_check CHECK (topup_credit_debt >= 0);

CREATE OR REPLACE FUNCTION public.fulfill_credit_order(
  p_order_id UUID,
  p_user_id UUID,
  p_payment_id TEXT DEFAULT NULL,
  p_paid_at TIMESTAMPTZ DEFAULT now()
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order public.credit_orders%ROWTYPE;
  v_profile public.profiles%ROWTYPE;
  v_debt_paid INT;
  v_credits_added INT;
BEGIN
  SELECT * INTO v_order FROM public.credit_orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND OR v_order.user_id <> p_user_id THEN
    RAISE EXCEPTION 'Credit order does not belong to supplied user';
  END IF;
  IF v_order.status = 'paid' THEN
    RETURN jsonb_build_object('ok', true, 'already_fulfilled', true, 'credits_purchased', v_order.credits);
  END IF;
  IF v_order.status <> 'pending' THEN
    RAISE EXCEPTION 'Credit order cannot be fulfilled from status %', v_order.status;
  END IF;

  SELECT * INTO v_profile FROM public.profiles WHERE id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Profile not found for credit order user'; END IF;

  v_debt_paid := LEAST(COALESCE(v_profile.topup_credit_debt, 0), v_order.credits);
  v_credits_added := v_order.credits - v_debt_paid;

  UPDATE public.credit_orders SET
    status = 'paid',
    dodo_payment_id = COALESCE(p_payment_id, dodo_payment_id),
    paid_at = p_paid_at,
    updated_at = now()
  WHERE id = p_order_id;

  UPDATE public.profiles SET
    topup_credits = topup_credits + v_credits_added,
    topup_credit_debt = topup_credit_debt - v_debt_paid,
    updated_at = now()
  WHERE id = p_user_id;

  RETURN jsonb_build_object(
    'ok', true,
    'credits_purchased', v_order.credits,
    'credits_added', v_credits_added,
    'debt_paid', v_debt_paid
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.refund_credit_order(
  p_payment_id TEXT,
  p_refund_amount_cents INT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order public.credit_orders%ROWTYPE;
  v_profile public.profiles%ROWTYPE;
  v_credits_to_reverse INT;
  v_shortfall INT;
BEGIN
  SELECT * INTO v_order
  FROM public.credit_orders
  WHERE dodo_payment_id = p_payment_id
  FOR UPDATE;

  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'reason', 'order_not_found'); END IF;
  IF v_order.status = 'refunded' THEN RETURN jsonb_build_object('ok', true, 'already_refunded', true); END IF;
  IF v_order.status <> 'paid' THEN RAISE EXCEPTION 'Only paid credit orders can be refunded'; END IF;

  v_credits_to_reverse := CASE
    WHEN p_refund_amount_cents IS NULL OR p_refund_amount_cents >= v_order.amount_cents THEN v_order.credits
    ELSE CEIL(v_order.credits::NUMERIC * p_refund_amount_cents / v_order.amount_cents)::INT
  END;

  SELECT * INTO v_profile FROM public.profiles WHERE id = v_order.user_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Profile not found for refunded credit order'; END IF;

  v_shortfall := GREATEST(0, v_credits_to_reverse - v_profile.topup_credits);
  UPDATE public.profiles SET
    topup_credits = GREATEST(0, topup_credits - v_credits_to_reverse),
    topup_credit_debt = topup_credit_debt + v_shortfall,
    updated_at = now()
  WHERE id = v_order.user_id;

  -- Credit packs are expected to be fully refunded. Marking the order here is
  -- idempotent; partial-refund support can later track cumulative refund rows.
  UPDATE public.credit_orders SET status = 'refunded', updated_at = now() WHERE id = v_order.id;

  RETURN jsonb_build_object('ok', true, 'credits_reversed', v_credits_to_reverse, 'debt_added', v_shortfall);
END;
$$;

REVOKE ALL ON FUNCTION public.refund_credit_order(TEXT, INT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.refund_credit_order(TEXT, INT) TO service_role;
