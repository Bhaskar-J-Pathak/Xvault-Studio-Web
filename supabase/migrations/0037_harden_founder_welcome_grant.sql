-- Prevent the one-time Founder welcome-credit marker from being cleared and
-- re-triggered by a later profile update.

CREATE OR REPLACE FUNCTION public.grant_founder_welcome_credits()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE'
     AND OLD.founder_welcome_credits_granted_at IS NOT NULL THEN
    NEW.founder_welcome_credits_granted_at := OLD.founder_welcome_credits_granted_at;
  END IF;

  IF (
    COALESCE(NEW.is_lifetime, false)
    OR NEW.plan = 'founder_circle'
  ) AND NEW.founder_welcome_credits_granted_at IS NULL THEN
    NEW.topup_credits := COALESCE(NEW.topup_credits, 0) + 500;
    NEW.founder_welcome_credits_granted_at := now();
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS grant_founder_welcome_credits_on_profile ON public.profiles;
CREATE TRIGGER grant_founder_welcome_credits_on_profile
  BEFORE INSERT OR UPDATE OF plan, is_lifetime, founder_welcome_credits_granted_at
  ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.grant_founder_welcome_credits();

REVOKE ALL ON FUNCTION public.grant_founder_welcome_credits() FROM PUBLIC, anon, authenticated;
