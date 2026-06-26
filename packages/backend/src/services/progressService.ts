import { IProgressRepository, AnswerRecord } from "../repositories/interfaces/IProgressRepository";
import { IArticleRepository } from "../repositories/interfaces/IArticleRepository";
import { AppError, ERROR_CODES } from "../utils/errors";
import { z } from "zod";

const updateProgressSchema = z.object({
  word_id: z.number().int().positive("word_id 必填"),
  familiarity: z.number().int().min(1, "熟识度不能小于1").max(5, "熟识度不能大于5"),
});

const submitArticleSchema = z.object({
  article_id: z.number().int().positive("article_id 必填"),
  answers: z
    .array(
      z.object({
        question_id: z.number().int().positive("question_id 必填"),
        selected: z.string().min(1, "selected 必填"),
      }),
    )
    .min(1, "至少提交一题"),
});

export class ProgressService {
  constructor(
    private progressRepo: IProgressRepository,
    private articleRepo?: IArticleRepository,
  ) {}

  async updateWordProgress(userId: number, body: unknown) {
    const parsed = updateProgressSchema.safeParse(body);
    if (!parsed.success) {
      throw new AppError(ERROR_CODES.BAD_REQUEST, parsed.error.errors[0].message);
    }

    const { word_id, familiarity } = parsed.data;
    const record = await this.progressRepo.upsertWordProgress(userId, word_id, familiarity);

    return {
      familiarity: record.familiarity,
      review_count: record.review_count,
      last_reviewed: record.last_reviewed,
    };
  }

  async getWordProgressByBook(userId: number, bookId: number) {
    return this.progressRepo.getWordProgressByBook(userId, bookId);
  }

  async submitArticleProgress(userId: number, body: unknown) {
    if (!this.articleRepo) {
      throw new AppError(ERROR_CODES.INTERNAL_ERROR, "articleRepo 未注入");
    }

    const parsed = submitArticleSchema.safeParse(body);
    if (!parsed.success) {
      throw new AppError(ERROR_CODES.BAD_REQUEST, parsed.error.errors[0].message);
    }

    const { article_id, answers: submitted } = parsed.data;

    // 获取文章题目，用于校验答案
    const article = await this.articleRepo.getArticleById(article_id);
    if (!article) {
      throw new AppError(ERROR_CODES.NOT_FOUND, "文章不存在");
    }

    // 后端严格校验：逐个比对 selected 与正确答案，自行计算 is_correct
    const answers: AnswerRecord[] = submitted.map((item) => {
      const question = article.questions.find((q) => q.id === item.question_id);
      if (!question) {
        throw new AppError(ERROR_CODES.BAD_REQUEST, `题目 ${item.question_id} 不存在`);
      }
      // 兼容两种 answer 格式：
      // - 新格式（字母 A/B/C/D）：直接与 selected 比对
      // - 旧格式（选项全文本）：查找在 options 中的索引，转为字母后比对
      let correctLetter = question.answer;
      if (correctLetter.length > 1) {
        const cleanOptions = question.options.map((opt) =>
          opt.replace(/^[A-D][.．、)）]\s*/i, "").trim(),
        );
        const idx = cleanOptions.indexOf(question.answer);
        if (idx >= 0) {
          correctLetter = String.fromCharCode(65 + idx);
        }
      }
      const isCorrect = item.selected === correctLetter;
      return {
        question_id: item.question_id,
        selected: item.selected,
        correct: correctLetter,
        is_correct: isCorrect,
        explanation: question.explanation,
      };
    });

    const record = await this.progressRepo.submitArticleProgress(userId, article_id, answers);

    // 计算得分
    const total = answers.length;
    const correctCount = answers.filter((a) => a.is_correct).length;
    const quizScore = Math.round((correctCount / total) * 100);

    return {
      id: record.id,
      quiz_score: quizScore,
      completed_at: record.completed_at,
      answers,
    };
  }
}
