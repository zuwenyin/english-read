/**
 * 种子数据脚本：从 seed-data.json 导入词书和单词数据
 * 运行方式：npx ts-node --transpile-only src/db/seed.ts
 *
 * 数据来源：DictionaryData（分级分类）+ english-vocabulary（翻译/例句）
 */
import { DatabaseSync } from "node:sqlite";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { cacheClear } from "../utils/cache";

const dbPath = "./data/english-read.db";

// 确保 data 目录存在
const dbDir = dirname(dbPath);
if (!existsSync(dbDir)) {
  mkdirSync(dbDir, { recursive: true });
}

const db = new DatabaseSync(dbPath);
db.exec("PRAGMA foreign_keys = ON");

// 执行建表
const schemaPath = join(__dirname, "..", "db", "schema.sql");
if (existsSync(schemaPath)) {
  const schema = readFileSync(schemaPath, "utf-8");
  db.exec(schema);
}

// 读取种子数据
const seedDataPath = join(__dirname, "..", "db", "seed-data.json");
if (!existsSync(seedDataPath)) {
  console.error("[Seed] ❌ 找不到 seed-data.json，请先运行 process-data.js");
  process.exit(1);
}

interface SeedWord {
  word: string;
  phonetic: string;
  translation: string;
  example_sentence: string;
  difficulty: number;
}

interface SeedBook {
  book_name: string;
  level: string;
  description: string;
  word_count: number;
  words: SeedWord[];
}

interface SeedData {
  generated_at: string;
  source: string;
  books: SeedBook[];
}

const seedRaw = readFileSync(seedDataPath, "utf-8");
const seedData: SeedData = JSON.parse(seedRaw);

console.log(`[Seed] 数据来源: ${seedData.source}`);
console.log(`[Seed] 生成时间: ${seedData.generated_at}`);
console.log(`[Seed] 词书数量: ${seedData.books.length}`);

// 清空旧数据
db.exec("DELETE FROM user_word_progress");
db.exec("DELETE FROM words");
db.exec("DELETE FROM word_books");

// === 插入词书 ===
const insertBook = db.prepare(
  "INSERT INTO word_books (id, name, level, description) VALUES (?, ?, ?, ?)",
);

for (let i = 0; i < seedData.books.length; i++) {
  const book = seedData.books[i];
  insertBook.run(i + 1, book.book_name, book.level, book.description);
  console.log(`  📚 #${i + 1} ${book.book_name} (${book.level})`);
}

// === 插入单词（使用事务提速） ===
const insertWord = db.prepare(
  "INSERT INTO words (word_book_id, word, phonetic, translation, example_sentence, difficulty) VALUES (?, ?, ?, ?, ?, ?)",
);

let totalWords = 0;

db.exec("BEGIN TRANSACTION");

for (let i = 0; i < seedData.books.length; i++) {
  const book = seedData.books[i];
  const bookId = i + 1;
  let bookWordCount = 0;

  for (const w of book.words) {
    insertWord.run(bookId, w.word, w.phonetic, w.translation, w.example_sentence, w.difficulty);
    bookWordCount++;
  }

  const withTrans = book.words.filter((w: SeedWord) => w.translation.length > 0).length;
  console.log(
    `  📝 ${book.book_name}: ${bookWordCount} 单词 (翻译: ${withTrans}/${bookWordCount})`,
  );
  totalWords += bookWordCount;
}

db.exec("COMMIT");

const count = db.prepare("SELECT COUNT(*) as c FROM words").get() as { c: number };
console.log(`\n[Seed] ✅ 完成！${seedData.books.length} 本词书，${count.c} 个单词`);

// 清除后端缓存
cacheClear();
console.log("[Seed] 🧹 后端缓存已清除");

db.close();
