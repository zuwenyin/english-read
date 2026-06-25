import { Router } from "express";
import { WordBookService } from "../services/wordBookService";
import { authMiddleware } from "../middleware/auth";
import { IWordRepository } from "../repositories/interfaces/IWordRepository";
import { success } from "../utils/response";

export function createWordBookRoutes(wordRepo: IWordRepository): Router {
  const router = Router();
  const service = new WordBookService(wordRepo);

  // GET /api/word-books?level=primary
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
