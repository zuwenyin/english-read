import { Router } from "express";
import { WordService } from "../services/wordService";
import { authMiddleware } from "../middleware/auth";
import { IWordRepository } from "../repositories/interfaces/IWordRepository";
import { success } from "../utils/response";

/**
 * @swagger
 * tags:
 *   name: Words
 *   description: 单词相关接口
 */

export function createWordRoutes(wordRepo: IWordRepository): Router {
  const router = Router();
  const service = new WordService(wordRepo);

  /**
   * @swagger
   * /api/words/search:
   *   get:
   *     tags: [Words]
   *     summary: 搜索单词（按英文或中文）
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: query
   *         name: keyword
   *         required: true
   *         schema: { type: string }
   *         description: 搜索关键词
   *       - in: query
   *         name: bookId
   *         schema: { type: integer }
   *         description: 限定词书范围
   *     responses:
   *       200: { description: 匹配的单词列表 }
   */
  // ⚠️ /search 必须在 /:bookId 之前，否则 "search" 会被当成 bookId
  router.get("/search", authMiddleware, async (req, res, next) => {
    try {
      const keyword = req.query.keyword as string;
      const bookId = req.query.bookId ? Number(req.query.bookId) : undefined;
      const result = await service.search(keyword, bookId);
      success(res, result);
    } catch (err) {
      next(err);
    }
  });

  /**
   * @swagger
   * /api/words/{bookId}:
   *   get:
   *     tags: [Words]
   *     summary: 获取词书单词列表（分页）
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: path
   *         name: bookId
   *         required: true
   *         schema: { type: integer }
   *         description: 词书ID
   *       - in: query
   *         name: page
   *         schema: { type: integer, default: 1 }
   *       - in: query
   *         name: pageSize
   *         schema: { type: integer, default: 20 }
   *     responses:
   *       200: { description: 分页单词列表 }
   */
  router.get("/:bookId", authMiddleware, async (req, res, next) => {
    try {
      const bookId = Number(req.params.bookId);
      const page = Number(req.query.page) || 1;
      const pageSize = Number(req.query.pageSize) || 20;
      const result = await service.listByBook(bookId, page, pageSize);
      success(res, result);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
