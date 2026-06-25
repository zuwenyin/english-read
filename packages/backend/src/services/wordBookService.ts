import { IWordRepository } from "../repositories/interfaces/IWordRepository";

export class WordBookService {
  constructor(private wordRepo: IWordRepository) {}

  async list(level?: string) {
    const books = await this.wordRepo.getWordBooks(level);
    return books;
  }
}
