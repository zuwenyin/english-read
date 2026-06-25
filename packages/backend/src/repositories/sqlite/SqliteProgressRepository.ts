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
      .get(userId, wordId) as WordProgressRecord;

    return Promise.resolve(row);
  }

  getWordProgressByBook(userId: number, bookId: number): Promise<WordProgressRecord[]> {
    const rows = this.db
      .prepare(
        `SELECT uwp.* FROM user_word_progress uwp
         JOIN words w ON uwp.word_id = w.id
         WHERE uwp.user_id = ? AND w.word_book_id = ?`,
      )
      .all(userId, bookId) as WordProgressRecord[];
    return Promise.resolve(rows);
  }

  submitArticleProgress(
    userId: number,
    articleId: number,
    answers: AnswerRecord[],
  ): Promise<ArticleProgressRecord> {
    const answersJson = JSON.stringify(answers);
    const result = this.db
      .prepare(
        `INSERT INTO user_article_progress (user_id, article_id, answers, completed_at)
         VALUES (?, ?, ?, datetime('now'))`,
      )
      .run(userId, articleId, answersJson);

    const row = this.db
      .prepare("SELECT * FROM user_article_progress WHERE id = ?")
      .get(Number(result.lastInsertRowid)) as Record<string, unknown>;

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
    const row = this.db
      .prepare("SELECT * FROM user_article_progress WHERE user_id = ? AND article_id = ?")
      .get(userId, articleId) as Record<string, unknown> | undefined;

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
      .get(userId) as { count: number };

    // 已读文章数
    const articlesRow = this.db
      .prepare("SELECT COUNT(*) as count FROM user_article_progress WHERE user_id = ?")
      .get(userId) as { count: number };

    // 平均成绩（所有文章答题正确率平均值）
    const scoreRow = this.db
      .prepare(`SELECT answers FROM user_article_progress WHERE user_id = ?`)
      .all(userId) as Array<{ answers: string }>;

    let avgQuizScore = 0;
    if (scoreRow.length > 0) {
      const scores = scoreRow.map((r) => {
        const answers: AnswerRecord[] = JSON.parse(r.answers || "[]");
        if (answers.length === 0) return 0;
        const correctCount = answers.filter((a) => a.is_correct).length;
        return (correctCount / answers.length) * 100;
      });
      avgQuizScore = Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length);
    }

    // 本周学习时长（分钟，基于 last_reviewed 和 completed_at 统计条数估算）
    const weekRow = this.db
      .prepare(
        `SELECT
          (SELECT COUNT(*) FROM user_word_progress WHERE user_id = ? AND last_reviewed >= datetime('now', '-7 days')) +
          (SELECT COUNT(*) FROM user_article_progress WHERE user_id = ? AND completed_at >= datetime('now', '-7 days'))
         as total_actions`,
      )
      .get(userId, userId) as { total_actions: number };

    // 简单估算：每次操作约 2 分钟
    const weeklyMinutes = weekRow.total_actions * 2;

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

    // 最近 3 篇阅读文章
    const recentArticles = this.db
      .prepare(
        `SELECT a.id, a.title, a.level, a.category, uap.completed_at as last_read_at
         FROM user_article_progress uap
         JOIN articles a ON uap.article_id = a.id
         WHERE uap.user_id = ?
         ORDER BY uap.completed_at DESC
         LIMIT 3`,
      )
      .all(userId) as Array<{
      id: number;
      title: string;
      level: string;
      category: string;
      last_read_at: string;
    }>;

    return Promise.resolve({ recent_books: recentBooks, recent_articles: recentArticles });
  }
}
