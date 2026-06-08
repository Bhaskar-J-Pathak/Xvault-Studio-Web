-- ============================================================
-- XVault Studio — World Board Schema Additions
-- ============================================================

-- Track how many words have been processed by extraction per chapter.
-- Only the delta (new words) is sent to the AI on each pass — keeps costs near zero.
ALTER TABLE chapters
  ADD COLUMN IF NOT EXISTS last_extracted_word INT NOT NULL DEFAULT 0;

-- Enrich entities with provenance + confidence metadata
ALTER TABLE entities
  ADD COLUMN IF NOT EXISTS confidence           TEXT NOT NULL DEFAULT 'inferred'
    CHECK (confidence IN ('explicit', 'inferred')),
  ADD COLUMN IF NOT EXISTS first_seen_chapter_id UUID REFERENCES chapters(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS last_seen_word        INT NOT NULL DEFAULT 0;

-- ============================================================
-- INCONSISTENCY FLAGS
-- Queued by the extraction diff engine when a known entity
-- attribute contradicts new manuscript text.
-- The co-author reads this table to generate proactive alerts.
-- ============================================================
CREATE TABLE IF NOT EXISTS inconsistency_flags (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id        UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  entity_id         UUID REFERENCES entities(id) ON DELETE CASCADE,
  entity_name       TEXT NOT NULL,
  attribute         TEXT NOT NULL,
  established_value TEXT NOT NULL,
  found_value       TEXT NOT NULL,
  context_quote     TEXT,
  chapter_id        UUID REFERENCES chapters(id) ON DELETE CASCADE,
  status            TEXT NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending', 'resolved_typo', 'resolved_intentional')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS inconsistency_flags_project_id_idx
  ON inconsistency_flags(project_id);
CREATE INDEX IF NOT EXISTS inconsistency_flags_status_idx
  ON inconsistency_flags(project_id, status)
  WHERE status = 'pending';

ALTER TABLE inconsistency_flags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own inconsistency flags"
  ON inconsistency_flags FOR ALL USING (
    auth.uid() = (SELECT user_id FROM projects WHERE id = inconsistency_flags.project_id)
  );

-- ============================================================
-- DEAD BRANCH THRESHOLD
-- Dead branch is determined by CHAPTER GAP, not word count,
-- because writers have very different chapter lengths.
-- A thread is dead if it hasn't been mentioned for N chapters.
-- The threshold is stored per-project so it's configurable.
-- Default: 5 chapters (covers both long and short chapter writers).
-- ============================================================

-- Add chapter-based tracking to plot_threads
ALTER TABLE plot_threads
  ADD COLUMN IF NOT EXISTS introduced_chapter_number  INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_seen_chapter_number   INT NOT NULL DEFAULT 0;

-- Add dead_branch_threshold to project settings JSONB
-- (already exists as JSONB DEFAULT '{}', just document the key here)
-- project.settings.dead_branch_chapter_threshold: number (default 5)
-- Users can configure this in their project settings: 3–10 chapters.

-- ============================================================
-- SEARCH RPC — find entity by name (case-insensitive)
-- Used by the diff engine to match extracted names to DB rows
-- ============================================================
-- ============================================================
-- MERGE ENTITY ATTRIBUTES
-- Merges new/changed attributes into an entity's JSONB without
-- removing existing keys — uses Postgres || operator.
-- ============================================================
CREATE OR REPLACE FUNCTION merge_entity_attributes(
  p_entity_id  UUID,
  p_attributes JSONB
)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE entities
  SET attributes = attributes || p_attributes
  WHERE id = p_entity_id;
$$;

-- ============================================================
-- ADVANCE CHAPTER EXTRACTION WATERMARK
-- Increments last_extracted_word so only truly new text is
-- sent to the AI on the next pass.
-- ============================================================
CREATE OR REPLACE FUNCTION advance_chapter_extraction(
  p_chapter_id UUID,
  p_word_delta  INT
)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE chapters
  SET last_extracted_word = last_extracted_word + p_word_delta
  WHERE id = p_chapter_id;
$$;

-- ============================================================
-- SEARCH RPC — find entity by name (case-insensitive)
-- Used by the diff engine to match extracted names to DB rows
-- ============================================================
CREATE OR REPLACE FUNCTION find_entity_by_name(
  p_project_id UUID,
  p_name       TEXT
)
RETURNS TABLE (
  id         UUID,
  name       TEXT,
  type       TEXT,
  attributes JSONB,
  confidence TEXT
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT id, name, type, attributes, confidence
  FROM entities
  WHERE project_id = p_project_id
    AND lower(name) = lower(p_name)
  LIMIT 1;
$$;
