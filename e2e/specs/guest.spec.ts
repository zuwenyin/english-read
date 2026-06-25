import { test, expect } from "@playwright/test";

// ============================================================
// Guest 路由测试：未登录用户的访问行为
// ============================================================

test.describe("登录页 /login", () => {
  test("应展示登录表单", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("form")).toBeVisible();
    await expect(page.getByPlaceholder("请输入用户名")).toBeVisible();
    await expect(page.getByPlaceholder("请输入密码")).toBeVisible();
    await expect(page.getByRole("button", { name: "登录" })).toBeVisible();
  });

  test("应可跳转至注册页", async ({ page }) => {
    await page.goto("/login");
    await page.getByText("去注册").click();
    await expect(page).toHaveURL("/register");
  });

  test("空表单提交应显示验证错误", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "登录" }).click();
    // Ant Design Form 验证：应有错误提示
    await expect(page.locator(".ant-form-item-explain-error")).toHaveCount(2);
  });

  test("错误密码应显示错误信息", async ({ page }) => {
    await page.goto("/login");
    await page.getByPlaceholder("请输入用户名").fill("nonexistent_user");
    await page.getByPlaceholder("请输入密码").fill("wrong_password");
    await page.getByRole("button", { name: "登录" }).click();
    // 应显示错误 message
    await expect(page.locator(".ant-message")).toBeVisible({ timeout: 10_000 });
  });
});

test.describe("注册页 /register", () => {
  test("应展示注册表单", async ({ page }) => {
    await page.goto("/register");
    await expect(page.locator("form")).toBeVisible();
    await expect(page.getByPlaceholder("请输入用户名")).toBeVisible();
    await expect(page.getByPlaceholder("请输入邮箱")).toBeVisible();
    await expect(page.getByPlaceholder("请输入密码（至少6个字符）")).toBeVisible();
    await expect(page.getByPlaceholder("请再次输入密码")).toBeVisible();
    await expect(page.getByRole("button", { name: "注册" })).toBeVisible();
  });

  test("应可跳转至登录页", async ({ page }) => {
    await page.goto("/register");
    await page.getByText("去登录").click();
    await expect(page).toHaveURL("/login");
  });

  test("空表单提交应显示验证错误", async ({ page }) => {
    await page.goto("/register");
    await page.getByRole("button", { name: "注册" }).click();
    await expect(page.locator(".ant-form-item-explain-error").first()).toBeVisible();
  });

  test("两次密码不一致应显示错误", async ({ page }) => {
    await page.goto("/register");
    await page.getByPlaceholder("请输入用户名").fill("testuser");
    await page.getByPlaceholder("请输入邮箱").fill("test@test.com");
    await page.getByPlaceholder("请输入密码（至少6个字符）").fill("123456");
    await page.getByPlaceholder("请再次输入密码").fill("654321");
    await page.getByRole("button", { name: "注册" }).click();
    await expect(page.locator(".ant-message")).toBeVisible({ timeout: 5_000 });
  });
});
