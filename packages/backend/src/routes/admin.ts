import { Router } from "express";
import type { DatabaseSync } from "node:sqlite";
import { ArticleImportService, FetchResult, LevelCounts } from "../services/articleImportService";
import { DeepSeekService } from "../services/deepseekService";
import { IArticleRepository } from "../repositories/interfaces/IArticleRepository";
import { authMiddleware } from "../middleware/auth";
import { success } from "../utils/response";
import { logger } from "../utils/logger";

/**
 * Admin Routes — 管理后台接口
 *
 * POST   /api/admin/fetch-articles — 手动触发文章拉取（可选 body: { counts: { primary: 3, junior: 5, ... } }）
 * GET    /api/admin/fetch-status     — 获取最近一次拉取状态（暂用内存存储）
 * DELETE /api/admin/articles        — 删除所有文章及关联数据
 */

export function createAdminRoutes(
  articleRepo: IArticleRepository,
  db?: DatabaseSync,
  deepseekService?: DeepSeekService,
): Router {
  const router = Router();
  const service = new ArticleImportService(articleRepo);
  const deepseek = deepseekService || new DeepSeekService();

  // 内存存储最近一次拉取结果
  let lastFetchResult: (FetchResult & { timestamp: string }) | null = null;
  let isFetching = false;

  /**
   * @swagger
   * /api/admin/fetch-articles:
   *   post:
   *     summary: 触发文章拉取
   *     description: 手动触发文章拉取管线，可选 counts 指定每个年级拉取数量。
   *     tags: [Admin]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: false
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               counts:
   *                 type: object
   *                 properties:
   *                   primary:
   *                     type: integer
   *                   junior:
   *                     type: integer
   *                   senior:
   *                     type: integer
   *                   college:
   *                     type: integer
   *     responses:
   *       200:
   *         description: 拉取结果
   */
  router.post("/fetch-articles", authMiddleware, async (req, res, next) => {
    if (isFetching) {
      success(res, { message: "拉取任务已在进行中，请稍后再试" });
      return;
    }

    try {
      isFetching = true;
      const counts = req.body?.counts as LevelCounts | undefined;
      const sources = req.body?.sources as string[] | undefined;
      const result = await service.runPipeline(counts, sources);
      lastFetchResult = { ...result, timestamp: new Date().toISOString() };
      success(res, lastFetchResult);
    } catch (err) {
      next(err);
    } finally {
      isFetching = false;
    }
  });

  /**
   * GET /api/admin/fetch-status
   * 获取最近一次拉取状态（含进行中标记）
   */
  /**
   * @swagger
   * /api/admin/fetch-status:
   *   get:
   *     summary: 获取拉取状态
   *     description: 获取最近一次文章拉取的结果或当前进行中的状态。
   *     tags: [Admin]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: 拉取状态
   */
  router.get("/fetch-status", authMiddleware, (_req, res) => {
    if (isFetching) {
      success(res, { fetching: true, message: "拉取任务正在进行中..." });
      return;
    }
    if (!lastFetchResult) {
      success(res, { message: "尚未执行过拉取任务" });
      return;
    }
    success(res, lastFetchResult);
  });

  /**
   * @swagger
   * /api/admin/articles:
   *   delete:
   *     summary: 删除所有文章
   *     description: 删除所有文章及关联数据（article_words + user_article_progress），返回被删除的记录数。
   *     tags: [Admin]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: 删除成功
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 code:
   *                   type: integer
   *                   example: 0
   *                 message:
   *                   type: string
   *                   example: 所有文章及关联数据已删除
   *                 data:
   *                   type: object
   *                   properties:
   *                     message:
   *                       type: string
   *                     deleted:
   *                       type: object
   *                       properties:
   *                         articles:
   *                           type: integer
   *                         article_words:
   *                           type: integer
   *                         user_article_progress:
   *                           type: integer
   */
  router.delete("/articles", authMiddleware, (_req, res) => {
    if (!db) {
      success(res, { error: "数据库实例未传入" });
      return;
    }
    const { articles, words, progress } = db
      .prepare(
        `SELECT
           (SELECT COUNT(*) FROM articles) as articles,
           (SELECT COUNT(*) FROM article_words) as words,
           (SELECT COUNT(*) FROM user_article_progress) as progress`,
      )
      .get<{ articles: number; words: number; progress: number }>()!;

    db.exec("DELETE FROM article_words");
    db.exec("DELETE FROM user_article_progress");
    db.exec("DELETE FROM articles");

    success(res, {
      message: "所有文章及关联数据已删除",
      deleted: {
        articles,
        article_words: words,
        user_article_progress: progress,
      },
    });
  });

  /**
   * @swagger
   * /api/admin/articles/{id}/retranslate:
   *   post:
   *     summary: 重新翻译文章（句子级）
   *     description: 对指定文章调用 DeepSeek 重新生成句子级中英对照翻译。
   *     tags: [Admin]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: 翻译结果
   */
  router.post("/articles/:id/retranslate", authMiddleware, async (req, res, next) => {
    try {
      const articleId = Number(req.params.id);
      if (!articleId || articleId <= 0) {
        success(res, { success: false, message: "无效的文章 ID" });
        return;
      }

      const article = await articleRepo.getArticleById(articleId);
      if (!article) {
        success(res, { success: false, message: "文章不存在" });
        return;
      }

      logger.info(`[Admin] retranslating article ${articleId}: "${article.title}"`);
      const newTranslation = await deepseek.translateContentBySentence(article.content);

      if (!newTranslation) {
        success(res, {
          success: false,
          message: "翻译失败，请检查 DeepSeek API 是否可用",
        });
        return;
      }

      await articleRepo.updateTranslation(articleId, newTranslation);
      logger.info(`[Admin] article ${articleId} translation updated (sentence-level)`);

      // 返回前 3 句预览
      let preview: { en: string; zh: string }[] = [];
      try {
        const parsed = JSON.parse(newTranslation) as {
          sentences: { en: string; zh: string }[];
        }[];
        preview = parsed.flatMap((p) => p.sentences).slice(0, 3);
      } catch {
        // ignore preview parse errors
      }

      success(res, {
        success: true,
        message: "翻译已更新为句子级对照格式",
        preview,
      });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
