---
name: strip-answer-from-detail
overview: 脱敏 GET /api/articles/:id 接口的 questions 字段，同时在 POST /api/progress/article 返回值中附带逐题对错与解析，前端改用提交响应展示结果。
todos:
  - id: strip-article-detail
    content: 在 ArticleService.getArticleById() 中对 questions 脱敏，仅保留 id、question、options
    status: completed
  - id: enhance-submit-response
    content: 在 ProgressService.submitArticleProgress() 返回值中增加 answers 数组，每条含 correct、is_correct、explanation
    status: completed
  - id: update-frontend-types
    content: 更新前端 AnswerRecord 和 ArticleProgressResult 类型定义
    status: completed
  - id: adapt-reading-detail
    content: 改造 ReadingDetail.tsx：删除本地 is_correct 计算，改用提交响应的 answers 渲染结果页
    status: completed
    dependencies:
      - update-frontend-types
---

## 问题描述

`GET /api/articles/:id` 接口返回的 `questions` 数组中包含 `answer`（正确答案）和 `explanation`（中文解析），前端在答题前即可获取正确答案，破坏了测验性质。同时前端目前在提交后本地用 `article.questions` 的 `answer` 字段计算对错，脱敏后将无法工作。

## 修复目标

- **后端脱敏**：文章详情接口的 `questions` 仅保留 `id`、`question`、`options`，移除 `answer` 和 `explanation`
- **后端增强返回值**：`POST /api/progress/article` 提交成功时，返回逐题对错详情（含 `correct`、`is_correct`、`explanation`），前端直接使用提交响应数据渲染结果页
- **前端适配**：去掉本地计算 `is_correct` 的逻辑，改用提交响应的 `answers` 数组展示结果

## 核心流程

1. 用户看文章、答题（只看题目和选项，看不到答案）
2. 用户提交 → 后端校验并返回 `{ quiz_score, answers: [{ question_id, selected, correct, is_correct, explanation }] }`
3. 前端用提交响应的 `answers` 渲染结果页（标示正确/错误答案 + 解析）

## 技术方案

### 修改文件清单

| 文件                                               | 改动类型 | 说明                                                                  |
| -------------------------------------------------- | -------- | --------------------------------------------------------------------- |
| `packages/backend/src/services/articleService.ts`  | MODIFY   | `getArticleById()` 脱敏 questions                                     |
| `packages/backend/src/services/progressService.ts` | MODIFY   | `submitArticleProgress()` 返回值增加 answers + explanation            |
| `packages/frontend/src/types/index.ts`             | MODIFY   | `AnswerRecord` 加 `explanation`，`ArticleProgressResult` 加 `answers` |
| `packages/frontend/src/pages/ReadingDetail.tsx`    | MODIFY   | 删除本地计算，改用提交响应数据                                        |

### 后端改动详情

#### articleService.ts — 脱敏

在 `getArticleById()` 的 return 前，对 `article.questions` 做 map 映射，仅保留 `id`、`question`、`options` 三个字段。

#### progressService.ts — 增强返回值

1. 在构建 `answers` 数组时（第 68-79 行），每个元素增加 `explanation: question.explanation`
2. 返回结果（第 89-93 行）增加 `answers` 字段，类型为 `(AnswerRecord & { explanation: string })[]`

### 前端改动详情

#### types/index.ts

- `AnswerRecord` 增加可选字段 `explanation?: string`
- `ArticleProgressResult` 增加 `answers: AnswerRecord[]`

#### ReadingDetail.tsx

- `submitMutation.onSuccess`（第 368-386 行）：删除本地 `validated` 计算逻辑，直接用 `_data.answers` 构建 `quizResult`
- 结果页（第 515-543 行）：将 `q.answer` 替换为 `record.correct`，将 `q.explanation` 替换为 `record.explanation`

### 不改动的部分

- 后端 `Question` 接口定义不变（ProgressService 内部仍需完整字段做校验）
- `SqliteArticleRepository` 不变（数据库读写需完整字段）
- `ProgressService.submitArticleProgress()` 内部的逐题校验逻辑不变
- `routes/articles.ts` 的 `user_progress` 逻辑不变（历史进度答案属于用户已见过的数据）
