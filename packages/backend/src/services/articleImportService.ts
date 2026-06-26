import { IArticleRepository } from "../repositories/interfaces/IArticleRepository";
import { DeepSeekService, EnrichedArticle } from "./deepseekService";
import { ChinaDailyFetcher } from "./content-fetchers/chinadaily";
import { GutenbergFetcher } from "./content-fetchers/gutenberg";
import { BreakingNewsFetcher } from "./content-fetchers/breaking-news";
import type { RawArticle, ContentFetcher } from "./content-fetchers/types";
import { config } from "../config";
import { logger } from "../utils/logger";

/**
 * ArticleImportService — 文章导入管线
 *
 * 流程：多源爬取 → DeepSeek AI 加工（问答+生词） → 去重 → 入库
 *
 * 数据源（按优先级）：
 *   1. China Daily（www.chinadaily.com.cn）—— 英文新闻，国内可直连
 *   2. Project Gutenberg（gutendex.com）—— 公版英文经典/故事
 *   3. Breaking News English（breakingnewsenglish.com）—— ESL 分级新闻
 * AI 加工：DeepSeek API，仅生成阅读题和生词标注，不生成文章正文
 */

export interface FetchResult {
  success: boolean;
  fetched: number;
  inserted: number;
  skipped: number;
  failed: number;
  durationMs: number;
  errors: string[];
  sourceDetails: SourceDetail[];
}

export interface SourceDetail {
  sourceName: string;
  fetched: number;
  errors: string[];
}

const LEVELS = ["primary", "junior", "senior", "college"] as const;

export type LevelCounts = Partial<Record<(typeof LEVELS)[number], number>>;

export class ArticleImportService {
  private fetchers: ContentFetcher[] = [
    new ChinaDailyFetcher(),
    new GutenbergFetcher(),
    new BreakingNewsFetcher(),
  ];
  private deepseek: DeepSeekService;

  constructor(private articleRepo: IArticleRepository) {
    this.deepseek = new DeepSeekService();
  }

  /**
   * 执行完整拉取管线：爬取 → AI 加工 → 去重 → 入库
   * @param counts 每个年级拉取数量，未指定则使用配置默认值
   * @param sources 指定启用的数据源名称列表，不传则使用全部
   */
  async runPipeline(counts?: LevelCounts, sources?: string[]): Promise<FetchResult> {
    const startTime = Date.now();
    const result: FetchResult = {
      success: false,
      fetched: 0,
      inserted: 0,
      skipped: 0,
      failed: 0,
      durationMs: 0,
      errors: [],
      sourceDetails: [],
    };

    try {
      // ============ 阶段 1：多源爬取 ============
      logger.info("[Pipeline] starting multi-source crawl...");
      const rawArticles = await this.fetchFromAllSources(result, counts, sources);
      result.fetched = rawArticles.length;
      logger.info(`[Pipeline] crawled ${result.fetched} raw articles from all sources`);

      if (rawArticles.length === 0) {
        result.durationMs = Date.now() - startTime;
        result.success = false;
        result.errors.push("所有数据源均未能爬取到文章，请检查网络连接");
        return result;
      }

      // ============ 阶段 2：DeepSeek 加工（问答 + 生词） ============
      let enriched: EnrichedArticle[];
      if (this.deepseek.isEnabled) {
        logger.info("[Pipeline] enriching articles with DeepSeek...");
        enriched = await this.deepseek.enrichBatch(rawArticles);
      } else {
        logger.info("[Pipeline] DeepSeek disabled, skipping enrichment");
        enriched = rawArticles.map((a) => ({
          ...a,
          questions: [],
          articleWords: [],
          contentTranslation: "",
        }));
      }

      // ============ 阶段 2b：DeepSeek 翻译（句子级中英对照） ============
      if (this.deepseek.isEnabled) {
        logger.info("[Pipeline] translating articles with DeepSeek...");
        for (const article of enriched) {
          try {
            article.contentTranslation = await this.deepseek.translateContentBySentence(
              article.content,
            );
            logger.info(`[Pipeline] ✓ translated: ${article.title}`);
          } catch (err) {
            logger.warn(
              `[Pipeline] translation failed for "${article.title}": ${(err as Error).message}`,
            );
            article.contentTranslation = "";
          }
        }
      }

      // ============ 阶段 3：去重检测 ============
      const newArticles = await this.deduplicate(enriched, result);
      logger.info(`[Pipeline] after dedup: ${newArticles.length} new, ${result.skipped} skipped`);

      if (newArticles.length === 0) {
        result.durationMs = Date.now() - startTime;
        result.success = true;
        return result;
      }

      // ============ 阶段 4：入库 ============
      await this.saveToDatabase(newArticles, result);

      result.durationMs = Date.now() - startTime;
      result.success = true;
      logger.info(
        `[Pipeline] completed: crawled=${result.fetched}, inserted=${result.inserted}, skipped=${result.skipped}, failed=${result.failed}, duration=${result.durationMs}ms`,
      );
    } catch (err) {
      result.durationMs = Date.now() - startTime;
      result.errors.push(`Pipeline error: ${(err as Error).message}`);
      logger.error(`[Pipeline] failed: ${(err as Error).message}`);
    }

    return result;
  }

  /**
   * 阶段 1：从所有数据源按年级混合爬取
   *
   * 策略：每个年级依次遍历所有源，单个源失败不影响其他源，
   *       直到凑够目标数量。跨源共享 seenUrls 去重。
   */
  private async fetchFromAllSources(
    result: FetchResult,
    counts?: LevelCounts,
    sources?: string[],
  ): Promise<RawArticle[]> {
    const allArticles: RawArticle[] = [];
    // 跨源、跨年级共享 URL 去重集合
    const seenUrls = new Set<string>();

    // 过滤启用的数据源
    const activeFetchers = sources
      ? this.fetchers.filter((f) => sources.includes(f.name))
      : this.fetchers;

    for (const level of LEVELS) {
      const perLevel = counts?.[level] ?? config.articleFetchDefaultCount;
      if (perLevel <= 0) continue;

      const levelArticles: RawArticle[] = [];

      for (const fetcher of activeFetchers) {
        const remaining = perLevel - levelArticles.length;
        if (remaining <= 0) break;

        const detail: SourceDetail = {
          sourceName: `${fetcher.name} (${level})`,
          fetched: 0,
          errors: [],
        };

        try {
          const articles = await fetcher.fetch(level, remaining, seenUrls);
          levelArticles.push(...articles);
          detail.fetched = articles.length;
          logger.debug(`[Pipeline] ${fetcher.name} (${level}): fetched ${articles.length}`);
        } catch (err) {
          const msg = `${fetcher.name} (${level}) failed: ${(err as Error).message}`;
          detail.errors.push(msg);
          logger.warn(`[Pipeline] ${msg}`);
        }

        result.sourceDetails.push(detail);
      }

      allArticles.push(...levelArticles);
      logger.info(
        `[Pipeline] ${level}: total ${levelArticles.length}/${perLevel} from all sources`,
      );
    }

    return allArticles;
  }

  /**
   * 阶段 3：按标题去重（同批次 + 数据库）
   */
  private async deduplicate(
    articles: EnrichedArticle[],
    result: FetchResult,
  ): Promise<EnrichedArticle[]> {
    const seen = new Set<string>();
    const unique: EnrichedArticle[] = [];

    for (const article of articles) {
      const normalizedTitle = article.title.trim().toLowerCase();

      // 同批次内去重
      if (seen.has(normalizedTitle)) {
        result.skipped++;
        continue;
      }
      seen.add(normalizedTitle);

      // 数据库去重
      const exists = await this.articleRepo.checkTitleExists(article.title);
      if (exists) {
        result.skipped++;
        continue;
      }

      unique.push(article);
    }

    return unique;
  }

  /**
   * 阶段 4：逐篇入库（含 article_words）
   */
  private async saveToDatabase(articles: EnrichedArticle[], result: FetchResult): Promise<void> {
    for (const article of articles) {
      try {
        await this.articleRepo.insertArticle(
          article.title,
          article.content,
          article.summary,
          article.level,
          article.category,
          article.sourceName,
          article.questions,
          article.articleWords,
          article.contentTranslation,
        );
        result.inserted++;
      } catch (err) {
        result.failed++;
        result.errors.push(`Insert failed for "${article.title}": ${(err as Error).message}`);
        logger.error(`[Pipeline] insert failed: ${article.title} — ${(err as Error).message}`);
      }
    }
  }
}
