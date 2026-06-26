# English Read - 英文学习平台

基于 React + Express 的全栈英文学习平台，支持小学至大学四个阶段的分级单词学习和阅读理解训练，集成 DeepSeek AI 自动生成学习内容。

## ✨ 特性

- 🎯 **分级学习**：小学 / 初中 / 高中 / 大学四个难度阶段，切换即加载对应内容
- 📖 **单词模块**：扇贝风格卡片背诵、选择题测试（20 题/轮）、Web Speech API 发音
- 📰 **阅读模块**：分级文章阅读 + 阅读理解题，生词自动标注，点击查词
- 🤖 **AI 驱动**：DeepSeek 自动生成阅读理解题、生词标注（音标+释义）、句子级中英对照翻译
- 🌐 **内容源抓取**：自动从 Breaking News English、China Daily 等 5 个外部源拉取文章
- 🔐 **用户系统**：注册 / 登录（JWT），学习进度持久化
- 📱 **响应式设计**：一套代码适配 PC + 平板 + 手机端
- 🛠️ **管理后台**：手动触发文章拉取、内容翻译、数据管理
- 📋 **Swagger 文档**：OpenAPI 3.0 自动生成 API 文档

## 🏗️ 技术栈

| 层级     | 技术                                              |
| -------- | ------------------------------------------------- |
| 包管理   | pnpm workspaces (Monorepo)                        |
| 前端     | React 18 + TypeScript + Vite 5 + Ant Design 5     |
| 后端     | Express + TypeScript                              |
| 数据库   | SQLite（node:sqlite 内置）                        |
| 状态管理 | React Context + useReducer + TanStack React Query |
| 鉴权     | JWT（jsonwebtoken）                               |
| AI 服务  | DeepSeek API（openai SDK）                        |
| 日志     | Winston                                           |
| 定时调度 | node-cron                                         |
| 测试     | Vitest（前端）/ Jest（后端）/ Playwright（E2E）   |
| 代码规范 | ESLint + Prettier + Husky + Commitlint            |

## 📂 项目结构

```
english-read/
├── packages/
│   ├── frontend/          # React SPA 前端
│   │   └── src/
│   │       ├── components/   # 通用组件
│   │       ├── pages/        # 11 个页面组件
│   │       ├── hooks/        # 自定义 Hooks
│   │       ├── store/        # Context 状态管理
│   │       ├── router/       # 路由配置
│   │       └── utils/        # 工具函数（apiClient）
│   └── backend/           # Express API 后端
│       └── src/
│           ├── routes/       # 路由 / 控制器
│           ├── services/     # 业务逻辑层
│           │   ├── deepseekService.ts          # AI 服务
│           │   ├── articleImportService.ts     # 文章导入管线
│           │   └── content-fetchers/           # 内容源抓取器（5 个）
│           ├── repositories/ # 数据访问层（Repository 模式）
│           ├── db/           # Schema + 迁移脚本 + 种子数据
│           ├── middleware/   # 中间件（auth, errorHandler）
│           └── utils/        # 工具函数（logger, swagger, jwt）
├── prod/                   # 技术文档
├── e2e/                    # Playwright E2E 测试
└── .env.example            # 环境变量模板
```

## 🚀 快速开始

### 环境要求

- **Node.js** >= 22（使用内置 node:sqlite）
- **pnpm** >= 8

### 安装与运行

```bash
# 1. 克隆项目
git clone <your-repo-url>
cd english-read

# 2. 安装依赖
pnpm install

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env，填入 JWT_SECRET 等必要配置

# 4. 初始化数据库并导入示例数据
pnpm --filter @english-read/backend run seed

# 5. 导入示例文章（可选，不执行则通过 AI 抓取获取文章）
pnpm --filter @english-read/backend run seed:articles

# 6. 启动开发服务器
pnpm dev
```

启动后：

- 前端：http://localhost:5173
- 后端 API：http://localhost:3000
- Swagger 文档：http://localhost:3000/api-docs

## ⚙️ 环境变量

| 变量               | 必填   | 默认值                 | 说明                                 |
| ------------------ | ------ | ---------------------- | ------------------------------------ |
| `PORT`             | 否     | 3000                   | 服务端口                             |
| `DB_TYPE`          | 否     | sqlite                 | 数据库类型                           |
| `DB_PATH`          | 否     | ./data/english-read.db | SQLite 文件路径                      |
| `JWT_SECRET`       | **是** | —                      | JWT 签名密钥                         |
| `LOG_LEVEL`        | 否     | info                   | error / warn / info / debug          |
| `DEEPSEEK_API_KEY` | 否     | —                      | DeepSeek API Key（用于 AI 生成题目） |
| `NEWSAPI_KEY`      | 否     | —                      | NewsAPI Key（不填则跳过该源）        |
| `CRON_ENABLED`     | 否     | false                  | 是否启用每天 8:00 自动拉取文章       |

## 📋 可用脚本

```bash
# 开发
pnpm dev                  # 同时启动前后端

# 测试
pnpm test                 # 运行所有测试
pnpm test:backend         # 后端单元测试（Jest）
pnpm test:frontend        # 前端单元测试（Vitest）
pnpm test:e2e             # E2E 测试（Playwright）
pnpm test:e2e:ui           # E2E 测试（Playwright UI 模式）

# 代码检查
pnpm lint                 # ESLint 检查并修复
pnpm format               # Prettier 格式化
pnpm fix                  # lint + format

# 数据初始化
pnpm --filter @english-read/backend run seed             # 导入词书数据
pnpm --filter @english-read/backend run seed:articles    # 导入示例文章
```

## 🧠 AI 功能说明

项目集成 DeepSeek API 实现以下自动化能力：

- **阅读理解题生成**：每篇文章自动生成 4 道选择题（含选项 + 中文解析）
- **生词标注**：每篇文章标注 5 个核心生词（含音标 + 中文释义）
- **句子级翻译**：段落级中英对照翻译，支持逐句对照阅读

设置 `DEEPSEEK_API_KEY` 环境变量即可启用 AI 功能。若未配置，系统将优雅降级。

## 🤝 贡献

欢迎提交 Issue 和 Pull Request。提交代码前请确保通过 lint 检查和测试。

## 📄 License

MIT
