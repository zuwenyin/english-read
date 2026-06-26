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

export interface WordProgressRecord {
  id: number;
  user_id: number;
  word_id: number;
  familiarity: number;
  review_count: number;
  last_reviewed: string;
  created_at: string;
}

// ========== Article Types ==========

export interface ArticleListItem {
  id: number;
  title: string;
  summary: string;
  level: string;
  category: string;
  source: string;
  created_at: string;
}

export interface Question {
  id: number;
  question: string;
  options: string[];
  answer: string;
  explanation: string;
}

export interface ArticleWord {
  id: number;
  word: string;
  translation: string;
  phonetic?: string;
}

export interface AnswerRecord {
  question_id: number;
  selected: string;
  correct: string;
  is_correct: boolean;
  explanation?: string;
}

export interface ArticleDetail {
  id: number;
  title: string;
  content: string;
  level: string;
  category: string;
  source: string;
  questions: Question[];
  article_words: ArticleWord[];
  content_translation: string;
  user_progress: {
    answers: AnswerRecord[];
    completed_at: string;
    quiz_score: number;
  } | null;
  user_word_familiarity: Record<string, number>;
  created_at: string;
}

export interface ArticleProgressResult {
  id: number;
  quiz_score: number;
  completed_at: string;
  answers: AnswerRecord[];
}

export interface StatsOverview {
  total_words_learned: number;
  total_articles_read: number;
  avg_quiz_score: number;
  weekly_study_minutes: number;
}

export interface RecentProgress {
  recent_books: {
    id: number;
    name: string;
    level: string;
    last_studied_at: string;
  }[];
  recent_articles: {
    id: number;
    title: string;
    level: string;
    category: string;
    last_read_at: string;
  }[];
}
