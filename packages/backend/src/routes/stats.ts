import { Router } from "express";
import { StatsService } from "../services/statsService";
import { IProgressRepository } from "../repositories/interfaces/IProgressRepository";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { success } from "../utils/response";

export function createStatsRoutes(progressRepo: IProgressRepository): Router {
  const router = Router();
  const statsService = new StatsService(progressRepo);

  // GET /api/stats/overview — 学习统计概览
  router.get("/overview", authMiddleware, async (req, res, next) => {
    try {
      const authReq = req as AuthRequest;
      const result = await statsService.getStatsOverview(authReq.user.id);
      success(res, result);
    } catch (err) {
      next(err);
    }
  });

  // GET /api/stats/recent — 最近学习记录
  router.get("/recent", authMiddleware, async (req, res, next) => {
    try {
      const authReq = req as AuthRequest;
      const result = await statsService.getRecentProgress(authReq.user.id);
      success(res, result);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
