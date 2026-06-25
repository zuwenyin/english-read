---
name: english-learning-platform
overview: 基于 React + Node.js + Monorepo 架构构建英文学习平台，包含用户系统、年级选择（小学/初中/高中/大学）、单词模块（卡片背诵+测试+发音）、阅读模块（分级文章+理解题+生词标注），支持 PC 和手机端响应式布局。采用 pnpm monorepo，数据库通过适配层解耦，方便后续切换 MySQL/MongoDB。
design:
  architecture:
    framework: react
  styleKeywords:
    - 教育风
    - 清新明快
    - 卡片式布局
    - 蓝色系主色调
    - 微动画
    - 响应式
  fontSystem:
    fontFamily: PingFang SC, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto
    heading:
      size: 28px
      weight: 600
    subheading:
      size: 20px
      weight: 500
    body:
      size: 16px
      weight: 400
  colorSystem:
    primary:
      - "#1677FF"
      - "#4096FF"
      - "#69B1FF"
    background:
      - "#F5F7FA"
      - "#FFFFFF"
    text:
      - "#1D2129"
      - "#4E5969"
      - "#86909C"
    functional:
      - "#52C41A"
      - "#FF4D4F"
      - "#FAAD14"
      - "#1677FF"
todos:
  - id: init-monorepo
    content: 使用 pnpm 初始化 monorepo 项目结构，配置 workspaces 和 TypeScript 基础环境
    status: pending
  - id: db-adapter-layer
    content: 实现数据库适配层（Repository 接口 + SQLite 实现），确保业务代码与数据库解耦
    status: pending
    dependencies:
      - init-monorepo
  - id: seed-data
    content: 编写开源词库和示例文章的 seed 脚本，初始化 SQLite 数据库
    status: pending
    dependencies:
      - db-adapter-layer
  - id: auth-api
    content: 实现用户注册/登录 API（含 JWT 鉴权中间件）
    status: pending
    dependencies:
      - db-adapter-layer
  - id: word-api
    content: 实现词书和单词 API（含进度记录接口）
    status: pending
    dependencies:
      - auth-api
  - id: reading-api
    content: 实现文章和阅读理解 API（含答题结果提交接口）
    status: pending
    dependencies:
      - auth-api
  - id: frontend-layout
    content: 搭建前端项目框架（React + Vite + Ant Design），实现响应式布局和路由
    status: pending
    dependencies:
      - init-monorepo
  - id: auth-pages
    content: 开发注册页和登录页，接入后端认证 API
    status: pending
    dependencies:
      - frontend-layout
  - id: word-pages
    content: 开发单词卡片背诵页和测试页（含 Web Speech API 发音功能）
    status: pending
    dependencies:
      - auth-pages
      - word-api
  - id: reading-pages
    content: 开发阅读列表页和文章阅读页（含生词标注点击查词功能）
    status: pending
    dependencies:
      - auth-pages
      - reading-api
  - id: polish-responsive
    content: 完善手机端响应式适配，优化交互细节和动画效果
    status: pending
    dependencies:
      - word-pages
      - reading-pages
---

## 产品概述

英文学习平台，支持小学、初中、高中、大学四个年级阶段，每个阶段对应不同难度。包含单词和阅读两大核心模块，支持 PC 和手机端响应式访问，用户注册登录后保存学习进度。

## 核心功能

- **年级选择**：小学、初中、高中、大学四个阶段，切换后加载对应难度内容
- **用户系统**：注册、登录、学习进度保存
- **单词模块**：
- 单词卡片背诵（扇贝风格，滑动翻页，标记熟识度）
- 单词选择题测试（四选一，即时反馈）
- 单词发音跟读（Web Speech API，支持重复播放）
- **阅读模块**：
- 分级阅读文章浏览（按年级阶段筛选）
- 阅读理解题（阅读文章后答题）
- 文章生词标注与点击查词（点击单词弹出释义和发音）
- **响应式布局**：一套代码适配 PC 和手机端

## 技术栈选择

### 包管理器

- **pnpm**：高效磁盘空间利用，严格依赖管理，适合 monorepo

### Monorepo 架构

- **pnpm workspaces**：管理多 package 工作区
- **turbo**（可选）：增量构建加速

### 前端（packages/frontend）

- React 18 + TypeScript + Vite
- Ant Design 5（UI 组件，通过 adapter 封装减少强绑定）
- React Router v6（路由）
- Axios（HTTP 客户端，封装为 apiClient 方便替换）
- React Context + useReducer（状态管理）

### 后端（packages/backend）

- Node.js + Express + TypeScript
- **数据库适配层**：Repository 模式，接口与实现分离
- 初期实现：`SQLiteAdapter`（better-sqlite3）
- 预留接口：`MySQLAdapter`、`MongoDBAdapter`
- bcrypt（密码加密）
- jsonwebtoken（JWT 鉴权）
- Joi / Zod（参数校验，可选）

### 数据库设计（与具体 DB 无关的逻辑模型）

**users 表** — 用户账号

| 字段          | 类型        | 说明               |
| ------------- | ----------- | ------------------ |
| id            | INTEGER PK  | 用户ID             |
| username      | TEXT UNIQUE | 用户名             |
| password_hash | TEXT        | 加密密码（bcrypt） |
| created_at    | DATETIME    | 注册时间           |

**word_books 表** — 词书（按年级阶段）

| 字段        | 类型       | 说明                                      |
| ----------- | ---------- | ----------------------------------------- |
| id          | INTEGER PK | 词书ID                                    |
| name        | TEXT       | 词书名                                    |
| level       | TEXT       | 对应阶段（primary/junior/senior/college） |
| description | TEXT       | 描述                                      |

**words 表** — 单词

| 字段             | 类型       | 说明         |
| ---------------- | ---------- | ------------ |
| id               | INTEGER PK | 单词ID       |
| word_book_id     | INTEGER FK | 所属词书     |
| word             | TEXT       | 英文单词     |
| phonetic         | TEXT       | 音标         |
| translation      | TEXT       | 中文释义     |
| example_sentence | TEXT       | 例句         |
| difficulty       | INTEGER    | 难度等级 1-5 |

**articles 表** — 阅读文章

| 字段       | 类型       | 说明               |
| ---------- | ---------- | ------------------ |
| id         | INTEGER PK | 文章ID             |
| title      | TEXT       | 标题               |
| content    | TEXT       | 文章内容           |
| level      | TEXT       | 对应阶段           |
| category   | TEXT       | 类型（story/news） |
| questions  | JSON       | 阅读理解题         |
| created_at | DATETIME   | 创建时间           |

**user_word_progress 表** — 单词学习进度

| 字段          | 类型       | 说明         |
| ------------- | ---------- | ------------ |
| id            | INTEGER PK | 记录ID       |
| user_id       | INTEGER FK | 用户ID       |
| word_id       | INTEGER FK | 单词ID       |
| familiarity   | INTEGER    | 熟识度 0-5   |
| last_reviewed | DATETIME   | 上次复习时间 |

**user_article_progress 表** — 文章阅读进度

| 字段         | 类型       | 说明     |
| ------------ | ---------- | -------- |
| id           | INTEGER PK | 记录ID   |
| user_id      | INTEGER FK | 用户ID   |
| article_id   | INTEGER FK | 文章ID   |
| quiz_score   | INTEGER    | 答题得分 |
| completed_at | DATETIME   | 完成时间 |

## 实施方案

### 系统架构

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

### 数据库适配层设计（核心解耦方案）

采用 Repository 模式，所有数据访问通过接口进行，具体实现可替换。

**目录结构中的核心文件**：

- `packages/backend/src/repositories/IUserRepository.ts` — 用户数据访问接口
- `packages/backend/src/repositories/ISWordRepository.ts` — 单词数据访问接口
- `packages/backend/src/repositories/IArticleRepository.ts` — 文章数据访问接口
- `packages/backend/src/repositories/sqlite/` — SQLite 实现
- `packages/backend/src/repositories/mysql/` — MySQL 实现（预留）
- `packages/backend/src/database/DatabaseFactory.ts` — 根据配置创建对应 Adapter

**切换数据库**：只需修改配置文件中的 `DB_TYPE` 字段，无需改动业务代码。

### 后端 API 设计

| 方法 | 路径                        | 说明                            |
| ---- | --------------------------- | ------------------------------- |
| POST | /api/auth/register          | 用户注册                        |
| POST | /api/auth/login             | 用户登录                        |
| GET  | /api/word-books             | 获取词书列表（按阶段筛选）      |
| GET  | /api/words/:bookId          | 获取词书单词列表                |
| POST | /api/progress/word          | 更新单词熟识度                  |
| GET  | /api/progress/words/:bookId | 获取用户单词进度                |
| GET  | /api/articles               | 获取文章列表（按阶段/类型筛选） |
| GET  | /api/articles/:id           | 获取文章详情                    |
| POST | /api/progress/article       | 提交文章阅读进度/答题结果       |

### Monorepo 目录结构

```
english-read/
├── package.json          # 根 pnpm 配置，workspaces 声明
├── pnpm-workspace.yaml   # pnpm 工作区配置
├── turbo.json            # turbo 构建配置（可选）
├── tsconfig.json         # 根 TypeScript 配置
├── packages/
│   ├── frontend/        # React 前端
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   ├── tsconfig.json
│   │   ├── index.html
│   │   └── src/
│   │       ├── main.tsx
│   │       ├── App.tsx
│   │       ├── api/           # API 客户端（封装 Axios）
│   │       ├── components/    # 通用组件
│   │       ├── pages/         # 页面组件
│   │       ├── store/         # 状态管理
│   │       └── styles/        # 全局样式
│   └── backend/         # Express 后端
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           ├── index.ts       # 入口
│           ├── routes/         # 路由/控制器
│           ├── services/      # 业务逻辑层
│           ├── repositories/  # 数据访问层（接口+适配实现）
│           ├── models/        # 数据模型/类型定义
│           ├── middleware/    # 中间件（JWT 鉴权等）
│           ├── config/        # 配置文件
│           └── seed/          # 初始数据脚本
└── docs/                 # 文档
```

### 关键技术决策

1. **pnpm workspaces**：比 npm/yarn workspaces 更严格，依赖提升可控，适合 monorepo
2. **Repository 模式解耦数据库**：业务代码只依赖接口，切换数据库只需新增 Adapter 实现
3. **Axios 封装为 apiClient**：统一拦截器处理 token，方便后续替换为 fetch 或其他 HTTP 库
4. **Ant Design 通过 wrapper 组件使用**：核心业务组件不直接引用 antd，通过自行封装的 UI 组件桥接，降低替换成本
5. **Web Speech API**：免费无需密钥，兼容性良好
6. **JWT 鉴权**：无 session 依赖，适合 SPA

### 实施注意事项

- 开源词库：使用 CET-4/6、中考、高考等公开词库初始化数据库
- 阅读文章：初期手动录入 8-12 篇示例文章，后续通过脚本批量导入
- 密码安全：使用 bcrypt 加密，salt rounds 设为 10
- 响应式断点：Ant Design 断点 xs(<576px)、sm(≥576px)、md(≥768px)、lg(≥992px)
- 初期不做后台管理，数据通过 seed 脚本或 SQLite 客户端维护

## 设计风格

采用现代教育类平台设计风格，清新明快，适合学习场景。主色调为蓝色系（知识、专业感），辅以绿色（进步、成就感）和橙色（活力、提醒）。整体风格简洁，减少干扰，聚焦学习内容。

## 页面设计

### 1. 首页 / 年级选择页（/）

- **顶部导航栏**：Logo + 平台名称 + 登录/用户头像
- **Hero 区块**：欢迎语 + 平台简介，背景使用渐变蓝色
- **年级选择卡片区**：4 张卡片横向排列（PC）或纵向排列（手机），每张卡片包含：
- 阶段图标（小学📘 / 初中📗 / 高中📕 / 大学📙）
- 阶段名称
- 难度描述
- 卡片 hover 时有微缩放动画
- **底部**：简短的页脚信息

### 2. 注册页（/register）

- 居中卡片式布局，包含用户名、密码、确认密码输入框
- 底部有「已有账号？去登录」链接

### 3. 登录页（/login）

- 居中卡片式布局，包含用户名、密码输入框
- 底部有「没有账号？去注册」链接

### 4. 单词学习页（/words）

- **顶部**：当前词书名称 + 进度条
- **卡片区**：居中大卡片，展示单词、音标、释义、例句
- 卡片支持左右滑动（手机）或按钮翻页（PC）
- 底部有「不认识 / 模糊 / 熟悉」三个按钮
- **发音按钮**：点击播放单词发音（Web Speech API）

### 5. 单词测试页（/words/quiz）

- **顶部**：进度条 + 当前题号
- **题目区**：英文单词 + 四个中文选项（单选）
- **提交按钮**：选择后点击提交，显示对错反馈
- **结果页**：测试完成后显示得分和错误单词回顾

### 6. 阅读列表页（/reading）

- **筛选栏**：按类型（全部/故事/新闻）和年级阶段筛选
- **文章卡片列表**：每张卡片显示标题、类型标签、难度标签、简介
- 点击卡片进入文章阅读页

### 7. 文章阅读页（/reading/:id）

- **文章内容区**：正文展示，生词高亮标注（蓝色下划线）
- **点击查词**：点击生词弹出气泡，显示释义和发音按钮
- **阅读理解题区**：文章下方显示选择题，提交后显示解析
- **底部操作栏**：标记已读完按钮

## 响应式设计

- PC 端（≥992px）：多列卡片布局，顶部导航
- 平板端（768px-992px）：两列卡片，折叠式导航
- 手机端（<768px）：单列布局，底部 Tab 导航栏

## Agent Extensions

暂无需要使用额外扩展工具，所有功能均通过核心代码实现。
