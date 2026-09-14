-- The writing contest is postponed. Remove any active enrollment allowance so
-- every manuscript continues to use the user's normal trial or plan credits.
-- Contest projects are deliberately kept as ordinary user projects.
UPDATE profiles
SET
  contest_slug = NULL,
  contest_credits_remaining = 0,
  contest_ends_at = NULL,
  contest_project_id = NULL,
  updated_at = now()
WHERE contest_slug = 'xvault-10k-2026';
