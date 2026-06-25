import { Router } from "express";
import { WordService } from "../services/wordService";
import { authMiddleware } from "../middleware/auth";
import { IWordRepository } from "../repositories/interfaces/IWordRepository";
import { success } from "../utils/response";

export function createWordRoutes(wordRepo: IWordRepository): Router {
  const router = Router();
  const service = new WordService(wordRepo);

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

  // GET /api/words/:bookId?page=1&pageSize=20
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
