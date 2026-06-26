import express from "express";
import swaggerUi from "swagger-ui-express";
import { config } from "./config";
import { getDatabase, closeDatabase } from "./config/database";
import { errorHandler } from "./middleware/errorHandler";
import { getRepositories } from "./repositories/factory";
import { DeepSeekService } from "./services/deepseekService";
import { createAuthRoutes } from "./routes/auth";
import { createWordBookRoutes } from "./routes/wordBooks";
import { createWordRoutes } from "./routes/words";
import { createProgressRoutes } from "./routes/progress";
import { createArticleRoutes } from "./routes/articles";
import { createStatsRoutes } from "./routes/stats";
import { createAdminRoutes } from "./routes/admin";
import { startArticleScheduler } from "./scheduler";
import { authMiddleware } from "./middleware/auth";
import { cacheClear } from "./utils/cache";
import { success } from "./utils/response";
import { logger } from "./utils/logger";
import { swaggerSpec } from "./utils/swagger";

// 初始化数据库
const db = getDatabase();

// 初始化 Repository
const repos = getRepositories(db);

// 初始化 DeepSeek 服务（单例，供 admin 路由复用）
const deepseekService = new DeepSeekService();

const app = express();

// Middleware
app.use(express.json());

// Health check
app.get("/api/health", (_req, res) => {
  success(res, "ok");
});

// Swagger API 文档
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get("/api/docs.json", (_req, res) => {
  res.json(swaggerSpec);
});

// Auth routes
app.use("/api/auth", createAuthRoutes(repos.user));

// Word & Progress routes
app.use("/api/word-books", createWordBookRoutes(repos.word));
app.use("/api/words", createWordRoutes(repos.word));
app.use("/api/progress", createProgressRoutes(repos.progress, repos.article));
app.use("/api/articles", createArticleRoutes(repos.article, repos.progress));
app.use("/api/stats", createStatsRoutes(repos.progress));
app.use("/api/admin", createAdminRoutes(repos.article, db, deepseekService));

// 启动文章定时拉取调度器
const stopScheduler = startArticleScheduler(repos.article);

// POST /api/cache/clear — 清除后端缓存（内部接口，seed 脚本调用）
app.post("/api/cache/clear", authMiddleware, (_req, res, next) => {
  try {
    cacheClear();
    success(res, null, "缓存已清除");
  } catch (err) {
    next(err);
  }
});

// Error handler (must be last)
app.use(errorHandler);

const server = app.listen(config.port, () => {
  logger.info(`Server running on http://localhost:${config.port}`);
});

// ============ 优雅退出 ============
function gracefulShutdown(signal: string): void {
  logger.info(`${signal} received, shutting down gracefully...`);
  stopScheduler();
  server.close(() => {
    closeDatabase();
    logger.info("Server closed");
    process.exit(0);
  });

  // 超时强制退出
  setTimeout(() => {
    logger.error("Forced shutdown after timeout");
    process.exit(1);
  }, 10_000);
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
