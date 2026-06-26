import type { DatabaseSync } from "node:sqlite";
import {
  IProgressRepository,
  WordProgressRecord,
  AnswerRecord,
  ArticleProgressRecord,
  StatsOverview,
  RecentProgress,
} from "../interfaces/IProgressRepository";

export class SqliteProgressRepository implements IProgressRepository {
  constructor(private db: DatabaseSync) {}

  upsertWordProgress(
    userId: number,
    wordId: number,
    familiarity: number,
  ): Promise<WordProgressRecord> {
    this.db
      .prepare(
        `INSERT INTO user_word_progress (user_id, word_id, familiarity, review_count, last_reviewed)
         VALUES (?, ?, ?, 1, datetime('now'))
         ON CONFLICT(user_id, word_id) DO UPDATE SET
           familiarity = excluded.familiarity,
           review_count = review_count + 1,
           last_reviewed = datetime('now')`,
      )
      .run(userId, wordId, familiarity);

    const row = this.db
      .prepare("SELECT * FROM user_word_progress WHERE user_id = ? AND word_id = ?")
      .get<WordProgressRecord>(userId, wordId)!;

    return Promise.resolve(row);
  }

  getWordProgressByBook(userId: number, bookId: number): Promise<WordProgressRecord[]> {
    const rows = this.db
      .prepare(
        `SELECT uwp.* FROM user_word_progress uwp
         JOIN words w ON uwp.word_id = w.id
         WHERE uwp.user_id = ? AND w.word_book_id = ?`,
      )
      .all<WordProgressRecord>(userId, bookId);
    return Promise.resolve(rows);
  }

  submitArticleProgress(
    userId: number,
    articleId: number,
    answers: AnswerRecord[],
  ): Promise<ArticleProgressRecord> {
    const answersJson = JSON.stringify(answers);

    // 查找当前最大 attempt，新提交使用 attempt + 1
    const maxAttemptRow = this.db
      .prepare(
        "SELECT COALESCE(MAX(attempt), 0) as max_attempt FROM user_article_progress WHERE user_id = ? AND article_id = ?",
      )
      .get<{ max_attempt: number }>(userId, articleId)!;
    const newAttempt = maxAttemptRow.max_attempt + 1;

    this.db
      .prepare(
        `INSERT INTO user_article_progress (user_id, article_id, attempt, answers, completed_at)
         VALUES (?, ?, ?, ?, datetime('now'))`,
      )
      .run(userId, articleId, newAttempt, answersJson);

    // 取回刚插入的记录
    const row = this.db
      .prepare(
        "SELECT * FROM user_article_progress WHERE user_id = ? AND article_id = ? AND attempt = ?",
      )
      .get<Record<string, unknown>>(userId, articleId, newAttempt)!;

    const record: ArticleProgressRecord = {
      id: row.id as number,
      user_id: row.user_id as number,
      article_id: row.article_id as number,
      answers: JSON.parse((row.answers as string) || "[]") as AnswerRecord[],
      completed_at: row.completed_at as string,
    };

    return Promise.resolve(record);
  }

  getArticleProgress(userId: number, articleId: number): Promise<ArticleProgressRecord | null> {
    // 返回最新一轮（attempt 最大）的已完成进度
    const row = this.db
      .prepare(
        `SELECT * FROM user_article_progress
         WHERE user_id = ? AND article_id = ? AND completed_at IS NOT NULL
         ORDER BY attempt DESC LIMIT 1`,
      )
      .get<Record<string, unknown>>(userId, articleId);

    if (!row) return Promise.resolve(null);

    const record: ArticleProgressRecord = {
      id: row.id as number,
      user_id: row.user_id as number,
      article_id: row.article_id as number,
      answers: JSON.parse((row.answers as string) || "[]") as AnswerRecord[],
      completed_at: row.completed_at as string,
    };

    return Promise.resolve(record);
  }

  getStatsOverview(userId: number): Promise<StatsOverview> {
    // 已学单词数（familiarity ≥ 1）
    const wordsRow = this.db
      .prepare(
        `SELECT COUNT(DISTINCT word_id) as count
         FROM user_word_progress WHERE user_id = ? AND familiarity >= 1`,
      )
      .get<{ count: number }>(userId)!;

    // 已读文章数（按 article_id 去重，不因多 attempt 重复计数）
    const articlesRow = this.db
      .prepare(
        "SELECT COUNT(DISTINCT article_id) as count FROM user_article_progress WHERE user_id = ?",
      )
      .get<{ count: number }>(userId)!;

    // 平均成绩：只取每篇文章最新 attempt 的得分，再计算平均
    const scoreRow = this.db
      .prepare(
        `SELECT ROUND(AVG(
          CAST(
            (SELECT COUNT(*) FROM json_each(uap.answers) WHERE json_extract(value, '$.is_correct') = 1)
            AS REAL
          ) * 100.0 / NULLIF(
            (SELECT COUNT(*) FROM json_each(uap.answers)), 0
          )
        )) as avg_score
        FROM user_article_progress uap
        WHERE uap.user_id = ?
          AND uap.attempt = (
            SELECT MAX(uap2.attempt)
            FROM user_article_progress uap2
            WHERE uap2.user_id = ? AND uap2.article_id = uap.article_id
          )`,
      )
      .get<{ avg_score: number | null }>(userId, userId)!;
    const avgQuizScore = scoreRow.avg_score ?? 0;

    // 本周学习时长：单词复习 0.5 分钟/次 + 文章完成 8 分钟/篇（按文章去重）
    const weekRow = this.db
      .prepare(
        `SELECT
          COALESCE((SELECT COUNT(*) FROM user_word_progress WHERE user_id = ? AND last_reviewed >= datetime('now', '-7 days')), 0) as word_count,
          COALESCE((SELECT COUNT(DISTINCT article_id) FROM user_article_progress WHERE user_id = ? AND completed_at >= datetime('now', '-7 days')), 0) as article_count`,
      )
      .get<{ word_count: number; article_count: number }>(userId, userId)!;

    const weeklyMinutes = Math.round(weekRow.word_count * 0.5 + weekRow.article_count * 8);

    return Promise.resolve({
      total_words_learned: wordsRow.count,
      total_articles_read: articlesRow.count,
      avg_quiz_score: avgQuizScore,
      weekly_study_minutes: weeklyMinutes,
    });
  }

  getRecentProgress(userId: number): Promise<RecentProgress> {
    // 最近 3 个学习词书
    const recentBooks = this.db
      .prepare(
        `SELECT DISTINCT wb.id, wb.name, wb.level, MAX(uwp.last_reviewed) as last_studied_at
         FROM user_word_progress uwp
         JOIN words w ON uwp.word_id = w.id
         JOIN word_books wb ON w.word_book_id = wb.id
         WHERE uwp.user_id = ?
         GROUP BY wb.id
         ORDER BY last_studied_at DESC
         LIMIT 3`,
      )
      .all(userId) as Array<{
      id: number;
      name: string;
      level: string;
      last_studied_at: string;
    }>;

    // 最近 3 篇阅读文章（按文章去重，取最新 attempt 时间）
    const recentArticles = this.db
      .prepare(
        `SELECT a.id, a.title, a.level, a.category, MAX(uap.completed_at) as last_read_at
         FROM user_article_progress uap
         JOIN articles a ON uap.article_id = a.id
         WHERE uap.user_id = ?
         GROUP BY uap.article_id
         ORDER BY last_read_at DESC
         LIMIT 3`,
      )
      .all<{ id: number; title: string; level: string; category: string; last_read_at: string }>(
        userId,
      );

    return Promise.resolve({ recent_books: recentBooks, recent_articles: recentArticles });
  }

  getWordFamiliarityBatch(userId: number, words: string[]): Promise<Map<string, number>> {
    const result = new Map<string, number>();
    if (words.length === 0) return Promise.resolve(result);

    const placeholders = words.map(() => "?").join(",");

    const rows = this.db
      .prepare(
        `SELECT w.word, COALESCE(uwp.familiarity, 0) as familiarity
         FROM words w
         LEFT JOIN user_word_progress uwp ON uwp.word_id = w.id AND uwp.user_id = ?
         WHERE w.word IN (${placeholders})`,
      )
      .all<{ word: string; familiarity: number }>(userId, ...words);

    for (const r of rows) {
      result.set(r.word.toLowerCase(), r.familiarity);
    }
    return Promise.resolve(result);
  }
}
