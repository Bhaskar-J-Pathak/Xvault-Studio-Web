-- The extraction schema and World Board UI support a "lore" entity type.
-- The original table check did not, causing valid extractions to fail at insert.
ALTER TABLE entities DROP CONSTRAINT IF EXISTS entities_type_check;

ALTER TABLE entities
  ADD CONSTRAINT entities_type_check
  CHECK (type IN ('character', 'location', 'faction', 'item', 'event', 'lore'));

-- Make relationship writes explicit under RLS. A project owner may connect any
-- two entities in their own project, including lore entities.
DROP POLICY IF EXISTS "Users can manage own relationships" ON relationships;

CREATE POLICY "Users can manage own relationships"
  ON relationships
  FOR ALL
  USING (
    auth.uid() = (SELECT user_id FROM projects WHERE id = relationships.project_id)
  )
  WITH CHECK (
    auth.uid() = (SELECT user_id FROM projects WHERE id = relationships.project_id)
  );
