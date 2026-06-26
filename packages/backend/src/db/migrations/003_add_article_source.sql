-- 003: 为 articles 表添加 source（来源）列
ALTER TABLE articles ADD COLUMN source TEXT DEFAULT '';
