import type { DatabaseSync } from "node:sqlite";
import {
  IArticleRepository,
  ArticleListItem,
  ArticleDetail,
  Question,
  ArticleWordRecord,
  ArticleWordInput,
  PaginatedResult,
} from "../interfaces/IArticleRepository";

export class SqliteArticleRepository implements IArticleRepository {
  constructor(private db: DatabaseSync) {}

  getArticles(
    level?: string,
    category?: string,
    keyword?: string,
    page = 1,
    pageSize = 20,
  ): Promise<PaginatedResult<ArticleListItem>> {
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (level) {
      conditions.push("level = ?");
      params.push(level);
    }
    if (category) {
      conditions.push("category = ?");
      params.push(category);
    }
    if (keyword) {
      conditions.push("(title LIKE ? OR content LIKE ?)");
      const like = `%${keyword}%`;
      params.push(like, like);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const offset = (page - 1) * pageSize;

    const totalRow = this.db
      .prepare(`SELECT COUNT(*) as count FROM articles ${where}`)
      .get<{ count: number }>(...params)!;
    const total = totalRow.count;

    const list = this.db
      .prepare(
        `SELECT id, title, summary, level, category, source, created_at FROM articles ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      )
      .all<ArticleListItem>(...params, pageSize, offset);

    return Promise.resolve({ list, total, page, pageSize });
  }

  getArticleById(id: number): Promise<ArticleDetail | null> {
    const row = this.db.prepare("SELECT * FROM articles WHERE id = ?").get(id) as
      | Record<string, unknown>
      | undefined;

    if (!row) return Promise.resolve(null);

    const articleId = row.id as number;
    // AI 生成的 questions 不含 id，在这里补齐唯一 id（articleId * 1000 + 序号）
    const rawQuestions = JSON.parse((row.questions as string) || "[]") as Question[];
    const questions = rawQuestions.map((q, i) => ({
      ...q,
      id: q.id || articleId * 1000 + i + 1,
    }));

    const detail: ArticleDetail = {
      id: articleId,
      title: row.title as string,
      content: row.content as string,
      level: row.level as string,
      category: row.category as string,
      source: (row.source as string) || "",
      questions,
      content_translation: (row.content_translation as string) || "",
      created_at: row.created_at as string,
    };

    return Promise.resolve(detail);
  }

  getArticleWords(articleId: number): Promise<ArticleWordRecord[]> {
    const rows = this.db
      .prepare("SELECT * FROM article_words WHERE article_id = ?")
      .all<ArticleWordRecord>(articleId);
    return Promise.resolve(rows);
  }

  searchArticles(
    keyword: string,
    level?: string,
    category?: string,
    page = 1,
    pageSize = 20,
  ): Promise<PaginatedResult<ArticleListItem>> {
    return this.getArticles(level, category, keyword, page, pageSize);
  }

  checkTitleExists(title: string): Promise<boolean> {
    const row = this.db.prepare("SELECT id FROM articles WHERE title = ?").get(title) as
      | { id: number }
      | undefined;
    return Promise.resolve(!!row);
  }

  insertArticle(
    title: string,
    content: string,
    summary: string,
    level: string,
    category: string,
    source: string,
    questions: Question[],
    words: ArticleWordInput[],
    contentTranslation = "",
  ): Promise<{ articleId: number }> {
    const insertArticle = this.db.prepare(
      `INSERT INTO articles (title, content, summary, level, category, source, questions, content_translation)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    const insertWord = this.db.prepare(
      `INSERT INTO article_words (article_id, word, translation, phonetic)
       VALUES (?, ?, ?, ?)`,
    );

    // node:sqlite (DatabaseSync) 不支持 transaction() API，
    // 使用 exec 手动管理事务边界确保原子性
    this.db.exec("BEGIN");

    const result = insertArticle.run(
      title,
      content,
      summary,
      level,
      category,
      source,
      JSON.stringify(questions),
      contentTranslation,
    );
    const id = Number(result.lastInsertRowid);

    for (const w of words) {
      insertWord.run(id, w.word, w.translation, w.phonetic);
    }

    this.db.exec("COMMIT");

    return Promise.resolve({ articleId: id });
  }

  updateTranslation(articleId: number, contentTranslation: string): Promise<void> {
    this.db
      .prepare("UPDATE articles SET content_translation = ? WHERE id = ?")
      .run(contentTranslation, articleId);
    return Promise.resolve();
  }
}
