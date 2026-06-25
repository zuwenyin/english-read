/**
 * ProgressService 文章进度测试
 *
 * 覆盖：
 * - submitArticleProgress：保存进度 / quiz_score 计算准确性
 * - 题目校验 / 参数校验
 */

import { ProgressService } from "../services/progressService";
import {
  IProgressRepository,
  ArticleProgressRecord,
} from "../repositories/interfaces/IProgressRepository";
import { IArticleRepository, ArticleDetail } from "../repositories/interfaces/IArticleRepository";
import { AppError } from "../utils/errors";

function mockProgressRepo(overrides: Partial<IProgressRepository> = {}): IProgressRepository {
  return {
    upsertWordProgress: jest.fn(),
    getWordProgressByBook: jest.fn(),
    submitArticleProgress: jest.fn().mockResolvedValue({
      id: 10,
      user_id: 1,
      article_id: 1,
      answers: [],
      completed_at: "2025-06-25T00:00:00.000Z",
    } as ArticleProgressRecord),
    getArticleProgress: jest.fn(),
    getStatsOverview: jest.fn(),
    getRecentProgress: jest.fn(),
    ...overrides,
  };
}

function mockArticleRepo(overrides: Partial<IArticleRepository> = {}): IArticleRepository {
  return {
    getArticles: jest.fn(),
    getArticleById: jest.fn().mockResolvedValue(mockArticle()),
    getArticleWords: jest.fn(),
    searchArticles: jest.fn(),
    ...overrides,
  };
}

function mockArticle(): ArticleDetail {
  return {
    id: 1,
    title: "Test Article",
    content: "Test content.",
    level: "junior",
    category: "science",
    questions: [
      { id: 1, question: "Q1?", options: ["A", "B", "C"], answer: "A", explanation: "..." },
      { id: 2, question: "Q2?", options: ["X", "Y", "Z"], answer: "Y", explanation: "..." },
      { id: 3, question: "Q3?", options: ["1", "2", "3"], answer: "3", explanation: "..." },
    ],
    created_at: "2025-06-01T00:00:00.000Z",
  };
}

describe("ProgressService - submitArticleProgress", () => {
  it("全部答对 — quiz_score = 100", async () => {
    const progressRepo = mockProgressRepo();
    const articleRepo = mockArticleRepo();
    const service = new ProgressService(progressRepo, articleRepo);

    const result = await service.submitArticleProgress(1, {
      article_id: 1,
      answers: [
        { question_id: 1, selected: "A" },
        { question_id: 2, selected: "Y" },
        { question_id: 3, selected: "3" },
      ],
    });

    expect(result.quiz_score).toBe(100);
    expect(result.id).toBe(10);
  });

  it("答对 2/3 — quiz_score = 67", async () => {
    const progressRepo = mockProgressRepo();
    const articleRepo = mockArticleRepo();
    const service = new ProgressService(progressRepo, articleRepo);

    const result = await service.submitArticleProgress(1, {
      article_id: 1,
      answers: [
        { question_id: 1, selected: "B" }, // 错误
        { question_id: 2, selected: "Y" }, // 正确
        { question_id: 3, selected: "3" }, // 正确
      ],
    });

    expect(result.quiz_score).toBe(67);
  });

  it("答对 1/3 — quiz_score = 33", async () => {
    const progressRepo = mockProgressRepo();
    const articleRepo = mockArticleRepo();
    const service = new ProgressService(progressRepo, articleRepo);

    const result = await service.submitArticleProgress(1, {
      article_id: 1,
      answers: [
        { question_id: 1, selected: "C" },
        { question_id: 2, selected: "X" },
        { question_id: 3, selected: "3" },
      ],
    });

    expect(result.quiz_score).toBe(33);
  });

  it("全部答错 — quiz_score = 0", async () => {
    const progressRepo = mockProgressRepo();
    const articleRepo = mockArticleRepo();
    const service = new ProgressService(progressRepo, articleRepo);

    const result = await service.submitArticleProgress(1, {
      article_id: 1,
      answers: [
        { question_id: 1, selected: "C" },
        { question_id: 2, selected: "X" },
        { question_id: 3, selected: "1" },
      ],
    });

    expect(result.quiz_score).toBe(0);
  });

  it("单题答对 — quiz_score = 100", async () => {
    const singleQuestionArticle: ArticleDetail = {
      ...mockArticle(),
      questions: [{ id: 1, question: "Q?", options: ["A", "B"], answer: "A", explanation: "正确" }],
    };
    const progressRepo = mockProgressRepo();
    const articleRepo = mockArticleRepo({
      getArticleById: jest.fn().mockResolvedValue(singleQuestionArticle),
    });
    const service = new ProgressService(progressRepo, articleRepo);

    const result = await service.submitArticleProgress(1, {
      article_id: 1,
      answers: [{ question_id: 1, selected: "A" }],
    });

    expect(result.quiz_score).toBe(100);
  });

  it("文章不存在 — 抛出 NOT_FOUND 错误", async () => {
    const progressRepo = mockProgressRepo();
    const articleRepo = mockArticleRepo({
      getArticleById: jest.fn().mockResolvedValue(null),
    });
    const service = new ProgressService(progressRepo, articleRepo);

    await expect(
      service.submitArticleProgress(1, {
        article_id: 999,
        answers: [{ question_id: 1, selected: "A" }],
      }),
    ).rejects.toThrow("文章不存在");
  });

  it("题目不存在 — 抛出 BAD_REQUEST 错误", async () => {
    const progressRepo = mockProgressRepo();
    const articleRepo = mockArticleRepo();
    const service = new ProgressService(progressRepo, articleRepo);

    await expect(
      service.submitArticleProgress(1, {
        article_id: 1,
        answers: [{ question_id: 999, selected: "A" }],
      }),
    ).rejects.toThrow("题目 999 不存在");
  });

  it("未注入 articleRepo — 抛出 SERVER_ERROR", async () => {
    const progressRepo = mockProgressRepo();
    // 不传 articleRepo（模拟未注入场景）
    const service = new ProgressService(progressRepo, undefined);

    await expect(
      service.submitArticleProgress(1, {
        article_id: 1,
        answers: [{ question_id: 1, selected: "A" }],
      }),
    ).rejects.toThrow("articleRepo 未注入");
  });

  it("answers 数组为空 — 抛出 BAD_REQUEST", async () => {
    const progressRepo = mockProgressRepo();
    const articleRepo = mockArticleRepo();
    const service = new ProgressService(progressRepo, articleRepo);

    await expect(
      service.submitArticleProgress(1, {
        article_id: 1,
        answers: [],
      }),
    ).rejects.toThrow(AppError);
  });

  it("缺少 article_id — 抛出校验错误", async () => {
    const progressRepo = mockProgressRepo();
    const articleRepo = mockArticleRepo();
    const service = new ProgressService(progressRepo, articleRepo);

    await expect(
      service.submitArticleProgress(1, {
        answers: [{ question_id: 1, selected: "A" }],
      }),
    ).rejects.toThrow(AppError);
  });
});
