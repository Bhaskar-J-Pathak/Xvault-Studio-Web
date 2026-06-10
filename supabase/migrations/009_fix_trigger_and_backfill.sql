-- ============================================================
-- Migration 009: Fix handle_new_user trigger + backfill profiles
-- ============================================================
-- Problem: migration 008 made referral_code NOT NULL, but if the
-- handle_new_user function wasn't updated in production the trigger
-- fails silently on new signups, leaving users with no profile row.
-- This migration:
--   1. Drops and recreates the trigger explicitly
--   2. Recreates the function with the correct referral_code insert
--   3. Backfills any auth.users rows that are missing a profile
-- ============================================================

-- ── 1. Recreate the function ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (id, email, plan, trial_ends_at, referral_code)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    'free',
    now() + INTERVAL '14 days',
    upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 8))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- ── 2. Drop and recreate the trigger (ensures it points to updated fn) ────
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ── 3. Backfill: create profiles for any auth users who have none ─────────
-- Safe to run multiple times (ON CONFLICT DO NOTHING).
INSERT INTO profiles (id, email, plan, trial_ends_at, referral_code)
SELECT
  u.id,
  COALESCE(u.email, ''),
  'free',
  now() + INTERVAL '14 days',
  upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 8))
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;
