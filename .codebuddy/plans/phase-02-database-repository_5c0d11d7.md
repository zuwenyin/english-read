---
name: phase-02-database-repository
overview: 实施阶段二：SQLite 数据库初始化（7张表）+ Repository 接口（已有）对应的 SQLite 适配实现，并将阶段二文档中的方法名对齐到现有接口代码。
todos:
  - id: update-phase02-doc
    content: 更新 phase-02-database-repository.md 中 Task 2.2 的 AI Prompt，将方法名对齐到现有接口代码（update、getWordsByBook、submitArticleProgress、getWordProgressByBook）
    status: completed
  - id: database-init
    content: 创建 schema.sql（7 张表 DDL）和 database.ts（getDatabase 单例），在 index.ts 中集成数据库初始化调用
    status: completed
  - id: repo-user-word
    content: 实现 SqliteUserRepository 和 SqliteWordRepository，包含所有接口方法的 SQL 查询
    status: completed
    dependencies:
      - database-init
  - id: repo-article-progress
    content: 实现 SqliteArticleRepository 和 SqliteProgressRepository，包含所有接口方法的 SQL 查询
    status: completed
    dependencies:
      - database-init
  - id: factory-verify
    content: 创建 repositories/factory.ts 工厂函数，运行 tsc --noEmit 验证编译通过
    status: completed
    dependencies:
      - repo-user-word
      - repo-article-progress
---

## 用户需求

执行 `prod/phase-02-database-repository.md` 阶段二开发任务，包含两个子任务：

1. **Task 2.1**：SQLite 数据库初始化 + 7 张建表脚本（users, word_books, words, articles, user_word_progress, user_article_progress, article_words）
2. **Task 2.2**：Repository 接口的 SQLite 适配实现（SqliteUserRepository, SqliteWordRepository, SqliteArticleRepository, SqliteProgressRepository）+ Repository 工厂

## 已确认决策（方案 A）

阶段二文档中的 AI Prompt 方法名与已有接口代码不一致。以**现有接口代码为准**（接口设计比文档更完善），实施前需更新阶段二文档中的方法名引用使其对齐。

## 当前项目状态

- 4 个 Repository 接口文件已在 `repositories/interfaces/` 下完整定义，含完整类型
- `config/index.ts` 已有 dbType、dbPath 配置
- 统一响应格式（success/fail）、错误处理（AppError）、Express 服务器已就绪
- 依赖已安装：better-sqlite3 ^11.0.0、bcrypt、jsonwebtoken、zod
- `.gitignore` 已配置忽略 `data/` 和 `*.db`
- **缺失**：schema.sql、database.ts、4 个 SQLite 实现类、factory.ts、index.ts 中的数据库初始化调用

## 技术方案

### 实现策略

分三步执行：**文档对齐 → 数据库初始化 → Repository 实现**。每一步依赖前一步的产出，确保编译通过后再进入下一步。

### Task 2.1：数据库初始化

#### schema.sql（`packages/backend/src/db/schema.sql`）

使用 `CREATE TABLE IF NOT EXISTS` 确保幂等性，严格按 technical-design.md 第五节定义 7 张表：

| 表名                  | 关键约束                                  |
| --------------------- | ----------------------------------------- |
| users                 | username UNIQUE, email UNIQUE NOT NULL    |
| word_books            | level 为 primary/junior/senior/college    |
| words                 | word_book_id FK → word_books(id)          |
| articles              | questions JSON 列，category 为 story/news |
| user_word_progress    | (user_id, word_id) 联合唯一约束           |
| user_article_progress | answers JSON 列                           |
| article_words         | article_id FK → articles(id)              |

#### database.ts（`packages/backend/src/config/database.ts`）

- 导出 `getDatabase()` 函数，返回 better-sqlite3 Database 单例
- 使用 `config.dbPath` 作为数据库文件路径
- 通过 `fs.readFileSync` 读取 schema.sql 内容，调用 `db.exec()` 执行建表
- 启用 WAL 模式 `PRAGMA journal_mode=WAL` 提升并发读取性能
- 启用外键约束 `PRAGMA foreign_keys=ON`

#### index.ts 集成

在 Express 中间件注册前调用 `getDatabase()` 触发初始化，初始化失败时进程退出。

### Task 2.2：Repository 实现

#### SQLite 实现类（`repositories/sqlite/`）

所有方法使用 better-sqlite3 同步 API（`db.prepare().get()/.all()/.run()`），用 `Promise.resolve()` 包装返回以匹配接口的 Promise 签名。

**SqliteUserRepository**：

- `findByUsername` / `findByEmail`：SELECT 单条，不返回 password_hash（对上层透明）
- `create`：INSERT 后返回 `this.findById(result.lastInsertRowid)`
- `update`：UPDATE 经 UpdateUserInput 过滤集

**SqliteWordRepository**：

- `getWordBooks(level?)`：条件筛选，可选 JOIN 统计 word_count
- `getWordsByBook`：带 LIMIT/OFFSET 分页 + COUNT 查询总数
- `searchWords`：WHERE word LIKE ? OR translation LIKE ? 模糊匹配
- `getWordById`：简单主键查询

**SqliteArticleRepository**：

- `getArticles`：多条件动态拼接 WHERE 子句 + 分页
- `getArticleById`：JSON.parse 解析 questions 字段
- `getArticleWords`：按 article_id 查询生词标注
- `searchArticles`：WHERE title LIKE ? OR content LIKE ? 模糊匹配

**SqliteProgressRepository**：

- `upsertWordProgress`：INSERT ... ON CONFLICT(user_id, word_id) DO UPDATE（利用联合唯一约束）
- `getWordProgressByBook`：JOIN words 表，按 book_id 筛选
- `submitArticleProgress`：INSERT + 返回新记录
- `getArticleProgress`：按 (user_id, article_id) 查询，返回 null 时表示未完成
- `getStatsOverview`：聚合查询（COUNT DISTINCT、AVG、时间范围统计）
- `getRecentProgress`：两次子查询各取最近 3 条，JOIN 对应表获取详细信息

### 工厂函数（`repositories/factory.ts`）

```typescript
export function getRepositories(db: Database) {
  return {
    user: new SqliteUserRepository(db),
    word: new SqliteWordRepository(db),
    article: new SqliteArticleRepository(db),
    progress: new SqliteProgressRepository(db),
  };
}
```

当前仅支持 sqlite，后续扩展 MySQL 时只需修改此文件。

### 关键实现注意事项

1. **性能**：所有 SQL 使用参数化查询（防注入），分页查询使用两步（先 COUNT 后 SELECT），避免 N+1
2. **JSON 处理**：articles.questions 和 user_article_progress.answers 在 SQLite 中存为 TEXT，读写时 JSON.parse/JSON.stringify
3. **密码安全**：User 查询结果对象中显式排除 password_hash 字段，上层 Service 调用 bcrypt
4. **单例模式**：getDatabase() 返回全局唯一 Database 实例，在 factory.ts 中注入各 Repository
5. **事务**：better-sqlite3 支持 `db.transaction()`，后续 Service 层复杂操作可复用

### 目录结构变更

```
packages/backend/src/
├── db/
│   └── schema.sql                          # [NEW] 7 张表建表 SQL
├── config/
│   ├── index.ts                            # 已有
│   └── database.ts                         # [NEW] getDatabase() 初始化函数
├── repositories/
│   ├── interfaces/                         # 已有（4 个接口文件）
│   ├── sqlite/
│   │   ├── SqliteUserRepository.ts         # [NEW]
│   │   ├── SqliteWordRepository.ts         # [NEW]
│   │   ├── SqliteArticleRepository.ts      # [NEW]
│   │   └── SqliteProgressRepository.ts     # [NEW]
│   └── factory.ts                          # [NEW]
└── index.ts                                # [MODIFY] 添加数据库初始化调用
```

## 推荐的 Agent 扩展

### Skill

- **writing-plans**：在生成阶段二执行计划前，使用该技能校验方案与现有接口代码、technical-design.md 的一致性，确保计划完整可执行。

### SubAgent

- **code-explorer**：在实现 Repository 方法时，用于查找现有接口文件中的类型定义（UserRecord、WordRecord、PaginatedResult 等），确保实现类返回类型与接口精确匹配。
