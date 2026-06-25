# 阶段三：认证模块（前后端打通）

> **状态**：✅ 已完成（2026-06-25）
> **思路**：将原来的 Phase 3（后端认证 API）和 Phase 6（前端认证骨架）合并为一个垂直模块。
> 完成后即可注册 → 登录 → 看到 Layout → 路由守卫生效，完整闭环可验证。

---

## Task 3.1：后端认证 API（注册 / 登录 / Profile）+ JWT 中间件

### 执行步骤

1. 创建 `src/middleware/auth.ts`：
   - 验证 `Authorization: Bearer <token>` 头
   - 无效/过期返回 `{ code: 40101, message: "未登录或Token已过期", data: null }`
   - 有效则将 `userId` 写入 `req.user.id`

2. 在 `src/services/authService.ts` 中实现注册/登录/Profile 业务逻辑：
   - `POST /api/auth/register`：Zod 校验 → 查重 → bcryptjs 加密 → 存入 DB
   - `POST /api/auth/login`：查用户 → bcryptjs 对比 → JWT 签发
   - `GET /api/auth/profile`：查当前用户（不含 password_hash）
   - `PUT /api/auth/profile`：更新邮箱或密码

3. 在 `src/routes/auth.ts` 中创建路由，挂载 auth 中间件

4. 在 `src/index.ts` 中注册路由

5. 用 curl 验证所有接口

### API 规格（参考 technical-design.md 7.5.1-7.5.2, 7.5.13-7.5.14）

- `POST /api/auth/register` → `{ code: 0, data: { id, username, email } }`
- `POST /api/auth/login` → `{ code: 0, data: { token, user: { id, username, email } } }`
- `GET /api/auth/profile` 🔒 → 返回用户信息
- `PUT /api/auth/profile` 🔒 → 更新邮箱/密码

### Harness 约束

- 不允许修改 JWT payload 结构（只允许 `{userId}`）
- 不允许修改错误码定义
- 不允许修改统一响应格式

### 验收标准

- [x] 注册成功返回用户信息
- [x] 用户名/邮箱重复返回 40001
- [x] 登录成功返回 JWT token
- [x] 密码错误返回 40101
- [x] 带 Token 访问 Profile 返回用户信息
- [x] 不带 Token 返回 40101
- [x] Profile 更新成功

---

## Task 3.2：前端工程骨架（路由 + Layout + AuthContext + apiClient）

### 执行步骤

1. 创建 `src/router/index.tsx`：
   - 9 个页面路由（含动态路由 `:bookId`、`:id`）
   - 路由守卫（未登录跳 `/login`，已登录访问 `/login` 或 `/register` 跳 `/`）
   - placeholder 页面组件（后续阶段替换）

2. 创建 `src/store/AuthContext.tsx`：
   - React Context + useReducer 管理登录状态
   - 存储 JWT token 到 localStorage
   - 提供 `login()` / `logout()` / `isAuthenticated`

3. 创建 `src/api/apiClient.ts`：
   - Axios 实例（baseURL = VITE_API_BASE_URL）
   - 请求拦截器自动附加 token
   - 响应拦截器：`code ≠ 0` 抛出错误，401 清除 token 并跳转 `/login`

4. 创建 `src/components/Layout.tsx`：
   - 响应式布局：PC 顶部导航 / 手机底部 Tab
   - 4 个 Tab：首页 / 单词 / 阅读 / 我的
   - 未登录时「单词」「我的」点击跳转登录页

5. 完善 `antd-wrapper.tsx`，补充所需组件导出

6. 在 `App.tsx` 中组装 Provider 层级：
   - BrowserRouter → AuthProvider → QueryClientProvider → Layout → Routes

### 路由设计

| 路由                   | 页面     | 鉴权                     |
| ---------------------- | -------- | ------------------------ |
| `/`                    | 首页     | 否（未登录显示年级选择） |
| `/login`               | 登录页   | 否（已登录跳 `/`）       |
| `/register`            | 注册页   | 否（已登录跳 `/`）       |
| `/words`               | 词书市场 | 🔒                       |
| `/words/learn/:bookId` | 单词学习 | 🔒                       |
| `/words/quiz/:bookId`  | 单词测试 | 🔒                       |
| `/reading`             | 阅读列表 | 🔒                       |
| `/reading/:id`         | 文章阅读 | 🔒                       |
| `/profile`             | 个人中心 | 🔒                       |

### 验收标准

- [x] 所有路由可正常切换
- [x] 未登录访问 `/words` → 跳转 `/login`
- [x] 登录后访问 `/login` → 跳转 `/`
- [x] PC 端顶部导航 / 手机端底部 Tab 正确显示
- [x] AuthContext 正确管理状态
- [x] apiClient 正确附加 token

---

## Task 3.3：前端登录页 + 注册页

### 执行步骤

1. 创建 `src/api/auth.ts`：`register()` / `login()` / `getProfile()` / `updateProfile()`

2. 实现 `src/pages/Login.tsx`：
   - antd Form：用户名 + 密码
   - 提交后存储 token 到 AuthContext + localStorage
   - 成功后跳转 `/`
   - 错误提示

3. 实现 `src/pages/Register.tsx`：
   - antd Form：用户名 + 邮箱 + 密码 + 确认密码
   - 邮箱格式校验、密码强度提示
   - 注册成功后自动跳转登录页
   - 「已有账号？去登录」链接

4. 打通流程：注册 → 登录 → 首页 → 进入单词 Tab → 被路由守卫拦截 → 登录 → 正常访问

### 验收标准

- [x] 注册功能正常（含校验，用户名重复提示）
- [x] 登录功能正常（密码错误提示）
- [x] 登录后 token 正确存储和使用
- [x] 401 错误自动跳转登录页
- [x] 「去登录」「去注册」页面跳转正确
- [x] **完整流程可走通**：注册 → 登录 → 看到 Layout → 路由守卫生效

---

## 阶段总结

**按纵向切分，此阶段完成后即可看到完整的认证闭环：**

```
用户打开浏览器
  → 进入首页看到年级选择（未登录状态）
  → 点击「注册」→ 填写信息 → 注册成功
  → 跳转登录页 → 输入账号密码 → 登录
  → 看到带导航的完整 Layout
  → 可以点击各个 Tab 切换页面
  → 路由守卫保护需要登录的页面
```
