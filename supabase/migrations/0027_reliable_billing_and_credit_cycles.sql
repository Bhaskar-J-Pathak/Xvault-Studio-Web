-- Reliable paid-plan activation and billing-anniversary credit resets.
--
-- requests_reset_at historically meant "last reset" in SQL but "next reset"
-- in the UI. credits_reset_at is now the single, explicit next-reset timestamp.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS credits_reset_at TIMESTAMPTZ;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS dodo_payment_id TEXT,
  ADD COLUMN IF NOT EXISTS dodo_checkout_session_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS orders_dodo_payment_id_idx
  ON public.orders(dodo_payment_id)
  WHERE dodo_payment_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS orders_dodo_checkout_session_id_idx
  ON public.orders(dodo_checkout_session_id)
  WHERE dodo_checkout_session_id IS NOT NULL;

ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_plan_purchased_check;
ALTER TABLE public.orders
  ADD CONSTRAINT orders_plan_purchased_check
  CHECK (plan_purchased IN ('hobbyist', 'founder_circle'));

ALTER TABLE public.webhook_events
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'processed',
  ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_error TEXT;

ALTER TABLE public.webhook_events DROP CONSTRAINT IF EXISTS webhook_events_status_check;
ALTER TABLE public.webhook_events
  ADD CONSTRAINT webhook_events_status_check
  CHECK (status IN ('processing', 'processed', 'failed'));

UPDATE public.webhook_events
SET processed_at = COALESCE(processed_at, received_at)
WHERE status = 'processed';

-- Preserve a manually supplied future reset date (including existing Founder
-- accounts), otherwise advance the old reset anchor to its next monthly date.
CREATE OR REPLACE FUNCTION public.next_monthly_credit_reset(
  p_candidate TIMESTAMPTZ,
  p_reference TIMESTAMPTZ DEFAULT now()
)
RETURNS TIMESTAMPTZ
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_next TIMESTAMPTZ := COALESCE(p_candidate, p_reference + INTERVAL '1 month');
BEGIN
  WHILE v_next <= p_reference LOOP
    v_next := v_next + INTERVAL '1 month';
  END LOOP;
  RETURN v_next;
END;
$$;

UPDATE public.profiles
SET credits_reset_at = CASE
  WHEN (is_lifetime = true OR plan IN ('hobbyist', 'founder_circle'))
       AND requests_reset_at > now()
    THEN requests_reset_at
  WHEN is_lifetime = true OR plan IN ('hobbyist', 'founder_circle')
    THEN public.next_monthly_credit_reset(requests_reset_at + INTERVAL '1 month', now())
  WHEN trial_ends_at IS NOT NULL AND trial_ends_at > now()
    THEN trial_ends_at
  ELSE date_trunc('month', now()) + INTERVAL '1 month'
END
WHERE credits_reset_at IS NULL;

ALTER TABLE public.profiles
  ALTER COLUMN credits_reset_at SET NOT NULL,
  ALTER COLUMN credits_reset_at SET DEFAULT (date_trunc('month', now()) + INTERVAL '1 month');

-- Atomically marks the order paid and grants the new plan. The plan is read
-- from our own order row, never trusted from webhook/client metadata.
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

  -- A duplicate/cross-event delivery must not refill credits twice.
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

  RETURN jsonb_build_object(
    'ok', true,
    'plan', v_order.plan_purchased,
    'credits_reset_at', v_next_reset
  );
END;
$$;

REVOKE ALL ON FUNCTION public.activate_paid_order(UUID, UUID, TEXT, TEXT, TIMESTAMPTZ) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.activate_paid_order(UUID, UUID, TEXT, TEXT, TIMESTAMPTZ) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.activate_paid_order(UUID, UUID, TEXT, TEXT, TIMESTAMPTZ) TO service_role;

-- Remove both historical signatures so PostgREST never sees an ambiguous RPC
-- when p_project_id is omitted.
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
  v_in_trial BOOLEAN;
  v_paid BOOLEAN;
  v_monthly INT;
BEGIN
  SELECT * INTO v_profile FROM public.profiles WHERE id = p_user_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Profile not found for user %', p_user_id; END IF;

  v_paid := COALESCE(v_profile.is_lifetime, false) OR v_profile.plan IN ('hobbyist', 'founder_circle');
  v_in_trial := NOT v_paid AND v_profile.trial_ends_at IS NOT NULL AND v_profile.trial_ends_at > now();

  IF v_in_trial THEN
    v_limit := 100 + COALESCE(v_profile.bonus_credits, 0);
    IF v_profile.ai_requests_total + p_credits > v_limit THEN
      RETURN jsonb_build_object('allowed', false, 'reason', 'trial_limit', 'remaining', GREATEST(0, v_limit - v_profile.ai_requests_total));
    END IF;
    RETURN jsonb_build_object('allowed', true, 'remaining', GREATEST(0, v_limit - v_profile.ai_requests_total - p_credits));
  END IF;

  v_monthly := CASE
    WHEN v_profile.credits_reset_at IS NOT NULL AND v_profile.credits_reset_at <= now() THEN 0
    ELSE v_profile.ai_requests_this_month
  END;

  v_limit := CASE
    WHEN COALESCE(v_profile.is_lifetime, false) OR v_profile.plan = 'founder_circle' THEN 500
    WHEN v_profile.plan = 'hobbyist' THEN 300
    ELSE 50
  END + COALESCE(v_profile.bonus_credits, 0);

  IF v_monthly + p_credits > v_limit THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'plan_limit', 'remaining', GREATEST(0, v_limit - v_monthly));
  END IF;
  RETURN jsonb_build_object('allowed', true, 'remaining', GREATEST(0, v_limit - v_monthly - p_credits));
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
BEGIN
  SELECT * INTO v_profile FROM public.profiles WHERE id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Profile not found for user %', p_user_id; END IF;

  IF v_profile.credits_reset_at IS NULL OR v_profile.credits_reset_at <= now() THEN
    v_next_reset := public.next_monthly_credit_reset(
      COALESCE(v_profile.credits_reset_at, date_trunc('month', now()) + INTERVAL '1 month'),
      now()
    );
    UPDATE public.profiles SET
      ai_requests_this_month = 0,
      requests_reset_at = now(),
      credits_reset_at = v_next_reset
    WHERE id = p_user_id;
  END IF;

  UPDATE public.profiles SET
    ai_requests_this_month = ai_requests_this_month + p_credits,
    ai_requests_total = ai_requests_total + p_credits,
    updated_at = now()
  WHERE id = p_user_id;

  RETURN jsonb_build_object('ok', true);
END;
$$;
