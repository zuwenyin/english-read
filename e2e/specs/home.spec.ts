import { test, expect } from "@playwright/test";
import { login } from "../fixtures/auth";

// ============================================================
// 首页 / 路由测试
// ============================================================

test.describe("未登录首页 /", () => {
  test("应展示年级选择卡片（未选年级时）", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("欢迎来到 English Read")).toBeVisible();
    // 四个年级卡片
    await expect(page.getByText("小学")).toBeVisible();
    await expect(page.getByText("初中")).toBeVisible();
    await expect(page.getByText("高中")).toBeVisible();
    await expect(page.getByText("大学")).toBeVisible();
  });

  test("选择年级后应展示学习概览", async ({ page }) => {
    await page.goto("/");
    await page.getByText("小学").click();
    // 登录后再回来能看到学习概览
    await expect(page.getByText("学习概览", { exact: false })).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText("推荐词书", { exact: false })).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText("推荐文章", { exact: false })).toBeVisible({ timeout: 5_000 });
  });
});

test.describe("已登录首页 /", () => {
  test("应展示学习概览（含统计卡片）", async ({ page }) => {
    await login(page);
    await page.goto("/");
    // 先选年级
    await page.getByText("小学").click();
    // 统计卡片应出现
    await expect(page.getByText("已学单词", { exact: false })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("已读文章", { exact: false })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("推荐词书")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("推荐文章")).toBeVisible({ timeout: 10_000 });
  });

  test("可点击'切换年级'回到选择页", async ({ page }) => {
    await login(page);
    await page.goto("/");
    await page.getByText("小学").click();
    await expect(page.getByText("推荐词书")).toBeVisible({ timeout: 10_000 });
    await page.getByRole("button", { name: "切换年级" }).click();
    await expect(page.getByText("欢迎来到 English Read")).toBeVisible();
  });

  test("未认证访问受保护路由应重定向到 /login", async ({ page }) => {
    await page.goto("/words");
    await expect(page).toHaveURL(/\/login/);
  });
});
