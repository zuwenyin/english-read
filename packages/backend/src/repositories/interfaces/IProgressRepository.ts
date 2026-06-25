/**
 * IProgressRepository — 学习进度数据访问接口
 *
 * 定义单词进度和文章进度相关数据操作的契约，具体实现见 repositories/sqlite/
 */
export interface IProgressRepository {
  /** 更新单词熟识度（upsert） */
  upsertWordProgress(
    userId: number,
    wordId: number,
    familiarity: number,
  ): Promise<WordProgressRecord>;
  /** 获取用户对指定词书的单词进度 */
  getWordProgressByBook(userId: number, bookId: number): Promise<WordProgressRecord[]>;
  /** 提交文章阅读进度/答题结果 */
  submitArticleProgress(
    userId: number,
    articleId: number,
    answers: AnswerRecord[],
  ): Promise<ArticleProgressRecord>;
  /** 获取用户某篇文章的进度 */
  getArticleProgress(userId: number, articleId: number): Promise<ArticleProgressRecord | null>;
  /** 获取学习统计概览 */
  getStatsOverview(userId: number): Promise<StatsOverview>;
  /** 获取最近学习记录 */
  getRecentProgress(userId: number): Promise<RecentProgress>;
}

export interface WordProgressRecord {
  id: number;
  user_id: number;
  word_id: number;
  familiarity: number;
  review_count: number;
  last_reviewed: string;
  created_at: string;
}

export interface AnswerRecord {
  question_id: number;
  selected: string;
  correct: string;
  is_correct: boolean;
}

export interface ArticleProgressRecord {
  id: number;
  user_id: number;
  article_id: number;
  answers: AnswerRecord[];
  completed_at: string;
}

export interface StatsOverview {
  total_words_learned: number;
  total_articles_read: number;
  avg_quiz_score: number;
  weekly_study_minutes: number;
}

export interface RecentProgress {
  recent_books: RecentBook[];
  recent_articles: RecentArticle[];
}

export interface RecentBook {
  id: number;
  name: string;
  level: string;
  last_studied_at: string;
}

export interface RecentArticle {
  id: number;
  title: string;
  level: string;
  category: string;
  last_read_at: string;
}
