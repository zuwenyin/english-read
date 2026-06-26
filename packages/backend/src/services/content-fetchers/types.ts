/**
 * ContentFetcher — 统一的内容源抓取接口
 *
 * 每个外部内容源实现此接口，按年级返回标准化文章数据。
 * Pipeline 编排层通过此接口调度所有源，便于新增/移除来源。
 */

/** 在 DB 入库前的中间态 */
export type ContentCategory = "story" | "news";

export interface RawArticle {
  title: string;
  content: string;
  summary: string;
  /** 年级阶段：primary | junior | senior | college */
  level: string;
  /** 文章类型 */
  category: ContentCategory;
  /** 来源标识，用于日志和追溯 */
  sourceName: string;
}

export interface ContentFetcher {
  /** 抓取器唯一标识 */
  readonly name: string;
  /** 获取指定年级的文章列表 */
  fetch(level: string, count: number, seenUrls?: Set<string>): Promise<RawArticle[]>;
}

/** 年级 → 内容难度描述（用于 AI prompt 和内容筛选） */
export const LEVEL_DESCRIPTIONS: Record<string, string> = {
  primary:
    "English for primary school students (Grade 1-6), very simple vocabulary, short sentences",
  junior:
    "English for junior high school students (Grade 7-9), basic vocabulary, simple paragraphs",
  senior:
    "English for senior high school students (Grade 10-12), intermediate vocabulary, narrative and expository texts",
  college:
    "English for college students (CET-4/6 level), advanced vocabulary, argumentative and academic texts",
};
