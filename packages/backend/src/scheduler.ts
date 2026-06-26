import cron from "node-cron";
import { config } from "./config";
import { ArticleImportService } from "./services/articleImportService";
import { logger } from "./utils/logger";
import type { IArticleRepository } from "./repositories/interfaces/IArticleRepository";

/**
 * Scheduler — 文章定时拉取调度器
 *
 * 每天早上 8:00 (UTC+8 = 北京时区) 自动执行文章采集管线。
 * 通过 CRON_ENABLED 环境变量控制开关。
 */
export function startArticleScheduler(articleRepo: IArticleRepository): () => void {
  if (!config.cronEnabled) {
    logger.info("[Scheduler] cron disabled (CRON_ENABLED=false), skipping auto fetch");
    return () => {};
  }

  const service = new ArticleImportService(articleRepo);

  // cron 表达式：每天 8:00（服务器时间）
  // 分钟 小时 日 月 星期
  const task = cron.schedule("0 8 * * *", async () => {
    logger.info("[Scheduler] triggered — starting daily article import");
    try {
      const result = await service.runPipeline();
      logger.info(
        `[Scheduler] daily import completed: ${result.inserted} inserted, ${result.skipped} skipped, ${result.failed} failed`,
      );
    } catch (err) {
      logger.error(`[Scheduler] daily import crashed: ${(err as Error).message}`);
    }
  });

  logger.info("[Scheduler] started — daily article fetch scheduled at 08:00");
  return () => task.stop();
}
