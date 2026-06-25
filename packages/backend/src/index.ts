import express from "express";
import { config } from "./config";
import { getDatabase } from "./config/database";
import { errorHandler } from "./middleware/errorHandler";
import { getRepositories } from "./repositories/factory";
import { createAuthRoutes } from "./routes/auth";
import { createWordBookRoutes } from "./routes/wordBooks";
import { createWordRoutes } from "./routes/words";
import { createProgressRoutes } from "./routes/progress";
import { createArticleRoutes } from "./routes/articles";
import { createStatsRoutes } from "./routes/stats";
import { authMiddleware } from "./middleware/auth";
import { cacheClear } from "./utils/cache";
import { success } from "./utils/response";

// 初始化数据库
const db = getDatabase();
console.log("[Database] Initialized successfully");

// 初始化 Repository
const repos = getRepositories(db);

const app = express();

// Middleware
app.use(express.json());

// Health check
app.get("/api/health", (_req, res) => {
  success(res, "ok");
});

// Auth routes
app.use("/api/auth", createAuthRoutes(repos.user));

// Word & Progress routes
app.use("/api/word-books", createWordBookRoutes(repos.word));
app.use("/api/words", createWordRoutes(repos.word));
app.use("/api/progress", createProgressRoutes(repos.progress, repos.article));
app.use("/api/articles", createArticleRoutes(repos.article, repos.progress));
app.use("/api/stats", createStatsRoutes(repos.progress));

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

app.listen(config.port, () => {
  console.log(`Server running on http://localhost:${config.port}`);
});
