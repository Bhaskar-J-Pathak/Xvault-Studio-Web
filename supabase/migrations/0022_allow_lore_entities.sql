-- The extraction schema and World Board UI support a "lore" entity type.
-- The original table check did not, causing valid extractions to fail at insert.
ALTER TABLE entities DROP CONSTRAINT IF EXISTS entities_type_check;

ALTER TABLE entities
  ADD CONSTRAINT entities_type_check
  CHECK (type IN ('character', 'location', 'faction', 'item', 'event', 'lore'));
