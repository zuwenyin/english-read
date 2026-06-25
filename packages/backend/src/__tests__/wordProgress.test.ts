/**
 * ProgressService 单词进度测试
 *
 * 覆盖：
 * - updateWordProgress：UPSERT 逻辑 / review_count 递增
 * - 参数校验（word_id 范围 / familiarity 范围）
 */

import { ProgressService } from "../services/progressService";
import {
  IProgressRepository,
  WordProgressRecord,
} from "../repositories/interfaces/IProgressRepository";
import { AppError } from "../utils/errors";

function mockProgressRepo(overrides: Partial<IProgressRepository> = {}): IProgressRepository {
  return {
    upsertWordProgress: jest.fn().mockResolvedValue({
      id: 1,
      user_id: 1,
      word_id: 100,
      familiarity: 3,
      review_count: 1,
      last_reviewed: "2025-06-25T00:00:00.000Z",
      created_at: "2025-06-25T00:00:00.000Z",
    } as WordProgressRecord),
    getWordProgressByBook: jest.fn().mockResolvedValue([]),
    submitArticleProgress: jest.fn(),
    getArticleProgress: jest.fn(),
    getStatsOverview: jest.fn(),
    getRecentProgress: jest.fn(),
    ...overrides,
  };
}

describe("ProgressService - updateWordProgress", () => {
  it("首次标记单词 — 返回 familiarity=3, review_count=1", async () => {
    const repo = mockProgressRepo();
    const service = new ProgressService(repo);

    const result = await service.updateWordProgress(1, {
      word_id: 100,
      familiarity: 3,
    });

    expect(result).toEqual({
      familiarity: 3,
      review_count: 1,
      last_reviewed: "2025-06-25T00:00:00.000Z",
    });
    expect(repo.upsertWordProgress).toHaveBeenCalledWith(1, 100, 3);
  });

  it("更新熟识度 — UPSERT 被调用", async () => {
    const repo = mockProgressRepo({
      upsertWordProgress: jest.fn().mockResolvedValue({
        id: 1,
        user_id: 1,
        word_id: 200,
        familiarity: 5,
        review_count: 5,
        last_reviewed: "2025-06-25T00:00:00.000Z",
        created_at: "2025-06-20T00:00:00.000Z",
      } as WordProgressRecord),
    });
    const service = new ProgressService(repo);

    const result = await service.updateWordProgress(1, {
      word_id: 200,
      familiarity: 5,
    });

    expect(result.familiarity).toBe(5);
    expect(result.review_count).toBe(5);
    expect(repo.upsertWordProgress).toHaveBeenCalledTimes(1);
  });

  it("标记为最低熟识度 (1)", async () => {
    const repo = mockProgressRepo({
      upsertWordProgress: jest.fn().mockResolvedValue({
        id: 2,
        user_id: 1,
        word_id: 300,
        familiarity: 1,
        review_count: 1,
        last_reviewed: "2025-06-25T00:00:00.000Z",
        created_at: "2025-06-25T00:00:00.000Z",
      } as WordProgressRecord),
    });
    const service = new ProgressService(repo);

    const result = await service.updateWordProgress(1, {
      word_id: 300,
      familiarity: 1,
    });

    expect(result.familiarity).toBe(1);
  });

  it("标记为最高熟识度 (5)", async () => {
    const repo = mockProgressRepo({
      upsertWordProgress: jest.fn().mockResolvedValue({
        id: 3,
        user_id: 1,
        word_id: 400,
        familiarity: 5,
        review_count: 1,
        last_reviewed: "2025-06-25T00:00:00.000Z",
        created_at: "2025-06-25T00:00:00.000Z",
      } as WordProgressRecord),
    });
    const service = new ProgressService(repo);

    const result = await service.updateWordProgress(1, {
      word_id: 400,
      familiarity: 5,
    });

    expect(result.familiarity).toBe(5);
  });

  // --- 参数校验测试 ---

  it("familiarity < 1 — 抛出校验错误", async () => {
    const repo = mockProgressRepo();
    const service = new ProgressService(repo);

    await expect(service.updateWordProgress(1, { word_id: 100, familiarity: 0 })).rejects.toThrow(
      AppError,
    );
  });

  it("familiarity > 5 — 抛出校验错误", async () => {
    const repo = mockProgressRepo();
    const service = new ProgressService(repo);

    await expect(service.updateWordProgress(1, { word_id: 100, familiarity: 6 })).rejects.toThrow(
      AppError,
    );
  });

  it("word_id 为 0 — 抛出校验错误", async () => {
    const repo = mockProgressRepo();
    const service = new ProgressService(repo);

    await expect(service.updateWordProgress(1, { word_id: 0, familiarity: 3 })).rejects.toThrow(
      AppError,
    );
  });

  it("word_id 为负数 — 抛出校验错误", async () => {
    const repo = mockProgressRepo();
    const service = new ProgressService(repo);

    await expect(service.updateWordProgress(1, { word_id: -1, familiarity: 3 })).rejects.toThrow(
      AppError,
    );
  });

  it("缺少 word_id — 抛出校验错误", async () => {
    const repo = mockProgressRepo();
    const service = new ProgressService(repo);

    await expect(service.updateWordProgress(1, { familiarity: 3 })).rejects.toThrow(AppError);
  });

  it("review_count 随重复调用递增", async () => {
    let callCount = 0;
    const repo = mockProgressRepo({
      upsertWordProgress: jest.fn().mockImplementation(() => {
        callCount++;
        return Promise.resolve({
          id: 1,
          user_id: 1,
          word_id: 500,
          familiarity: 3,
          review_count: callCount,
          last_reviewed: "2025-06-25T00:00:00.000Z",
          created_at: "2025-06-25T00:00:00.000Z",
        } as WordProgressRecord);
      }),
    });
    const service = new ProgressService(repo);

    // 第一次
    let result = await service.updateWordProgress(1, { word_id: 500, familiarity: 3 });
    expect(result.review_count).toBe(1);

    // 第二次
    result = await service.updateWordProgress(1, { word_id: 500, familiarity: 4 });
    expect(result.review_count).toBe(2);
  });
});
