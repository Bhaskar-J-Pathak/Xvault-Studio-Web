-- Server-timed balance summary used by the account page. Keeping the maturity
-- comparison in Postgres avoids trusting the browser clock.
CREATE OR REPLACE FUNCTION public.get_my_affiliate_summary()
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'pending_cents', COALESCE((
      SELECT SUM(commission_amount_cents)
      FROM public.affiliate_commissions
      WHERE referrer_id = auth.uid()
        AND status = 'pending'
        AND available_at > now()
    ), 0),
    'available_cents', COALESCE((
      SELECT SUM(commission_amount_cents)
      FROM public.affiliate_commissions
      WHERE referrer_id = auth.uid()
        AND status = 'pending'
        AND available_at <= now()
    ), 0),
    'lifetime_earned_cents', COALESCE((
      SELECT SUM(commission_amount_cents)
      FROM public.affiliate_commissions
      WHERE referrer_id = auth.uid()
        AND status <> 'reversed'
    ), 0),
    'payout_pending_cents', COALESCE((
      SELECT SUM(amount_cents)
      FROM public.affiliate_withdrawals
      WHERE user_id = auth.uid()
        AND status IN ('requested', 'processing')
    ), 0)
  );
$$;

REVOKE ALL ON FUNCTION public.get_my_affiliate_summary() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_affiliate_summary() TO authenticated;
