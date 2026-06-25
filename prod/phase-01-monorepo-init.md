# 阶段一：Monorepo 骨架初始化

**目标**：搭建 pnpm workspaces monorepo 骨架，配置前端/后端基础工具链

---

## Task 1.1：初始化 Monorepo 根配置 + 前端 package

### 执行步骤

1. 在项目根目录创建以下文件：
   - `package.json`（根，含 `"workspaces": ["packages/*"]`）
   - `pnpm-workspace.yaml`
   - `tsconfig.json`（根，含 project references 配置，见下方配置示例）
2. 创建 `packages/frontend/` 目录，含：
   - `package.json`（name: `@english-read/frontend`，dependencies: react, react-dom, antd, react-router-dom, axios, @tanstack/react-query）
   - `vite.config.ts`（含 react plugin，配置 proxy: `/api -> http://localhost:3000`）
   - `tsconfig.json`（配置见下方示例）
   - `index.html`（含 root div）
   - `src/main.tsx`（渲染 `<App />`）
   - `src/App.tsx`（暂时返回 `<div>App Loading</div>`）
   - `src/components/antd-wrapper.tsx`（封装 antd，导出 Button/Card/Input/Layout/Menu/Tabs 等基础组件）
   - `src/api/`（空目录）
   - `src/pages/`（空目录）
   - `src/store/`（空目录）
   - `src/styles/`（空目录）
   - `.env.example`（前端环境变量示例，内容：`VITE_API_BASE_URL=http://localhost:3000`）
3. 安装依赖：`pnpm install`
4. 配置 `.eslintrc.cjs`（继承 `@typescript-eslint/recommended` + `plugin:react/recommended` + `plugin:react-hooks/recommended` + `plugin:prettier/recommended`，ESLint 版本：`^8.56.0`）
5. 配置 `.prettierrc`（`semi: true, singleQuote: false, printWidth: 100, endOfLine: "auto"`）
6. 配置 Husky + lint-staged + Commitlint + Commitizen（完整步骤见下方）
7. 验证：`pnpm --filter frontend dev` 能正常启动

### 前端 tsconfig.json 配置示例

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false
  },
  "include": ["src"]
}
```

### 根 tsconfig.json 配置示例

```json
{
  "files": [],
  "references": [{ "path": "./packages/frontend" }, { "path": "./packages/backend" }]
}
```

### Husky + lint-staged + Commitlint + Commitizen 配置步骤

1. 安装依赖：
   ```
   pnpm add -D husky lint-staged eslint-config-prettier prettier
   pnpm add -D @commitlint/cli @commitlint/config-conventional commitizen cz-conventional-changelog
   ```
2. 初始化 Husky：`npx husky install`，创建 `.husky/pre-commit` 文件，内容：
   ```sh
   #!/usr/bin/env sh
   . "$(dirname -- "$0")/_/husky.sh"
   npx lint-staged
   ```
3. 在根 `package.json` 中添加 `lint-staged` 字段：
   ```json
   "lint-staged": {
     "*.{js,jsx,ts,tsx}": ["eslint --fix", "prettier --write"],
     "*.{json,md,yml,yaml}": ["prettier --write"]
   }
   ```
4. 创建 `commitlint.config.js`：
   ```js
   module.exports = { extends: ["@commitlint/config-conventional"] };
   ```
5. 在根 `package.json` 中添加 `config` 字段：
   ```json
   "config": {
     "commitizen": { "path": "cz-conventional-changelog" }
   }
   ```
6. 添加 `prepare` 脚本到根 `package.json`：`"prepare": "husky"`（Husky v9 语法）

### AI Prompt 模板

````
请按照以下步骤初始化 english-read 项目的 monorepo 前端骨架。

【必须遵循的约束】
- 包管理器只能用 pnpm，不能用 npm/yarn
- 技术栈严格遵循 prod/technical-design.md 第三节
- Ant Design 必须通过 wrapper 封装使用（创建 packages/frontend/src/components/antd-wrapper.tsx，统一导出 antd 组件）
- ESLint 版本必须为 ^8.56.0
- 项目根目录：d:/TraeWorkSpace/english-read/
- Git Hook 工具链必须完整配置（Husky + lint-staged + Commitlint + Commitizen）
- 前端环境变量文件必须放在 packages/frontend/.env.example（不得放在根目录）

【执行步骤】
1. 在项目根目录创建以下文件：
   - package.json（根，含 workspaces: ["packages/*"]，含 lint-staged 配置和 commitizen 配置）
   - pnpm-workspace.yaml
   - tsconfig.json（根，内容如下）：
     ```json
     {
       "files": [],
       "references": [
         { "path": "./packages/frontend" },
         { "path": "./packages/backend" }
       ]
     }
     ```

2. 创建 packages/frontend/ 目录，含：
   - package.json（name: @english-read/frontend，dependencies: react@^18.2.0, react-dom@^18.2.0, antd@^5.0.0, react-router-dom@^6.0.0, axios@^1.6.0, @tanstack/react-query@^5.0.0）
   - vite.config.ts（含 react plugin，配置 proxy: /api -> http://localhost:3000）
   - tsconfig.json（内容如下）：
     ```json
     {
       "compilerOptions": {
         "target": "ES2020",
         "useDefineForClassFields": true,
         "lib": ["ES2020", "DOM", "DOM.Iterable"],
         "module": "ESNext",
         "skipLibCheck": true,
         "moduleResolution": "bundler",
         "allowImportingTsExtensions": true,
         "isolatedModules": true,
         "moduleDetection": "force",
         "noEmit": true,
         "jsx": "react-jsx",
         "strict": true,
         "noUnusedLocals": false,
         "noUnusedParameters": false
       },
       "include": ["src"]
     }
     ```
   - index.html（含 root div）
   - src/main.tsx（渲染 <App />）
   - src/App.tsx（暂时返回 <div>App Loading</div>）
   - src/components/antd-wrapper.tsx（封装 antd，导出 Button/Card/Input/Layout/Menu/Tabs 等基础组件）
   - src/api/ 目录（空目录）
   - src/pages/ 目录（空目录）
   - src/store/ 目录（空目录）
   - src/styles/ 目录（空目录）
   - .env.example（前端环境变量示例，内容：VITE_API_BASE_URL=http://localhost:3000）

3. 安装依赖：pnpm install

4. 配置 Linter 工具链：
   - 安装 ESLint 相关依赖（明确版本）：
     pnpm add -D eslint@^8.56.0 @typescript-eslint/eslint-plugin@^7.0.0 @typescript-eslint/parser@^7.0.0 eslint-plugin-react@^7.33.0 eslint-plugin-react-hooks@^4.6.0
   - 安装 Prettier 相关依赖：
     pnpm add -D prettier@^3.0.0 eslint-config-prettier@^9.0.0 eslint-plugin-prettier@^5.0.0
   - 安装 Git Hook 工具链：
     pnpm add -D husky@^9.0.0 lint-staged@^15.0.0
     pnpm add -D @commitlint/cli@^19.0.0 @commitlint/config-conventional@^19.0.0 commitizen@^4.3.0 cz-conventional-changelog@^3.3.0
   - 配置 .eslintrc.cjs（继承 @typescript-eslint/recommended + react/recommended + react-hooks/recommended + prettier/recommended）
     > 注：原计划使用 eslint-config-antd，该包在 npm 上不存在，改为标准 TypeScript + React ESLint 组合
   - 配置 .prettierrc（semi: true, singleQuote: false, printWidth: 100）
   - 运行 npx husky install
   - 创建 .husky/pre-commit 文件（内容：npx lint-staged）
   - 创建 commitlint.config.js（内容：module.exports = { extends: ['@commitlint/config-conventional'] }）
   - 在根 package.json 中添加：
     "lint-staged": { "*.{js,jsx,ts,tsx}": ["eslint --fix", "prettier --write"], "*.{json,md,yml,yaml}": ["prettier --write"] }
     "config": { "commitizen": { "path": "cz-conventional-changelog" } }
     "prepare": "husky"
     "lint": "eslint . --ext .ts,.tsx,.js,.jsx,.cjs,.mjs --fix"
     "format": "prettier --write \"**/*.{ts,tsx,js,jsx,cjs,mjs,json,md,yml,yaml}\""
     "lint:check": "eslint . --ext .ts,.tsx,.js,.jsx,.cjs,.mjs"
     "format:check": "prettier --check \"**/*.{ts,tsx,js,jsx,cjs,mjs,json,md,yml,yaml}\""

5. 验证：pnpm --filter frontend dev 能正常启动

【禁止修改】
- 不得修改 prod/technical-design.md
- 不得修改 AGENTS.md
- 不得引入技术设计文档中未列出的依赖（小版本更新除外）
- 不得跳过 Git Hook 工具链配置
- 不得更改 ESLint 版本（必须 ^8.56.0）

【验收标准】
- pnpm --filter frontend dev 成功启动，访问 localhost:5173 看到 App Loading
- pnpm install 无报错
- 目录结构与 technical-design.md 第八节一致
- .husky/pre-commit 存在且内容正确（包含 npx lint-staged）
- commitlint.config.js 存在
- packages/frontend/.env.example 存在且含 VITE_API_BASE_URL 变量
- 运行 git commit 时 pre-commit hook 自动触发（功能验证）
````

### Harness 约束

- 禁止修改：`prod/technical-design.md`、`AGENTS.md`
- 禁止引入未列出的依赖
- 禁止更改技术选型（AGENTS.md 第二节）
- 禁止跳过 Git Hook 工具链配置（Husky + lint-staged + Commitlint + Commitizen）
- 禁止更改 ESLint 版本（必须 ^8.56.0）
- 必须保留的目录结构：`packages/frontend/src/api/`、`src/components/`、`src/pages/`、`src/store/`、`src/styles/`
- 不得删除 `packages/frontend/.env.example` 文件

### 验收标准

- [x] `pnpm --filter frontend dev` 成功启动，浏览器访问 localhost:5173 显示页面
- [x] `pnpm install` 无报错
- [x] 根 `package.json` 含 `"workspaces": ["packages/*"]`
- [x] `pnpm-workspace.yaml` 存在
- [x] `packages/frontend/src/components/antd-wrapper.tsx` 存在（antd 封装文件）
- [x] `.husky/pre-commit` 存在且内容正确（包含 `npx lint-staged`）
- [x] `commitlint.config.js` 存在
- [x] 根 `package.json` 含 `lint-staged` 字段
- [x] 根 `package.json` 含 `config.commitizen` 字段
- [x] `packages/frontend/.env.example` 存在且含 `VITE_API_BASE_URL` 变量
- [x] 运行 `git commit` 时 pre-commit hook 自动触发（功能验证）
- [x] ESLint 版本为 ^8.56.0（检查 package.json 中的 eslint 版本）

---

## Task 1.2：初始化后端 package + 基础 Express 服务

### 执行步骤

1. 创建 `packages/backend/` 目录，含：
   - `package.json`（name: `@english-read/backend`，scripts: `{ dev: ts-node-dev src/index.ts, build: tsc, start:dist: node dist/index.js }`）
   - `tsconfig.json`（配置见下方示例）
   - `src/index.ts`（Express 入口，监听 3000 端口，添加 GET /api/health 健康检查接口）
   - `src/routes/`（空目录，后续添加）
   - `src/services/`（空目录）
   - `src/repositories/`（含 `interfaces/` 子目录，定义 IUserRepository/IWordRepository/IArticleRepository/IProgressRepository 接口骨架）
   - `src/models/`（空目录）
   - `src/middleware/`（含 `errorHandler.ts` 统一错误处理中间件）
   - `src/config/`（含 `index.ts` 配置读取，支持 DB_TYPE/JWT_SECRET/PORT 环境变量）
   - `src/seed/`（空目录）
   - `.env.example`（后端环境变量示例，内容见下方）
2. 实现 `src/middleware/errorHandler.ts`：捕获异常，返回统一错误响应格式，根据错误类型设置正确错误码
3. 实现 `src/utils/response.ts`：`success(res, data)` -> 返回 `{ code: 0, message: "success", data }`；`fail(res, code, message)` -> 返回 `{ code, message, data: null }`
4. 实现 `src/utils/errors.ts`：导出错误码枚举 `ERROR_CODES`
5. 创建 `packages/backend/.env.example` 文件，内容：
   ```
   DB_TYPE=sqlite
   JWT_SECRET=your-secret-key-here
   PORT=3000
   DB_PATH=./data/english-read.db
   ```
6. 安装依赖：`pnpm --filter backend add express jsonwebtoken bcryptjs zod` 和 `pnpm --filter backend add -D typescript ts-node-dev @types/express @types/node`
7. 验证：`pnpm --filter backend dev` 成功启动，访问 `localhost:3000/api/health` 返回 `{ code: 0, data: "ok" }`

### 后端 tsconfig.json 配置示例

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### AI Prompt 模板

````
请初始化 english-read 项目的后端骨架。

【必须遵循的约束】
- 包管理器：pnpm
- 技术栈：Express + TypeScript + SQLite（node:sqlite 内置）+ Zod
- 统一响应格式：{ code: number, message: string, data: any }
- 错误码：0=成功，40001=参数校验失败，40101=未登录，40301=无权限，40401=资源不存在，50001=服务器错误
- 后端端口：3000（必须与前端 vite.config.ts 中的 proxy 端口一致）
- 项目根目录：d:/TraeWorkSpace/english-read/
- 后端环境变量文件必须放在 packages/backend/.env.example（不得放在根目录）

【执行步骤】
1. 创建 packages/backend/ 目录，含：
   - package.json（name: @english-read/backend，scripts: { dev: ts-node-dev src/index.ts, build: tsc, start:dist: node dist/index.js }）
   - tsconfig.json（内容如下）：
     ```json
     {
       "compilerOptions": {
         "target": "ES2020",
         "module": "commonjs",
         "lib": ["ES2020"],
         "outDir": "./dist",
         "rootDir": "./src",
         "strict": true,
         "esModuleInterop": true,
         "skipLibCheck": true,
         "forceConsistentCasingInFileNames": true,
         "resolveJsonModule": true,
         "moduleResolution": "node"
       },
       "include": ["src/**/*"],
       "exclude": ["node_modules", "dist"]
     }
     ```
   - src/index.ts（Express入口，监听3000端口，添加 GET /api/health 健康检查接口）
   - src/routes/（空目录，后续添加）
   - src/services/（空目录）
   - src/repositories/（含 interfaces/ 子目录，定义 IUserRepository/IWordRepository/IArticleRepository/IProgressRepository 接口骨架）
   - src/models/（空目录）
   - src/middleware/（含 errorHandler.ts 统一错误处理中间件）
   - src/config/（含 index.ts 配置读取，支持 DB_TYPE/JWT_SECRET/PORT 环境变量）
   - src/seed/（空目录）
   - .env.example（后端环境变量示例，内容见下方）

2. 实现 src/middleware/errorHandler.ts：
   - 捕获异常，返回统一错误响应格式
   - 根据错误类型设置正确错误码

3. 实现 src/utils/response.ts：
   - success(res, data) -> 返回 { code: 0, message: "success", data }
   - fail(res, code, message) -> 返回 { code, message, data: null }

4. 实现 src/utils/errors.ts：
   - 导出错误码枚举 ERROR_CODES

5. 创建 packages/backend/.env.example 文件，内容：
````

DB_TYPE=sqlite
JWT_SECRET=your-secret-key-here
PORT=3000
DB_PATH=./data/english-read.db

```

6. 安装依赖：pnpm --filter backend add express jsonwebtoken bcryptjs zod
pnpm --filter backend add -D typescript ts-node-dev @types/express @types/node

7. 验证：pnpm --filter backend dev 成功启动，访问 localhost:3000/api/health 返回 { code: 0, data: "ok" }

【禁止修改】
- prod/technical-design.md、AGENTS.md
- 不得引入未列出的依赖
- 后端端口必须保持 3000（与前端的 proxy 配置一致）
- 不得删除 packages/backend/.env.example 文件

【验收标准】
- pnpm --filter backend dev 成功启动
- GET /api/health 返回 { "code": 0, "message": "success", "data": "ok" }
- src/repositories/interfaces/ 下4个接口文件存在（可空实现）
- src/middleware/errorHandler.ts 存在
- src/utils/response.ts 存在
- packages/backend/.env.example 存在且含 DB_TYPE/JWT_SECRET/PORT/DB_PATH 变量
- tsc 编译成功（pnpm --filter backend build 无错）
- dist/ 目录生成且包含编译后的文件
```

### Harness 约束

- 禁止修改：`prod/technical-design.md`、`AGENTS.md`
- 禁止更改 API 响应格式（必须是 `{code, message, data}`）
- 禁止更改错误码定义
- Repository 接口方法签名必须与 technical-design.md 中的 API 需求对齐
- 禁止更改后端端口（必须 3000，与前端的 proxy 配置一致）
- 禁止删除 `packages/backend/.env.example` 文件
- 禁止删除 `packages/frontend/.env.example` 文件
- 不得修改 `tsconfig.json` 中的 `outDir` 配置（必须 `./dist`）

### 验收标准

- [x] `pnpm --filter backend dev` 成功启动
- [x] `GET /api/health` 返回正确格式
- [x] `src/repositories/interfaces/IUserRepository.ts` 等 4 个接口文件存在
- [x] `src/middleware/errorHandler.ts` 实现统一错误处理
- [x] `src/utils/response.ts` 导出 `success`/`fail` 方法
- [x] `packages/backend/.env.example` 存在且含 `DB_TYPE`/`JWT_SECRET`/`PORT`/`DB_PATH` 变量
- [x] `pnpm --filter backend build` 成功编译（tsc 无错）
- [x] `dist/` 目录生成且包含编译后的 JavaScript 文件
- [x] `packages/backend/tsconfig.json` 中 `outDir` 配置为 `./dist`

---

## 开发完成记录

**完成时间**：2026-06-24

### 实际与计划差异

| 差异项             | 原计划                       | 实际                                                | 原因                                        |
| ------------------ | ---------------------------- | --------------------------------------------------- | ------------------------------------------- |
| ESLint 配置        | `eslint-config-antd@^3.0.0`  | `eslint-plugin-react` + `eslint-plugin-react-hooks` | `eslint-config-antd` 在 npm 上不存在（404） |
| Prettier 换行符    | 默认 LF                      | 添加 `endOfLine: "auto"`                            | Windows 系统默认 CRLF，避免 Delete `␍` 错误 |
| Husky prepare 脚本 | `"prepare": "husky install"` | `"prepare": "husky"`                                | Husky v9 使用新语法                         |
| 额外 scripts       | 无                           | 添加 `lint`/`format`/`lint:check`/`format:check`    | 方便手动执行 linter 修复和检查              |

### 最终项目结构

```
english-read/
├── package.json              # 根配置（workspaces + lint-staged + commitizen + scripts）
├── pnpm-workspace.yaml
├── tsconfig.json             # 根 TS 配置（含 references）
├── .eslintrc.cjs             # ESLint（TS + React + Prettier）
├── .prettierrc               # Prettier（semi, singleQuote, printWidth:100, endOfLine:auto）
├── .gitignore
├── commitlint.config.js
├── .husky/pre-commit         # Git Hook（lint-staged）
├── packages/
│   ├── frontend/
│   │   ├── package.json / vite.config.ts / tsconfig.json / index.html
│   │   ├── .env.example
│   │   └── src/ (App.tsx, main.tsx, antd-wrapper.tsx, api/, pages/, store/, styles/)
│   └── backend/
│       ├── package.json / tsconfig.json / .env.example
│       ├── dist/             # tsc 编译产物
│       └── src/ (index.ts, config/, middleware/, utils/, repositories/interfaces/, routes/, services/, models/, seed/)
└── prod/                     # 开发文档
```
