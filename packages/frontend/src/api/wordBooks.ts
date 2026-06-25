import apiClient from "./apiClient";
import type { WordBookRecord, WordRecord, PaginatedResult } from "../types";

export async function getWordBooks(level?: string): Promise<WordBookRecord[]> {
  const params = level ? { level } : {};
  return apiClient.get("/api/word-books", { params });
}

export async function getWordsByBook(
  bookId: number,
  page = 1,
  pageSize = 20,
): Promise<PaginatedResult<WordRecord>> {
  return apiClient.get(`/api/words/${bookId}`, {
    params: { page, pageSize },
  });
}

export async function searchWords(keyword: string, bookId?: number): Promise<WordRecord[]> {
  const params: Record<string, string | number> = { keyword };
  if (bookId) params.bookId = bookId;
  return apiClient.get("/api/words/search", { params });
}
