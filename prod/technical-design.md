# 英文学习平台 - 技术方案文档

> 创建时间：2026-06-24  
> 状态：待开发

---

## 一、产品概述

英文学习平台，支持**小学、初中、高中、大学**四个年级阶段，每个阶段对应不同难度。包含**单词**和**阅读**两大核心模块，支持 PC 和手机端响应式访问，用户注册登录后保存学习进度。

---

## 二、核心功能

### 2.1 年级选择

- 小学、初中、高中、大学四个阶段
- 切换阶段后加载对应难度内容

### 2.2 用户系统

- 注册（用户名 + 邮箱 + 密码）、登录
- 学习进度保存（单词熟识度、文章阅读记录、测试成绩）
- 密码重置：初期不支持自助找回，忘记密码请联系管理员重置

### 2.3 单词模块

- **单词搜索**：支持按英文或中文搜索单词
- **单词卡片背诵**：扇贝风格，滑动翻页，标记熟识度（忘记/模糊/一般/熟悉/精通，共5级）
- **单词选择题测试**：每次20题，从当前词书随机抽取，四选一，即时反馈，完成后显示得分和错题回顾
- **单词发音跟读**：Web Speech API，支持重复播放；不支持的浏览器显示音标供用户自查

### 2.4 阅读模块

- **分级阅读文章浏览**：按年级阶段和类型（故事/新闻）筛选，支持关键词搜索
- **阅读理解题**：阅读文章后答题，提交后显示解析
- **文章生词标注与点击查词**：文章预标注生词（蓝色下划线）+ 用户进度叠加（familiarity≤2的单词也高亮），点击弹出气泡显示释义和发音

### 2.5 响应式布局

- 一套代码适配 PC 和手机端
- 手机端底部 Tab 导航：首页 / 单词 / 阅读 / 我的

### 2.6 单词测试规则

- 每次测试 **20 题**，从当前词书的单词中随机抽取
- 支持**重复测试**同一词书
- 测试范围：当前词书的所有单词（不区分熟识度）
- 结果页显示得分、正确率、错题列表（单词 + 正确释义）

---

## 三、技术栈选型

### 3.1 包管理器

- **pnpm**：高效磁盘空间利用，严格依赖管理，适合 monorepo

### 3.2 Monorepo 架构

- **pnpm workspaces**：管理多 package 工作区（参考 Vue3、Vite 等主流项目，不使用 Turborepo）

### 3.3 前端（packages/frontend）

| 技术        | 选型                       | 说明                            |
| ----------- | -------------------------- | ------------------------------- |
| 框架        | React 18 + TypeScript      |                                 |
| 构建工具    | Vite 5                     |                                 |
| UI 组件库   | Ant Design 5               | 通过 wrapper 封装减少强绑定     |
| 路由        | React Router v6            |                                 |
| HTTP 客户端 | Axios                      | 封装为 apiClient，方便替换      |
| 状态管理    | React Context + useReducer | 轻量，适合初期                  |
| 数据缓存    | @tanstack/react-query      | 缓存 API 请求结果，减少重复请求 |

### 3.4 后端（packages/backend）

| 技术         | 选型                         | 说明                                       |
| ------------ | ---------------------------- | ------------------------------------------ |
| 运行时       | Node.js                      |                                            |
| 框架         | Express + TypeScript         |                                            |
| 数据库适配层 | Repository 模式              | 接口与实现分离，方便切换数据库             |
| 初期数据库   | SQLite（node:sqlite 内置）   | 零依赖、免编译，Node.js 22+ 内置           |
| 密码加密     | bcryptjs（salt rounds = 10） | 纯 JS 实现，无需编译，API 与 bcrypt 兼容   |
| 鉴权         | jsonwebtoken（JWT）          | 无 session 依赖，适合 SPA                  |
| 参数校验     | Zod                          | 与 TypeScript 集成好，支持 schema 推导类型 |

### 3.5 前端 Linter 工具链

| 工具        | 选型                                              | 说明                                            |
| ----------- | ------------------------------------------------- | ----------------------------------------------- |
| ESLint      | ESLint + @typescript-eslint + eslint-plugin-react | TypeScript + React 代码规范                     |
| Prettier    | prettier + eslint-config-prettier                 | 统一代码格式，解决与 ESLint 规则冲突            |
| Git Hook    | Husky + lint-staged                               | 提交前自动运行 eslint --fix 和 prettier --write |
| Commit 规范 | Commitlint + Commitizen                           | Conventional Commits 格式                       |

---

## 四、系统架构

```
┌─────────────────────────────────────────────┐
│            Browser (PC & Mobile)            │
└──────────────────┬──────────────────────────┘
                   │ HTTPS / REST API
┌──────────────────▼──────────────────────────┐
│        React SPA (Ant Design)               │
│  packages/frontend                          │
└──────────────────┬──────────────────────────┘
                   │ Axios (apiClient)
┌──────────────────▼──────────────────────────┐
│        Express Backend API                  │
│  packages/backend                           │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │        Routes / Controllers         │    │
│  └──────────────┬──────────────────────┘    │
│  ┌──────────────▼──────────────────────┐    │
│  │     Service Layer (业务逻辑)        │    │
│  └──────────────┬──────────────────────┘    │
│  ┌──────────────▼──────────────────────┐    │
│  │   Repository Interface (接口定义)   │    │
│  └──────────────┬──────────────────────┘    │
│  ┌──────────────▼──────────────────────┐    │
│  │  SQLiteAdapter (初期实现)           │    │
│  │  MySQLAdapter  (预留)               │    │
│  │  MongoAdapter   (预留)               │    │
│  └─────────────────────────────────────┘    │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│         SQLite (初期) / MySQL (后续)         │
└─────────────────────────────────────────────┘
```

---

## 五、数据库设计（逻辑模型）

### 5.1 users 表 — 用户账号

| 字段          | 类型                 | 说明                 |
| ------------- | -------------------- | -------------------- |
| id            | INTEGER PK           | 用户ID               |
| username      | TEXT UNIQUE          | 用户名               |
| email         | TEXT UNIQUE NOT NULL | 邮箱（用于通知）     |
| password_hash | TEXT                 | 加密密码（bcryptjs） |
| created_at    | DATETIME             | 注册时间             |

### 5.2 word_books 表 — 词书（按年级阶段）

| 字段        | 类型       | 说明                                      |
| ----------- | ---------- | ----------------------------------------- |
| id          | INTEGER PK | 词书ID                                    |
| name        | TEXT       | 词书名                                    |
| level       | TEXT       | 对应阶段（primary/junior/senior/college） |
| description | TEXT       | 描述                                      |

### 5.3 words 表 — 单词

| 字段             | 类型       | 说明         |
| ---------------- | ---------- | ------------ |
| id               | INTEGER PK | 单词ID       |
| word_book_id     | INTEGER FK | 所属词书     |
| word             | TEXT       | 英文单词     |
| phonetic         | TEXT       | 音标         |
| translation      | TEXT       | 中文释义     |
| example_sentence | TEXT       | 例句         |
| difficulty       | INTEGER    | 难度等级 1-5 |

### 5.4 articles 表 — 阅读文章

| 字段       | 类型       | 说明                                                      |
| ---------- | ---------- | --------------------------------------------------------- |
| id         | INTEGER PK | 文章ID                                                    |
| title      | TEXT       | 标题                                                      |
| content    | TEXT       | 文章内容（HTML，生词用 `<mark class="vocabulary">` 标注） |
| summary    | TEXT       | 文章简介（列表页展示，约 100 字符）                       |
| level      | TEXT       | 对应阶段（primary/junior/senior/college）                 |
| category   | TEXT       | 类型（story/news）                                        |
| questions  | JSON       | 阅读理解题（Schema 见下方）                               |
| created_at | DATETIME   | 创建时间                                                  |

**questions 字段 JSON Schema：**

```json
[
  {
    "id": 1,
    "question": "题目文本",
    "options": ["选项A", "选项B", "选项C", "选项D"],
    "answer": "B",
    "explanation": "解析文本"
  }
]
```

### 5.5 user_word_progress 表 — 单词学习进度

| 字段          | 类型              | 说明                                                 |
| ------------- | ----------------- | ---------------------------------------------------- |
| id            | INTEGER PK        | 记录ID                                               |
| user_id       | INTEGER FK        | 用户ID                                               |
| word_id       | INTEGER FK        | 单词ID                                               |
| familiarity   | INTEGER           | 熟识度 1-5（1=忘记，2=模糊，3=一般，4=熟悉，5=精通） |
| review_count  | INTEGER DEFAULT 0 | 复习次数                                             |
| last_reviewed | DATETIME          | 上次复习时间                                         |
| created_at    | DATETIME          | 首次学习时间                                         |

**唯一约束**：`(user_id, word_id)` 联合唯一，确保一个用户对同一单词只有一条进度记录。

### 5.6 user_article_progress 表 — 文章阅读进度

| 字段         | 类型       | 说明                      |
| ------------ | ---------- | ------------------------- |
| id           | INTEGER PK | 记录ID                    |
| user_id      | INTEGER FK | 用户ID                    |
| article_id   | INTEGER FK | 文章ID                    |
| answers      | JSON       | 答题明细（Schema 见下方） |
| completed_at | DATETIME   | 完成时间                  |

> **校验策略**：`quiz_score` 不再单独存储，通过 `answers` 明细实时计算正确率。提交答案时，后端查询文章 `questions` JSON 逐个比对，自行计算 `is_correct`，不信任前端传入的 `correct`/`is_correct` 字段。

**answers 字段 JSON Schema：**

```json
[
  {
    "question_id": 1,
    "selected": "B",
    "correct": "B",
    "is_correct": true
  }
]
```

> 注意：`correct` 和 `is_correct` 由后端校验后填入，前端请求时只需传 `question_id` + `selected`。

````

### 5.7 article_words 表 — 文章生词预标注

| 字段        | 类型       | 说明                                    |
| ----------- | ---------- | --------------------------------------- |
| id          | INTEGER PK | 记录ID                                  |
| article_id  | INTEGER FK | 文章ID                                  |
| word        | TEXT       | 生词原文（与 content 中标注的单词匹配） |
| translation | TEXT       | 中文释义                                |
| phonetic    | TEXT       | 音标（可选）                            |

> **生词标注逻辑**：文章中的生词通过 `article_words` 表预标注，同时结合用户的 `user_word_progress` 记录（familiarity ≤ 2 的单词也视为生词），两者叠加展示。

---

## 六、数据库适配层设计（核心解耦方案）

采用 **Repository 模式**，所有数据访问通过接口进行，具体实现可替换。

### 6.1 接口定义

- `IUserRepository.ts` — 用户数据访问接口
- `IWordRepository.ts` — 单词数据访问接口
- `IArticleRepository.ts` — 文章数据访问接口
- `IProgressRepository.ts` — 学习进度数据访问接口（单词进度 + 文章进度）

### 6.2 实现

- `repositories/sqlite/` — SQLite 实现（初期）
- `repositories/mysql/` — MySQL 实现（预留）
- `repositories/mongodb/` — MongoDB 实现（预留）

### 6.3 切换数据库

只需修改配置文件中的 `DB_TYPE` 字段，无需改动业务代码。

---

## 七、后端 API 设计

### 7.1 统一响应格式

**成功响应：**

```json
{
  "code": 0,
  "message": "success",
  "data": { ... }
}
````

**错误响应：**

```json
{
  "code": 40001,
  "message": "错误描述",
  "data": null
}
```

### 7.2 错误码规范

| 错误码 | 说明                |
| ------ | ------------------- |
| 0      | 成功                |
| 40001  | 参数校验失败        |
| 40101  | 未登录 / Token 过期 |
| 40301  | 无权限              |
| 40401  | 资源不存在          |
| 50001  | 服务器内部错误      |

### 7.3 分页参数

列表接口支持分页，参数通过 Query String 传递：

| 参数     | 类型   | 默认值 | 说明                 |
| -------- | ------ | ------ | -------------------- |
| page     | number | 1      | 页码（从 1 开始）    |
| pageSize | number | 20     | 每页条数（最大 100） |

分页响应中 `data` 格式：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "list": [ ... ],
    "total": 100,
    "page": 1,
    "pageSize": 20
  }
}
```

### 7.4 API 列表

🔒 = 需要 JWT 鉴权（请求头带 `Authorization: Bearer <token>`）

| 方法                                                                                        | 路径                        | 说明                                                               | 鉴权 |
| ------------------------------------------------------------------------------------------- | --------------------------- | ------------------------------------------------------------------ | ---- |
| POST                                                                                        | /api/auth/register          | 用户注册                                                           | 否   |
| POST                                                                                        | /api/auth/login             | 用户登录                                                           | 否   |
| GET                                                                                         | /api/auth/profile           | 获取当前用户资料                                                   | 🔒   |
| PUT                                                                                         | /api/auth/profile           | 更新用户资料（邮箱/密码）                                          | 🔒   |
| GET                                                                                         | /api/stats/overview         | 获取学习统计概览（已学单词数、已读文章数、平均成绩、本周学习时长） | 🔒   |
| GET                                                                                         | /api/progress/recent        | 获取最近学习记录（最近词书/文章，各取 3 条）                       | 🔒   |
| GET                                                                                         | /api/word-books             | 获取词书列表（按阶段筛选）                                         | 🔒   |
| GET                                                                                         | /api/words/:bookId          | 获取词书单词列表（支持分页）                                       | 🔒   |
| GET                                                                                         | /api/words/search           | 搜索单词（按英文或中文）                                           | 🔒   |
| **注意**：`/search` 路由必须注册在 `/:bookId` 之前，避免被 Express 误匹配为 `bookId=search` |
| POST                                                                                        | /api/progress/word          | 更新单词熟识度                                                     | 🔒   |
| GET                                                                                         | /api/progress/words/:bookId | 获取用户单词进度                                                   | 🔒   |
| GET                                                                                         | /api/articles               | 获取文章列表（按阶段/类型/关键词筛选，支持分页）                   | 🔒   |
| GET                                                                                         | /api/articles/:id           | 获取文章详情（含 questions、article_words、user_progress）         | 🔒   |
| GET                                                                                         | /api/articles/search        | 搜索文章（按标题或内容关键词）                                     | 🔒   |
| **注意**：`/search` 路由必须注册在 `/:id` 之前                                              |
| POST                                                                                        | /api/progress/article       | 提交文章阅读进度/答题结果                                          | 🔒   |
| POST                                                                                        | /api/cache/clear            | 清除后端缓存（内部接口，seed 脚本调用）                            | 🔒   |

### 7.5 API 详细设计

#### 7.5.1 POST /api/auth/register — 用户注册

**Request Body：**

```json
{
  "username": "string",
  "email": "string",
  "password": "string"
}
```

**Response：**

```json
{
  "code": 0,
  "message": "注册成功",
  "data": {
    "id": 1,
    "username": "xxx",
    "email": "xxx"
  }
}
```

#### 7.5.2 POST /api/auth/login — 用户登录

**Request Body：**

```json
{
  "username": "string",
  "password": "string"
}
```

**Response：**

```json
{
  "code": 0,
  "message": "登录成功",
  "data": {
    "token": "eyJhbG...",
    "user": {
      "id": 1,
      "username": "xxx",
      "email": "xxx"
    }
  }
}
```

#### 7.5.3 GET /api/word-books — 获取词书列表

**Query Parameters：**
| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| level | string | 否 | 阶段筛选（primary/junior/senior/college） |

**Response：**

```json
{
  "code": 0,
  "message": "success",
  "data": [
    {
      "id": 1,
      "name": "小学英语词汇",
      "level": "primary",
      "word_count": 500,
      "description": "..."
    }
  ]
}
```

#### 7.5.4 GET /api/words/:bookId — 获取词书单词列表

**Query Parameters：**
| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| page | number | 否 | 页码 |
| pageSize | number | 否 | 每页条数 |

**Response：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "list": [
      {
        "id": 1,
        "word": "apple",
        "phonetic": "/ˈæpl/",
        "translation": "苹果",
        "example_sentence": "I eat an apple every day.",
        "difficulty": 1
      }
    ],
    "total": 500,
    "page": 1,
    "pageSize": 20
  }
}
```

#### 7.5.5 GET /api/words/search — 搜索单词

**Query Parameters：**
| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| keyword | string | 是 | 搜索关键词（英文或中文） |
| bookId | number | 否 | 限定词书范围 |

**Response：**（同 7.5.4，返回匹配的单词列表）

#### 7.5.6 POST /api/progress/word — 更新单词熟识度

**Request Body：**

```json
{
  "word_id": 1,
  "familiarity": 3
}
```

**Response：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "familiarity": 3,
    "review_count": 1,
    "last_reviewed": "2026-06-24T12:00:00Z"
  }
}
```

#### 7.5.7 GET /api/articles — 获取文章列表

**Query Parameters：**
| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| level | string | 否 | 阶段筛选 |
| category | string | 否 | 类型筛选（story/news） |
| keyword | string | 否 | 关键词搜索 |
| page | number | 否 | 页码 |
| pageSize | number | 否 | 每页条数 |

**Response：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "list": [
      {
        "id": 1,
        "title": "A Day at School",
        "summary": "Tom goes to school on Monday...",
        "level": "primary",
        "category": "story",
        "created_at": "2026-06-24"
      }
    ],
    "total": 50,
    "page": 1,
    "pageSize": 20
  }
}
```

#### 7.5.8 GET /api/articles/:id — 获取文章详情

**Response：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "title": "A Day at School",
    "content": "<p>Today is <mark class=\"vocabulary\" data-word=\"Monday\">Monday</mark>...</p>",
    "level": "primary",
    "category": "story",
    "questions": [ ... ],  // 见 articles 表 questions Schema
    "article_words": [     // 文章预标注生词
      { "word": "Monday", "translation": "星期一", "phonetic": "/ˈmʌndeɪ/" }
    ],
    "created_at": "2026-06-24",
    "user_progress": {
      "answers": [ ... ],  // 用户上次答题明细，首次阅读为 null
      "completed_at": "2026-06-24T12:00:00Z"
    }
  }
}
```

#### 7.5.9 POST /api/progress/article — 提交文章阅读进度

**Request Body：**

```json
{
  "article_id": 1,
  "answers": [
    {
      "question_id": 1,
      "selected": "B"
    }
  ]
}
```

> **校验策略**：后端严格校验，Service 层查询文章 `questions` JSON 中的正确答案，逐个比对 `selected` 与 `answer`，自行计算 `is_correct`。前端无需（也不应）传递 `correct`/`is_correct` 字段。
> `quiz_score` 由后端通过校验后的 `answers` 明细计算，前端无需传递。

**Response：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "quiz_score": 80, // 后端计算：正确率 × 100
    "completed_at": "2026-06-24T12:00:00Z"
  }
}
```

#### 7.5.10 GET /api/stats/overview — 获取学习统计概览

> 为首页学习概览（10.1 节）和 个人中心页（10.9 节）提供数据。

**Response：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "total_words_learned": 120, // 已学单词数（familiarity ≥ 1 的单词数）
    "total_articles_read": 8, // 已读文章数
    "avg_quiz_score": 85, // 平均成绩（所有文章答题正确率的平均值，0-100）
    "weekly_study_minutes": 230 // 本周学习时长（分钟），基于 last_reviewed 和 completed_at 统计
  }
}
```

#### 7.5.11 GET /api/progress/recent — 获取最近学习记录

> 为个人中心页（10.9 节）的「最近学习」区提供数据。

**Response：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "recent_books": [
      {
        "id": 1,
        "name": "小学英语词汇",
        "level": "primary",
        "last_studied_at": "2026-06-24T10:00:00Z"
      }
    ],
    "recent_articles": [
      {
        "id": 1,
        "title": "A Day at School",
        "level": "primary",
        "category": "story",
        "last_read_at": "2026-06-23T15:00:00Z"
      }
    ]
  }
}
```

> 各取最近 3 条，基于 `user_word_progress.last_reviewed` 和 `user_article_progress.completed_at` 倒序查询。

#### 7.5.12 POST /api/cache/clear — 清除后端缓存

> 内部接口，供 seed 脚本调用，无需用户触发。

**Response：**

```json
{
  "code": 0,
  "message": "缓存已清除",
  "data": null
}
```

#### 7.5.13 GET /api/auth/profile — 获取当前用户资料

> 登录后获取个人资料，用于个人中心展示和表单回填。

**Response：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "username": "xxx",
    "email": "xxx@example.com",
    "created_at": "2026-06-24T12:00:00Z"
  }
}
```

#### 7.5.14 PUT /api/auth/profile — 更新用户资料

> 支持修改邮箱或密码，至少传一项。

**Request Body：**

```json
{
  "email": "new@example.com", // 可选
  "password": "newPassword123" // 可选
}
```

**Response：**

```json
{
  "code": 0,
  "message": "更新成功",
  "data": {
    "id": 1,
    "username": "xxx",
    "email": "new@example.com"
  }
}
```

#### 7.5.15 GET /api/progress/words/:bookId — 获取用户单词进度

> 返回指定词书中每个单词的熟识度，供单词学习页展示进度条。

**Response：**

```json
{
  "code": 0,
  "message": "success",
  "data": [
    {
      "word_id": 1,
      "familiarity": 3,
      "review_count": 2,
      "last_reviewed": "2026-06-24T12:00:00Z"
    }
  ]
}
```

> 未学过的单词不会出现在列表中（`user_word_progress` 无记录）。

#### 7.5.16 GET /api/articles/search — 搜索文章

> 与 7.5.7 列表接口结构相同，增加 `keyword` 参数（必填），匹配标题或内容。

**Query Parameters：**
| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| keyword | string | 是 | 搜索关键词（匹配标题或内容） |
| level | string | 否 | 阶段筛选 |
| category | string | 否 | 类型筛选 |
| page | number | 否 | 页码 |
| pageSize | number | 否 | 每页条数 |

**Response：** 同 7.5.7（分页文章列表，含 `summary` 字段）。

---

#### 7.5.17 GET /api/articles/:id/words — 获取文章生词列表

> 返回文章预标注的生词数据（`article_words` 表），供前端做生词高亮。

**Response：**

```json
{
  "code": 0,
  "message": "success",
  "data": [{ "id": 1, "word": "Monday", "translation": "星期一", "phonetic": "/ˈmʌndeɪ/" }]
}
```

---

## 八、Monorepo 目录结构

```
english-read/
├── package.json              # 根 pnpm 配置，workspaces 声明
├── pnpm-workspace.yaml       # pnpm 工作区配置
├── tsconfig.json             # 根 TypeScript 配置
├── packages/
│   ├── frontend/            # React 前端
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   ├── tsconfig.json
│   │   ├── index.html
│   │   └── src/
│   │       ├── main.tsx
│   │       ├── App.tsx
│   │       ├── api/         # API 客户端（axios 封装）
│   │       ├── components/  # 通用组件（Layout, antd-wrapper, AuthLayout）
│   │       ├── hooks/       # 自定义 Hook（useMediaQuery）
│   │       ├── pages/       # 页面组件（9 个页面）
│   │       ├── store/       # 状态管理（AuthContext）
│   │       ├── types/       # TypeScript 类型定义
│   │       └── styles/      # 全局样式
│   └── backend/             # Express 后端
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           ├── index.ts      # 入口
│           ├── routes/       # 路由/控制器
│           ├── services/     # 业务逻辑层
│           ├── repositories/ # 数据访问层（接口 + SQLite 实现）
│           ├── db/           # 种子数据脚本（seed.ts, article-seed.ts, seed-data.json）
│           ├── middleware/   # 中间件（auth, errorHandler）
│           ├── utils/        # 工具函数（cache, response, jwt）
├── prod/                    # 技术文档
└── docs/                    # 其他文档
```

---

## 九、前端 Linter 工具链详细配置

### 9.1 ESLint（TypeScript + React）

- 安装：`eslint`、`@typescript-eslint/eslint-plugin`、`@typescript-eslint/parser`、`eslint-plugin-react`、`eslint-plugin-react-hooks`、`eslint-config-prettier`、`eslint-plugin-prettier`
- 配置文件：`.eslintrc.cjs`，继承 `plugin:@typescript-eslint/recommended`、`plugin:react/recommended`、`plugin:react-hooks/recommended`、`plugin:prettier/recommended`
- 与 TypeScript 集成，检查类型安全和代码质量
- > 注：原计划使用 `eslint-config-antd`，但该包在 npm 上不存在，改为标准 TypeScript + React ESLint 组合

### 9.2 Prettier（代码格式化）

- 安装：`prettier`、`eslint-config-prettier`、`eslint-plugin-prettier`
- 配置文件：`.prettierrc`
- 使用 `eslint-config-prettier` 关闭 ESLint 中与 Prettier 冲突的规则

### 9.3 Husky + lint-staged（Git Hook）

- 安装：`husky`、`lint-staged`
- 配置 Husky pre-commit hook，触发 lint-staged
- lint-staged 配置：只对暂存区文件运行检查（提升提交速度）

### 9.4 Commitlint + Commitizen（Conventional Commits）

- 安装：`@commitlint/cli`、`@commitlint/config-conventional`、`commitizen`
- 配置文件：`commitlint.config.js`
- 使用 `commitizen` 交互式生成符合规范的 Commit Message

---

## 十、页面设计

### 10.1 首页（/）

首页根据用户是否选择年级阶段，展示两种状态：

**状态一：未选择年级（首次访问）**

- 顶部导航栏：Logo + 平台名称 + 登录/用户头像
- Hero 区块：欢迎语 + 平台简介，渐变蓝色背景
- 年级选择卡片区：4 张卡片（小学📘 / 初中📗 / 高中📕 / 大学📙）
- 卡片 hover 微缩放动画

**状态二：已选择年级**

- 顶部导航栏：Logo + 平台名称 + 当前年级标签 + 登录/用户头像
- 学习概览区：已学单词数、已读文章数、本周学习时长
- 推荐词书：当前年级阶段的词书列表（入口到 /words）
- 推荐文章：当前年级阶段的文章列表（入口到 /reading）

### 10.2 注册页（/register）

- 居中卡片式布局
- 用户名、邮箱、密码、确认密码输入框
- 邮箱格式校验、密码强度提示
- 「已有账号？去登录」链接

### 10.3 登录页（/login）

- 居中卡片式布局
- 用户名、密码输入框
- 「没有账号？去注册」链接
- 忘记密码：请联系管理员重置

### 10.4 词书市场页（/words）

- 顶部搜索栏：按词书名搜索
- 词书卡片列表：词书名、适用年级、单词总数、描述
- 「选择学习」按钮：选完后进入单词学习页（/words/learn/:bookId）
- 已选词书标记「当前学习」

### 10.5 单词学习页（/words/learn/:bookId）

- 顶部：当前词书名称 + 进度条
- 居中大卡片：单词、音标、释义、例句
- 支持左右滑动（手机）或按钮翻页（PC）
- 底部：5 个熟识度按钮
  - 忘记（红色）
  - 模糊（橙色）
  - 一般（黄色）
  - 熟悉（蓝色）
  - 精通（绿色）
- 发音按钮：Web Speech API；不支持的浏览器显示音标文本

### 10.6 单词测试页（/words/quiz/:bookId）

- 顶部：进度条 + 当前题号（如 3/20）
- 题目区：英文单词 + 四个中文选项
- 提交后显示对错反馈（正确绿色，错误红色 + 显示正确答案）
- 结果页：得分 + 正确率 + 错题列表（单词 + 正确释义）

### 10.7 阅读列表页（/reading）

- 顶部搜索栏：关键词搜索
- 筛选栏：类型（全部/故事/新闻）+ 年级阶段
- 文章卡片列表：标题、类型标签、难度标签、简介

### 10.8 文章阅读页（/reading/:id）

- 文章内容区：生词高亮标注（蓝色下划线），预标注 + 用户进度叠加
- 点击查词：弹出气泡显示释义和发音
- 阅读理解题区：提交后显示解析
- 底部：标记已读完按钮

### 10.9 个人中心页（/profile）

- 学习统计：已学单词数、已读文章数、测试平均成绩
- 学习记录：最近学习的词书/文章
- 账号信息：用户名、邮箱（可修改）

---

## 十一、响应式设计

| 设备 | 断点          | 布局                 |
| ---- | ------------- | -------------------- |
| 手机 | < 576px       | 单列，底部 Tab 导航  |
| 平板 | 576px - 992px | 两列卡片，折叠式导航 |
| PC   | ≥ 992px       | 多列卡片，顶部导航   |

### 11.1 三端导航体系（已实现）

| 设备 | 断点      | 导航方式                                      |
| ---- | --------- | --------------------------------------------- |
| 手机 | < 576px   | 底部固定 Tab 导航（56px 高，position: fixed） |
| 平板 | 576-991px | 顶部汉堡菜单 + Drawer 侧边抽屉                |
| PC   | ≥ 992px   | 顶部固定导航栏（logo + 链接 + 用户区）        |

| Tab  | 路由       | 说明                                     |
| ---- | ---------- | ---------------------------------------- |
| 首页 | `/`        | 未选年级→年级选择页；已选年级→学习概览页 |
| 单词 | `/words`   | 词书市场（选择词书后进入学习页）         |
| 阅读 | `/reading` | 阅读列表页                               |
| 我的 | `/profile` | 个人中心页                               |

> 未登录用户点击「单词」或「我的」时，自动跳转登录页。
> 手机端所有页面底部预留 `paddingBottom: 80` 防止被底部 Tab 遮挡。

---

## 十二、关键技术决策

1. **pnpm workspaces**：依赖提升可控，适合 monorepo（Vue3、Vite 等同款方案）
2. **Repository 模式解耦数据库**：切换数据库只需新增 Adapter，无需改业务代码；Repository 接口支持事务（`beginTransaction / commit / rollback`）
3. **Axios 封装为 apiClient**：统一拦截器处理 token，方便后续替换
4. **Ant Design 通过 wrapper 使用**：降低 UI 库替换成本
5. **Web Speech API**：免费无需密钥，Chrome/Edge/Safari 兼容性良好；不支持的浏览器降级显示音标文本
6. **JWT 鉴权**：无 session 依赖，适合 SPA；Token 有效期 7 天
7. **Husky + lint-staged 只检查暂存文件**：提升提交速度
8. **参数校验选用 Zod**：与 TypeScript 集成好，支持 schema 推导类型
9. **缓存策略**：词书列表、文章列表后端内存缓存，服务启动时加载，依赖显式清除或服务重启失效

---

## 十三、缓存策略

### 13.1 缓存层级

| 层级     | 方案                             | 说明                                             |
| -------- | -------------------------------- | ------------------------------------------------ |
| 前端缓存 | React Query（TanStack Query）    | 缓存 API 请求结果，减少重复请求                  |
| 后端缓存 | Node.js 内存缓存（memory-cache） | 缓存词书列表、文章列表，服务启动时加载，永不过期 |

### 13.2 缓存失效策略

- **加载时机**：服务启动时一次性加载词书列表、文章列表到内存缓存
- **失效方式**：
  - seed 脚本运行后自动调用 `POST /api/cache/clear` 清除缓存（推荐）
  - 或重启服务，缓存随服务启动重新加载
- **用户进度**：不缓存，实时读取
- **缓存有效期**：内存缓存永不过期，依赖显式清除或服务重启

---

## 十四、测试策略

### 14.1 单元测试

- **前端**：Jest + React Testing Library
- **后端**：Jest + ts-jest

### 14.2 E2E 测试

- **Playwright**：覆盖核心流程（注册 → 登录 → 选择年级 → 学习单词 → 完成测试）

### 14.3 测试覆盖率目标

- 工具函数：80%+
- API 接口：70%+
- 核心业务逻辑：90%+

---

## 十五、部署方案

### 15.1 前端部署

- 构建：`pnpm build`（Vite 构建）
- 部署：静态文件部署到 CDN（如 Vercel、Netlify）
- 环境变量：`VITE_API_BASE_URL`

### 15.2 后端部署

- 构建：`tsc` 编译 TypeScript
- 运行：`node dist/index.js`
- 环境变量：`DB_TYPE`、`JWT_SECRET`、`PORT`
- 推荐：Docker 容器化部署

### 15.3 Docker 配置

- 单容器方案：Nginx 同时托管前端静态文件 + 反代后端 API
  - 前端：Vite build 产物放入 Nginx 静态目录（`/usr/share/nginx/html`）
  - 后端：Node.js 进程在容器内运行，Nginx 将 `/api` 路径反代到后端端口
  - 进程管理：容器内用 `tini` 或 `supervisord` 管理 Nginx + Node 两个进程
- `docker-compose.yml`：本地开发一键启动（前端 + 后端 + SQLite）

---

## 十六、实施注意事项

- **开源词库**：使用 CET-4/6、中考、高考等公开词库初始化数据库
- **阅读文章**：初期通过 `article-seed.ts` 脚本导入 11 篇示例文章（primary×4、junior×2、senior×2、college×3），覆盖 story 和 news 两种类型，每篇含 4-5 道阅读理解题和 5 个生词预标注。运行 `pnpm --filter backend seed:articles` 即可导入
- **密码安全**：bcryptjs salt rounds = 10（纯 JS 实现，无需编译）
- **后台管理**：初期不做，数据通过 seed 脚本或 SQLite 客户端维护
- **seed 脚本设计**：
  - 词书数据：`packages/backend/src/db/seed-data.json`（5 本词书，共 12,800 词）
  - 文章数据：`packages/backend/src/db/article-seed.ts`（硬编码 11 篇文章）
  - 执行方式：
    - `pnpm --filter backend seed` — 导入词书 + 单词
    - `pnpm --filter backend seed:articles` — 导入文章
  - 缓存清除：seed 完成后直接调用 `cacheClear()` 函数（不走 HTTP API，避免鉴权问题）
- **Web Speech API 降级方案**：不支持的浏览器（如旧版 Firefox）显示音标文本，提示用户点击播放
- **Repository 事务支持**：`IRepository` 接口新增 `transaction` 方法，SQLite 实现使用 `node:sqlite` 的事务 API
- **初期数据来源**：
  - 单词：CET-4/6 词表（公开资源）、中考/高考考纲词汇
  - 文章：手动编写或从公开资源（如 VOA Learning English）整理
