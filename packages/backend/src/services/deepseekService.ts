import OpenAI from "openai";
import { config } from "../config";
import { logger } from "../utils/logger";
import type { Question } from "../repositories/interfaces/IArticleRepository";
import type { RawArticle } from "./content-fetchers/types";

/**
 * DeepSeekService — 使用 DeepSeek API 加工文章
 *
 * 功能：
 * 1. 为文章生成 4 道阅读理解题（含选项 + 解析）
 * 2. 为文章标注 5 个核心生词（含音标 + 中文释义）
 *
 * 批量策略：每 2 篇文章合并为一次 API 调用
 */
export interface EnrichedArticle extends RawArticle {
  questions: Question[];
  articleWords: ArticleWordItem[];
  contentTranslation: string; // JSON: [{text, translation}, ...] 段落级翻译
}

export interface ArticleWordItem {
  word: string;
  translation: string;
  phonetic: string;
}

const ENRICH_BATCH_SIZE = 2; // 降到 2 篇/批，避免 JSON 响应超出 max_tokens

const SYSTEM_PROMPT = `You are an English teaching assistant. For each English article provided, you must:

1. Generate exactly 4 reading comprehension questions IN ENGLISH that test understanding of the article. Each question must have:
   - "question": the question text in English
   - "options": array of 4 answer choices IN ENGLISH — DO NOT include letter prefixes (A., B., C., D.) in the option text. Just the answer text itself, e.g. "In the Tang Dynasty" not "A. In the Tang Dynasty"
   - "answer": the correct answer (exactly matching the TEXT of one of the options, without any letter prefix)
   - "explanation": brief explanation in Chinese (帮助中国学生理解)

2. Extract exactly 5 key vocabulary words from the article. Each word must have:
   - "word": the English word
   - "translation": Chinese translation
   - "phonetic": International Phonetic Alphabet (IPA) notation

CRITICAL: Return ONLY valid JSON. No markdown code blocks, no extra text.
The JSON must have exactly this structure:
{
  "articles": [
    {
      "index": 0,
      "questions": [{ "question": "...", "options": ["In the Tang Dynasty","In 2014","In July 2024","In 2023"], "answer": "In 2014", "explanation": "..." }],
      "words": [{ "word": "...", "translation": "...", "phonetic": "/.../" }]
    }
  ]
}`;

export class DeepSeekService {
  private client: OpenAI | null = null;
  private enabled: boolean;

  constructor() {
    this.enabled = !!config.deepseekApiKey;
    if (this.enabled) {
      this.client = new OpenAI({
        apiKey: config.deepseekApiKey,
        baseURL: "https://api.deepseek.com",
      });
      logger.info("[DeepSeek] service initialized");
    } else {
      logger.info("[DeepSeek] disabled (no DEEPSEEK_API_KEY)");
    }
  }

  /** 是否已启用 */
  get isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * 批量加工文章：为每篇文章生成 questions 和 article_words
   */
  async enrichBatch(articles: RawArticle[]): Promise<EnrichedArticle[]> {
    if (!this.enabled || !this.client) {
      logger.debug("[DeepSeek] skipped enrich (service disabled)");
      return articles.map((a) => ({
        ...a,
        questions: [],
        articleWords: [],
        contentTranslation: "",
      }));
    }

    const enriched: EnrichedArticle[] = [];

    const totalBatches = Math.ceil(articles.length / ENRICH_BATCH_SIZE);

    for (let i = 0; i < articles.length; i += ENRICH_BATCH_SIZE) {
      const batch = articles.slice(i, i + ENRICH_BATCH_SIZE);
      const batchNum = Math.floor(i / ENRICH_BATCH_SIZE) + 1;
      logger.info(`[DeepSeek] batch ${batchNum}/${totalBatches}: ${batch.length} articles`);

      try {
        const batchResults = await this.processBatch(batch);
        for (const article of batchResults) {
          logger.info(`[DeepSeek] ✓ enriched: ${article.title}`);
        }
        enriched.push(...batchResults);
      } catch (err) {
        logger.error(
          `[DeepSeek] batch enrich failed (${i}-${i + batch.length}): ${(err as Error).message}`,
        );
        // 降级：AI 失败时文章仍可入库，不含 questions/words
        enriched.push(
          ...batch.map((a) => ({ ...a, questions: [], articleWords: [], contentTranslation: "" })),
        );
      }
    }

    return enriched;
  }

  private async processBatch(articles: RawArticle[]): Promise<EnrichedArticle[]> {
    if (!this.client) throw new Error("Client not initialized");

    const userMessage = articles
      .map(
        (a, idx) =>
          `--- Article ${idx} (Level: ${a.level}, Type: ${a.category}) ---\nTitle: ${a.title}\n\nContent:\n${a.content.substring(0, 3000)}`,
      )
      .join("\n\n");

    const response = await this.client.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
      temperature: 0.7,
      max_tokens: 8192,
    });

    const choice = response.choices[0];
    const rawContent = choice?.message?.content || "{}";
    const finishReason = choice?.finish_reason;

    // 检查是否因 token 限制被截断
    if (finishReason === "length") {
      logger.warn(
        `[DeepSeek] response truncated (finish_reason=length), max_tokens may be insufficient for ${articles.length} articles`,
      );
    }

    // 解析 JSON 响应
    let parsed: { articles: EnrichResult[] };
    try {
      // 尝试直接解析
      parsed = JSON.parse(rawContent);
    } catch (firstErr) {
      // 如果被 markdown 包裹，提取 JSON 块
      const jsonMatch = rawContent.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[1]);
        } catch {
          logger.error(
            `[DeepSeek] JSON parse failed in markdown block, first 500 chars: ${jsonMatch[1].substring(0, 500)}`,
          );
          throw new Error("Failed to parse DeepSeek response as JSON");
        }
      } else {
        // 尝试修复截断的 JSON：找到最后一个完整的 article 对象
        const repaired = tryRepairTruncatedJson(rawContent);
        if (!repaired) {
          logger.error(
            `[DeepSeek] JSON parse failed (finish_reason=${finishReason}), raw (first 500): ${rawContent.substring(0, 500)}`,
          );
          throw new Error("Failed to parse DeepSeek response as JSON");
        }
        parsed = repaired;
        logger.warn(
          `[DeepSeek] salvaged ${parsed.articles.length}/${articles.length} articles from truncated JSON`,
        );
      }
    }

    return articles.map((article, idx) => {
      const enrich = parsed.articles?.find((e: EnrichResult) => e.index === idx);
      if (!enrich) {
        logger.warn(
          `[DeepSeek] no enrichment for article index=${idx}: "${article.title.substring(0, 60)}"`,
        );
      }
      // 清洗选项：去掉 AI 偶尔输出的 "A. " / "B．" 等字母前缀
      // 并将 answer 从文本转为字母（A/B/C/D），与前端发送的 selected 格式对齐
      const questions = (enrich?.questions || []).map((q) => {
        const cleanOptions = q.options.map((opt) => stripOptionPrefix(opt));
        const answerIndex = cleanOptions.findIndex((opt) => opt === stripOptionPrefix(q.answer));
        const answer = answerIndex >= 0 ? String.fromCharCode(65 + answerIndex) : q.answer;
        return { ...q, options: cleanOptions, answer };
      });
      return {
        ...article,
        questions,
        articleWords: enrich?.words || [],
        contentTranslation: "",
      };
    });
  }

  /**
   * 为单篇文章生成段落级中英文对照翻译。
   * 将 HTML 内容去标签后按段落拆分，逐段翻译，返回 JSON 字符串。
   * 自动检测原文语言：英文→中文，中文→英文。
   * 翻译失败时返回空字符串（降级），不影响文章入库。
   */
  async translateContent(content: string): Promise<string> {
    if (!this.enabled || !this.client) return "";

    // 去 HTML 标签，先保留换行结构，再清理标签
    const plainText = content
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<p[^>]*>/gi, "\n")
      .replace(/<\/p>/gi, "")
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"');

    // 按双换行 + 单换行拆分为段落
    const rawParagraphs = plainText
      .split(/\n+/)
      .map((p) => p.replace(/\s+/g, " ").trim())
      .filter((p) => p.length > 10);

    if (rawParagraphs.length === 0) {
      logger.debug("[DeepSeek] translateContent: no paragraphs found");
      return "";
    }

    // 检测原文语言：中文字符占比 > 30% 则认为是中文文章
    const chineseCharCount = (rawParagraphs.join("").match(/[\u4e00-\u9fff]/g) || []).length;
    const totalLength = rawParagraphs.join("").length;
    const isChineseArticle = totalLength > 0 && chineseCharCount / totalLength > 0.3;
    const sourceLang = isChineseArticle ? "Chinese" : "English";
    const targetLang = isChineseArticle ? "English" : "Chinese";

    // 限制段落数以控制 API 调用 tokens
    const maxParagraphs = 8;
    const paragraphs =
      rawParagraphs.length > maxParagraphs ? rawParagraphs.slice(0, maxParagraphs) : rawParagraphs;

    logger.info(
      `[DeepSeek] translateContent: ${rawParagraphs.length} raw paragraphs, ` +
        `using ${paragraphs.length} (${sourceLang}→${targetLang})`,
    );

    try {
      const response = await this.client.chat.completions.create({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: `You are a translator. I will send you ${sourceLang} paragraphs. Translate each into ${targetLang}.
You MUST return ONLY a JSON object in this exact format:
{"translations": ["translation1", "translation2", ...]}

Rules:
- No markdown, no code fences, no extra text before or after the JSON
- The translations array MUST have exactly ${paragraphs.length} items
- Keep proper names in original form
- Output raw JSON only, starting with { and ending with }`,
          },
          {
            role: "user",
            content: paragraphs.map((p, i) => `[${i}] ${p}`).join("\n\n"),
          },
        ],
        temperature: 0.3,
        max_tokens: 4096,
      });

      const rawContent = response.choices[0]?.message?.content || "";
      const finishReason = response.choices[0]?.finish_reason;

      if (finishReason === "length") {
        logger.warn("[DeepSeek] translateContent truncated (finish_reason=length)");
      }

      // 解析翻译结果（多重回退策略）
      let translations: string[] = [];

      const tryParseJson = (text: string): string[] | null => {
        // 策略1：直接 JSON 解析
        try {
          const parsed = JSON.parse(text);
          if (parsed.translations && Array.isArray(parsed.translations)) {
            return parsed.translations;
          }
        } catch {
          // continue
        }

        // 策略2：提取 ```json ... ``` 代码块
        const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (codeBlockMatch) {
          try {
            const parsed = JSON.parse(codeBlockMatch[1]);
            if (parsed.translations && Array.isArray(parsed.translations)) {
              return parsed.translations;
            }
          } catch {
            // continue
          }
        }

        // 策略3：尝试提取任何 {...} JSON 对象
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            const parsed = JSON.parse(jsonMatch[0]);
            if (parsed.translations && Array.isArray(parsed.translations)) {
              return parsed.translations;
            }
          } catch {
            // continue
          }
        }

        // 策略4：修复 JSON 字符串内未转义的双引号后重试
        const repaired = tryRepairJson(text);
        if (repaired) {
          try {
            const parsed = JSON.parse(repaired);
            if (parsed.translations && Array.isArray(parsed.translations)) {
              logger.debug(
                `[DeepSeek] translateContent: JSON repaired, got ${parsed.translations.length} translations`,
              );
              return parsed.translations;
            }
          } catch {
            // continue
          }
        }

        return null;
      };

      /** 修复 translations JSON 数组内未转义的 ASCII 双引号 */
      const tryRepairJson = (raw: string): string | null => {
        const arrayStart = raw.indexOf('"translations"');
        if (arrayStart === -1) return null;

        const bracketStart = raw.indexOf("[", arrayStart);
        if (bracketStart === -1) return null;

        // 从末尾找最后一个 ]，作为数组结束位置
        let bracketEnd = -1;
        for (let i = raw.length - 1; i >= bracketStart; i--) {
          if (raw[i] === "]") {
            bracketEnd = i;
            break;
          }
        }
        if (bracketEnd === -1) return null;

        const prefix = raw.substring(0, bracketStart + 1);
        const suffix = raw.substring(bracketEnd);
        const arrayContent = raw.substring(bracketStart + 1, bracketEnd);

        // 扫描数组内容：识别字符串边界，修复内部未转义的双引号
        let repaired = "";
        let inString = false;

        for (let i = 0; i < arrayContent.length; i++) {
          const ch = arrayContent[i];

          if (ch === "\\" && i + 1 < arrayContent.length) {
            // 保留已有的转义序列
            repaired += ch + arrayContent[i + 1];
            i++;
          } else if (ch === '"' && !inString) {
            inString = true;
            repaired += ch;
          } else if (ch === '"' && inString) {
            // 检查是否为结构性闭引号（后跟 , 或 ]）
            const rest = arrayContent.substring(i + 1);
            if (/^\s*[,\]]/.test(rest)) {
              inString = false;
              repaired += ch;
            } else {
              // 字符串内部的未转义引号 → 转义
              repaired += '\\"';
            }
          } else {
            repaired += ch;
          }
        }

        return prefix + repaired + suffix;
      };

      const jsonResult = tryParseJson(rawContent);
      if (jsonResult) {
        translations = jsonResult;
      } else {
        // 策略5：模型直接回了纯文本翻译，尝试按双换行拆分
        logger.debug(
          `[DeepSeek] translateContent: JSON parse failed, trying plain-text fallback. ` +
            `First 200: ${rawContent.substring(0, 200)}`,
        );
        const lines = rawContent
          .split(/\n{2,}/)
          .map((l) => l.replace(/\s+/g, " ").trim())
          .filter((l) => l.length > 0);
        if (lines.length >= 1 && lines.length <= paragraphs.length * 2) {
          translations = lines;
        } else {
          // 策略6：整个响应当一段翻译
          translations = [rawContent.trim()];
        }
      }

      // 补齐或截断 translations 到与 paragraphs 对齐
      while (translations.length < paragraphs.length) {
        translations.push("");
      }
      if (translations.length > paragraphs.length) {
        translations = translations.slice(0, paragraphs.length);
      }

      // 组装段落级翻译对
      const result = paragraphs.map((text, i) => ({
        text,
        translation: translations[i] || "",
      }));

      logger.info(`[DeepSeek] translateContent: got ${result.length} translations`);
      return JSON.stringify(result);
    } catch (err) {
      logger.error(`[DeepSeek] translateContent failed: ${(err as Error).message}`);
      return "";
    }
  }

  /**
   * 为单篇文章生成句子级中英文对照翻译。
   * 与 translateContent() 的区别：让 AI 自行切分句子，输出逐句对照格式。
   * 返回新格式 JSON：`[{"sentences":[{"en":"...","zh":"..."}]}]`
   */
  async translateContentBySentence(content: string): Promise<string> {
    if (!this.enabled || !this.client) return "";

    // 去 HTML 标签（与 translateContent 共享逻辑）
    const plainText = content
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<p[^>]*>/gi, "\n")
      .replace(/<\/p>/gi, "")
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"');

    const rawParagraphs = plainText
      .split(/\n+/)
      .map((p) => p.replace(/\s+/g, " ").trim())
      .filter((p) => p.length > 10);

    if (rawParagraphs.length === 0) {
      logger.debug("[DeepSeek] translateContentBySentence: no paragraphs found");
      return "";
    }

    // 检测语言
    const chineseCharCount = (rawParagraphs.join("").match(/[\u4e00-\u9fff]/g) || []).length;
    const totalLength = rawParagraphs.join("").length;
    const isChineseArticle = totalLength > 0 && chineseCharCount / totalLength > 0.3;
    const sourceLang = isChineseArticle ? "Chinese" : "English";
    const targetLang = isChineseArticle ? "English" : "Chinese";

    const maxParagraphs = 8;
    const paragraphs =
      rawParagraphs.length > maxParagraphs ? rawParagraphs.slice(0, maxParagraphs) : rawParagraphs;

    logger.info(
      `[DeepSeek] translateContentBySentence: ${rawParagraphs.length} raw paragraphs, ` +
        `using ${paragraphs.length} (${sourceLang}→${targetLang})`,
    );

    try {
      const response = await this.client.chat.completions.create({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: `You are a translator. I will send you ${sourceLang} paragraphs.
For each paragraph, split it into sentences and translate each sentence into ${targetLang}.
You MUST return ONLY a JSON object in this exact format:
{"paragraphs":[{"sentences":[{"en":"sentence1","zh":"translation1"},{"en":"sentence2","zh":"translation2"}]}]}

Rules:
- The "en" field always contains the original ${sourceLang} sentence
- The "zh" field always contains the ${targetLang} translation (regardless of actual language directions, use "en" for original and "zh" for translation)
- Split carefully: abbreviations (Mr., Dr., U.S., e.g., etc.) are NOT sentence boundaries
- Keep proper names in original form
- No markdown, no code fences, no extra text before or after the JSON
- The paragraphs array MUST have exactly ${paragraphs.length} items
- Output raw JSON only, starting with { and ending with }`,
          },
          {
            role: "user",
            content: paragraphs.map((p, i) => `[${i}] ${p}`).join("\n\n"),
          },
        ],
        temperature: 0.3,
        max_tokens: 8192,
      });

      const rawContent = response.choices[0]?.message?.content || "";
      const finishReason = response.choices[0]?.finish_reason;

      if (finishReason === "length") {
        logger.warn("[DeepSeek] translateContentBySentence truncated (finish_reason=length)");
      }

      // 解析返回的 JSON（复用多重回退策略）
      type SentencePair = { en: string; zh: string };
      type ParagraphOutput = { sentences: SentencePair[] };
      let paragraphsOutput: ParagraphOutput[] = [];

      const tryParse = (text: string): ParagraphOutput[] | null => {
        // 策略1：直接 JSON 解析
        try {
          const parsed = JSON.parse(text);
          if (parsed.paragraphs && Array.isArray(parsed.paragraphs)) {
            return parsed.paragraphs;
          }
        } catch {
          // continue
        }

        // 策略2：提取 ```json ... ``` 代码块
        const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (codeBlockMatch) {
          try {
            const parsed = JSON.parse(codeBlockMatch[1]);
            if (parsed.paragraphs && Array.isArray(parsed.paragraphs)) {
              return parsed.paragraphs;
            }
          } catch {
            // continue
          }
        }

        // 策略3：提取任何 {...} JSON 对象
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            const parsed = JSON.parse(jsonMatch[0]);
            if (parsed.paragraphs && Array.isArray(parsed.paragraphs)) {
              return parsed.paragraphs;
            }
          } catch {
            // continue
          }
        }

        return null;
      };

      const parsed = tryParse(rawContent);
      if (parsed) {
        paragraphsOutput = parsed;
      } else {
        // 降级：返回空数组格式
        logger.warn(
          `[DeepSeek] translateContentBySentence: JSON parse failed. ` +
            `First 200: ${rawContent.substring(0, 200)}`,
        );
        paragraphsOutput = paragraphs.map((text) => ({
          sentences: [{ en: text, zh: "" }],
        }));
      }

      // 补齐或截断到与 paragraphs 对齐
      while (paragraphsOutput.length < paragraphs.length) {
        paragraphsOutput.push({ sentences: [] });
      }
      if (paragraphsOutput.length > paragraphs.length) {
        paragraphsOutput = paragraphsOutput.slice(0, paragraphs.length);
      }

      // 输出新格式：段落数组，每段包含 sentences 数组
      const result = paragraphsOutput.map((p) => ({
        sentences: p.sentences || [],
      }));

      logger.info(
        `[DeepSeek] translateContentBySentence: got ${result.length} paragraphs, ` +
          `${result.reduce((sum, p) => sum + p.sentences.length, 0)} sentences total`,
      );
      return JSON.stringify(result);
    } catch (err) {
      logger.error(`[DeepSeek] translateContentBySentence failed: ${(err as Error).message}`);
      return "";
    }
  }
}

interface EnrichResult {
  index: number;
  questions: Question[];
  words: ArticleWordItem[];
}

/**
 * 清洗选项文本中的字母前缀。
 * 去掉 "A. "、"B．"、"C、"、" D) " 等变体，返回纯选项文本。
 */
export function stripOptionPrefix(opt: string): string {
  return opt.replace(/^[A-D][.．、)）]\s*/i, "").trim();
}

/**
 * 尝试修复被截断的 JSON 响应。
 * 当 max_tokens 不足导致 JSON 不完整时，尝试找回最后一个完整的 article 对象。
 * 返回修复后的 parsed 对象，如完全无法修复则返回 null。
 */
function tryRepairTruncatedJson(raw: string): { articles: EnrichResult[] } | null {
  // 策略：从后往前找，尝试在最后一个完整的 article 对象后补上 ]}
  // 先尝试直接补全常见截断模式
  const repairAttempts = [
    // 截断在数组中间某个对象之后
    raw + "\n    }\n  ]\n}",
    // 截断在字符串中间
    raw.replace(/"[^"]*$/, '"') + "\n    }\n  ]\n}",
    // 截断在 options 数组中间
    raw + "]\n        }\n      ]\n    }\n  ]\n}",
  ];

  for (const attempt of repairAttempts) {
    try {
      const parsed = JSON.parse(attempt);
      if (parsed.articles && Array.isArray(parsed.articles)) {
        return parsed as { articles: EnrichResult[] };
      }
    } catch {
      // 继续尝试
    }
  }

  // 更精确的策略：找到最后一个完整的 "index": N 对象
  const articleStarts = [...raw.matchAll(/\{\s*"index":\s*(\d+)/g)];
  if (articleStarts.length === 0) return null;

  // 从最后一个 article 开始处截断并补全
  for (let i = articleStarts.length - 1; i >= 0; i--) {
    const startIdx = articleStarts[i].index!;
    const prefix = raw.substring(0, startIdx);
    // 尝试补全后缀
    const suffix = "\n    }\n  ]\n}";
    try {
      const parsed = JSON.parse(prefix + suffix);
      if (parsed.articles && Array.isArray(parsed.articles)) {
        return parsed as { articles: EnrichResult[] };
      }
    } catch {
      // 继续尝试更早的 article
    }
  }

  return null;
}
