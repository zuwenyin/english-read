# 阶段五：阅读模块（前后端打通）✅ 已完成

> **思路**：将原来的 Phase 5（后端文章 API + 统计 API）和 Phase 8（前端阅读页面）合并为一个垂直模块。
> 完成后即可浏览文章列表 → 阅读文章 → 做阅读理解题 → 查看成绩，完整闭环可验证。
>
> **实施日期**：2026-06-25

---

## 前置准备（已完成 ✅）

以下工作已在评估阶段完成，无需重复执行：

| 事项                                      | 说明                                                                                                                              |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `articles` 表新增 `summary` 列            | Schema + Migration + 技术文档 均已更新                                                                                            |
| `ArticleListItem` 接口增加 `summary` 字段 | 列表 API 直接返回 summary，前端无需从 content 截取                                                                                |
| 测试文章数据                              | `article-seed.ts` 已编写，8 篇文章 + 29 道题 + 40 个生词已入库                                                                    |
| 答案校验策略                              | **后端严格校验**：提交答案时，Service 层从 `questions` JSON 取正确答案与 `selected` 比对，不信任前端传入的 `correct`/`is_correct` |

> 运行方式：`pnpm --filter backend seed:articles`（重新导入测试数据）

---

## Task 5.1：后端文章 API（列表 / 详情 / 搜索）

### 执行步骤

1. 创建 `src/routes/articles.ts` + `src/services/articleService.ts`：
   - `GET /api/articles?level=&category=&keyword=&page=&pageSize=`
     - 列表不含 `content` 全文
     - 返回分页格式
   - `GET /api/articles/search?keyword=xxx&level=`
     - **⚠️ 必须注册在 `/:id` 之前**
     - 匹配标题或内容
   - `GET /api/articles/:id`
     - 返回完整文章（含 content、questions、article_words）
     - 同时查询用户阅读进度

2. 在 `src/index.ts` 中注册路由（注意搜索路由顺序）

### API 规格（参考 technical-design.md 7.5.7-7.5.8, 7.5.16）

- `GET /api/articles` → 分页文章列表（不含 content）
- `GET /api/articles/search` → 关键词搜索
- `GET /api/articles/:id` → 文章详情（含 content + questions + user_progress + article_words）

### 验收标准

- [x] 文章列表正确返回（不含 content）
- [x] 文章详情正确返回（含完整信息）
- [x] 搜索正确工作
- [x] 路由顺序正确（`/search` 在 `/:id` 之前）
- [x] 未读文章 user_progress 为 null

---

## Task 5.2：后端文章进度 API + 统计 API + 缓存

### 执行步骤

1. 完善 `src/routes/progress.ts`：
   - `POST /api/progress/article`
     - Zod：article_id + answers 数组（只需 `question_id` + `selected`，不需要 `correct`/`is_correct`）
     - **⚠️ 后端严格校验**：Service 层查询文章 `questions` JSON，逐个比对 `selected` 与 `answer`，自行计算 `is_correct`
     - 保存到 user_article_progress
     - 返回 `{ id, quiz_score, completed_at }`

2. 创建 `src/routes/stats.ts` + `src/services/statsService.ts`：
   - `GET /api/stats/overview`
     - 返回已学单词数、已读文章数、平均成绩、本周学习时长
   - `GET /api/progress/recent`
     - 返回最近 3 条词书 + 3 条文章学习记录
   - `POST /api/cache/clear`
     - 内部接口，seed 脚本调用

3. 实现 `src/utils/cache.ts`：
   - 简单 Map 内存缓存
   - 启动时加载词书/文章列表
   - `/api/cache/clear` 时清除

### 验收标准

- [x] 文章进度正确保存
- [x] quiz_score 计算正确（`Math.round(correctCount / total * 100)`）
- [x] 统计概览返回正确数据
- [x] 最近学习记录返回正确
- [x] 缓存清除接口正常

---

## Task 5.3：前端阅读列表页（/reading）

### 执行步骤

1. 创建 `src/api/articles.ts`：
   - `getArticles()` / `getArticleById()` / `searchArticles()`
   - `submitArticleProgress()` / `getArticleProgress()`

2. 实现 `src/pages/Reading.tsx`（替换原占位文件）：
   - 顶部搜索栏（防抖 500ms）
   - 筛选栏：类型（全部/故事/新闻）+ 年级阶段
   - 文章卡片列表：
     - 标题 + 类型标签 + 难度标签
     - 简介（直接使用 API 返回的 `summary` 字段，不需要前端截取）
   - 点击跳转 `/reading/:id`
   - react-query 缓存

### 验收标准

- [x] 文章列表正确显示
- [x] 搜索防抖工作正常（useRef + clearTimeout 实现）
- [x] 类型 + 年级筛选正确
- [x] 点击跳转正确
- [x] react-query 缓存正常

---

## Task 5.4：前端文章阅读页（/reading/:id）

### 执行步骤

1. 实现 `src/pages/ReadingDetail.tsx`（替换原占位文件）：
   - `dangerouslySetInnerHTML` 渲染文章 HTML 内容
   - **生词高亮**：`.vocabulary` CSS 蓝色下划线样式
   - **点击查词**：onClick 弹出 antd Popover
     - 显示词汇释义 + 发音按钮（Web Speech API）
   - **阅读理解题区**：
     - 渲染 questions JSON 数组
     - 提交答案 → 调用 `POST /api/progress/article`
     - 显示解析

2. 后端确保 `GET /api/articles/:id` 返回 `article_words` 数据

### 验收标准

- [x] 文章 HTML 正确渲染（含 `<mark class="vocabulary">` 标签）
- [x] 生词正确高亮（蓝色下划线 + hover 背景色）
- [x] 点击生词弹出释义气泡（事件委托 + controlled Popover）
- [x] 发音按钮正常（Web Speech API，不支持时提示降级）
- [x] 阅读理解题正确提交（useMutation → POST /api/progress/article）
- [x] 解析正确显示（正确/错误颜色区分 + 正确答案标注）

---

## 阶段总结

**此阶段完成后即可看到完整的阅读学习闭环：**

```
进入 /reading（阅读列表）
  → 筛选年级/类型 → 搜索文章
  → 点击进入 /reading/:id
  → 阅读文章（生词可点击查词）
  → 做阅读理解题
  → 提交 → 查看成绩和解析
```

**注意**：测试数据已通过 `article-seed.ts` 脚本准备完毕（8 篇文章覆盖 primary/junior/senior 三个阶段的 story 和 news 类型），运行 `pnpm --filter backend seed:articles` 即可重新导入。正式数据在 Phase 7 的 Seed 脚本中提供。

---

## 实施记录

### 新建文件

| 文件                                              | 说明                                           |
| ------------------------------------------------- | ---------------------------------------------- |
| `packages/backend/src/services/articleService.ts` | 文章 Service：列表/搜索/详情，Zod 参数校验     |
| `packages/backend/src/routes/articles.ts`         | 文章路由：`/search` → `/` → `/:id`（注意顺序） |
| `packages/backend/src/services/statsService.ts`   | 统计 Service：概览 + 最近记录                  |
| `packages/backend/src/routes/stats.ts`            | 统计路由：`/api/stats/overview`                |
| `packages/backend/src/utils/cache.ts`             | 内存缓存工具（Map 实现）                       |
| `packages/frontend/src/api/articles.ts`           | 文章 API 客户端                                |

### 修改文件

| 文件                                                | 变更                                                                                                                                                  |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/backend/src/services/progressService.ts`  | 新增 `submitArticleProgress`（严格校验答案），接收 `IArticleRepository`                                                                               |
| `packages/backend/src/routes/progress.ts`           | 新增 `/article`、`/recent` 路由，接收 `articleRepo`                                                                                                   |
| `packages/backend/src/index.ts`                     | 注册 articles/stats/cache 路由                                                                                                                        |
| `packages/frontend/src/types/index.ts`              | 新增 `ArticleListItem`、`ArticleDetail`、`Question`、`ArticleWord`、`AnswerRecord`、`ArticleProgressResult`、`StatsOverview`、`RecentProgress` 等类型 |
| `packages/frontend/src/components/antd-wrapper.tsx` | 补充 `Popover`、`Select`、`Pagination`、`Collapse` 导出                                                                                               |
| `packages/frontend/src/pages/Reading.tsx`           | 实现文章列表页（搜索防抖 + 筛选 + 卡片分页）                                                                                                          |
| `packages/frontend/src/pages/ReadingDetail.tsx`     | 实现文章阅读页（HTML 渲染 + 生词高亮 + Popover 查词 + 答题 + 解析）                                                                                   |

### 关键设计实现

- **路由顺序**：`/api/articles/search` 注册在 `/:id` 之前，避免 "search" 被当 id 匹配
- **答案校验**：Service 层查询 `questions` JSON → 逐题比对 `selected` vs `answer` → 自行计算 `is_correct`，前端不传 `correct`/`is_correct`
- **生词高亮**：CSS 注入 `.article-content mark.vocabulary` 蓝色 dashed 下划线 + hover 背景色
- **点击查词**：事件委托 → 从 `article_words` 查释义 → controlled Popover 弹窗（含发音按钮）
- **搜索防抖**：`useRef` 存储 timer → onChange 先 `clearTimeout` 再 `setTimeout(500ms)`
