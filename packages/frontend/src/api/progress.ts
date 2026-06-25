import apiClient from "./apiClient";
import type { WordProgressRecord } from "../types";

export async function updateWordProgress(
  wordId: number,
  familiarity: number,
): Promise<WordProgressRecord> {
  return apiClient.post("/api/progress/word", {
    word_id: wordId,
    familiarity,
  });
}

export async function getWordProgress(bookId: number): Promise<WordProgressRecord[]> {
  return apiClient.get(`/api/progress/words/${bookId}`);
}
