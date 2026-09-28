-- One-time, non-expiring credit top-ups.
-- Included plan/trial credits are always consumed before top-up credits.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS topup_credits INT NOT NULL DEFAULT 0;

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_topup_credits_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_topup_credits_check CHECK (topup_credits >= 0);

CREATE TABLE IF NOT EXISTS public.credit_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  pack_key TEXT NOT NULL CHECK (pack_key IN ('credits_100', 'credits_200', 'credits_400', 'credits_600', 'credits_1750', 'credits_4000')),
  credits INT NOT NULL CHECK (credits IN (100, 200, 400, 600, 1750, 4000)),
  amount_cents INT NOT NULL CHECK (amount_cents IN (500, 1000, 1500, 2000, 5000, 10000)),
  currency TEXT NOT NULL DEFAULT 'USD',
  product_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
  checkout_url TEXT,
  dodo_checkout_session_id TEXT,
  dodo_payment_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS credit_orders_checkout_session_idx
  ON public.credit_orders(dodo_checkout_session_id)
  WHERE dodo_checkout_session_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS credit_orders_payment_idx
  ON public.credit_orders(dodo_payment_id)
  WHERE dodo_payment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS credit_orders_user_idx
  ON public.credit_orders(user_id, created_at DESC);

ALTER TABLE public.credit_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own credit orders" ON public.credit_orders;
CREATE POLICY "Users can view own credit orders"
  ON public.credit_orders FOR SELECT
  USING (auth.uid() = user_id);

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
BEGIN
  SELECT * INTO v_order
  FROM public.credit_orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND OR v_order.user_id <> p_user_id THEN
    RAISE EXCEPTION 'Credit order does not belong to supplied user';
  END IF;
  IF v_order.status = 'paid' THEN
    RETURN jsonb_build_object('ok', true, 'already_fulfilled', true, 'credits', v_order.credits);
  END IF;
  IF v_order.status <> 'pending' THEN
    RAISE EXCEPTION 'Credit order cannot be fulfilled from status %', v_order.status;
  END IF;

  UPDATE public.credit_orders
  SET status = 'paid',
      dodo_payment_id = COALESCE(p_payment_id, dodo_payment_id),
      paid_at = p_paid_at,
      updated_at = now()
  WHERE id = p_order_id;

  UPDATE public.profiles
  SET topup_credits = topup_credits + v_order.credits,
      updated_at = now()
  WHERE id = p_user_id;

  IF NOT FOUND THEN RAISE EXCEPTION 'Profile not found for credit order user'; END IF;

  RETURN jsonb_build_object('ok', true, 'credits', v_order.credits);
END;
$$;

REVOKE ALL ON FUNCTION public.fulfill_credit_order(UUID, UUID, TEXT, TIMESTAMPTZ) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fulfill_credit_order(UUID, UUID, TEXT, TIMESTAMPTZ) TO service_role;

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
      WHEN COALESCE(v_profile.is_lifetime, false) OR v_profile.plan = 'founder_circle' THEN 500
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
      WHEN COALESCE(v_profile.is_lifetime, false) OR v_profile.plan = 'founder_circle' THEN 500
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
