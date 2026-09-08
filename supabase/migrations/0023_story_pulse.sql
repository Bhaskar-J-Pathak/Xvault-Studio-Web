-- Chapter-by-chapter emotional observations for the Story Pulse MVP.
CREATE TABLE IF NOT EXISTS story_pulse_observations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id        UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  chapter_id        UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  character_name    TEXT NOT NULL,
  emotional_state   TEXT NOT NULL,
  desire            TEXT,
  fear               TEXT,
  change_summary    TEXT,
  evidence_quote    TEXT NOT NULL,
  continuity_note   TEXT,
  severity          TEXT NOT NULL DEFAULT 'none'
                    CHECK (severity IN ('none', 'notice', 'warning')),
  confidence        TEXT NOT NULL DEFAULT 'inferred'
                    CHECK (confidence IN ('explicit', 'inferred')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (project_id, chapter_id, character_name)
);

CREATE INDEX IF NOT EXISTS story_pulse_project_chapter_idx
  ON story_pulse_observations(project_id, chapter_id);

ALTER TABLE story_pulse_observations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own story pulse"
  ON story_pulse_observations FOR ALL
  USING (EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = story_pulse_observations.project_id
      AND projects.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = story_pulse_observations.project_id
      AND projects.user_id = auth.uid()
  ));
