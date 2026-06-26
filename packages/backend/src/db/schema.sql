-- english-read 数据库初始化脚本
-- 7 张表，严格按 technical-design.md 第五节

-- 1. users — 用户账号
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. word_books — 词书（按年级阶段）
CREATE TABLE IF NOT EXISTS word_books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    level TEXT NOT NULL,
    description TEXT DEFAULT ''
);

-- 3. words — 单词
CREATE TABLE IF NOT EXISTS words (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    word_book_id INTEGER NOT NULL,
    word TEXT NOT NULL,
    phonetic TEXT DEFAULT '',
    translation TEXT DEFAULT '',
    example_sentence TEXT DEFAULT '',
    difficulty INTEGER DEFAULT 1,
    FOREIGN KEY (word_book_id) REFERENCES word_books(id)
);

-- 4. articles — 阅读文章
CREATE TABLE IF NOT EXISTS articles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    summary TEXT DEFAULT '',
    level TEXT NOT NULL,
    category TEXT NOT NULL,
    source TEXT DEFAULT '',
    questions TEXT DEFAULT '[]',
    content_translation TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 5. user_word_progress — 单词学习进度
CREATE TABLE IF NOT EXISTS user_word_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    word_id INTEGER NOT NULL,
    familiarity INTEGER DEFAULT 1,
    review_count INTEGER DEFAULT 0,
    last_reviewed DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (word_id) REFERENCES words(id),
    UNIQUE(user_id, word_id)
);

-- 6. user_article_progress — 文章阅读进度（支持多轮答题 attempt）
CREATE TABLE IF NOT EXISTS user_article_progress (
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

-- 7. article_words — 文章生词预标注
CREATE TABLE IF NOT EXISTS article_words (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    article_id INTEGER NOT NULL,
    word TEXT NOT NULL,
    translation TEXT DEFAULT '',
    phonetic TEXT DEFAULT '',
    FOREIGN KEY (article_id) REFERENCES articles(id)
);
