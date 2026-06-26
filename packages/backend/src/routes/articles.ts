import { Router } from "express";
import { ArticleService } from "../services/articleService";
import { IArticleRepository } from "../repositories/interfaces/IArticleRepository";
import { IProgressRepository } from "../repositories/interfaces/IProgressRepository";
import { authMiddleware } from "../middleware/auth";
import { success } from "../utils/response";

/**
 * @swagger
 * tags:
 *   name: Articles
 *   description: 阅读文章相关接口
 */

export function createArticleRoutes(
  articleRepo: IArticleRepository,
  progressRepo: IProgressRepository,
): Router {
  const router = Router();
  const articleService = new ArticleService(articleRepo);

  /**
   * @swagger
   * /api/articles/search:
   *   get:
   *     tags: [Articles]
   *     summary: 搜索文章
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: query
   *         name: keyword
   *         required: true
   *         schema: { type: string }
   *       - in: query
   *         name: level
   *         schema: { type: string }
   *       - in: query
   *         name: category
   *         schema: { type: string, enum: [story, news] }
   *       - in: query
   *         name: page
   *         schema: { type: integer, default: 1 }
   *       - in: query
   *         name: pageSize
   *         schema: { type: integer, default: 20 }
   *     responses:
   *       200: { description: 分页文章列表 }
   */
  // ⚠️ /search 必须注册在 /:id 之前，避免 Express 把 "search" 当 id 匹配
  router.get("/search", authMiddleware, async (req, res, next) => {
    try {
      const result = await articleService.searchArticles(req.query);
      success(res, result);
    } catch (err) {
      next(err);
    }
  });

  /**
   * @swagger
   * /api/articles:
   *   get:
   *     tags: [Articles]
   *     summary: 获取文章列表（可按阶段/类型/关键词筛选）
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: query
   *         name: level
   *         schema: { type: string, enum: [primary, junior, senior, college] }
   *       - in: query
   *         name: category
   *         schema: { type: string, enum: [story, news] }
   *       - in: query
   *         name: keyword
   *         schema: { type: string }
   *       - in: query
   *         name: page
   *         schema: { type: integer, default: 1 }
   *       - in: query
   *         name: pageSize
   *         schema: { type: integer, default: 20 }
   *     responses:
   *       200: { description: 分页文章列表 }
   */
  router.get("/", authMiddleware, async (req, res, next) => {
    try {
      const result = await articleService.getArticles(req.query);
      success(res, result);
    } catch (err) {
      next(err);
    }
  });

  /**
   * @swagger
   * /api/articles/{id}:
   *   get:
   *     tags: [Articles]
   *     summary: 获取文章详情（含内容、题目、生词、用户进度、熟识度映射）
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: integer }
   *     responses:
   *       200: { description: 文章详情 }
   *       404: { description: 文章不存在 }
   */
  router.get("/:id", authMiddleware, async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      // 使用 articleRepo 直接查询（含完整的 answer 字段），用于答案格式兼容
      const rawArticle = await articleRepo.getArticleById(id);
      if (!rawArticle) {
        return res.status(404).json({ message: "文章不存在" });
      }

      // 查询用户阅读进度（首次阅读则为 null）
      const userProgress = await progressRepo.getArticleProgress(req.user!.id, id);

      // 查询文章预标注生词的用户熟识度（用于前端叠加高亮）
      const articleWords = (await articleRepo.getArticleWords(id)).map((aw) => aw.word);
      const wordFamiliarity = await progressRepo.getWordFamiliarityBatch(
        req.user!.id,
        articleWords,
      );

      // 如果 user_progress 中 answer.correct 是旧格式（全文本），转为字母
      const normalizedUserProgress = userProgress
        ? {
            ...userProgress,
            answers: userProgress.answers.map((a) => {
              if (a.correct && a.correct.length > 1) {
                const q = rawArticle.questions.find((q) => q.id === a.question_id);
                if (q) {
                  const cleanOptions = q.options.map((opt) =>
                    opt.replace(/^[A-D][.．、)）]\s*/i, "").trim(),
                  );
                  const idx = cleanOptions.indexOf(a.correct);
                  if (idx >= 0) {
                    return {
                      ...a,
                      correct: String.fromCharCode(65 + idx),
                    };
                  }
                }
              }
              return a;
            }),
          }
        : null;

      // 构建脱敏后的 article 响应
      const articleResponse = {
        id: rawArticle.id,
        title: rawArticle.title,
        content: rawArticle.content,
        level: rawArticle.level,
        category: rawArticle.category,
        source: rawArticle.source,
        questions: rawArticle.questions.map((q) => ({
          id: q.id,
          question: q.question,
          options: q.options,
        })),
        article_words: (await articleRepo.getArticleWords(id)).map(
          ({ id, word, translation, phonetic }) => ({ id, word, translation, phonetic }),
        ),
        content_translation: rawArticle.content_translation,
        created_at: rawArticle.created_at,
      };

      success(res, {
        ...articleResponse,
        user_progress: normalizedUserProgress
          ? {
              answers: normalizedUserProgress.answers,
              completed_at: normalizedUserProgress.completed_at,
              quiz_score:
                normalizedUserProgress.answers.length > 0
                  ? Math.round(
                      (normalizedUserProgress.answers.filter((a) => a.is_correct).length /
                        normalizedUserProgress.answers.length) *
                        100,
                    )
                  : 0,
            }
          : null,
        user_word_familiarity: Object.fromEntries(wordFamiliarity),
      });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
