import { DatabaseSync } from "node:sqlite";
import { readFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { config } from "./index";

let db: DatabaseSync | null = null;

/**
 * 获取 SQLite 数据库单例
 * - 首次调用时初始化数据库文件并执行 schema.sql 建表
 * - 启用 WAL 模式提升并发读取性能
 * - 启用外键约束
 */
export function getDatabase(): DatabaseSync {
  if (db) return db;

  // 确保 data 目录存在
  const dbDir = dirname(config.dbPath);
  if (!existsSync(dbDir)) {
    mkdirSync(dbDir, { recursive: true });
  }

  db = new DatabaseSync(config.dbPath);

  // 性能优化：WAL 模式
  db.exec("PRAGMA journal_mode = WAL");
  // 启用外键约束
  db.exec("PRAGMA foreign_keys = ON");

  // 执行建表脚本
  const schemaPath = join(__dirname, "..", "db", "schema.sql");
  const schema = readFileSync(schemaPath, "utf-8");
  db.exec(schema);

  console.log(`[Database] Initialized: ${config.dbPath}`);

  return db;
}

/**
 * 关闭数据库连接（用于优雅退出）
 */
export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}
