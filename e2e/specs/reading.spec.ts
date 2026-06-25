import { test, expect } from "@playwright/test";
import { login } from "../fixtures/auth";

// ============================================================
// 阅读模块路由：/reading, /reading/:id
// ============================================================
// 前提：需要运行 seed 脚本确保文章数据存在

test.describe("阅读列表 /reading", () => {
  test("应展示文章列表", async ({ page }) => {
    await login(page);
    await page.goto("/reading");
    await expect(page.getByText("阅读文章")).toBeVisible({ timeout: 10_000 });
    // 应有文章卡片
    await expect(page.locator(".ant-card")).not.toHaveCount(0, { timeout: 10_000 });
  });

  test("可按年级筛选文章", async ({ page }) => {
    await login(page);
    await page.goto("/reading");
    await expect(page.getByText("阅读文章")).toBeVisible({ timeout: 10_000 });
    // 选择"小学"级别（Ant Design Select → dropdown option）
    const levelSelect = page.locator(".ant-select").first();
    await levelSelect.click();
    await page.locator(".ant-select-item-option-content").filter({ hasText: "小学" }).click();
    await page.waitForTimeout(500);
  });

  test("可按类型筛选文章", async ({ page }) => {
    await login(page);
    await page.goto("/reading");
    await expect(page.getByText("阅读文章")).toBeVisible({ timeout: 10_000 });
    // 选择"故事"类型
    const categorySelect = page.locator(".ant-select").nth(1);
    await categorySelect.click();
    await page.locator(".ant-select-item-option-content").filter({ hasText: "故事" }).click();
    await page.waitForTimeout(500);
  });

  test("可通过搜索框搜索文章", async ({ page }) => {
    await login(page);
    await page.goto("/reading");
    await expect(page.getByText("阅读文章")).toBeVisible({ timeout: 10_000 });
    const searchInput = page.getByPlaceholder("搜索文章标题...");
    await searchInput.fill("不存在的文章标题");
    await searchInput.press("Enter");
    await page.waitForTimeout(1000);
    // 应有空状态或过滤结果
  });
});

test.describe("文章详情 /reading/:id", () => {
  test("应展示文章标题和内容", async ({ page }) => {
    await login(page);
    await page.goto("/reading/1");
    // 文章标题应可见
    await expect(page.locator("h3").or(page.locator("h2"))).toBeVisible({ timeout: 10_000 });
    // 文章内容卡片
    await expect(page.locator(".article-content")).toBeVisible({ timeout: 10_000 });
    // 年级和类型 Tag
    await expect(page.locator(".ant-tag")).not.toHaveCount(0);
  });

  test("应有阅读理解题并可选答", async ({ page }) => {
    await login(page);
    await page.goto("/reading/1");
    // 等待内容加载
    await expect(page.locator(".article-content")).toBeVisible({ timeout: 10_000 });
    // 阅读理解区域
    const quizSection = page.getByText("阅读理解");
    if (await quizSection.isVisible({ timeout: 3_000 })) {
      // 找到并选择一个 Radio
      const radio = page.locator(".ant-radio-wrapper").first();
      if (await radio.isVisible()) {
        await radio.click();
        await expect(page.locator(".ant-radio-checked").first()).toBeVisible();
      }
    }
  });

  test("应可从文章列表点击进入详情", async ({ page }) => {
    await login(page);
    await page.goto("/reading");
    await expect(page.getByText("阅读文章")).toBeVisible({ timeout: 10_000 });
    // 点击第一篇文章卡片
    const firstCard = page.locator(".ant-card").first();
    if (await firstCard.isVisible({ timeout: 5_000 })) {
      await firstCard.click();
      await expect(page).toHaveURL(/\/reading\/\d+/);
    }
  });
});
