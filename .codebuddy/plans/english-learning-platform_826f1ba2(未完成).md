---
name: english-learning-platform
overview: 基于 React + Node.js + SQLite + Ant Design 构建英文学习平台，包含用户系统、年级选择（小学/初中/高中/大学）、单词模块（卡片背诵+测试+发音）、阅读模块（分级文章+理解题+生词标注），支持 PC 和手机端响应式布局。
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
  - id: init-project
    content: 初始化前后端项目结构，配置 TypeScript + Vite + Express 基础环境
    status: pending
  - id: db-and-seed
    content: 设计并创建 SQLite 数据库，编写词书和单词 seed 脚本（含开源词库数据）
    status: pending
    dependencies:
      - init-project
  - id: auth-api
    content: 实现用户注册/登录 API（含 JWT 鉴权中间件）
    status: pending
    dependencies:
      - db-and-seed
  - id: word-api-and-pages
    content: 实现词书/单词 API，开发单词卡片背诵页和测试页（含 Web Speech API 发音）
    status: pending
    dependencies:
      - auth-api
  - id: reading-api-and-pages
    content: 实现文章 API，开发阅读列表页和文章阅读页（含生词标注点击查词功能）
    status: pending
    dependencies:
      - auth-api
  - id: responsive-and-polish
    content: 完善响应式布局适配手机端，优化交互细节和动画效果
    status: pending
    dependencies:
      - word-api-and-pages
      - reading-api-and-pages
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

- **前端**：React 18 + TypeScript + Vite + Ant Design 5 + React Router v6 + Axios
- **后端**：Node.js + Express + TypeScript + better-sqlite3（SQLite 驱动）
- **样式**：Ant Design 自带样式 + CSS Modules（响应式用 Ant Design Grid 断点）
- **发音**：浏览器 Web Speech API（SpeechSynthesis）
- **状态管理**：React Context + useReducer（轻量，适合初期）

## 实施方案

### 系统架构

采用前后端分离架构，前端通过 REST API 与后端通信，SQLite 作为本地数据库。

```
[浏览器]
   |
[React SPA (Ant Design)]
   |  REST API (Axios)
[Node.js + Express 后端]
   |
[SQLite 数据库]
```

### 数据库设计

**users 表** — 用户账号

| 字段       | 类型        | 说明               |
| ---------- | ----------- | ------------------ |
| id         | INTEGER PK  | 用户ID             |
| username   | TEXT UNIQUE | 用户名             |
| password   | TEXT        | 加密密码（bcrypt） |
| created_at | DATETIME    | 注册时间           |

**word_books 表** — 词书（按年级阶段）

| 字段        | 类型       | 说明                                      |
| ----------- | ---------- | ----------------------------------------- |
| id          | INTEGER PK | 词书ID                                    |
| name        | TEXT       | 词书名（如「小学基础词汇」）              |
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

| 字段       | 类型       | 说明                                      |
| ---------- | ---------- | ----------------------------------------- |
| id         | INTEGER PK | 文章ID                                    |
| title      | TEXT       | 标题                                      |
| content    | TEXT       | 文章内容（HTML/富文本）                   |
| level      | TEXT       | 对应阶段（primary/junior/senior/college） |
| category   | TEXT       | 类型（story/news）                        |
| questions  | TEXT       | 阅读理解题（JSON 格式存储）               |
| created_at | DATETIME   | 创建时间                                  |

**user_progress 表** — 学习进度

| 字段          | 类型       | 说明         |
| ------------- | ---------- | ------------ |
| id            | INTEGER PK | 记录ID       |
| user_id       | INTEGER FK | 用户ID       |
| word_id       | INTEGER FK | 单词ID       |
| familiarity   | INTEGER    | 熟识度 0-5   |
| last_reviewed | DATETIME   | 上次复习时间 |

**user_article_progress 表** — 文章阅读进度

| 字段         | 类型       | 说明            |
| ------------ | ---------- | --------------- |
| id           | INTEGER PK | 记录ID          |
| user_id      | INTEGER FK | 用户ID          |
| article_id   | INTEGER FK | 文章ID          |
| read         | INTEGER    | 是否读完（0/1） |
| quiz_score   | INTEGER    | 答题得分        |
| completed_at | DATETIME   | 完成时间        |

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

### 前端页面结构

| 页面          | 路径         | 说明                         |
| ------------- | ------------ | ---------------------------- |
| 首页/年级选择 | /            | 选择年级阶段，进入对应内容   |
| 注册页        | /register    | 用户注册                     |
| 登录页        | /login       | 用户登录                     |
| 单词学习页    | /words       | 单词卡片背诵                 |
| 单词测试页    | /words/quiz  | 单词选择题测试               |
| 阅读列表页    | /reading     | 文章列表（按类型筛选）       |
| 文章阅读页    | /reading/:id | 阅读文章 + 生词标注 + 理解题 |

### 关键技术决策

1. **SQLite 选型**：轻量零配置，适合初期部署，后续可迁移至 MySQL
2. **better-sqlite3**：同步 API，性能优于 sqlite3（异步），适合小规模并发
3. **Ant Design 5**：企业级组件库，内置响应式断点，PC 和移动端适配成本低
4. **Web Speech API**：免费无需密钥，兼容性良好（Chrome/Edge/Safari），音质可接受
5. **JWT 鉴权**：前端存储 token，后端中间件验证，无 session 依赖，适合 SPA

### 实施注意事项

- 开源词库：使用 CET-4/6、中考、高考等公开词库 JSON 文件初始化数据库
- 阅读文章：初期手动录入 8-12 篇示例文章（每阶段 2-3 篇），后续通过脚本批量导入
- 密码安全：使用 bcrypt 加密，salt rounds 设为 10
- 响应式断点：Ant Design 断点 xs(<576px)、sm(≥576px)、md(≥768px)、lg(≥992px)
- 初期不做后台管理，数据通过 SQLite 客户端或后端 seed 脚本维护

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

- PC 端（≥992px）：多列卡片布局，侧边导航
- 平板端（768px-992px）：两列卡片，折叠式导航
- 手机端（<768px）：单列布局，底部 Tab 导航栏
