import axios from "axios";
import { ContentFetcher, RawArticle, ContentCategory } from "./types";
import { logger } from "../../utils/logger";

/**
 * Simple English Wikipedia 抓取器
 *
 * 从 simple.wikipedia.org 获取随机百科短文，适合英语学习者。
 * Simple Wikipedia 使用简单的英语词汇（~1500词基础词汇），
 * 文章长度适中，适合 junior ~ senior 年级。
 */
const SIMPLE_WIKI_BASE = "https://simple.wikipedia.org";
const SIMPLE_WIKI_API = `${SIMPLE_WIKI_BASE}/w/api.php`;

interface WikiPageInfo {
  pageid: number;
  title: string;
  extract: string;
}

interface WikiRandomResponse {
  query: {
    random: WikiPageInfo[];
  };
}

const LEVEL_MAX_LENGTH: Record<string, number> = {
  primary: 500,
  junior: 1000,
  senior: 2000,
  college: 4000,
};

export class WikipediaFetcher implements ContentFetcher {
  readonly name = "SimpleWikipedia";

  async fetch(level: string, count: number, _seenUrls?: Set<string>): Promise<RawArticle[]> {
    const maxLength = LEVEL_MAX_LENGTH[level] || 2000;

    // 获取随机页面列表
    const randomResponse = await axios.get<WikiRandomResponse>(SIMPLE_WIKI_API, {
      params: {
        action: "query",
        format: "json",
        list: "random",
        rnnamespace: 0, // 主命名空间（文章）
        rnlimit: Math.min(count * 2, 20), // 每次最多 20
        rnfilterredir: "nonredirects",
        origin: "*",
      },
      timeout: 30_000,
    });

    const pages = randomResponse.data.query.random || [];
    const articles: RawArticle[] = [];

    for (const page of pages) {
      if (articles.length >= count) break;

      try {
        // 获取页面摘要
        const extractResponse = await axios.get<{ query: { pages: Record<string, WikiPageInfo> } }>(
          SIMPLE_WIKI_API,
          {
            params: {
              action: "query",
              format: "json",
              prop: "extracts",
              exintro: 1, // 仅引言部分
              explaintext: 1, // 纯文本
              pageids: page.pageid,
              origin: "*",
            },
            timeout: 30_000,
          },
        );

        const pageData = Object.values(extractResponse.data.query.pages)[0];
        if (!pageData?.extract) continue;

        const content = pageData.extract.trim();

        // 按年级限制内容长度
        let finalContent = content;
        if (content.length > maxLength) {
          // 截断到合适长度，尽量在句号处截断
          const cutoff = content.lastIndexOf(".", maxLength);
          finalContent =
            cutoff > maxLength * 0.5
              ? content.substring(0, cutoff + 1)
              : content.substring(0, maxLength);
        }

        if (finalContent.length < 80) continue;

        const category: ContentCategory = "story"; // 百科文章归为 story

        articles.push({
          title: page.title,
          content: finalContent,
          summary: finalContent.substring(0, 150),
          level,
          category,
          sourceName: this.name,
        });
      } catch {
        // 单页获取失败不影响整体，继续下一页
        continue;
      }

      // 礼貌性延迟，避免触发 Wikipedia 速率限制
      if (articles.length < count) {
        await new Promise((r) => setTimeout(r, 200));
      }
    }

    logger.debug(`[${this.name}] fetched ${articles.length} articles for level=${level}`);
    return articles;
  }
}
