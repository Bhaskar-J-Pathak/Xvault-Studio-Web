-- ============================================================
-- XVault Studio — Initial Schema
-- Run this in the Supabase SQL editor or via supabase db push
-- ============================================================

-- Enable pgvector for semantic search
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================
-- PROFILES
-- One row per auth.users entry — created automatically by trigger
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id                     UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email                  TEXT NOT NULL,
  plan                   TEXT NOT NULL DEFAULT 'free'
                           CHECK (plan IN ('free', 'pro', 'pro_plus', 'ultra')),
  ai_requests_this_month INT NOT NULL DEFAULT 0,
  ai_requests_total      INT NOT NULL DEFAULT 0,
  requests_reset_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  trial_ends_at          TIMESTAMPTZ,               -- signup + 28 days
  onboarding_step        INT NOT NULL DEFAULT 0,    -- which tutorial step the user is on
  onboarding_done        BOOLEAN NOT NULL DEFAULT false,
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger: automatically create a profile when a new user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (id, email, plan, trial_ends_at)
  VALUES (
    NEW.id,
    NEW.email,
    'free',
    now() + INTERVAL '28 days'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- PROJECTS
-- ============================================================
CREATE TABLE IF NOT EXISTS projects (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  genre      TEXT,
  is_sample  BOOLEAN NOT NULL DEFAULT false,
  settings   JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS projects_user_id_idx ON projects(user_id);

-- ============================================================
-- CHAPTERS
-- ============================================================
CREATE TABLE IF NOT EXISTS chapters (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  content    JSONB,               -- Lexical editor state (serialised JSON)
  word_count INT NOT NULL DEFAULT 0,
  position   INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS chapters_project_id_idx ON chapters(project_id);

-- ============================================================
-- STORY CHUNKS  (vector search)
-- ============================================================
CREATE TABLE IF NOT EXISTS story_chunks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  chapter_id  UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  embedding   VECTOR(768),        -- Gemini text-embedding-004 (768-dim)
  chunk_index INT NOT NULL DEFAULT 0,
  word_start  INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- IVFFlat index for fast approximate cosine similarity search
-- lists = 100 is a good default; increase to 200 if the table grows past ~1M rows
CREATE INDEX IF NOT EXISTS story_chunks_embedding_idx
  ON story_chunks USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

CREATE INDEX IF NOT EXISTS story_chunks_project_id_idx ON story_chunks(project_id);

-- ============================================================
-- PLOT THREADS
-- ============================================================
CREATE TABLE IF NOT EXISTS plot_threads (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id               UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  description              TEXT NOT NULL,
  introduced_chapter_id    UUID REFERENCES chapters(id) ON DELETE SET NULL,
  last_seen_chapter_id     UUID REFERENCES chapters(id) ON DELETE SET NULL,
  last_seen_word_position  INT NOT NULL DEFAULT 0,
  total_project_words      INT NOT NULL DEFAULT 0,
  status                   TEXT NOT NULL DEFAULT 'open'
                             CHECK (status IN ('open', 'resolved', 'dead')),
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS plot_threads_project_id_idx ON plot_threads(project_id);

-- ============================================================
-- ENTITIES  (World Board)
-- ============================================================
CREATE TABLE IF NOT EXISTS entities (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  type        TEXT NOT NULL DEFAULT 'character'
                CHECK (type IN ('character', 'location', 'faction', 'item', 'event')),
  description TEXT,
  attributes  JSONB NOT NULL DEFAULT '{}',
  position    JSONB NOT NULL DEFAULT '{"x":0,"y":0}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS entities_project_id_idx ON entities(project_id);

-- ============================================================
-- RELATIONSHIPS  (World Board edges)
-- ============================================================
CREATE TABLE IF NOT EXISTS relationships (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  source_id  UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  target_id  UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  label      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS relationships_project_id_idx ON relationships(project_id);

-- ============================================================
-- CORK CARDS
-- ============================================================
CREATE TABLE IF NOT EXISTS cork_cards (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title      TEXT,
  content    TEXT,
  color      TEXT NOT NULL DEFAULT '#1c1917',
  position   JSONB NOT NULL DEFAULT '{"x":0,"y":0}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS cork_cards_project_id_idx ON cork_cards(project_id);

-- ============================================================
-- STYLE PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS style_profiles (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id          UUID NOT NULL UNIQUE REFERENCES projects(id) ON DELETE CASCADE,
  pov                 TEXT,
  tense               TEXT,
  sentence_length     TEXT,
  dialogue_ratio      TEXT,
  description_density TEXT,
  tone                TEXT,
  vocabulary_level    TEXT,
  sample_sentences    JSONB NOT NULL DEFAULT '[]',
  analyzed_at_words   INT NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- CHAT MEMORIES  (persistent co-author context)
-- ============================================================
CREATE TABLE IF NOT EXISTS chat_memories (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  summary    TEXT NOT NULL,
  tags       TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS chat_memories_project_id_idx ON chat_memories(project_id);

-- ============================================================
-- SAMPLE PROJECTS  (seeded once at deploy, not per-user)
-- ============================================================
CREATE TABLE IF NOT EXISTS sample_projects (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  genre         TEXT NOT NULL UNIQUE,   -- fantasy | scifi | thriller | romance
  title         TEXT NOT NULL,
  chapters      JSONB NOT NULL,         -- [{title, content (plain text), word_count}]
  chunks        JSONB NOT NULL,         -- [{content, embedding (float[]), chunk_index, word_start}]
  entities      JSONB NOT NULL,         -- [{name, type, description, attributes, position}]
  relationships JSONB NOT NULL,         -- [{source_name, target_name, label}]
  threads       JSONB NOT NULL          -- [{description, introduced_chapter, last_seen_chapter, status}]
);

-- ============================================================
-- ROW LEVEL SECURITY
-- Every user can only read/write their own data.
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own projects"
  ON projects FOR ALL USING (auth.uid() = user_id);

ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own chapters"
  ON chapters FOR ALL USING (
    auth.uid() = (SELECT user_id FROM projects WHERE id = chapters.project_id)
  );

ALTER TABLE story_chunks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own story chunks"
  ON story_chunks FOR ALL USING (
    auth.uid() = (SELECT user_id FROM projects WHERE id = story_chunks.project_id)
  );

ALTER TABLE plot_threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own plot threads"
  ON plot_threads FOR ALL USING (
    auth.uid() = (SELECT user_id FROM projects WHERE id = plot_threads.project_id)
  );

ALTER TABLE entities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own entities"
  ON entities FOR ALL USING (
    auth.uid() = (SELECT user_id FROM projects WHERE id = entities.project_id)
  );

ALTER TABLE relationships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own relationships"
  ON relationships FOR ALL USING (
    auth.uid() = (SELECT user_id FROM projects WHERE id = relationships.project_id)
  );

ALTER TABLE cork_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own cork cards"
  ON cork_cards FOR ALL USING (
    auth.uid() = (SELECT user_id FROM projects WHERE id = cork_cards.project_id)
  );

ALTER TABLE style_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own style profiles"
  ON style_profiles FOR ALL USING (
    auth.uid() = (SELECT user_id FROM projects WHERE id = style_profiles.project_id)
  );

ALTER TABLE chat_memories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own chat memories"
  ON chat_memories FOR ALL USING (
    auth.uid() = (SELECT user_id FROM projects WHERE id = chat_memories.project_id)
  );

-- sample_projects is public read-only (seeded at deploy, no auth needed)
ALTER TABLE sample_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read sample projects"
  ON sample_projects FOR SELECT USING (true);

-- ============================================================
-- ATOMIC RATE LIMIT RPC
-- Called from server-side API routes via the service-role client.
-- Uses FOR UPDATE to lock the row — safe under 100+ concurrent users.
-- Returns: {allowed: bool, remaining: int, reason?: string}
-- ============================================================
CREATE OR REPLACE FUNCTION consume_ai_request(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_profile profiles%ROWTYPE;
  v_limit   INT;
  v_in_trial BOOLEAN;
BEGIN
  -- Lock the profile row to serialise concurrent AI requests from same user
  SELECT * INTO v_profile
  FROM profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found for user %', p_user_id;
  END IF;

  -- Reset monthly counter if we've crossed into a new calendar month
  IF date_trunc('month', now()) > date_trunc('month', v_profile.requests_reset_at) THEN
    UPDATE profiles
    SET ai_requests_this_month = 0,
        requests_reset_at = now()
    WHERE id = p_user_id;
    v_profile.ai_requests_this_month := 0;
  END IF;

  -- Trial check: unlimited access during trial window
  v_in_trial := v_profile.trial_ends_at IS NOT NULL
                AND v_profile.trial_ends_at > now();

  IF v_in_trial THEN
    UPDATE profiles
    SET ai_requests_this_month = ai_requests_this_month + 1,
        ai_requests_total      = ai_requests_total + 1,
        updated_at             = now()
    WHERE id = p_user_id;
    RETURN jsonb_build_object('allowed', true, 'remaining', 9999);
  END IF;

  -- Resolve plan cap
  v_limit := CASE v_profile.plan
    WHEN 'free'     THEN 50
    WHEN 'pro'      THEN 500
    WHEN 'pro_plus' THEN 2000
    WHEN 'ultra'    THEN 10000
    ELSE 50
  END;

  -- Enforce limit
  IF v_profile.ai_requests_this_month >= v_limit THEN
    RETURN jsonb_build_object(
      'allowed',   false,
      'reason',    'plan_limit',
      'remaining', 0
    );
  END IF;

  -- Allow and increment
  UPDATE profiles
  SET ai_requests_this_month = ai_requests_this_month + 1,
      ai_requests_total      = ai_requests_total + 1,
      updated_at             = now()
  WHERE id = p_user_id;

  RETURN jsonb_build_object(
    'allowed',   true,
    'remaining', v_limit - v_profile.ai_requests_this_month - 1
  );
END;
$$;

-- ============================================================
-- SEMANTIC SEARCH RPC
-- Called from /api/ai/story-bible. Returns the N most similar
-- story chunks for a given query embedding.
-- ============================================================
CREATE OR REPLACE FUNCTION search_story_chunks(
  p_project_id UUID,
  p_embedding  VECTOR(768),
  p_limit      INT DEFAULT 5
)
RETURNS TABLE (
  id          UUID,
  chapter_id  UUID,
  content     TEXT,
  similarity  FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    sc.id,
    sc.chapter_id,
    sc.content,
    1 - (sc.embedding <=> p_embedding) AS similarity
  FROM story_chunks sc
  WHERE sc.project_id = p_project_id
    AND sc.embedding IS NOT NULL
  ORDER BY sc.embedding <=> p_embedding
  LIMIT p_limit;
END;
$$;
