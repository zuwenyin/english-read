-- Migration 001: Add summary column to articles table
-- For existing databases that were created before this column was added

-- SQLite does not support IF NOT EXISTS for ALTER TABLE ADD COLUMN,
-- so we use a pragmatic approach: try-catch in the migration runner,
-- or simply check if the column exists before altering.

-- If you get an error "duplicate column name: summary",
-- it means the column already exists and this migration can be safely skipped.

ALTER TABLE articles ADD COLUMN summary TEXT DEFAULT '';
