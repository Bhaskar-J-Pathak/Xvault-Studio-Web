-- ============================================================
-- Migration 010: Add welcome_email_sent flag to profiles
-- ============================================================
-- Tracks whether the one-time welcome email has been sent.
-- Checked in /auth/callback so the email fires exactly once
-- per account (not per login).
-- ============================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS welcome_email_sent BOOLEAN NOT NULL DEFAULT false;

-- Backfill: existing users who've already gone through onboarding
-- should NOT receive a welcome email retroactively.
UPDATE profiles
SET welcome_email_sent = true
WHERE onboarding_step > 0 OR onboarding_done = true;
