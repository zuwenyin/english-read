import Parser from "rss-parser";
import { ContentFetcher, RawArticle, ContentCategory } from "./types";
import { logger } from "../../utils/logger";

/**
 * Breaking News English 抓取器
 *
 * Breaking News English 提供按 7 级难度（Level 0-6）分级的英语新闻，
 * 每篇新闻有对应难度版本的文章文本。通过 RSS feed 获取。
 *
 * 年级映射：
 *   Level 0-1 → primary
 *   Level 2-3 → junior
 *   Level 4-5 → senior
 *   Level 6   → college
 */
const BNE_RSS_URL = "https://breakingnewsenglish.com/feed.xml";

interface BNEItem {
  title?: string;
  link?: string;
  contentSnippet?: string;
  pubDate?: string;
}

export class BreakingNewsFetcher implements ContentFetcher {
  readonly name = "BreakingNewsEnglish";

  private parser = new Parser<Record<string, unknown>, BNEItem>();

  private levelMapping: Record<string, { min: number; max: number }> = {
    primary: { min: 0, max: 1 },
    junior: { min: 2, max: 3 },
    senior: { min: 4, max: 5 },
    college: { min: 6, max: 6 },
  };

  async fetch(level: string, count: number, _seenUrls?: Set<string>): Promise<RawArticle[]> {
    const feed = await this.parser.parseURL(BNE_RSS_URL);
    const items = (feed.items || []).slice(0, count * 2); // 多拉一些用于筛选

    const articles: RawArticle[] = [];

    for (const item of items) {
      if (articles.length >= count) break;

      const title = item.title?.replace(/\(\d\)$/, "").trim() || "Untitled";
      const rawSnippet = item.contentSnippet || "";
      const link = item.link || "";

      // 尝试从页面链接中提取难度级别
      const bneLevel = this.extractLevel(title, link);

      if (!this.matchesLevel(bneLevel, level)) continue;

      // 从摘要中提取内容片段
      const content = this.cleanContent(rawSnippet);

      if (content.length < 100) continue; // 跳过过短内容

      const category: ContentCategory = bneLevel <= 2 ? "story" : "news";

      articles.push({
        title,
        content,
        summary: content.substring(0, 150) + "...",
        level,
        category,
        sourceName: this.name,
      });
    }

    logger.debug(`[${this.name}] fetched ${articles.length} articles for level=${level}`);
    return articles;
  }

  private extractLevel(title: string, link: string): number {
    // 尝试从标题中提取，如 "Article Title (3)"
    const titleMatch = title.match(/\((\d)\)\s*$/);
    if (titleMatch) return parseInt(titleMatch[1]);

    // 尝试从链接中提取
    const linkMatch = link.match(/level[_-]?(\d)/i);
    if (linkMatch) return parseInt(linkMatch[1]);

    // 根据内容长度估算
    return 3; // 默认中等
  }

  private matchesLevel(bneLevel: number, targetLevel: string): boolean {
    const range = this.levelMapping[targetLevel];
    if (!range) return true;
    return bneLevel >= range.min && bneLevel <= range.max;
  }

  /**
   * 清理 BNE 文章内容，剥离嵌入的练习题/测验部分。
   *
   * BNE 的 RSS contentSnippet 包含整页内容：
   *   1. 文章正文（我们需要的）
   *   2. 练习题（COMPREHENSION QUESTIONS、SYNONYM MATCH 等——不应混入 content）
   * 该方法通过匹配习题节标题来截断，只保留正文部分。
   */
  private cleanContent(raw: string): string {
    // 先做基本空白清理
    let text = raw
      .replace(/\n{3,}/g, "\n\n")
      .replace(/[ \t]+/g, " ")
      .trim();

    // 匹配 BNE 文章结束标记：习题标题或来源声明
    // 这些是常见的练习题节标题，文章正文到此为止
    const exerciseHeaders = [
      /^COMPREHENSION\s+QUESTIONS$/im,
      /^TRUE\s*\/\s*FALSE$/im,
      /^MULTIPLE\s+CHOICE$/im,
      /^SYNONYM\s+MATCH$/im,
      /^PHRASE\s+MATCH$/im,
      /^DISCUSSION$/im,
      /^WRITING$/im,
      /^HOMEWORK$/im,
      /^ROLE\s+PLAY$/im,
      /^GAP\s+FILL$/im,
      /^LISTENING$/im,
      /^SPELLING$/im,
      /^VOCABULARY$/im,
      /^THE\s+ARTICLE$/im,
      /^WARM-?UPS$/im,
      /^CHAT$/im,
      /^BEFORE\s+READING/im,
      /^WHILE\s+READING/im,
      /^AFTER\s+READING/im,
      /^SURVEY$/im,
      /^LANGUAGE$/im,
      /^CLOZE$/im,
      /^PUT\s+THE\s+TEXT$/im,
      /^ROLE\s+PLAY$/im,
      /^HOMEWORK$/im,
      /^STUDENT\s+/im,
      /^QUIZ$/im,
      /^Sources?:/im,
    ];

    // 找到第一个匹配的习题标题位置，在此之前截断
    let cutIndex = text.length;
    for (const re of exerciseHeaders) {
      const match = text.match(re);
      if (match && match.index !== undefined && match.index < cutIndex) {
        cutIndex = match.index;
      }
    }

    if (cutIndex < text.length) {
      text = text.substring(0, cutIndex).trim();
      logger.debug(
        `[${this.name}] stripped exercise section at position ${cutIndex}, remaining: ${text.length} chars`,
      );
    }

    return text;
  }
}
