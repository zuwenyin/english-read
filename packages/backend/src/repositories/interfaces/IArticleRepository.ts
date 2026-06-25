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
}

export interface ArticleListItem {
  id: number;
  title: string;
  summary: string;
  level: string;
  category: string;
  created_at: string;
}

export interface ArticleDetail {
  id: number;
  title: string;
  content: string;
  level: string;
  category: string;
  questions: Question[];
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
