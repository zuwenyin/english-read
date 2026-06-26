---
name: sync-tech-doc-to-current-state
overview: 将 technical-design.md 文档同步更新为与当前项目实际代码一致，涵盖 AI 服务、内容抓取管线、Admin 模块、数据库 Schema、新增依赖、页面和路由等所有差异。
todos:
  - id: update-doc-header-status
    content: 更新文档头部状态（待开发→开发中）及创建/更新时间戳
    status: completed
  - id: update-tech-stack
    content: 更新第三节技术栈：前端测试框架 Jest→Vitest，后端补充新增依赖（cheerio/openai/node-cron/rss-parser/swagger-/winston）
    status: completed
  - id: update-db-schema
    content: 更新第五节数据库设计：articles 表新增 source/content_translation 字段，user_article_progress 新增 attempt 字段，补充迁移说明
    status: completed
  - id: update-api-list
    content: 更新第七节 API 设计：补充 4 个 Admin 接口到列表表格，新增 Admin 接口详细设计
    status: completed
    dependencies:
      - update-db-schema
  - id: update-directory-pages
    content: 更新第八节目录结构和第十节页面设计：补充新增文件和新增页面（ReadingResult/Admin/WordBookContext）
    status: completed
  - id: add-new-sections
    content: 新增章节：DeepSeek AI 服务、内容抓取管线、定时调度器、Admin 后台、Swagger 文档、Winston 日志、环境变量
    status: completed
    dependencies:
      - update-tech-stack
      - update-db-schema
      - update-api-list
---

## 需求概述

将 `prod/technical-design.md` 与当前项目实际代码状态进行同步，更新所有已确认的差异项。

## 更新范围

文档共约 1050 行，需更新约 10 个章节，涵盖 14 类差异：

- 文档状态：&quot;待开发&quot; → &quot;开发中&quot;
- DeepSeek AI 服务：补充自动生成阅读理解题、生词标注、句子级中英翻译功能
- 内容抓取管线：补充 5 个外部内容源（Breaking News / China Daily / Gutenberg / NewsAPI / Wikipedia）及 Pipeline 编排
- 定时调度器：补充 node-cron 每天 8:00 自动拉取机制，CRON_ENABLED 环境变量控制
- Admin 后台模块：补充 4 个 API 接口及前端 /admin 页面（文档原说&quot;初期不做&quot;）
- Swagger API 文档：补充 swagger-jsdoc + swagger-ui-express 实现
- Winston 日志：补充结构化日志及 LOG_LEVEL 配置
- 数据库 Schema 迁移：补充 5 次迁移新增的 summary / source / content_translation / attempt 字段
- 新增依赖：cheerio、openai、node-cron、rss-parser、swagger-jsdoc、swagger-ui-express、winston
- 前端测试框架：Jest → Vitest
- 新增前端页面：ReadingResult（/reading/:id/result）、Admin（/admin）
- WordBookContext 状态管理
- 新增环境变量：DB_PATH、LOG_LEVEL、DEEPSEEK_API_KEY、NEWSAPI_KEY、CRON_ENABLED
- API 列表补充：4 个 Admin 接口 + content_translation 字段说明

## 实现策略

直接编辑 `d:\TraeWorkSpace\english-read\prod\technical-design.md`，按章节顺序逐一更新差异项。遵循文档现有格式风格（Markdown 表格、代码块、编号列表），保持与原文一致的排版和表述语调。

## 关键更新点

### 1. 文档头部状态

将第 4 行 `> 状态：待开发` 改为 `> 状态：开发中`

### 2. 技术栈选型（第三节 3.3 / 3.4）

- 前端 3.3 表格：测试框架 Jest → Vitest
- 后端 3.4：在表格下方新增依赖说明段落，列出新增依赖及用途（DeepSeek AI、内容抓取、调度、日志、Swagger）

### 3. 系统架构（第四节）

在架构图下方补充 Admin 模块、Scheduler 调度器、Swagger 文档服务、Logger 等新增组件的说明

### 4. 数据库设计（第五节）

- articles 表新增字段：`source` TEXT（来源）、`content_translation` TEXT（段落级翻译 JSON）
- user_article_progress 表新增 `attempt` INTEGER 字段，UNIQUE 约束改为 `(user_id, article_id, attempt)`
- 补充迁移记录说明

### 5. API 设计（第七节）

- 7.4 API 列表表格新增 4 行 Admin 接口
- 补充 7.5.17 GET /api/articles/:id/words 接口
- 新增 7.5.18~7.5.21 Admin 接口详细设计

### 6. 目录结构（第八节）

补充 content-fetchers/、scheduler.ts、deepseekService.ts、Admin.tsx、WordBookContext.tsx、swagger.ts、logger.ts 等新增文件

### 7. 前端页面（第十节）

新增 ReadingResult 页面（10.10）、Admin 页面（10.11）

### 8. 新增章节

- **DeepSeek AI 服务**：自动题目生成、生词标注、句子翻译，批量策略（每 2 篇/次 API 调用）
- **内容抓取管线**：ContentFetcher 接口、5 个内容源、Pipeline 编排流程
- **定时调度器**：node-cron 每天 8:00 触发，CRON_ENABLED 控制
- **Admin 后台**：4 个 API 功能说明
- **日志系统**：Winston 结构化日志
- **环境变量**：新增的 5 个变量说明

## 实现注意事项

- 保持文档 Markdown 格式风格一致（表头对齐、缩进、代码块格式）
- 新增章节放在文档最后（按编号顺序增值）
- 不要修改已有正确内容，仅在对应位置插入/追加差异内容
- 更新后的文档应作为完整的技术参考，替代原有描述
