import apiClient from "./apiClient";
import type {
  ArticleListItem,
  ArticleDetail,
  PaginatedResult,
  ArticleProgressResult,
} from "../types";

/** 获取文章列表（筛选 + 分页） */
export async function getArticles(params?: {
  level?: string;
  category?: string;
  keyword?: string;
  page?: number;
  pageSize?: number;
}): Promise<PaginatedResult<ArticleListItem>> {
  return apiClient.get("/api/articles", { params: params || {} });
}

/** 搜索文章 */
export async function searchArticles(params: {
  keyword: string;
  level?: string;
  category?: string;
  page?: number;
  pageSize?: number;
}): Promise<PaginatedResult<ArticleListItem>> {
  return apiClient.get("/api/articles/search", { params });
}

/** 获取文章详情（含 content、questions、article_words、user_progress） */
export async function getArticleById(id: number): Promise<ArticleDetail> {
  return apiClient.get(`/api/articles/${id}`);
}

/** 提交文章阅读进度/答题结果 */
export async function submitArticleProgress(
  articleId: number,
  answers: { question_id: number; selected: string }[],
): Promise<ArticleProgressResult> {
  return apiClient.post("/api/progress/article", {
    article_id: articleId,
    answers,
  });
}
