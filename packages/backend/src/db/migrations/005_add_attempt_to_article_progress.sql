-- 005: 为 user_article_progress 添加 attempt 列，支持同一用户多轮答题
-- 改 UNIQUE(user_id, article_id) 为 UNIQUE(user_id, article_id, attempt)
-- 已有数据默认 attempt=1

CREATE TABLE IF NOT EXISTS user_article_progress_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    article_id INTEGER NOT NULL,
    attempt INTEGER NOT NULL DEFAULT 1,
    answers TEXT DEFAULT '[]',
    completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (article_id) REFERENCES articles(id),
    UNIQUE(user_id, article_id, attempt)
);

-- 将现有数据迁移到新表，已有数据 attempt=1
INSERT OR IGNORE INTO user_article_progress_new (id, user_id, article_id, attempt, answers, completed_at)
SELECT id, user_id, article_id, 1, answers, completed_at
FROM user_article_progress
ORDER BY completed_at DESC;

DROP TABLE user_article_progress;
ALTER TABLE user_article_progress_new RENAME TO user_article_progress;
