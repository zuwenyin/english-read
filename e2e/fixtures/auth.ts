import { Page, request, APIRequestContext } from "@playwright/test";

const API_BASE = "http://localhost:3000/api";
const TEST_USER = {
  username: "e2e_test_user",
  email: "e2e_test@example.com",
  password: "E2eTest123!",
};

let tokenCache: string | null = null;

/**
 * 通过后端 API 注册并登录，返回 JWT token。
 * 测试套件之间共享 token 缓存，避免重复注册。
 */
async function ensureToken(apiCtx: APIRequestContext): Promise<string> {
  if (tokenCache) return tokenCache;

  // 尝试注册（如果用户已存在则忽略 409）
  const registerRes = await apiCtx.post(`${API_BASE}/auth/register`, {
    data: TEST_USER,
  });
  // 409 = 用户名或邮箱已存在，这是预期的
  if (
    registerRes.status() !== 200 &&
    registerRes.status() !== 201 &&
    registerRes.status() !== 409
  ) {
    const body = await registerRes.text();
    throw new Error(`注册失败: ${registerRes.status()} ${body}`);
  }

  // 登录获取 token
  const loginRes = await apiCtx.post(`${API_BASE}/auth/login`, {
    data: { username: TEST_USER.username, password: TEST_USER.password },
  });
  if (!loginRes.ok()) {
    const body = await loginRes.text();
    throw new Error(`登录失败: ${loginRes.status()} ${body}`);
  }

  const body = await loginRes.json();
  tokenCache = body.data.token;
  return tokenCache!;
}

/**
 * 执行完整登录流程：注册 → 登录 → 写入 localStorage
 * 调用后 page 处于已登录状态，可访问所有受保护路由。
 *
 * 关键时序：
 * 1. 先 go 到 /login 建立 app 的 localStorage origin
 * 2. 写入 token + user（此时 React AuthProvider 已挂载但 isAuthenticated=false）
 * 3. reload 页面 → AuthProvider 重新挂载 → useEffect 读取 localStorage → isAuthenticated=true
 * 4. GuestRoute 检测到已登录 → 自动重定向到 /
 */
export async function login(page: Page): Promise<string> {
  const apiCtx = await request.newContext({ baseURL: API_BASE });
  try {
    const token = await ensureToken(apiCtx);

    // 步骤 1：先导航到 app，建立 localStorage 的正确 origin
    await page.goto("/login");

    // 步骤 2：写入认证数据到 localStorage
    await page.evaluate(
      ({ token: t, user: u }) => {
        localStorage.setItem("token", t);
        localStorage.setItem("user", JSON.stringify(u));
      },
      {
        token,
        user: {
          id: 1,
          username: TEST_USER.username,
          email: TEST_USER.email,
        },
      },
    );

    // 步骤 3：重新加载页面，让 AuthProvider 在 mount 时读取 localStorage
    await page.reload();
    // 步骤 4：已登录用户会被 GuestRoute 从 /login 重定向到 /
    await page.waitForURL("/", { timeout: 10_000 });

    return token;
  } finally {
    await apiCtx.dispose();
  }
}

/**
 * 注销：清除 localStorage 并刷新
 */
export async function logout(page: Page): Promise<void> {
  await page.evaluate(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  });
}

/**
 * 重置 token 缓存（在不同测试场景间使用）
 */
export function clearTokenCache(): void {
  tokenCache = null;
}
