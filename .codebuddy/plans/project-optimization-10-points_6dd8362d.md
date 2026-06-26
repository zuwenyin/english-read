---
name: project-optimization-10-points
overview: 实施 10 项优化：优雅退出、dotenv 支持、统计 SQL 聚合、生词叠加高亮、文章进度唯一约束、学习时长精度、日志系统、类型安全增强、Swagger API 文档、React Query 缓存策略优化。
todos:
  - id: batch1-infra
    content: 第一批：后端基础设施 — 实现优雅退出（index.ts 注册 SIGTERM/SIGINT）、dotenv 支持（安装 dotenv + 创建 .env/.env.example + config 加载）、Winston 日志系统（安装 winston + 创建 logger.ts + 替换全项目 console.log/error）
    status: completed
  - id: batch2-types-docs
    content: 第二批：类型安全 + Swagger — 全局扩展 Express.Request 类型（auth.ts declare module）消除 6 处 as AuthRequest、泛型化 node-sqlite.d.ts 消除 ~20 处 as 断言、安装 swagger-jsdoc + swagger-ui-express 为 14 个 API 添加 JSDoc 注解并挂载 /api/docs
    status: completed
    dependencies:
      - batch1-infra
  - id: batch3-data-api
    content: 第三批：数据层 + API 扩展 — avg_quiz_score 改为 SQL json_each 聚合、user_article_progress 加 UNIQUE 约束 + 迁移 + upsert、weekly_study_minutes 加权计算（0.5min/词 + 8min/篇）、IProgressRepository 新增 getWordFamiliarityBatch + 文章详情 API 返回 user_word_familiarity
    status: completed
    dependencies:
      - batch2-types-docs
  - id: batch4-frontend
    content: 第四批：前端增强 — ReadingDetail.tsx 叠加 article_words + familiarity≤2 生词 DOM 动态高亮、Home.tsx 和 Profile.tsx 移除显式 staleTime:30000 统一使用全局 5 分钟默认值
    status: completed
    dependencies:
      - batch3-data-api
---

## 用户需求

对当前项目执行以下 10 项优化（按依赖关系分 4 批实施）：

### 第一批：后端基础设施（#3、#4、#11）

- **#3 优雅退出**：在 `index.ts` 注册 `SIGTERM`/`SIGINT` 信号处理器，调用 `closeDatabase()` 后退出
- **#4 dotenv 支持**：引入 `dotenv`，创建 `.env` / `.env.example` 文件，`config/index.ts` 启动时加载
- **#11 日志系统**：引入 `winston`，创建 `utils/logger.ts`，替换全项目 `console.log/error` 为结构化日志

### 第二批：类型安全 + 文档（#12、#13）

- **#12 类型安全增强**：全局扩展 Express Request 类型（`declare module 'express'`），消除 6 处 `as AuthRequest`；完善 `node-sqlite.d.ts` 泛型声明，减少 Repository 中 ~20 处 `as` 断言
- **#13 Swagger 文档**：引入 `swagger-jsdoc` + `swagger-ui-express`，为 14 个 API 端点添加 JSDoc 注解，挂载 `/api/docs`

### 第三批：数据层 + API 扩展（#5、#7、#8、#6 后端）

- **#5 统计查询性能**：`avg_quiz_score` 改为 SQL 聚合（`json_each` + `AVG`），不再全量 JS 遍历
- **#7 UNIQUE 约束**：`user_article_progress` 添加 `UNIQUE(user_id, article_id)`，Repository 改为 upsert
- **#8 学习时长精度**：`weekly_study_minutes` 改为加权计算（单词复习 0.5 分钟/次，文章完成 8 分钟/篇）
- **#6 生词 API 扩展**：`IProgressRepository` 新增 `getWordFamiliarityBatch()`，文章详情接口返回 `user_word_familiarity` 数据

### 第四批：前端增强（#6 前端、#14）

- **#6 生词叠加高亮**：`ReadingDetail.tsx` 叠加 `article_words` + 用户 familiarity ≤ 2 的生词，通过 DOM 遍历动态标记 `<mark>`
- **#14 React Query 缓存**：移除 `Home.tsx` / `Profile.tsx` 中显式 `staleTime: 30_000`，统用全局 5 分钟默认值

## 技术栈

- 后端：Node.js + Express + TypeScript + SQLite（node:sqlite）
- 前端：React 18 + TypeScript + Vite 5 + Ant Design 5 + TanStack React Query 5
- 新增依赖：`dotenv`、`winston`、`swagger-jsdoc`、`swagger-ui-express`
- 新增 dev 依赖：`@types/swagger-jsdoc`、`@types/swagger-ui-express`

## 实现方案

### 第一批：后端基础设施

**#3 优雅退出**

- 在 `index.ts` 注册 `process.on('SIGTERM', ...)` 和 `process.on('SIGINT', ...)`
- Handler 中调用 `closeDatabase()` 后 `process.exit(0)`

**#4 dotenv**

- 安装 `dotenv`，修改 `config/index.ts` 第一行调用 `dotenv.config()`
- 创建 `.env.example`（模板）和 `.env`（默认值），将 `.env` 加入 `.gitignore`
- 配置项：`PORT`、`DB_PATH`、`JWT_SECRET`

**#11 Winston 日志**

- 安装 `winston`，创建 `utils/logger.ts`
- 日志级别：`error` / `warn` / `info` / `debug`（通过 `LOG_LEVEL` 环境变量控制）
- 格式：`timestamp + level + message`，开发环境加颜色，生产环境输出 JSON
- 替换范围：`index.ts`、`database.ts`、`errorHandler.ts` 及所有路由层 `console.log`

### 第二批：类型安全 + 文档

**#12 类型安全**

- `middleware/auth.ts`：添加 `declare global { namespace Express { interface Request { user?: { id: number } } } }`，删除 `AuthRequest` 接口
- 所有路由文件：删除 `import { AuthRequest }`，使用 `req.user!.id` 替代 `(req as AuthRequest).user.id`
- `types/node-sqlite.d.ts`：将 `all()` 改为泛型 `all<T = unknown>(...params: unknown[]): T[]`，`get()` 改为 `get<T = unknown>(...params: unknown[]): T | undefined`
- 各 Repository：删除 `as WordRecord[]` 等断言，改用泛型 `all<WordRecord>()`

**#13 Swagger 文档**

- 安装 `swagger-jsdoc`、`swagger-ui-express` 及类型包
- 创建 `utils/swagger.ts`，配置 OpenAPI 3.0 定义（info、servers、components/securitySchemes）
- 为所有 14 个 API 路由添加 JSDoc `@swagger` 注解
- 在 `index.ts` 挂载 `/api/docs`（Swagger UI）和 `/api/docs.json`（JSON spec）

### 第三批：数据层 + API 扩展

**#5 统计 SQL 聚合**

- `avg_quiz_score`：单条 SQL 完成

```sql
SELECT AVG(
(SELECT COUNT(*) FROM json_each(answers) WHERE json_extract(value, '$.is_correct') = 1) * 100.0 /
NULLIF((SELECT COUNT(*) FROM json_each(answers)), 0)
) FROM user_article_progress WHERE user_id = ?
```

- 处理除零（`NULLIF`）和 NULL 结果（`COALESCE(..., 0)`）

**#7 UNIQUE 约束**

- `schema.sql`：添加 `UNIQUE(user_id, article_id)` 到 `user_article_progress`
- 新建迁移 `db/migrations/002_add_article_progress_unique.sql`
- `SqliteProgressRepository.submitArticleProgress()`：改为 `INSERT ... ON CONFLICT(user_id, article_id) DO UPDATE SET ...`
- `config/database.ts`：添加迁移文件自动执行逻辑

**#8 学习时长精度**

- 单词复习权重：0.5 分钟/次（基于 `user_word_progress` 本周 `last_reviewed` 记录数）
- 文章完成权重：8 分钟/篇（基于 `user_article_progress` 本周 `completed_at` 记录数）
- 替代原来的 `count * 2` 估算

**#6 生词 API（后端部分）**

- `IProgressRepository` 新增方法：`getWordFamiliarityBatch(userId: number, words: string[]): Promise<Map<string, number>>`
- `SqliteProgressRepository` 实现：`SELECT w.word, uwp.familiarity FROM words w LEFT JOIN user_word_progress uwp ON ... WHERE w.word IN (...)`
- `ArticleService.getArticleById()` 接受可选 `userId` 参数
- `articles.ts` 路由 `GET /:id` 的响应中新增 `user_word_familiarity: Record<string, number>`（单词→熟识度映射）

### 第四批：前端增强

**#6 生词叠加高亮（前端部分）**

- 前端 types 扩展：`ArticleDetail` 新增 `user_word_familiarity: Record<string, number>`
- `ReadingDetail.tsx`：
- 解析 `user_word_familiarity`，筛选 familiarity ≤ 2 的单词
- 合并 `article_words` + 用户生词，在 `useEffect` 中遍历文章内容 DOM 文本节点
- 对匹配的单词包裹 `<mark class="vocabulary user-unfamiliar">` 并附加不同样式（如橙色下划线区分）
- 扩展 `wordMap` 和 `handleContentClick` 支持用户生词点击查词

**#14 React Query 缓存**

- `Home.tsx`：删除 stats（L85）、wordBooks（L92）、articles（L99）的 `staleTime: 30_000`
- `Profile.tsx`：删除 stats（L35）、recent（L41）的 `staleTime: 30_000`
- 全局 `staleTime: 5 * 60 * 1000` 已足够

## 目录结构

```
english-read/
├── .env                          # [NEW] 默认环境变量
├── .env.example                  # [NEW] 环境变量模板
├── .gitignore                    # [MODIFY] 添加 .env
├── packages/
│   └── backend/
│       ├── package.json          # [MODIFY] 新增 dotenv、winston、swagger-jsdoc、swagger-ui-express
│       └── src/
│           ├── index.ts          # [MODIFY] 优雅退出 + dotenv 加载 + Swagger 端点
│           ├── config/
│           │   ├── index.ts      # [MODIFY] 顶部加 dotenv.config()
│           │   └── database.ts   # [MODIFY] 执行迁移脚本
│           ├── middleware/
│           │   ├── auth.ts       # [MODIFY] 全局扩展 Express Request，删除 AuthRequest 接口
│           │   └── errorHandler.ts #[MODIFY] 改用 logger.error
│           ├── utils/
│           │   ├── logger.ts     # [NEW] Winston 日志实例（级别/格式/输出）
│           │   └── swagger.ts    # [NEW] Swagger JSDoc 配置
│           ├── types/
│           │   └── node-sqlite.d.ts #[MODIFY] 泛型化 all()/get()
│           ├── db/
│           │   ├── schema.sql    # [MODIFY] user_article_progress 加 UNIQUE
│           │   └── migrations/
│           │       └── 002_add_article_progress_unique.sql  # [NEW] 迁移脚本
│           ├── repositories/
│           │   ├── interfaces/
│           │   │   └── IProgressRepository.ts  # [MODIFY] 新增 getWordFamiliarityBatch
│           │   └── sqlite/
│           │       ├── SqliteProgressRepository.ts  # [MODIFY] 优化 getStatsOverview + upsert + 新方法
│           │       ├── SqliteUserRepository.ts     # [MODIFY] 消除 as 断言
│           │       ├── SqliteWordRepository.ts     # [MODIFY] 消除 as 断言
│           │       └── SqliteArticleRepository.ts  # [MODIFY] 消除 as 断言
│           ├── services/
│           │   └── articleService.ts  # [MODIFY] getArticleById 支持 userId
│           └── routes/
│               ├── articles.ts  # [MODIFY] 消除 as AuthRequest + 返回 user_word_familiarity
│               ├── auth.ts      # [MODIFY] 消除 as AuthRequest
│               ├── progress.ts  # [MODIFY] 消除 as AuthRequest
│               ├── stats.ts     # [MODIFY] 消除 as AuthRequest
│               └── words.ts     # [MODIFY] 添加 Swagger 注解（无 as AuthRequest 问题）
│   └── frontend/
│       └── src/
│           ├── types/
│           │   └── index.ts              # [MODIFY] ArticleDetail 新增 user_word_familiarity
│           ├── pages/
│           │   ├── ReadingDetail.tsx     # [MODIFY] 生词叠加高亮逻辑
│           │   ├── Home.tsx              # [MODIFY] 移除显式 staleTime
│           │   └── Profile.tsx           # [MODIFY] 移除显式 staleTime
│           └── api/
│               └── articles.ts           # [MODIFY] 无需改（类型自动扩展）
```
