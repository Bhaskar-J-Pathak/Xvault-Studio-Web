-- ============================================================
-- Migration 006: story_bibles table + Row Level Security
-- ============================================================
-- The story_bibles table was used in code but never formally
-- defined in migrations, meaning it had no RLS. This migration
-- creates the table (IF NOT EXISTS — safe on fresh DBs) and
-- enables RLS so users can only access their own project's bible.
-- ============================================================

CREATE TABLE IF NOT EXISTS story_bibles (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  project_intent  TEXT,
  style_notes     TEXT,
  synopsis        TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (project_id)
);

ALTER TABLE story_bibles ENABLE ROW LEVEL SECURITY;

-- Users can read/write their own project's bible only.
-- We join through projects to verify ownership.
CREATE POLICY "Users can manage own story bibles"
  ON story_bibles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id       = story_bibles.project_id
        AND projects.user_id  = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id       = story_bibles.project_id
        AND projects.user_id  = auth.uid()
    )
  );
