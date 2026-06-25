import { Router } from "express";
import { ArticleService } from "../services/articleService";
import { IArticleRepository } from "../repositories/interfaces/IArticleRepository";
import { IProgressRepository } from "../repositories/interfaces/IProgressRepository";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { success } from "../utils/response";

export function createArticleRoutes(
  articleRepo: IArticleRepository,
  progressRepo: IProgressRepository,
): Router {
  const router = Router();
  const articleService = new ArticleService(articleRepo);

  // ⚠️ /search 必须注册在 /:id 之前，避免 Express 把 "search" 当 id 匹配
  router.get("/search", authMiddleware, async (req, res, next) => {
    try {
      const result = await articleService.searchArticles(req.query);
      success(res, result);
    } catch (err) {
      next(err);
    }
  });

  // GET /api/articles — 文章列表（不含 content 全文）
  router.get("/", authMiddleware, async (req, res, next) => {
    try {
      const result = await articleService.getArticles(req.query);
      success(res, result);
    } catch (err) {
      next(err);
    }
  });

  // GET /api/articles/:id — 文章详情（含 content + questions + article_words + user_progress）
  router.get("/:id", authMiddleware, async (req, res, next) => {
    try {
      const authReq = req as AuthRequest;
      const id = Number(req.params.id);
      const article = await articleService.getArticleById(id);

      // 查询用户阅读进度（首次阅读则为 null）
      const userProgress = await progressRepo.getArticleProgress(authReq.user.id, id);

      success(res, {
        ...article,
        user_progress: userProgress
          ? {
              answers: userProgress.answers,
              completed_at: userProgress.completed_at,
            }
          : null,
      });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
