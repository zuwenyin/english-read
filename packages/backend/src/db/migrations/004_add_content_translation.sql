-- 为文章添加内容翻译字段（存储段落级中英文对照 JSON）
ALTER TABLE articles ADD COLUMN content_translation TEXT DEFAULT '';
