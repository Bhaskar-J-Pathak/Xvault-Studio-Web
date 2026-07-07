-- ============================================================
-- Migration 011: Ensure story_bibles.project_id is unique
-- ============================================================
-- Migration 006 used CREATE TABLE IF NOT EXISTS, which is skipped
-- entirely on databases where the table already existed (created
-- manually before the migration was written). That means the
-- UNIQUE (project_id) constraint was never added on those DBs,
-- causing all upserts with onConflict:"project_id" to fail.
--
-- This migration safely:
--   1. Removes duplicate rows (keeps most recently updated)
--   2. Adds the unique constraint if it doesn't already exist
-- ============================================================

-- Step 1: Deduplicate — keep the most recently updated row per project.
DELETE FROM story_bibles
WHERE id NOT IN (
  SELECT DISTINCT ON (project_id) id
  FROM story_bibles
  ORDER BY project_id, updated_at DESC NULLS LAST
);

-- Step 2: Add the constraint if it's missing.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname    = 'story_bibles_project_id_key'
      AND conrelid   = 'story_bibles'::regclass
  ) THEN
    ALTER TABLE story_bibles
      ADD CONSTRAINT story_bibles_project_id_key UNIQUE (project_id);
  END IF;
END $$;
