import { Router } from "express";
import { ProgressService } from "../services/progressService";
import { authMiddleware } from "../middleware/auth";
import { IProgressRepository } from "../repositories/interfaces/IProgressRepository";
import { IArticleRepository } from "../repositories/interfaces/IArticleRepository";
import { success } from "../utils/response";

/**
 * @swagger
 * tags:
 *   name: Progress
 *   description: 学习进度相关接口
 */

export function createProgressRoutes(
  progressRepo: IProgressRepository,
  articleRepo: IArticleRepository,
): Router {
  const router = Router();
  const service = new ProgressService(progressRepo, articleRepo);

  /**
   * @swagger
   * /api/progress/word:
   *   post:
   *     tags: [Progress]
   *     summary: 更新单词熟识度
   *     security: [{ bearerAuth: [] }]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [word_id, familiarity]
   *             properties:
   *               word_id: { type: integer }
   *               familiarity: { type: integer, minimum: 1, maximum: 5 }
   *     responses:
   *       200: { description: 进度更新成功 }
   */
  router.post("/word", authMiddleware, async (req, res, next) => {
    try {
      const result = await service.updateWordProgress(req.user!.id, req.body);
      success(res, result, "进度更新成功");
    } catch (err) {
      next(err);
    }
  });

  /**
   * @swagger
   * /api/progress/article:
   *   post:
   *     tags: [Progress]
   *     summary: 提交文章阅读进度/答题结果
   *     security: [{ bearerAuth: [] }]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [article_id, answers]
   *             properties:
   *               article_id: { type: integer }
   *               answers:
   *                 type: array
   *                 items:
   *                   type: object
   *                   properties:
   *                     question_id: { type: integer }
   *                     selected: { type: string }
   *     responses:
   *       200: { description: 提交成功，返回得分 }
   */
  router.post("/article", authMiddleware, async (req, res, next) => {
    try {
      const result = await service.submitArticleProgress(req.user!.id, req.body);
      success(res, result, "提交成功");
    } catch (err) {
      next(err);
    }
  });

  /**
   * @swagger
   * /api/progress/words/{bookId}:
   *   get:
   *     tags: [Progress]
   *     summary: 获取用户在指定词书中的单词学习进度
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: path
   *         name: bookId
   *         required: true
   *         schema: { type: integer }
   *     responses:
   *       200: { description: 单词熟识度列表 }
   */
  router.get("/words/:bookId", authMiddleware, async (req, res, next) => {
    try {
      const bookId = Number(req.params.bookId);
      const result = await service.getWordProgressByBook(req.user!.id, bookId);
      success(res, result);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
