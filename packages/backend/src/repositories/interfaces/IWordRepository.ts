/**
 * IWordRepository — 单词数据访问接口
 *
 * 定义单词和词书相关数据操作的契约，具体实现见 repositories/sqlite/
 */
export interface IWordRepository {
  /** 获取词书列表（可按阶段筛选） */
  getWordBooks(level?: string): Promise<WordBookRecord[]>;
  /** 获取词书单词列表（分页） */
  getWordsByBook(
    bookId: number,
    page: number,
    pageSize: number,
  ): Promise<PaginatedResult<WordRecord>>;
  /** 搜索单词（按英文或中文） */
  searchWords(keyword: string, bookId?: number): Promise<WordRecord[]>;
  /** 通过 ID 获取单词 */
  getWordById(id: number): Promise<WordRecord | null>;
}

export interface WordBookRecord {
  id: number;
  name: string;
  level: string;
  description: string;
  word_count: number;
}

export interface WordRecord {
  id: number;
  word_book_id: number;
  word: string;
  phonetic: string;
  translation: string;
  example_sentence: string;
  difficulty: number;
}

export interface PaginatedResult<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}
