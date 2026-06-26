import axios from "axios";
import { ContentFetcher, RawArticle, ContentCategory } from "./types";
import { config } from "../../config";
import { logger } from "../../utils/logger";

/**
 * NewsAPI 抓取器
 *
 * 从 newsapi.org 拉取英文新闻头条，按年级难度过滤。
 * 需要 NEWSAPI_KEY 环境变量，未配置时自动跳过。
 *
 * 年级映射策略：
 *   primary → 简短、简单词汇的新闻
 *   junior  → 一般新闻
 *   senior  → 科技/商业新闻
 *   college → 政治/经济/世界新闻
 */
const NEWSAPI_BASE = "https://newsapi.org/v2";

const LEVEL_QUERIES: Record<string, { q: string; sortBy: string; pageSize: number }> = {
  primary: { q: "kids OR children", sortBy: "relevancy", pageSize: 30 },
  junior: { q: "science OR technology OR education", sortBy: "publishedAt", pageSize: 30 },
  senior: { q: "business OR technology OR health", sortBy: "publishedAt", pageSize: 30 },
  college: { q: "world OR politics OR economics", sortBy: "publishedAt", pageSize: 30 },
};

interface NewsApiArticle {
  title: string;
  description: string;
  content: string;
  url: string;
  publishedAt: string;
  source: { name: string };
}

interface NewsApiResponse {
  status: string;
  totalResults: number;
  articles: NewsApiArticle[];
}

export class NewsApiFetcher implements ContentFetcher {
  readonly name = "NewsAPI";

  private enabled: boolean;
  private apiKey: string;

  constructor() {
    this.apiKey = config.newsApiKey;
    this.enabled = !!this.apiKey;
  }

  async fetch(level: string, count: number, _seenUrls?: Set<string>): Promise<RawArticle[]> {
    if (!this.enabled) {
      logger.debug(`[${this.name}] skipped (no NEWSAPI_KEY configured)`);
      return [];
    }

    const query = LEVEL_QUERIES[level] || LEVEL_QUERIES.junior;

    const response = await axios.get<NewsApiResponse>(`${NEWSAPI_BASE}/top-headlines`, {
      params: {
        apiKey: this.apiKey,
        language: "en",
        q: query.q,
        sortBy: query.sortBy,
        pageSize: query.pageSize,
      },
      timeout: 30_000,
    });

    if (response.data.status !== "ok") {
      logger.warn(`[${this.name}] API error: ${response.data.status}`);
      return [];
    }

    const articles: RawArticle[] = [];

    for (const item of response.data.articles) {
      if (articles.length >= count) break;

      const title = item.title || "Untitled";
      const content = item.content || item.description || "";

      // 过滤掉被截断的内容（NewsAPI 经常返回 "[+xxx chars]" 截断）
      const cleanContent = content.replace(/\[\+\d+\s*chars\]$/, "").trim();

      if (cleanContent.length < 100) continue;

      const category: ContentCategory = "news";

      articles.push({
        title,
        content: cleanContent,
        summary: item.description || cleanContent.substring(0, 150),
        level,
        category,
        sourceName: this.name,
      });
    }

    logger.debug(`[${this.name}] fetched ${articles.length} articles for level=${level}`);
    return articles;
  }
}
