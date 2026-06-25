# 阶段二：数据库层 + Repository 模式实现

> **状态**：✅ 已完成（2026-06-24）
> **关联变更**：数据库驱动从 `better-sqlite3` 切换为 Node.js 内置 `node:sqlite`

**目标**：实现 SQLite 数据库初始化脚本（7 张表）+ Repository 接口 + SQLite 适配实现

---

## Task 2.1：SQLite 数据库初始化 + 7 张表建表脚本

### 数据库表结构（严格按 technical-design.md）

1. `users`: id INTEGER PK, username TEXT UNIQUE, email TEXT UNIQUE NOT NULL, password_hash TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
2. `word_books`: id INTEGER PK, name TEXT, level TEXT (primary/junior/senior/college), description TEXT
3. `words`: id INTEGER PK, word_book_id INTEGER FK REFERENCES word_books(id), word TEXT, phonetic TEXT, translation TEXT, example_sentence TEXT, difficulty INTEGER 1-5
4. `articles`: id INTEGER PK, title TEXT, content TEXT, level TEXT, category TEXT (story/news), questions JSON, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
5. `user_word_progress`: id INTEGER PK, user_id INTEGER FK REFERENCES users(id), word_id INTEGER FK REFERENCES words(id), familiarity INTEGER 1-5, review_count INTEGER DEFAULT 0, last_reviewed DATETIME, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
   - 唯一约束：`(user_id, word_id)` 联合唯一
6. `user_article_progress`: id INTEGER PK, user_id INTEGER FK REFERENCES users(id), article_id INTEGER FK REFERENCES articles(id), answers JSON, completed_at DATETIME
7. `article_words`: id INTEGER PK, article_id INTEGER FK REFERENCES articles(id), word TEXT, translation TEXT, phonetic TEXT

### 执行步骤

1. 创建 `packages/backend/src/db/schema.sql`，包含完整的 `CREATE TABLE` 语句（含外键约束）
2. 创建 `packages/backend/src/config/database.ts`：
   - 导出 `getDatabase()` 函数，返回 `node:sqlite` 的 DatabaseSync 实例
   - 读取 SQLite 数据库文件路径（环境变量 `DB_PATH`，默认 `./data/english-read.db`）
   - 自动执行 `schema.sql` 初始化建表（如果表不存在）
3. 在 `src/index.ts` 中调用数据库初始化
4. 验证：启动后端后，`data/english-read.db` 文件生成，且 7 张表存在

### AI Prompt 模板

```
请实现 english-read 项目的 SQLite 数据库初始化脚本。

【必须遵循的约束】
- 数据库：SQLite（使用 Node.js 内置的 node:sqlite，无需额外安装依赖）
- 必须创建7张表，表结构严格遵循 prod/technical-design.md 第五节
- 文件位置：packages/backend/src/config/database.ts（初始化连接）和 packages/backend/src/db/schema.sql（建表SQL）
- 项目根目录：d:/TraeWorkSpace/english-read/
- 不得修改 prod/technical-design.md 中的数据库表结构

【数据库表结构（严格按 technical-design.md）】
1. users: id INTEGER PK, username TEXT UNIQUE, email TEXT UNIQUE NOT NULL, password_hash TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
2. word_books: id INTEGER PK, name TEXT, level TEXT (primary/junior/senior/college), description TEXT
3. words: id INTEGER PK, word_book_id INTEGER FK REFERENCES word_books(id), word TEXT, phonetic TEXT, translation TEXT, example_sentence TEXT, difficulty INTEGER 1-5
4. articles: id INTEGER PK, title TEXT, content TEXT, level TEXT, category TEXT (story/news), questions JSON, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
5. user_word_progress: id INTEGER PK, user_id INTEGER FK REFERENCES users(id), word_id INTEGER FK REFERENCES words(id), familiarity INTEGER 1-5, review_count INTEGER DEFAULT 0, last_reviewed DATETIME, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
   - 唯一约束：(user_id, word_id) 联合唯一
6. user_article_progress: id INTEGER PK, user_id INTEGER FK REFERENCES users(id), article_id INTEGER FK REFERENCES articles(id), answers JSON, completed_at DATETIME
7. article_words: id INTEGER PK, article_id INTEGER FK REFERENCES articles(id), word TEXT, translation TEXT, phonetic TEXT

【执行步骤】
1. 创建 packages/backend/src/db/schema.sql，包含完整的 CREATE TABLE 语句（含外键约束）
2. 创建 packages/backend/src/config/database.ts：
   - 导出 getDatabase() 函数，返回 node:sqlite 的 DatabaseSync 实例
   - 读取 SQLite 数据库文件路径（环境变量 DB_PATH，默认 ./data/english-read.db）
   - 自动执行 schema.sql 初始化建表（如果表不存在）
3. 在 src/index.ts 中调用数据库初始化
4. 验证：启动后端后，data/english-read.db 文件生成，且7张表存在

【禁止修改】
- 表结构必须与 technical-design.md 第五节完全一致
- 不得修改统一响应格式
- 不得修改 prod/technical-design.md
- 数据库驱动使用 Node.js 内置的 node:sqlite

【验收标准】
- 启动后端后，./data/english-read.db 生成
- 运行 Node.js 脚本验证表数量（SELECT name FROM sqlite_master WHERE type='table' 返回7条记录）
- users 表有 username UNIQUE 约束
- user_word_progress 表有 (user_id, word_id) 联合唯一约束
```

### Harness 约束

- 禁止修改：数据库表结构（必须与 technical-design.md 完全一致）
- 禁止修改：`prod/technical-design.md`
- 禁止删除或更改任何表的字段

### 验收标准

- [x] `data/english-read.db` 文件生成
- [x] 运行 Node.js 脚本验证表数量（SELECT name FROM sqlite_master WHERE type='table' 返回7条记录）
- [x] 表结构（PRAGMA table_info）与 technical-design.md 第五节一致
- [x] 唯一约束正确创建
- [x] 验证脚本示例（创建 verify-db.js）：
  ```javascript
  const { DatabaseSync } = require("node:sqlite");
  const db = new DatabaseSync("./data/english-read.db");
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log("Tables:", tables);
  console.log("Table count:", tables.length); // 应该是 7
  db.close();
  ```

---

## Task 2.2：Repository 接口定义 + SQLite 适配实现

### Repository 接口方法（根据 API 需求定义）

**IUserRepository**:

- `findByUsername(username: string): Promise<UserRecord | null>`
- `findByEmail(email: string): Promise<UserRecord | null>`
- `create(data: CreateUserInput): Promise<UserRecord>`
- `findById(id: number): Promise<UserRecord | null>`
- `update(id: number, data: UpdateUserInput): Promise<UserRecord | null>`

**IWordRepository**:

- `getWordBooks(level?: string): Promise<WordBookRecord[]>`
- `getWordsByBook(bookId: number, page: number, pageSize: number): Promise<PaginatedResult<WordRecord>>`
- `searchWords(keyword: string, bookId?: number): Promise<WordRecord[]>`
- `getWordById(id: number): Promise<WordRecord | null>`

**IArticleRepository**:

- `getArticles(level?: string, category?: string, keyword?: string, page?: number, pageSize?: number): Promise<PaginatedResult<ArticleListItem>>`
- `getArticleById(id: number): Promise<ArticleDetail | null>`
- `getArticleWords(articleId: number): Promise<ArticleWordRecord[]>`
- `searchArticles(keyword: string, level?: string, category?: string, page?: number, pageSize?: number): Promise<PaginatedResult<ArticleListItem>>`

**IProgressRepository**:

- `upsertWordProgress(userId: number, wordId: number, familiarity: number): Promise<WordProgressRecord>`
- `getWordProgressByBook(userId: number, bookId: number): Promise<WordProgressRecord[]>`
- `submitArticleProgress(userId: number, articleId: number, answers: AnswerRecord[]): Promise<ArticleProgressRecord>`
- `getArticleProgress(userId: number, articleId: number): Promise<ArticleProgressRecord | null>`
- `getStatsOverview(userId: number): Promise<StatsOverview>`
- `getRecentProgress(userId: number): Promise<RecentProgress>`

### 执行步骤

1. 完善 `interfaces/` 下的 4 个接口文件，定义上述方法签名
2. 创建 `repositories/sqlite/` 下的 4 个实现类（SqliteUserRepository, SqliteWordRepository, SqliteArticleRepository, SqliteProgressRepository）
3. 创建 `repositories/factory.ts`：根据 `DB_TYPE` 环境变量返回对应 Repository 实例
4. 所有方法使用 node:sqlite 同步 API（`db.prepare().get()/.all()/.run()`），用 `Promise.resolve()` 包装返回
5. 密码存储使用 `bcryptjs.hash()/compare()`（在 Service 层处理，Repository 层只存 hash）
6. `IArticleRepository` 额外包含 `getArticleWords(articleId)` 方法，支撑文章生词预标注功能

### AI Prompt 模板

```
请实现 english-read 项目的 Repository 模式数据访问层。

【必须遵循的约束】
- 采用 Repository 模式，接口与实现分离（technical-design.md 第六节）
- 接口文件：packages/backend/src/repositories/interfaces/I*Repository.ts
- SQLite实现：packages/backend/src/repositories/sqlite/*Repository.ts
- 使用 node:sqlite（同步API）
- 项目根目录：d:/TraeWorkSpace/english-read/

【Repository接口方法（根据API需求定义，已对齐到当前代码）】

IUserRepository:
- findByUsername(username: string): Promise<UserRecord | null>
- findByEmail(email: string): Promise<UserRecord | null>
- create(data: CreateUserInput): Promise<UserRecord>
- findById(id: number): Promise<UserRecord | null>
- update(id: number, data: UpdateUserInput): Promise<UserRecord | null>

IWordRepository:
- getWordBooks(level?: string): Promise<WordBookRecord[]>
- getWordsByBook(bookId: number, page: number, pageSize: number): Promise<PaginatedResult<WordRecord>>
- searchWords(keyword: string, bookId?: number): Promise<WordRecord[]>
- getWordById(id: number): Promise<WordRecord | null>

IArticleRepository:
- getArticles(level?: string, category?: string, keyword?: string, page?: number, pageSize?: number): Promise<PaginatedResult<ArticleListItem>>
- getArticleById(id: number): Promise<ArticleDetail | null>
- getArticleWords(articleId: number): Promise<ArticleWordRecord[]>
- searchArticles(keyword: string, level?: string, category?: string, page?: number, pageSize?: number): Promise<PaginatedResult<ArticleListItem>>

IProgressRepository:
- upsertWordProgress(userId: number, wordId: number, familiarity: number): Promise<WordProgressRecord>
- getWordProgressByBook(userId: number, bookId: number): Promise<WordProgressRecord[]>
- submitArticleProgress(userId: number, articleId: number, answers: AnswerRecord[]): Promise<ArticleProgressRecord>
- getArticleProgress(userId: number, articleId: number): Promise<ArticleProgressRecord | null>
- getStatsOverview(userId: number): Promise<StatsOverview>
- getRecentProgress(userId: number): Promise<RecentProgress>

【执行步骤】
1. 完善 interfaces/ 下的4个接口文件，定义上述方法签名
2. 创建 repositories/sqlite/ 下的4个实现类
3. 创建 repositories/factory.ts：根据 DB_TYPE 环境变量返回对应 Repository 实例
4. 所有方法使用 node:sqlite 同步 API（db.prepare().get()/.all()/.run()）
5. 密码存储使用 bcryptjs.hash()/compare()（在 Service 层处理，Repository 层只存 hash）

【禁止修改】
- Repository 接口方法签名一旦定义，后续任务不得修改（harness约束）
- 不得直接在 Repository 层返回敏感信息（如 password_hash）

【验收标准】
- 所有 Repository 接口文件有完整的方法签名
- SQLite 实现类有完整实现（可暂时返回 mock 数据）
- factory.ts 能根据 DB_TYPE 返回正确实例
- 代码编译通过（tsc --noEmit 无错）
```

### Harness 约束

- 禁止修改：Repository 接口的方法签名（一旦定义，后续任务只能新增不能修改）
- 禁止在 Repository 层处理密码 hash（必须在 Service 层）
- 禁止直接返回 `password_hash` 字段

### 验收标准

- [x] 4 个接口文件有完整方法签名
- [x] 4 个 SQLite 实现类存在且有实现
- [x] `repositories/factory.ts` 导出 `getRepositories()` 函数
- [x] `tsc --noEmit` 编译无错

---

## 实施记录

### 变更说明

数据库驱动从 `better-sqlite3`（需 node-gyp 编译原生模块）切换为 Node.js 22 内置的 `node:sqlite`，实现零依赖、免编译。

| 对比项   | better-sqlite3（旧）                    | node:sqlite（新）                            |
| -------- | --------------------------------------- | -------------------------------------------- |
| 安装方式 | pnpm add better-sqlite3                 | 无需安装（Node 22.5+ 内置）                  |
| 编译要求 | 需要 node-gyp + C++ 编译工具            | 无需编译                                     |
| 导入方式 | `import Database from "better-sqlite3"` | `import { DatabaseSync } from "node:sqlite"` |
| 类型声明 | @types/better-sqlite3                   | @types/node@22 + 本地声明补丁                |
| PRAGMA   | `db.pragma("journal_mode = WAL")`       | `db.exec("PRAGMA journal_mode = WAL")`       |

### 创建的文件

| 文件                                                                   | 说明                                         |
| ---------------------------------------------------------------------- | -------------------------------------------- |
| `packages/backend/src/db/schema.sql`                                   | 7 张表 CREATE TABLE 语句（含外键、唯一约束） |
| `packages/backend/src/config/database.ts`                              | DatabaseSync 单例，自动建表，WAL 模式        |
| `packages/backend/src/config/index.ts`                                 | 环境变量配置（PORT, DB_PATH, JWT_SECRET）    |
| `packages/backend/src/repositories/interfaces/IUserRepository.ts`      | 用户仓储接口                                 |
| `packages/backend/src/repositories/interfaces/IWordRepository.ts`      | 单词仓储接口                                 |
| `packages/backend/src/repositories/interfaces/IArticleRepository.ts`   | 文章仓储接口                                 |
| `packages/backend/src/repositories/interfaces/IProgressRepository.ts`  | 进度仓储接口                                 |
| `packages/backend/src/repositories/sqlite/SqliteUserRepository.ts`     | 用户 SQLite 实现                             |
| `packages/backend/src/repositories/sqlite/SqliteWordRepository.ts`     | 单词 SQLite 实现                             |
| `packages/backend/src/repositories/sqlite/SqliteArticleRepository.ts`  | 文章 SQLite 实现                             |
| `packages/backend/src/repositories/sqlite/SqliteProgressRepository.ts` | 进度 SQLite 实现                             |
| `packages/backend/src/repositories/factory.ts`                         | Repository 工厂函数                          |
| `packages/backend/src/types/node-sqlite.d.ts`                          | node:sqlite TypeScript 类型声明补丁          |
| `packages/backend/src/utils/errors.ts`                                 | 错误类定义                                   |
| `packages/backend/src/utils/response.ts`                               | 统一响应格式                                 |
| `packages/backend/src/middleware/errorHandler.ts`                      | 全局错误处理中间件                           |
| `packages/backend/src/index.ts`                                        | Express 入口，含数据库初始化、health check   |

### 删除/修改的依赖

- ❌ `better-sqlite3` → 从 `package.json` 中移除
- ❌ `@types/better-sqlite3` → 从 devDependencies 中移除
- ✏️ `@types/node` → 从 `^20.0.0` 升级到 `^22.0.0`
- ❌ `pnpm-workspace.yaml` → 移除 `better-sqlite3: true` allowBuilds 条目
