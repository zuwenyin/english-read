---
name: fix-article-answer-leak
overview: 修复 `/api/articles/:id` 接口泄露题目正确答案的问题，在返回给前端前脱敏 questions 中的 answer 和 explanation 字段。
todos:
  - id: strip-answer-from-detail
    content: 在 ArticleService.getArticleById() 返回前剔除 questions 中的 answer 和 explanation 字段，仅保留 id、question、options
    status: pending
---

## 问题描述

`/api/articles/:id` 接口返回的 `questions` 数组中直接暴露了 `answer`（正确答案）和 `explanation`（中文解释）字段，导致前端在答题前即可获取正确答案，破坏了答题的测验性质。

## 修复目标

在文章详情接口返回数据前，对 `questions` 数组做脱敏处理：仅保留 `id`、`question`、`options` 三个字段，移除 `answer` 和 `explanation`。

## 背景说明

答案校验已在服务端独立完成（`ProgressService.submitArticleProgress()` 从数据库重新获取文章后逐题比对），前端不需要也不应该拿到正确答案。这是一个纯后端数据脱敏改动。

## 技术方案

### 修改位置

**唯一修改文件**：`packages/backend/src/services/articleService.ts`

**修改方法**：`getArticleById()`（第 41-59 行）

### 实现方式

在 `getArticleById()` 的 return 语句中，对 `article.questions` 做 map 转换，每条 question 只保留 `id`、`question`、`options`：

```typescript
return {
  ...article,
  questions: article.questions.map((q) => ({
    id: q.id,
    question: q.question,
    options: q.options,
  })),
  article_words: articleWords,
  content_translation: article.content_translation,
};
```

### 不改动的部分

- `Question` 接口定义保持不变（`ProgressService` 仍需完整字段做校验）
- `SqliteArticleRepository` 保持不变（数据库读写需要完整字段）
- `ProgressService.submitArticleProgress()` 保持不变（它自己调用 `articleRepo.getArticleById()` 获取完整 question 数据）

### 影响范围

- 仅影响 `GET /api/articles/:id` 返回给前端的 questions 结构
- 后端内部（progressService）不受影响，因为它直接调 repository
- 前端 `ReadingDetail.tsx` 的 questions 渲染不再依赖 `answer`/`explanation` 字段（这些字段原本在答题后由 progress 接口返回）
