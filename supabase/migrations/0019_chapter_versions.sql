-- ============================================================
-- Migration 0019: chapter_versions table
--
-- Stores a snapshot of chapter content before AI edits are
-- applied. Allows writers to roll back any edit session.
-- ============================================================

CREATE TABLE chapter_versions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id     UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  content        JSONB NOT NULL,
  change_type    TEXT NOT NULL DEFAULT 'edit_session',  -- 'edit_session' | 'manual'
  change_summary TEXT,            -- e.g. "Line edit: tightened 5 paragraphs"
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX chapter_versions_chapter_id_idx
  ON chapter_versions(chapter_id, created_at DESC);

-- RLS: users can only see versions of chapters they own
ALTER TABLE chapter_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chapter_versions_owner" ON chapter_versions
  FOR ALL USING (
    chapter_id IN (
      SELECT c.id FROM chapters c
      JOIN projects p ON p.id = c.project_id
      WHERE p.user_id = auth.uid()
    )
  );
