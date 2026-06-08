-- Co-author settings per project
CREATE TABLE IF NOT EXISTS coauthors (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  uuid        NOT NULL UNIQUE REFERENCES projects(id) ON DELETE CASCADE,
  name        text        NOT NULL DEFAULT 'Alex',
  personality text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE coauthors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner" ON coauthors
  USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

-- Co-author message history per project (max 50 kept)
CREATE TABLE IF NOT EXISTS coauthor_messages (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   uuid        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  role         text        NOT NULL CHECK (role IN ('user', 'assistant')),
  content      text        NOT NULL,
  message_type text        NOT NULL DEFAULT 'chat',
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE coauthor_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner" ON coauthor_messages
  USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

CREATE INDEX IF NOT EXISTS coauthor_messages_project_created
  ON coauthor_messages (project_id, created_at DESC);
