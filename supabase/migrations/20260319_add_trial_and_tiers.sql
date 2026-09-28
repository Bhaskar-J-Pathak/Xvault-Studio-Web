-- ──────────────────────────────────────────────────────────────────────────────
-- Migration: trial credits system + plan tiers
-- Run in Supabase SQL Editor or via `supabase db push`
-- ──────────────────────────────────────────────────────────────────────────────

-- 1. Expand plan column to allow all tiers
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_plan_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_plan_check
    CHECK (plan IN ('free', 'pro', 'pro_plus', 'ultra'));
-- 2. Add updated_at column if missing (required by existing moddatetime trigger)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
-- 3. Add trial window column (14 days from signup)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;
-- 4. Add lifetime request counter (used for trial credit tracking — never resets)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS ai_requests_total INT NOT NULL DEFAULT 0;
-- 5. Give existing users a fresh 14-day trial from now
UPDATE public.profiles
  SET trial_ends_at = now() + INTERVAL '14 days'
  WHERE trial_ends_at IS NULL;
-- 5. Supabase RPC used by the app to increment counters atomically
--    Increments BOTH ai_requests_this_month AND ai_requests_total
CREATE OR REPLACE FUNCTION public.increment_ai_requests()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.profiles
  SET
    ai_requests_this_month = ai_requests_this_month + 1,
    ai_requests_total      = ai_requests_total      + 1
  WHERE id = auth.uid();
END;
$$;
-- 6. Update profile-creation trigger to set trial_ends_at on new signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    plan,
    ai_requests_this_month,
    ai_requests_total,
    requests_reset_at,
    trial_ends_at
  )
  VALUES (
    new.id,
    new.email,
    'free',
    0,
    0,
    now(),
    now() + INTERVAL '14 days'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
