import { test, expect } from "@playwright/test";
import { login } from "../fixtures/auth";

// ============================================================
// 个人中心路由：/profile
// ============================================================

test.describe("个人中心 /profile", () => {
  test("应展示学习统计", async ({ page }) => {
    await login(page);
    await page.goto("/profile");
    await expect(page.getByText("个人中心")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("学习统计")).toBeVisible({ timeout: 10_000 });
    // 统计卡片
    await expect(page.getByText("已学单词", { exact: false })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("已读文章", { exact: false })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("平均成绩", { exact: false })).toBeVisible({ timeout: 10_000 });
  });

  test("应展示账号信息区域", async ({ page }) => {
    await login(page);
    await page.goto("/profile");
    await expect(page.getByText("个人中心")).toBeVisible({ timeout: 10_000 });
    // 账号信息区
    await expect(page.getByText("用户名：")).toBeVisible();
    await expect(page.getByText("修改邮箱")).toBeVisible();
    await expect(page.getByText("修改密码")).toBeVisible();
  });

  test("应展示最近学习记录", async ({ page }) => {
    await login(page);
    await page.goto("/profile");
    await expect(page.getByText("个人中心")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("最近学习")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("最近词书")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("最近文章")).toBeVisible({ timeout: 10_000 });
  });

  test("退出登录按钮应可见", async ({ page }) => {
    await login(page);
    await page.goto("/profile");
    await expect(page.getByText("个人中心")).toBeVisible({ timeout: 10_000 });
    const logoutBtn = page.getByRole("button", { name: "退出登录" });
    await expect(logoutBtn).toBeVisible();
  });

  test("修改邮箱表单应可用", async ({ page }) => {
    await login(page);
    await page.goto("/profile");
    await expect(page.getByText("个人中心")).toBeVisible({ timeout: 10_000 });
    // 邮箱输入框
    const emailInput = page.getByPlaceholder("新邮箱地址");
    await expect(emailInput).toBeVisible();
    await emailInput.clear();
    await emailInput.fill("new_email@example.com");
    // 保存按钮
    await expect(page.getByRole("button", { name: "保存" }).first()).toBeVisible();
  });

  test("修改密码表单应可用", async ({ page }) => {
    await login(page);
    await page.goto("/profile");
    await expect(page.getByText("个人中心")).toBeVisible({ timeout: 10_000 });
    const passwordInput = page.getByPlaceholder("新密码");
    await expect(passwordInput).toBeVisible();
    await passwordInput.fill("NewPassword123");
    // 第二个保存按钮
    const saveBtns = page.getByRole("button", { name: "保存" });
    await expect(saveBtns).toHaveCount(2);
  });
});
