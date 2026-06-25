import type { DatabaseSync } from "node:sqlite";
import {
  IArticleRepository,
  ArticleListItem,
  ArticleDetail,
  Question,
  ArticleWordRecord,
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
      .get(...params) as { count: number };
    const total = totalRow.count;

    const list = this.db
      .prepare(
        `SELECT id, title, summary, level, category, created_at FROM articles ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      )
      .all(...params, pageSize, offset) as ArticleListItem[];

    return Promise.resolve({ list, total, page, pageSize });
  }

  getArticleById(id: number): Promise<ArticleDetail | null> {
    const row = this.db.prepare("SELECT * FROM articles WHERE id = ?").get(id) as
      | Record<string, unknown>
      | undefined;

    if (!row) return Promise.resolve(null);

    const detail: ArticleDetail = {
      id: row.id as number,
      title: row.title as string,
      content: row.content as string,
      level: row.level as string,
      category: row.category as string,
      questions: JSON.parse((row.questions as string) || "[]") as Question[],
      created_at: row.created_at as string,
    };

    return Promise.resolve(detail);
  }

  getArticleWords(articleId: number): Promise<ArticleWordRecord[]> {
    const rows = this.db
      .prepare("SELECT * FROM article_words WHERE article_id = ?")
      .all(articleId) as ArticleWordRecord[];
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
}
