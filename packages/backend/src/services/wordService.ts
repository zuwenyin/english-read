import { IWordRepository } from "../repositories/interfaces/IWordRepository";
import { AppError, ERROR_CODES } from "../utils/errors";

export class WordService {
  constructor(private wordRepo: IWordRepository) {}

  async listByBook(bookId: number, page: number, pageSize: number) {
    return this.wordRepo.getWordsByBook(bookId, page, pageSize);
  }

  async search(keyword: string, bookId?: number) {
    if (!keyword || keyword.trim().length === 0) {
      throw new AppError(ERROR_CODES.BAD_REQUEST, "搜索关键词不能为空");
    }
    return this.wordRepo.searchWords(keyword.trim(), bookId);
  }
}
