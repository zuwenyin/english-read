import type { DatabaseSync } from "node:sqlite";
import { SqliteUserRepository } from "./sqlite/SqliteUserRepository";
import { SqliteWordRepository } from "./sqlite/SqliteWordRepository";
import { SqliteArticleRepository } from "./sqlite/SqliteArticleRepository";
import { SqliteProgressRepository } from "./sqlite/SqliteProgressRepository";

export function getRepositories(db: DatabaseSync) {
  return {
    user: new SqliteUserRepository(db),
    word: new SqliteWordRepository(db),
    article: new SqliteArticleRepository(db),
    progress: new SqliteProgressRepository(db),
  };
}
