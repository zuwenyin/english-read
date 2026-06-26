/**
 * IArticleRepository — 文章数据访问接口
 *
 * 定义阅读文章相关数据操作的契约，具体实现见 repositories/sqlite/
 */
export interface IArticleRepository {
  /** 获取文章列表（可按阶段/类型/关键词筛选，分页） */
  getArticles(
    level?: string,
    category?: string,
    keyword?: string,
    page?: number,
    pageSize?: number,
  ): Promise<PaginatedResult<ArticleListItem>>;
  /** 获取文章详情 */
  getArticleById(id: number): Promise<ArticleDetail | null>;
  /** 获取文章生词预标注 */
  getArticleWords(articleId: number): Promise<ArticleWordRecord[]>;
  /** 搜索文章（按标题或内容关键词） */
  searchArticles(
    keyword: string,
    level?: string,
    category?: string,
    page?: number,
    pageSize?: number,
  ): Promise<PaginatedResult<ArticleListItem>>;
  /** 检查标题是否已存在（去重） */
  checkTitleExists(title: string): Promise<boolean>;
  /** 插入文章及其生词标注（事务保护） */
  insertArticle(
    title: string,
    content: string,
    summary: string,
    level: string,
    category: string,
    source: string,
    questions: Question[],
    words: ArticleWordInput[],
    contentTranslation?: string,
  ): Promise<{ articleId: number }>;
  /** 更新文章翻译（用于重新翻译） */
  updateTranslation(articleId: number, contentTranslation: string): Promise<void>;
}

export interface ArticleWordInput {
  word: string;
  translation: string;
  phonetic: string;
}

export interface ArticleListItem {
  id: number;
  title: string;
  summary: string;
  level: string;
  category: string;
  source: string;
  created_at: string;
}

export interface ArticleDetail {
  id: number;
  title: string;
  content: string;
  level: string;
  category: string;
  source: string;
  questions: Question[];
  content_translation: string;
  created_at: string;
}

export interface Question {
  id: number;
  question: string;
  options: string[];
  answer: string;
  explanation: string;
}

export interface ArticleWordRecord {
  id: number;
  article_id: number;
  word: string;
  translation: string;
  phonetic?: string;
}

export interface PaginatedResult<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}
