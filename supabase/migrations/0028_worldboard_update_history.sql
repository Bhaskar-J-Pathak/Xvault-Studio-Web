-- Persist meaningful changes made by automatic World Board extraction.
CREATE TABLE IF NOT EXISTS worldboard_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  chapter_id UUID REFERENCES chapters(id) ON DELETE SET NULL,
  chapter_number INT NOT NULL,
  changes JSONB NOT NULL DEFAULT '{}',
  viewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS worldboard_updates_project_created_idx
  ON worldboard_updates(project_id, created_at DESC);
ALTER TABLE worldboard_updates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own world board updates"
  ON worldboard_updates FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = worldboard_updates.project_id
      AND projects.user_id = auth.uid()
  ));
CREATE POLICY "Users can mark own world board updates viewed"
  ON worldboard_updates FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = worldboard_updates.project_id
      AND projects.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = worldboard_updates.project_id
      AND projects.user_id = auth.uid()
  ));
CREATE POLICY "Users can create own world board updates"
  ON worldboard_updates FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = worldboard_updates.project_id
      AND projects.user_id = auth.uid()
  ));
