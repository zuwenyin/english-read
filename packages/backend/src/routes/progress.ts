import { Router } from "express";
import { ProgressService } from "../services/progressService";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { IProgressRepository } from "../repositories/interfaces/IProgressRepository";
import { IArticleRepository } from "../repositories/interfaces/IArticleRepository";
import { success } from "../utils/response";

export function createProgressRoutes(
  progressRepo: IProgressRepository,
  articleRepo: IArticleRepository,
): Router {
  const router = Router();
  const service = new ProgressService(progressRepo, articleRepo);

  // POST /api/progress/word — 标记单词熟识度
  router.post("/word", authMiddleware, async (req, res, next) => {
    try {
      const authReq = req as AuthRequest;
      const result = await service.updateWordProgress(authReq.user.id, req.body);
      success(res, result, "进度更新成功");
    } catch (err) {
      next(err);
    }
  });

  // POST /api/progress/article — 提交文章阅读进度/答题结果
  router.post("/article", authMiddleware, async (req, res, next) => {
    try {
      const authReq = req as AuthRequest;
      const result = await service.submitArticleProgress(authReq.user.id, req.body);
      success(res, result, "提交成功");
    } catch (err) {
      next(err);
    }
  });

  // GET /api/progress/words/:bookId — 获取词书学习进度
  router.get("/words/:bookId", authMiddleware, async (req, res, next) => {
    try {
      const authReq = req as AuthRequest;
      const bookId = Number(req.params.bookId);
      const result = await service.getWordProgressByBook(authReq.user.id, bookId);
      success(res, result);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
