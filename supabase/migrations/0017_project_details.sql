-- Add cover image, synopsis, and writing status to projects
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS cover_image_url TEXT,
  ADD COLUMN IF NOT EXISTS synopsis        TEXT,
  ADD COLUMN IF NOT EXISTS writing_status  TEXT DEFAULT 'drafting'
    CHECK (writing_status IN ('drafting', 'paused', 'completed'));

-- Storage bucket for custom cover images (run separately in Supabase dashboard
-- or via CLI: supabase storage create covers --public)
