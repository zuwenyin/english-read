import { Router } from "express";
import { StatsService } from "../services/statsService";
import { IProgressRepository } from "../repositories/interfaces/IProgressRepository";
import { authMiddleware } from "../middleware/auth";
import { success } from "../utils/response";

/**
 * @swagger
 * tags:
 *   name: Stats
 *   description: 学习统计相关接口
 */

export function createStatsRoutes(progressRepo: IProgressRepository): Router {
  const router = Router();
  const statsService = new StatsService(progressRepo);

  /**
   * @swagger
   * /api/stats/overview:
   *   get:
   *     tags: [Stats]
   *     summary: 获取学习统计概览
   *     security: [{ bearerAuth: [] }]
   *     responses:
   *       200:
   *         description: 学习统计数据
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/StatsOverview'
   */
  router.get("/overview", authMiddleware, async (req, res, next) => {
    try {
      const result = await statsService.getStatsOverview(req.user!.id);
      success(res, result);
    } catch (err) {
      next(err);
    }
  });

  /**
   * @swagger
   * /api/stats/recent:
   *   get:
   *     tags: [Stats]
   *     summary: 获取最近学习记录
   *     security: [{ bearerAuth: [] }]
   *     responses:
   *       200: { description: 最近学习的词书和文章（各3条） }
   */
  router.get("/recent", authMiddleware, async (req, res, next) => {
    try {
      const result = await statsService.getRecentProgress(req.user!.id);
      success(res, result);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
