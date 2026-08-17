-- Shared excerpts: public read-only links writers can share
CREATE TABLE shared_excerpts (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  token               TEXT        NOT NULL UNIQUE,
  project_id          UUID        NOT NULL REFERENCES projects(id)     ON DELETE CASCADE,
  chapter_id          UUID                 REFERENCES chapters(id)     ON DELETE SET NULL,
  excerpt_title       TEXT,
  novel_title         TEXT,
  author_display_name TEXT,
  content             TEXT        NOT NULL,
  word_count          INT         NOT NULL DEFAULT 0,
  created_by          UUID        NOT NULL REFERENCES auth.users(id)   ON DELETE CASCADE,
  views               INT         NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE shared_excerpts ENABLE ROW LEVEL SECURITY;

-- Anyone can read a shared excerpt (public link)
CREATE POLICY "Public read shared excerpts"
  ON shared_excerpts FOR SELECT USING (true);

-- Only the owner can create
CREATE POLICY "Owner insert shared excerpts"
  ON shared_excerpts FOR INSERT
  WITH CHECK (created_by = auth.uid());

-- Owner can delete their own
CREATE POLICY "Owner delete shared excerpts"
  ON shared_excerpts FOR DELETE
  USING (created_by = auth.uid());

-- Owner can increment views via update (or we handle via service role)
CREATE POLICY "Service role update shared excerpts"
  ON shared_excerpts FOR UPDATE
  USING (true);

CREATE INDEX shared_excerpts_token_idx ON shared_excerpts(token);
CREATE INDEX shared_excerpts_created_by_idx ON shared_excerpts(created_by);
