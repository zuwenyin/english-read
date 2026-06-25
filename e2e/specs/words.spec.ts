import { test, expect } from "@playwright/test";
import { login } from "../fixtures/auth";

// ============================================================
// 单词模块路由：/words, /words/learn/:bookId, /words/quiz/:bookId
// ============================================================
// 前提：需要运行 seed 脚本确保词书数据存在

test.describe("词书市场 /words", () => {
  test("应展示词书列表", async ({ page }) => {
    await login(page);
    await page.goto("/words");
    await expect(page.getByText("词书市场")).toBeVisible({ timeout: 10_000 });
    // 应展示词书卡片（种子数据有多个词书）
    await expect(page.locator(".ant-card")).not.toHaveCount(0, { timeout: 10_000 });
  });

  test("可按年级筛选词书", async ({ page }) => {
    await login(page);
    await page.goto("/words");
    await expect(page.getByText("词书市场")).toBeVisible({ timeout: 10_000 });
    // 点击"小学"筛选标签
    await page.getByText("小学").first().click();
    // 等待筛选结果
    await page.waitForTimeout(500);
    // 卡片中应包含年级标签
    await expect(page.locator(".ant-card")).not.toHaveCount(0);
  });

  test("可通过搜索框过滤词书", async ({ page }) => {
    await login(page);
    await page.goto("/words");
    await expect(page.getByText("词书市场")).toBeVisible({ timeout: 10_000 });
    const searchInput = page.getByPlaceholder("搜索词书名称或描述...");
    await searchInput.fill("不存在的词书名称");
    // 应显示空状态
    await expect(page.getByText("暂无词书")).toBeVisible({ timeout: 5_000 });
  });
});

test.describe("单词学习 /words/learn/:bookId", () => {
  test("应展示单词卡片", async ({ page }) => {
    await login(page);
    // 进入第一个词书 (bookId=1，seed 数据保证存在)
    await page.goto("/words/learn/1");
    // 单词卡片应包含：单词、音标、翻译
    await expect(page.locator(".ant-card")).not.toHaveCount(0, { timeout: 10_000 });
    // 熟识度按钮
    await expect(page.getByText("你的熟识程度：")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("忘记")).toBeVisible();
    await expect(page.getByText("模糊")).toBeVisible();
    await expect(page.getByText("精通")).toBeVisible();
  });

  test("可标记单词熟识度", async ({ page }) => {
    await login(page);
    await page.goto("/words/learn/1");
    await expect(page.getByText("你的熟识程度：")).toBeVisible({ timeout: 10_000 });
    // 点击"熟悉"
    await page.getByText("熟悉").click();
    // 等待 mutation 完成，不应有错误
    await page.waitForTimeout(1000);
    // 翻页按钮应可用
    await expect(page.getByText("下一个")).toBeVisible();
  });

  test("可翻页到下一个单词", async ({ page }) => {
    await login(page);
    await page.goto("/words/learn/1");
    await expect(page.getByText("下一个 →")).toBeVisible({ timeout: 10_000 });
    await page.getByText("下一个 →").click();
    // 等待新单词加载
    await page.waitForTimeout(500);
    // 上一个按钮应启用
    const prevBtn = page.getByText("← 上一个");
    await expect(prevBtn).toBeVisible();
    await expect(prevBtn).toBeEnabled();
  });

  test("可从学习页跳转到测试页", async ({ page }) => {
    await login(page);
    await page.goto("/words/learn/1");
    await expect(page.getByText("去测试")).toBeVisible({ timeout: 10_000 });
    await page.getByText("去测试").click();
    await expect(page).toHaveURL(/\/words\/quiz\/1/);
  });
});

test.describe("单词测验 /words/quiz/:bookId", () => {
  test("应展示答题界面", async ({ page }) => {
    await login(page);
    await page.goto("/words/quiz/1");
    // 等待题目加载
    await expect(page.getByText("请选择正确的释义")).toBeVisible({ timeout: 15_000 });
    // 应展示进度
    await expect(page.getByText("1 /")).toBeVisible();
    // 选项按钮
    await expect(page.locator(".ant-btn")).not.toHaveCount(0);
  });

  test("可选择答案并进入下一题", async ({ page }) => {
    await login(page);
    await page.goto("/words/quiz/1");
    await expect(page.getByText("请选择正确的释义")).toBeVisible({ timeout: 15_000 });
    // 选择第一个选项按钮（选项区由 Space vertical 包裹）
    const optionButtons = page.locator('[class*="ant-space-vertical"] button');
    // 跳过页面中其他可能匹配的 button，只取选项区内的按钮
    if ((await optionButtons.count()) > 0) {
      await optionButtons.first().click();
    } else {
      // 回退方案：直接点第一个非 disabled button
      await page.locator("button:not([disabled])").first().click();
    }
    // 应出现反馈和"下一题"按钮
    await expect(page.getByText("下一题")).toBeVisible({ timeout: 5_000 });
  });
});
