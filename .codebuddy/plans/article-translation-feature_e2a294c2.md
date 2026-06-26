---
name: article-translation-feature
overview: 在阅读答案解析页面上方添加"文章翻译"区域，按段落逐行中英文对照展示，中文可一键开关。翻译由 DeepSeek 在文章导入时生成并入库。
todos:
  - id: schema-translation
    content: 数据库 schema 变更：articles 表新增 content_translation 列，更新 schema.sql 和数据库初始化逻辑
    status: completed
  - id: deepseek-translate
    content: DeepSeekService 新增 translateContent 方法：接收 HTML 内容，去标签、分段后调用 DeepSeek 翻译为中文，返回 JSON 字符串
    status: completed
  - id: enriched-article-interface
    content: 扩展 EnrichedArticle 接口和 insertArticle 参数：增加 contentTranslation 字段，穿透整个导入管线
    status: completed
  - id: repo-insert-update
    content: SqliteArticleRepository.insertArticle 支持存储 content_translation 列
    status: completed
    dependencies:
      - schema-translation
      - enriched-article-interface
  - id: import-pipeline-translate
    content: ArticleImportService 管线增加翻译阶段：enrich 之后、入库之前调用 translateContent
    status: completed
    dependencies:
      - deepseek-translate
      - enriched-article-interface
  - id: api-return-translation
    content: 文章详情 API 返回 content_translation 字段：ArticleService.getArticleById 读取并透传
    status: completed
    dependencies:
      - repo-insert-update
  - id: frontend-types-api
    content: 前端类型定义和 API 响应更新：ArticleDetail 接口增加 content_translation，API 响应类型对齐
    status: completed
    dependencies:
      - api-return-translation
  - id: frontend-translation-ui
    content: ReadingDetail 答题结果页增加翻译区域：解析 content_translation JSON，段落对照渲染，中文开关切换，置于题目解析上方
    status: completed
    dependencies:
      - frontend-types-api
---

## 用户需求

在阅读答案解析页面，增加"文章翻译"功能，实现逐段中英文对照显示，中文翻译支持一键开关切换，功能模块放置于"题目解析"区域上方。

## 产品概述

在用户提交阅读理解题后，结果页面除现有的得分卡片和题目解析外，新增文章翻译区域。翻译在文章导入时由 DeepSeek 预生成，以段落级中英文对照形式呈现，用户可切换中文翻译的显示/隐藏。

## 核心功能

- 文章导入时由 DeepSeek 预生成段落级中文翻译，存入数据库
- 答案解析页面展示逐段中英文对照（英文原文 + 中文翻译）
- 一键开关切换中文翻译的显示与隐藏
- 翻译区域位于题目解析上方
- 无翻译数据的旧文章不显示该区域（优雅降级）

## 技术选型

- 后端框架：Express + TypeScript（已有）
- 数据库：SQLite / node:sqlite（已有）
- AI 翻译：DeepSeek API（已有 `deepseekService.ts`）
- 前端框架：React 18 + TypeScript + Ant Design 5（已有）

## 实现方案

### 总体策略

将文章翻译作为 DeepSeek 加工管线的第三步（在 questions/words 之后），与现有 enrich 流程解耦为独立 API 调用，避免单次调用 token 超限。翻译结果以 JSON 字符串形式存入 articles 表的 `content_translation` 列，前端解析后渲染。

### 关键设计决策

1. **翻译粒度选择段落级**：文章 content 是 HTML 段落格式（`<p>` 标签），按段落拆分翻译最自然。每段一个 `{text, translation}` 对，前端逐段对照展示。

2. **翻译与 enrich 分离为独立 API 调用**：当前 enrich（questions+words）单次调用已接近 token 限制，合并翻译会导致 JSON 截断。独立调用可复用现有容错机制（`tryRepairTruncatedJson`），且翻译失败不影响 questions/words。

3. **预生成而非实时翻译**：翻译在文章导入时生成并持久化，阅读时不调用 AI API，确保页面加载速度。

4. **存储为 JSON TEXT 列**：在 articles 表新增 `content_translation TEXT DEFAULT ''` 列，存储 `[{text, translation}]` JSON 数组，无需新建关联表。

### 性能分析

- 翻译 API 调用：每篇文章一次独立 DeepSeek 调用，耗时约 3-8 秒
- 前端渲染：JSON 解析后逐段渲染，O(n) 复杂度，n 为段落数（通常 5-20 段）
- 翻译 JSON 大小：每段约 200-500 字符，10 段约 5KB，对 SQLite 无压力

## 实现要点

### 数据结构

翻译 JSON 格式（存入 articles.content_translation）：

```
[
  {"text": "Environmental groups have largely praised the treaty...", "translation": "环保组织普遍赞扬了该条约..."},
  {"text": "A treaty is only as strong as its implementation...", "translation": "条约的力量取决于其执行力度..."}
]
```

### 现有模式复用

- `tryRepairTruncatedJson` 函数可直接复用于翻译 JSON 解析容错
- `deepseekService.ts` 的 OpenAI client 实例复用，新增 `translateContent` 方法
- `articleImportService.ts` 的降级模式：翻译失败不影响文章入库
- `ReadingDetail.tsx` 的 `Card` 组件模式复用于翻译区域

### 错误处理

- 翻译 API 失败：文章正常入库，`content_translation` 为空字符串
- JSON 解析失败：复用截断修复逻辑，能救多少救多少
- 前端：`content_translation` 为空时不渲染翻译区域

## 计划生成使用的 Agent Extensions

### Skill

- **writing-plans**
- 用途：本任务涉及多文件修改（后端 schema、service、repository、route + 前端 type、api、page），需要系统化方案设计
- 预期结果：生成涵盖所有修改点的完整执行计划
