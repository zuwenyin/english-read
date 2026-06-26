import apiClient from "./apiClient";

export interface FetchResult {
  success: boolean;
  fetched: number;
  inserted: number;
  skipped: number;
  failed: number;
  durationMs: number;
  errors: string[];
  sourceDetails: { sourceName: string; fetched: number; errors: string[] }[];
  timestamp?: string;
  message?: string;
}

/** 手动触发文章拉取（超时 5 分钟，LLM 加工耗时较长） */
export async function fetchArticles(
  counts?: Record<string, number>,
  sources?: string[],
): Promise<FetchResult> {
  return apiClient.post(
    "/api/admin/fetch-articles",
    { counts, sources },
    {
      timeout: 300_000, // 5 分钟
    },
  );
}

/** 获取最近一次拉取状态 */
export async function getFetchStatus(): Promise<FetchResult & { message?: string }> {
  return apiClient.get("/api/admin/fetch-status");
}

/** 删除所有文章及关联数据 */
export async function deleteAllArticles(): Promise<{
  message: string;
  deleted: { articles: number; article_words: number; user_article_progress: number };
}> {
  return apiClient.delete("/api/admin/articles");
}

/** 重新翻译指定文章为句子级对照格式 */
export async function retranslateArticle(articleId: number): Promise<{
  success: boolean;
  message: string;
  preview?: { en: string; zh: string }[];
}> {
  return apiClient.post(`/api/admin/articles/${articleId}/retranslate`);
}
