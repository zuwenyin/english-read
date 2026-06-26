import { config as dotenvConfig } from "dotenv";
import { resolve } from "path";

// 加载 .env 文件（项目根目录）
dotenvConfig({ path: resolve(__dirname, "..", "..", "..", "..", ".env") });

export const config = {
  port: parseInt(process.env.PORT || "3000", 10),
  dbType: process.env.DB_TYPE || "sqlite",
  dbPath: process.env.DB_PATH || "./data/english-read.db",
  jwtSecret: process.env.JWT_SECRET || "dev-secret-change-in-production",
  logLevel: process.env.LOG_LEVEL || "info",
  /** DeepSeek API Key（用于生成文章问答和生词标注） */
  deepseekApiKey: process.env.DEEPSEEK_API_KEY || "",
  /** NewsAPI Key（用于拉取英文新闻，可选） */
  newsApiKey: process.env.NEWSAPI_KEY || "",
  /** 是否启用定时拉取 */
  cronEnabled: process.env.CRON_ENABLED === "true",
  /** 文章拉取每个年级默认数量 */
  articleFetchDefaultCount: parseInt(process.env.ARTICLE_FETCH_COUNT || "3", 10),
};
