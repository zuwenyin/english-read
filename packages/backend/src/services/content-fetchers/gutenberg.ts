import axios from "axios";
import { ContentFetcher, RawArticle, ContentCategory } from "./types";
import { logger } from "../../utils/logger";

/**
 * Project Gutenberg 抓取器
 *
 * 从 gutendex.com API 获取公版英文短篇故事/书籍章节。
 * Gutenberg 内容按难度分：童话/寓言 → 短篇 → 中篇 → 经典文学。
 *
 * 年级映射：
 *   primary → 童话、寓言（如 Aesop's Fables）
 *   junior  → 短篇冒险故事
 *   senior  → 中篇经典（如 Sherlock Holmes 短篇集）
 *   college → 文学经典（如 Pride and Prejudice）
 */
const GUTENDEX_API = "https://gutendex.com/books";

const LEVEL_TOPICS: Record<string, string> = {
  primary: "fairy tales OR fables OR children stories",
  junior: "adventure OR short stories OR young adult",
  senior: "sherlock holmes OR science fiction OR classic short stories",
  college: "literature OR philosophy OR history",
};

interface GutenbergBook {
  id: number;
  title: string;
  authors: { name: string }[];
  subjects: string[];
  languages: string[];
  formats: Record<string, string>;
}

interface GutendexResponse {
  count: number;
  results: GutenbergBook[];
}

export class GutenbergFetcher implements ContentFetcher {
  readonly name = "ProjectGutenberg";

  async fetch(level: string, count: number, _seenUrls?: Set<string>): Promise<RawArticle[]> {
    const topic = LEVEL_TOPICS[level] || LEVEL_TOPICS.junior;

    const response = await axios.get<GutendexResponse>(GUTENDEX_API, {
      params: {
        search: topic,
        languages: "en",
        mime_type: "text/plain",
        page_size: Math.min(count * 2, 50),
      },
      timeout: 30_000,
    });

    const books = response.data.results || [];
    const articles: RawArticle[] = [];

    for (const book of books) {
      if (articles.length >= count) break;

      const textUrl =
        book.formats?.["text/plain; charset=utf-8"] ||
        book.formats?.["text/plain"] ||
        book.formats?.["text/plain; charset=us-ascii"];

      if (!textUrl) continue;

      try {
        const textResponse = await axios.get<string>(textUrl, {
          timeout: 15000,
          responseType: "text",
        });

        const text = textResponse.data;

        // 提取第一章（前 5000 字符）作为内容
        const chapterStart = this.findChapterStart(text);
        let excerpt = chapterStart
          ? text.substring(chapterStart).substring(0, 5000)
          : text.substring(0, 5000);

        excerpt = this.cleanText(excerpt);

        if (excerpt.length < 200) continue;

        // 构造标题：书名 + 章节
        const title = book.title.replace(/\s*\(.*\)$/, "").trim();

        articles.push({
          title,
          content: excerpt,
          summary: excerpt.substring(0, 150) + "...",
          level,
          category: "story" as ContentCategory,
          sourceName: this.name,
        });
      } catch {
        // 单本书下载失败不影响整体
        logger.debug(`[${this.name}] failed to download book ${book.id}`);
        continue;
      }
    }

    logger.debug(`[${this.name}] fetched ${articles.length} articles for level=${level}`);
    return articles;
  }

  private findChapterStart(text: string): number {
    // 查找第一章的多种形式
    const patterns = [
      /\n\s*CHAPTER\s+(I|1|ONE)[\s.\n]/i,
      /\n\s*Chapter\s+(I|1|ONE)[\s.\n]/,
      /\n\s*I\.\s+\n/,
      /\n\s*1\.\s+\n/,
    ];
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match.index !== undefined) {
        return match.index;
      }
    }
    return 0;
  }

  private cleanText(text: string): string {
    return text
      .replace(/\r\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/\s+/g, " ")
      .replace(/_/g, "") // Gutenberg 用 _斜体_ 标记
      .trim();
  }
}
