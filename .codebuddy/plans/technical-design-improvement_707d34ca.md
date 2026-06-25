---
name: technical-design-improvement
overview: 针对 technical-design.md 中发现的 15 个问题，逐一提出改进方案并直接更新文件，包括：熟识度改为5级、补全API请求/响应格式、定义题目JSON schema、新增邮箱字段、明确生词标注逻辑、完善进度表设计、定义测试规则、新增搜索功能、补充事务/缓存/测试/部署等方案。
todos:
  - id: update-database-design
    content: 更新数据库设计：统一熟识度5级、新增email字段、定义questions schema、新增article_words表、更新user_article_progress表
    status: completed
  - id: update-api-design
    content: 补充API设计：统一响应格式、分页参数、JWT鉴权标记、错误码、新增搜索API
    status: completed
    dependencies:
      - update-database-design
  - id: add-api-details
    content: 新增API详细设计章节：为每个接口提供完整Request/Response示例
    status: completed
    dependencies:
      - update-api-design
  - id: update-core-features
    content: 更新核心功能：熟识度5级、搜索功能、测试规则、生词标注逻辑
    status: completed
  - id: update-page-design
    content: 更新页面设计：熟识度5个按钮、注册页新增邮箱、手机端Tab导航
    status: completed
    dependencies:
      - update-core-features
  - id: add-new-sections
    content: 新增章节：缓存策略、测试策略、部署方案
    status: completed
    dependencies:
      - update-api-details
  - id: update-implementation-notes
    content: 更新实施注意事项：seed脚本设计、降级方案、事务支持
    status: completed
    dependencies:
      - add-new-sections
  - id: verify-consistency
    content: 验证文档一致性和完整性，确保全部15个问题已修复
    status: completed
    dependencies:
      - update-implementation-notes
---

## 产品概述

改进英文学习平台的技术文档（prod/technical-design.md），修复15个设计问题，使文档完整可实施。

## 核心功能

- 统一熟识度字段为5级（1-5），按钮相应改为5个
- 补充完整API设计（请求/响应格式、分页参数、JWT鉴权标记、统一错误格式）
- 定义 articles.questions JSON schema
- 完善数据库设计（users表新增email字段、新增article_words表、更新user_article_progress表）
- 明确文章生词标注逻辑（文章预标注 + 用户进度叠加）
- 补充搜索功能（单词搜索、文章搜索）
- 补充单词测试规则（每次20题、随机抽取、支持重复）
- 新增缓存策略章节（词书/文章列表缓存）
- 新增测试策略章节（Jest + React Testing Library + Playwright）
- 新增部署方案章节（Docker + GitHub Actions）
- 补充Web Speech API降级方案
- 补充响应式设计细节（手机端底部Tab导航具体路由）
- 补充seed脚本设计（数据格式、执行方式）
- 补充Repository事务支持说明

## 改进方案

直接编辑 `d:\TraeWorkSpace\english-read\prod\technical-design.md` 文件，按照以下顺序逐节改进：

### 1. 数据库设计改进（Section 5）

- 5.1 users表：新增 `email TEXT UNIQUE NOT NULL` 字段
- 5.3 words表：确认 difficulty 1-5 合理
- 5.4 articles表：定义 `questions` 字段的 JSON schema
- 5.5 user_word_progress表：将 `familiarity` 改为 INTEGER 1-5，新增 `review_count` 字段，添加唯一约束说明
- 5.6 user_article_progress表：新增 `answers JSON` 字段存储答题记录
- 新增 5.7 article_words表：文章生词预标注表

### 2. API设计改进（Section 7）

- 补充统一响应格式（成功/错误）
- 标注JWT鉴权接口（🔒标记）
- 列表接口添加分页参数（page, pageSize）
- 定义错误码规范
- 新增搜索API（/api/words/search, /api/articles/search）
- 新增用户资料API（/api/auth/profile）

### 3. 新增API详细设计章节

- 为每个API提供完整的Request/Response示例
- 明确Query Parameters和Path Parameters

### 4. 核心功能改进（Section 2）

- 2.3 单词模块：更新熟识度为5级，补充搜索功能
- 2.4 阅读模块：明确生词标注逻辑

### 5. 页面设计改进（Section 10）

- 10.4 单词学习页：按钮改为5个（忘记/模糊/一般/熟悉/精通）
- 10.2 注册页：新增邮箱输入框
- 补充手机端底部Tab导航设计（首页/单词/阅读/我的）

### 6. 响应式设计改进（Section 11）

- 补充手机端Tab导航的路由映射

### 7. 新增章节

- 缓存策略（Cache Strategy）
- 测试策略（Testing Strategy）
- 部署方案（Deployment Plan）

### 8. 技术决策改进（Section 12）

- 新增：参数校验选用Zod（与TypeScript集成更好）
- 新增：缓存策略决策

### 9. 实施注意事项改进（Section 13）

- 补充seed脚本设计（数据格式、执行方式）
- 补充Web Speech API降级方案
- 补充事务支持说明
- 补充初期数据来源说明

## 实施注意事项

- 保持文档格式一致性（表格、代码块、标题层级）
- 确保所有修改相互一致（如数据库字段与API响应对应）
- 新增章节的编号需要重新整理
