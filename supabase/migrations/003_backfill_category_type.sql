-- Backfill: set type = 'expense' for any categories that have type = NULL
-- (rows created before migration 002 added the column with a NOT NULL default)
UPDATE categories SET type = 'expense' WHERE type IS NULL;
