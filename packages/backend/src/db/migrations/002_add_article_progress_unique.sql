-- 002: 为 user_article_progress 添加 UNIQUE 约束
-- 同一用户可多次阅读同一文章，但只有一条进度记录（upsert 更新）

-- SQLite 不支持 ALTER TABLE ADD CONSTRAINT，需要通过重建表实现
-- 但 IF NOT EXISTS 特性的表无法直接用 CREATE TABLE ... AS SELECT 迁移
-- 简化方案：如果约束不存在则尝试直接添加（SQLite 3.33+ 部分支持）

-- 检查约束是否存在，不存在则创建
CREATE TABLE IF NOT EXISTS user_article_progress_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    article_id INTEGER NOT NULL,
    answers TEXT DEFAULT '[]',
    completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (article_id) REFERENCES articles(id),
    UNIQUE(user_id, article_id)
);

-- 将现有数据迁移到新表（去重保留最新）
INSERT OR IGNORE INTO user_article_progress_new (id, user_id, article_id, answers, completed_at)
SELECT id, user_id, article_id, answers, completed_at
FROM user_article_progress
ORDER BY completed_at DESC;

-- 删除旧表并重命名新表
DROP TABLE user_article_progress;
ALTER TABLE user_article_progress_new RENAME TO user_article_progress;
