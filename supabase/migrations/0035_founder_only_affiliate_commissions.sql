-- Affiliate commission applies only to the Founder lifetime plan.

UPDATE public.affiliate_commissions AS commission
SET status = 'reversed',
    reversed_at = now(),
    reversal_reason = 'Founder lifetime plan only',
    settled_at = now()
FROM public.orders AS affiliate_order
WHERE affiliate_order.id = commission.order_id
  AND affiliate_order.plan_purchased <> 'founder_circle'
  AND commission.status <> 'reversed';

UPDATE public.referrals AS referral
SET status = 'pending', completed_at = NULL
WHERE status = 'completed'
  AND NOT EXISTS (
    SELECT 1
    FROM public.affiliate_commissions AS commission
    WHERE commission.referred_id = referral.referred_id
      AND commission.status <> 'reversed'
  );

UPDATE public.profiles AS profile
SET referral_count = (
  SELECT COUNT(*)::INT
  FROM public.affiliate_commissions AS commission
  WHERE commission.referrer_id = profile.id
    AND commission.status <> 'reversed'
),
updated_at = now()
WHERE EXISTS (
  SELECT 1 FROM public.affiliate_commissions AS commission
  WHERE commission.referrer_id = profile.id
);

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

  -- Hobbyist purchases activate normally but never earn affiliate commission.
  IF v_order.plan_purchased = 'founder_circle' THEN
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
          AND status <> 'reversed'
      ),
      updated_at = now()
      WHERE id = v_referrer_id;
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'plan', v_order.plan_purchased,
    'credits_reset_at', v_next_reset,
    'affiliate_commission_cents', COALESCE(v_commission_cents, 0)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.activate_paid_order(UUID, UUID, TEXT, TEXT, TIMESTAMPTZ) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.activate_paid_order(UUID, UUID, TEXT, TEXT, TIMESTAMPTZ) TO service_role;
