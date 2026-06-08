-- ============================================================
-- Migration 005: Shorten existing active trials to 14 days
-- ============================================================
-- Migration 004 updated the handle_new_user trigger so all NEW
-- signups get 14-day trials. This migration retroactively caps
-- any still-active trial that would run longer than 14 days
-- from the user's signup date.
--
-- Safe to run multiple times (idempotent — only shortens, never extends).
-- ============================================================

UPDATE profiles p
SET    trial_ends_at = u.created_at + INTERVAL '14 days',
       updated_at    = now()
FROM   auth.users u
WHERE  p.id              = u.id
  AND  p.trial_ends_at   IS NOT NULL
  AND  p.trial_ends_at   > now()
  AND  u.created_at + INTERVAL '14 days' < p.trial_ends_at;
