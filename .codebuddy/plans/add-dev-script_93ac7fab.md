---
name: add-dev-script
overview: 在根 package.json 的 scripts 中增加 `dev` 命令，使用 pnpm --parallel 并发启动前后端开发服务。
todos:
  - id: add-dev-script
    content: '在根 package.json 的 scripts 中新增 "dev": "pnpm --parallel --filter @english-read/backend --filter @english-read/frontend run dev"'
    status: completed
---

## 用户需求

在根 `package.json` 的 `scripts` 中新增一条 `dev` 命令，实现一条命令同时启动前端（Vite）和后端（Express + ts-node-dev）服务。

## 核心功能

- 新增 `dev` 脚本，使用 pnpm 并发运行前后端子包的 `dev` 命令

## 技术方案

### 实现方式

在根 `package.json` 的 `scripts` 中新增：

```
"dev": "pnpm --parallel --filter @english-read/backend --filter @english-read/frontend run dev"
```

### 关键决策

- **使用 pnpm 内置并发能力**：`--parallel` 参数是 pnpm 原生支持，无需安装 `concurrently` 等第三方依赖
- **过滤器精确匹配**：`--filter` 分别指定 backend 和 frontend 两个子包，与 monorepo workspace 模式一致

### 涉及文件

```
english-read/
└── package.json  # [MODIFY] scripts 中新增 "dev" 命令
```
