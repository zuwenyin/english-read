import type { DatabaseSync } from "node:sqlite";
import {
  IWordRepository,
  WordBookRecord,
  WordRecord,
  PaginatedResult,
} from "../interfaces/IWordRepository";

export class SqliteWordRepository implements IWordRepository {
  constructor(private db: DatabaseSync) {}

  getWordBooks(level?: string): Promise<WordBookRecord[]> {
    const baseQuery = `
      SELECT wb.*, (SELECT COUNT(*) FROM words WHERE word_book_id = wb.id) as word_count
      FROM word_books wb`;
    if (level) {
      const rows = this.db
        .prepare(`${baseQuery} WHERE wb.level = ?`)
        .all(level) as WordBookRecord[];
      return Promise.resolve(rows);
    }
    const rows = this.db.prepare(baseQuery).all() as WordBookRecord[];
    return Promise.resolve(rows);
  }

  getWordsByBook(
    bookId: number,
    page: number,
    pageSize: number,
  ): Promise<PaginatedResult<WordRecord>> {
    const offset = (page - 1) * pageSize;

    const totalRow = this.db
      .prepare("SELECT COUNT(*) as count FROM words WHERE word_book_id = ?")
      .get(bookId) as { count: number };
    const total = totalRow.count;

    const list = this.db
      .prepare("SELECT * FROM words WHERE word_book_id = ? LIMIT ? OFFSET ?")
      .all(bookId, pageSize, offset) as WordRecord[];

    return Promise.resolve({ list, total, page, pageSize });
  }

  searchWords(keyword: string, bookId?: number): Promise<WordRecord[]> {
    const like = `%${keyword}%`;
    if (bookId !== undefined) {
      const rows = this.db
        .prepare(
          "SELECT * FROM words WHERE word_book_id = ? AND (word LIKE ? OR translation LIKE ?)",
        )
        .all(bookId, like, like) as WordRecord[];
      return Promise.resolve(rows);
    }
    const rows = this.db
      .prepare("SELECT * FROM words WHERE word LIKE ? OR translation LIKE ?")
      .all(like, like) as WordRecord[];
    return Promise.resolve(rows);
  }

  getWordById(id: number): Promise<WordRecord | null> {
    const row = this.db.prepare("SELECT * FROM words WHERE id = ?").get(id) as
      | WordRecord
      | undefined;
    return Promise.resolve(row ?? null);
  }
}
