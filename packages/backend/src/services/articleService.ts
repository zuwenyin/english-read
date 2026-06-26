import { IArticleRepository } from "../repositories/interfaces/IArticleRepository";
import { AppError, ERROR_CODES } from "../utils/errors";
import { z } from "zod";

const listQuerySchema = z.object({
  level: z.string().optional(),
  category: z.string().optional(),
  keyword: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

const searchQuerySchema = listQuerySchema.extend({
  keyword: z.string().min(1, "keyword 必填"),
});

export class ArticleService {
  constructor(private articleRepo: IArticleRepository) {}

  /** 获取文章列表（支持筛选 + 分页） */
  async getArticles(query: unknown) {
    const parsed = listQuerySchema.safeParse(query);
    if (!parsed.success) {
      throw new AppError(ERROR_CODES.BAD_REQUEST, parsed.error.errors[0].message);
    }
    const { level, category, keyword, page, pageSize } = parsed.data;
    return this.articleRepo.getArticles(level, category, keyword, page, pageSize);
  }

  /** 搜索文章（关键词必填） */
  async searchArticles(query: unknown) {
    const parsed = searchQuerySchema.safeParse(query);
    if (!parsed.success) {
      throw new AppError(ERROR_CODES.BAD_REQUEST, parsed.error.errors[0].message);
    }
    const { keyword, level, category, page, pageSize } = parsed.data;
    return this.articleRepo.searchArticles(keyword, level, category, page, pageSize);
  }

  /** 获取文章详情（含 content + questions + article_words） */
  async getArticleById(id: number) {
    if (!id || isNaN(id) || id < 1) {
      throw new AppError(ERROR_CODES.BAD_REQUEST, "文章 ID 无效");
    }

    const article = await this.articleRepo.getArticleById(id);
    if (!article) {
      throw new AppError(ERROR_CODES.NOT_FOUND, "文章不存在");
    }

    // 获取文章预标注生词
    const articleWords = await this.articleRepo.getArticleWords(id);

    return {
      ...article,
      // 脱敏 questions：不向前端暴露 answer 和 explanation
      questions: article.questions.map((q) => ({
        id: q.id,
        question: q.question,
        options: q.options,
      })),
      article_words: articleWords,
      content_translation: article.content_translation,
    };
  }
}
