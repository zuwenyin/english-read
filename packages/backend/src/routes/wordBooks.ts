import { Router } from "express";
import { WordBookService } from "../services/wordBookService";
import { authMiddleware } from "../middleware/auth";
import { IWordRepository } from "../repositories/interfaces/IWordRepository";
import { success } from "../utils/response";

/**
 * @swagger
 * tags:
 *   name: WordBooks
 *   description: 词书相关接口
 */

export function createWordBookRoutes(wordRepo: IWordRepository): Router {
  const router = Router();
  const service = new WordBookService(wordRepo);

  /**
   * @swagger
   * /api/word-books:
   *   get:
   *     tags: [WordBooks]
   *     summary: 获取词书列表（可按年级阶段筛选）
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: query
   *         name: level
   *         schema: { type: string, enum: [primary, junior, senior, college] }
   *         description: 年级阶段
   *     responses:
   *       200: { description: 词书列表 }
   */
  router.get("/", authMiddleware, async (req, res, next) => {
    try {
      const level = req.query.level as string | undefined;
      const books = await service.list(level);
      success(res, books);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
