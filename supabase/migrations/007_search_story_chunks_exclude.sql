-- ============================================================
-- Migration 007: Add p_exclude_chapter_id to search_story_chunks
-- ============================================================
-- The original function had no way to exclude the chapter the user is
-- currently editing. This replaces it with a version that accepts an
-- optional exclusion parameter (NULL means no exclusion).
-- ============================================================

CREATE OR REPLACE FUNCTION search_story_chunks(
  p_project_id         UUID,
  p_embedding          VECTOR(768),
  p_limit              INT DEFAULT 5,
  p_exclude_chapter_id UUID DEFAULT NULL
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
    AND (p_exclude_chapter_id IS NULL OR sc.chapter_id <> p_exclude_chapter_id)
  ORDER BY sc.embedding <=> p_embedding
  LIMIT p_limit;
END;
$$;
