import * as cheerio from "cheerio";
import axios from "axios";
import { ContentFetcher, RawArticle, ContentCategory } from "./types";
import { logger } from "../../utils/logger";

/**
 * China Daily 英文文章抓取器
 *
 * China Daily (www.chinadaily.com.cn) 是服务端渲染（SSR）的纯 HTML 站点，
 * 国内可直连，无需代理。文章列表页和详情页均可直接用 cheerio 解析。
 *
 * 难度分级策略：
 *   1. 频道基础映射：/life/、/culture/ → junior；/world/、/china/ → senior；
 *      /business/、/tech/、/opinion/ → college
 *   2. 字数修正：< 200 词降一级；> 800 词升一级（最低 primary，最高 college）
 *   3. primary 仅从 life/culture 频道产生
 *
 * 爬取策略：
 *   每个请求间隔 1-2 秒随机延迟，防止触发反爬。
 */

const CDN_BASE = "https://www.chinadaily.com.cn";

/** 频道 → 基础年级映射 */
const CHANNEL_LEVEL_MAP: Record<string, string> = {
  "/life/": "junior",
  "/culture/": "junior",
  "/world/": "senior",
  "/china/": "senior",
  "/business/": "college",
  "/tech/": "college",
  "/opinion/": "college",
};

/** 各频道列表页路径 */
const CHANNEL_PATHS = ["/world/", "/china/", "/business/", "/life/", "/culture/"];

const REQUEST_TIMEOUT = 15_000; // 单页超时 15 秒
const MIN_CONTENT_LENGTH = 100; // 正文最少 100 字符

export class ChinaDailyFetcher implements ContentFetcher {
  readonly name = "ChinaDaily";

  /**
   * 按年级抓取文章
   * 策略：遍历各频道 → 获取文章链接 → 批量抓取详情页 → 按分级规则筛选
   */
  async fetch(level: string, count: number, seenUrls?: Set<string>): Promise<RawArticle[]> {
    logger.info(`[${this.name}] starting fetch for level=${level}, target=${count}`);

    const allArticles: RawArticle[] = [];
    const urlSet = seenUrls || new Set<string>();

    // 遍历频道抓取
    for (const channelPath of CHANNEL_PATHS) {
      if (allArticles.length >= count) break;

      const baseLevel = CHANNEL_LEVEL_MAP[channelPath] || "senior";

      // primary 只从 junior 基础频道（life）中产生
      if (level === "primary" && baseLevel !== "junior") continue;

      // 频道间隔延迟，避免触发反爬
      await this.delay(2000 + Math.random() * 2000);

      try {
        const articles = await this.scrapeChannel(
          channelPath,
          level,
          baseLevel,
          count - allArticles.length,
          urlSet,
        );
        allArticles.push(...articles);
        logger.info(`[${this.name}] ${channelPath}: got ${articles.length} for level=${level}`);
      } catch (err) {
        logger.warn(`[${this.name}] channel ${channelPath} failed: ${(err as Error).message}`);
        // 单个频道失败不影响整体
      }
    }

    logger.info(`[${this.name}] fetch complete for level=${level}: ${allArticles.length}/${count}`);
    return allArticles;
  }

  /**
   * 抓取单个频道的文章
   */
  private async scrapeChannel(
    channelPath: string,
    targetLevel: string,
    baseLevel: string,
    needed: number,
    seenUrls: Set<string>,
  ): Promise<RawArticle[]> {
    const listUrl = `${CDN_BASE}${channelPath}`;
    const results: RawArticle[] = [];

    // 获取列表页
    const html = await this.fetchUrl(listUrl);
    const $ = cheerio.load(html);

    // 提取文章链接（格式：/a/YYYYMM/DD/WSxxxx.html 或 //www.chinadaily.com.cn/a/...）
    const links: string[] = [];
    $("a[href*='/a/']").each((_, el) => {
      const href = $(el).attr("href");
      if (href && href.includes("/a/") && href.endsWith(".html")) {
        const fullUrl = this.resolveUrl(href);
        // 去重
        if (!seenUrls.has(fullUrl)) {
          links.push(fullUrl);
        }
      }
    });

    logger.info(`[${this.name}] ${channelPath}: found ${links.length} article links`);

    // 逐个抓取详情页
    for (const url of links) {
      if (results.length >= needed) break;
      if (seenUrls.has(url)) continue;

      // 礼貌性延迟
      await this.delay(1000 + Math.random() * 1000);

      try {
        const article = await this.scrapeDetail(url, targetLevel, baseLevel);
        if (article) {
          results.push(article);
          seenUrls.add(url);
        }
      } catch (err) {
        logger.debug(`[${this.name}] detail ${url} failed: ${(err as Error).message}`);
        seenUrls.add(url); // 失败也标记，不再重试
      }
    }

    return results;
  }

  /**
   * 抓取单篇文章详情页，并完成分级
   */
  private async scrapeDetail(
    url: string,
    targetLevel: string,
    baseLevel: string,
  ): Promise<RawArticle | null> {
    const html = await this.fetchUrl(url);
    const $ = cheerio.load(html);

    // 提取标题
    const title = $("h1").first().text().trim() || $("title").text().trim() || "Untitled";

    // 提取正文（尝试多个常见容器）
    let content = "";
    const contentSelectors = [
      "#Content",
      "#articleContent",
      ".article-content",
      ".main_text",
      ".article-body",
      "[class*='article']",
    ];

    for (const sel of contentSelectors) {
      const el = $(sel);
      if (el.length > 0) {
        content = el.text().trim();
        if (content.length >= MIN_CONTENT_LENGTH) break;
      }
    }

    // 如果选择器都没命中，尝试取 <body> 中所有 <p> 文本
    if (content.length < MIN_CONTENT_LENGTH) {
      content = $("article p, #main p, .content p, p")
        .map((_, el) => $(el).text().trim())
        .get()
        .join("\n\n")
        .trim();
    }

    if (content.length < MIN_CONTENT_LENGTH) return null;

    // 清理内容
    content = this.cleanContent(content);

    // 计算字数并确定最终年级
    const wordCount = this.countWords(content);
    const finalLevel = this.assignLevel(targetLevel, baseLevel, wordCount);

    // 确定文章类型
    const category: ContentCategory = baseLevel === "junior" ? "story" : "news";

    // 生成摘要
    const summary =
      content.length <= 200 ? content : content.substring(0, 150).replace(/\s+\S*$/, "") + "...";

    return {
      title,
      content,
      summary,
      level: finalLevel,
      category,
      sourceName: this.name,
    };
  }

  /**
   * 根据目标年级 + 字数自动分级
   */
  private assignLevel(targetLevel: string, _baseLevel: string, wordCount: number): string {
    const levels = ["primary", "junior", "senior", "college"];
    let idx = levels.indexOf(targetLevel);
    if (idx < 0) idx = 2; // 默认 senior

    // 字数修正
    if (wordCount < 200) idx = Math.max(0, idx - 1);
    else if (wordCount > 800) idx = Math.min(levels.length - 1, idx + 1);

    return levels[idx];
  }

  /** 统计英文单词数 */
  private countWords(text: string): number {
    return text.split(/\s+/).filter((w) => w.length > 0).length;
  }

  /** 清理文章内容 */
  private cleanContent(text: string): string {
    return text
      .replace(/\n{3,}/g, "\n\n")
      .replace(/\s+/g, " ")
      .replace(/Share\s*$/i, "")
      .replace(/Follow\s+chinadaily.*$/i, "")
      .trim();
  }

  /**
   * 解析文章链接为绝对 URL
   * 处理三种格式：
   *   - "//www.chinadaily.com.cn/a/..." → 协议相对 URL
   *   - "/a/202606/26/WSxxxx.html" → 绝对路径
   *   - "https://www.chinadaily.com.cn/a/..." → 完整 URL
   */
  private resolveUrl(href: string): string {
    if (href.startsWith("//")) return `https:${href}`;
    if (href.startsWith("http")) return href;
    return `${CDN_BASE}${href}`;
  }

  /** 发起 HTTP GET 请求（含重试） */
  private async fetchUrl(url: string, retries = 3): Promise<string> {
    const requestConfig = {
      timeout: REQUEST_TIMEOUT,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
      },
      responseType: "text" as const,
      maxRedirects: 3,
    };

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await axios.get<string>(url, requestConfig);
        return response.data;
      } catch (err) {
        const errMsg = (err as Error).message;
        const isDnsError = errMsg.includes("ENOTFOUND");
        const isNetworkError =
          isDnsError || errMsg.includes("ECONNRESET") || errMsg.includes("ETIMEDOUT");

        // 404 不重试
        if (errMsg.includes("404")) throw err;

        // 最后一次重试或非网络错误 → 直接抛出
        if (attempt >= retries || !isNetworkError) throw err;

        // 指数退避：1s, 2s, 4s
        const backoff = 1000 * Math.pow(2, attempt) + Math.random() * 500;
        logger.debug(
          `[${this.name}] retry ${attempt + 1}/${retries} for ${url} after ${Math.round(backoff)}ms (${errMsg})`,
        );
        await this.delay(backoff);
      }
    }

    throw new Error("fetchUrl: unreachable");
  }

  /** 随机延迟 */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
