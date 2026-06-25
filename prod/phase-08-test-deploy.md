# 阶段八：测试 + Docker 部署

> **思路**：将原 Phase 11 保留不变，在所有功能开发完成后进行测试和部署配置。

---

## Task 8.1：实现关键路径单元测试

### 后端测试（`packages/backend/src/__tests__/`）

| 测试文件                  | 覆盖内容                                         |
| ------------------------- | ------------------------------------------------ |
| `auth.test.ts`            | 注册成功/用户名重复/登录成功/密码错误/Token 验证 |
| `wordProgress.test.ts`    | 单词进度 UPSERT / review_count 递增 / 范围校验   |
| `articleProgress.test.ts` | 文章进度保存 / quiz_score 计算准确性             |

### 前端测试（`packages/frontend/src/__tests__/`）

| 测试文件               | 覆盖内容                         |
| ---------------------- | -------------------------------- |
| `AuthContext.test.tsx` | 登录状态管理 / 登出 / 持久化     |
| `WordLearn.test.tsx`   | 单词卡片渲染 / 熟识度标记 / 翻页 |
| `apiClient.test.ts`    | Token 附加 / 响应拦截 / 401 处理 |

### 执行步骤

1. 配置 Jest / Vitest
2. 编写测试用例
3. 添加 `"test"` 和 `"test:coverage"` 脚本
4. 验证覆盖率

### 测试覆盖率目标

- 工具函数：80%+
- API 接口：70%+
- 核心业务逻辑：90%+

### 验收标准

- [x] 后端测试全部通过（3 套件 / 33 用例）
- [x] 前端单元测试全部通过（3 套件 / 22 用例）
- [x] 覆盖率报告生成
- [ ] CI 中可运行测试

---

## Task 8.1b：E2E 端到端测试（Playwright）

使用 `@playwright/test` 覆盖所有前端路由的真实浏览器交互测试。

### 技术选型

| 项目     | 方案                                   |
| -------- | -------------------------------------- |
| 框架     | `@playwright/test`                     |
| 浏览器   | Chromium（headless）                   |
| 认证方式 | 后端 API 注册/登录 → 注入 localStorage |

### 测试覆盖路由（全部 9 条）

| 测试文件          | 覆盖路由                                                | 覆盖内容                                                        |
| ----------------- | ------------------------------------------------------- | --------------------------------------------------------------- |
| `guest.spec.ts`   | `/login`, `/register`                                   | 表单展示、字段验证、密码不一致提示、页面互跳                    |
| `home.spec.ts`    | `/`                                                     | 未登录年级选择、已登录统计概览、切换年级、未认证重定向          |
| `words.spec.ts`   | `/words`, `/words/learn/:bookId`, `/words/quiz/:bookId` | 词书列表/筛选/搜索、单词卡片/熟识度标记/翻页、答题界面/选项交互 |
| `reading.spec.ts` | `/reading`, `/reading/:id`                              | 文章列表/年级分类筛选/搜索、文章内容渲染、阅读理解题选答        |
| `profile.spec.ts` | `/profile`                                              | 统计卡片、账号信息、最近学习、修改邮箱/密码、退出登录           |

### 文件结构

```
e2e/
├── fixtures/
│   └── auth.ts          # 登录辅助（API 注册→登录→localStorage 注入）
├── specs/
│   ├── guest.spec.ts    # 登录/注册页
│   ├── home.spec.ts     # 首页
│   ├── words.spec.ts    # 单词模块
│   ├── reading.spec.ts  # 阅读模块
│   └── profile.spec.ts  # 个人中心
└── report/              # HTML 报告（gitignore）
```

### 运行方式

```bash
# 1. 启动后端（确保 seed 数据已导入）
cd packages/backend && pnpm dev

# 2. 启动前端
cd packages/frontend && pnpm dev

# 3. 运行 E2E 测试
pnpm test:e2e

# 交互式 UI 模式
pnpm test:e2e:ui

# 查看报告
pnpm test:e2e:report
```

### 验收标准

- [x] 9 条路由全覆盖，测试全部通过（5 文件 / 31 用例）
- [x] 关键用户流程验证正常（注册→登录→学词→阅读→测验）
- [x] 非认证状态重定向验证正常

---

## Task 8.2：实现 Docker 部署配置

### Dockerfile（生产部署）

```
阶段 1：前端构建 → pnpm build
阶段 2：后端构建 → tsc
阶段 3：Nginx + Node.js 双进程
  - 前端静态文件 → /usr/share/nginx/html
  - 后端 API → Node.js 进程
  - Nginx 反代 /api → 后端
  - 进程管理：tini 或 supervisord
```

### docker-compose.yml（本地开发）

```
服务：
  - frontend：Vite dev server
  - backend：Express dev server
  - 数据库：SQLite 文件挂载到 volume
```

### 执行步骤

1. 创建 `Dockerfile`
2. 创建 `docker-compose.yml`
3. 创建 `.dockerignore`
4. 创建 Nginx 配置（`nginx.conf`）

### 环境变量

| 变量         | 说明                 |
| ------------ | -------------------- |
| `JWT_SECRET` | JWT 签名密钥         |
| `PORT`       | 后端端口             |
| `DB_PATH`    | SQLite 数据库路径    |
| `DB_TYPE`    | 数据库类型（sqlite） |

### 验收标准

- [ ] `docker-compose up` 成功启动
- [ ] SQLite 数据在重启后不丢失
- [ ] 生产 Dockerfile 构建成功
- [ ] Nginx 正确反代 API 请求

---

## 阶段总结

**此阶段是项目的收尾阶段：**

```
测试覆盖
  ├── 后端：认证 / 单词进度 / 文章进度（Jest，33 用例 ✅）
  ├── 前端：认证状态 / 单词学习 / apiClient（Vitest，22 用例 ✅）
  └── E2E：全部 9 条路由（Playwright，31 用例 ✅）

部署方案
  ├── Dockerfile：多阶段构建 + Nginx + Node.js
  └── docker-compose：本地一键启动
```

---

## 全部阶段总览

```
Phase 1: Monorepo 骨架初始化          ✅ 已完成
Phase 2: 数据库 + Repository 模式      ✅ 已完成
Phase 3: 认证模块（前后端打通）        ✅ 已完成
Phase 4: 单词模块（前后端打通）        ✅ 已完成
Phase 5: 阅读模块（前后端打通）        ✅ 已完成
Phase 6: 首页 + 个人中心              ✅ 已完成
Phase 7: Seed 数据 + 响应式适配       ✅ 已完成
Phase 8: 测试 + Docker 部署           🟡 测试完成 / 部署待开始
```

**每个 Phase 完成后都可以端到端验证，看到实际效果。**
