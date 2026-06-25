# 阶段七：Seed 数据脚本 + 响应式适配完善 ✅ 已完成

> **思路**：将原 Phase 10 保留不变，在此阶段为系统填充初始词库数据并完善移动端体验。
> 此时 Phase 3-6 已全部完成，有了完整的前后端打通，Seed 数据和响应式可以基于实际页面效果精细化调整。

---

## Task 7.1：增强 Seed 数据脚本

### 最终方案

**增强现有 `src/db/` 下的脚本，而非新建 `src/seed/`。**

| 文件                                     | 说明                                          |
| ---------------------------------------- | --------------------------------------------- |
| `packages/backend/src/db/seed.ts`        | 词书+单词种子数据（增强：导入后自动清除缓存） |
| `packages/backend/src/db/seed-data.json` | 词书数据源（3.35MB，5 本词书，共 12,800 词）  |

### 种子数据内容

#### 词书（来自 seed-data.json）

| #        | 词书名称             | 级别    | 单词量        |
| -------- | -------------------- | ------- | ------------- |
| 1        | 小学英语核心词汇     | primary | 800           |
| 2        | 初中英语核心词汇     | junior  | 1,500         |
| 3        | 高中英语核心词汇     | senior  | 3,500         |
| 4        | 大学英语四级核心词汇 | college | 4,000         |
| 5        | 大学英语六级进阶词汇 | college | 3,000         |
| **合计** | —                    | —       | **12,800 词** |

> 数据远超任务原定要求（~300/500/500/500），无需额外生成。

#### 文章（来自 article-seed.ts）

| 级别           | 故事类 (story) | 新闻类 (news) |   合计    |
| -------------- | :------------: | :-----------: | :-------: |
| primary (小学) |      2 篇      |     2 篇      |   4 篇    |
| junior (初中)  |      1 篇      |     1 篇      |   2 篇    |
| senior (高中)  |      1 篇      |     1 篇      |   2 篇    |
| college (大学) |      1 篇      |     2 篇      |   3 篇    |
| **总计**       |    **5 篇**    |   **6 篇**    | **11 篇** |

College 级别 3 篇文章（新增）：

- "The Startup Garage"（故事类 — 大学生创业）
- "Breakthrough in Quantum Computing Promises New Era of Drug Discovery"（新闻类 — 量子计算）
- "Global Treaty to End Plastic Pollution Reaches Historic Milestone"（新闻类 — 全球塑料污染条约）

每篇文章含 4-5 道阅读理解题和 5 个生词预标注。

### 运行脚本

```bash
# 导入词书 + 单词
pnpm --filter backend seed

# 导入文章
pnpm --filter backend seed:articles
```

### 关键实现细节

1. **缓存清除**：`seed.ts` 在导入完成后直接 `import { cacheClear } from "../utils/cache"` 调用清除缓存，无需走 HTTP API（避免 JWT 鉴权问题）
2. **事务写入**：使用 `node:sqlite` 事务批量插入，提升性能
3. **数据清空**：先清空相关表（`user_word_progress`, `words`, `word_books` / `article_words`, `user_article_progress`, `articles`），再插入新数据

### 验收标准

- [x] `pnpm --filter backend seed` 成功执行
- [x] `pnpm --filter backend seed:articles` 成功执行
- [x] 数据库中有初始词书、单词、文章数据
- [x] 文章包含 questions 和 article_words
- [x] Seed 后缓存被清除
- [x] 前端刷新后数据正确显示

---

## Task 7.2：完善响应式适配

### 最终方案

采用 **CSS 媒体查询 + useMediaQuery Hook + antd Grid 响应式断点**，不引入新依赖。

### 三端导航体系

| 设备   | 断点      | 导航方式                   | 实现                                        |
| ------ | --------- | -------------------------- | ------------------------------------------- |
| 手机端 | < 576px   | 底部固定 Tab 导航          | `.mobile-nav`（`position:fixed; bottom:0`） |
| 平板端 | 576-991px | 顶部汉堡菜单 + Drawer 抽屉 | `.tablet-nav` + antd `Drawer`（右侧滑出）   |
| PC 端  | ≥ 992px   | 顶部固定导航栏             | `.pc-nav`（logo + 文字链接 + 用户区）       |

导航内容：首页 / 单词 / 阅读 / 我的，四个 Tab 三端统一。

### 新增文件

| 文件                                           | 说明                                          |
| ---------------------------------------------- | --------------------------------------------- |
| `packages/frontend/src/hooks/useMediaQuery.ts` | 响应式媒体查询 Hook，基于 `window.matchMedia` |

### 各页面响应式改动

| 页面                  | 改动内容                                                                                    |
| --------------------- | ------------------------------------------------------------------------------------------- |
| **Layout.tsx**        | 三端导航体系重写：新增平板汉堡菜单 + Drawer；媒体查询分离 PC/平板/手机三套样式              |
| **Home.tsx**          | 年级卡片手机端单列（`xs={24}` 替代 `xs={12}`）；修复 level key 为 `"primary"`（与后端统一） |
| **Reading.tsx**       | Grid 卡片最小宽度 `320px → 280px`，手机端更友好                                             |
| **ReadingDetail.tsx** | 文章行高 `2 → 1.8`；手机端字号 15px/行高 1.7；所有页面底部 `paddingBottom: 80` 防 Tab 遮挡  |
| **WordLearn.tsx**     | 按钮 `minHeight: 44px`（适配手指点击）；底部 `paddingBottom: 80`                            |
| **WordQuiz.tsx**      | 答题页 + 结果页底部 `paddingBottom: 80`                                                     |
| **Profile.tsx**       | 引入 `useMediaQuery`，手机端表单 `layout="vertical"` + 输入框 `width: 100%`                 |
| **antd-wrapper.tsx**  | 新增 `Drawer` 导出                                                                          |

### 新增组件导出

- `Drawer` — 已通过 `packages/frontend/src/components/antd-wrapper.tsx` 统一导出

### 验收标准

- [x] Chrome DevTools iPhone 模拟正常
- [x] Chrome DevTools iPad 模拟正常
- [x] PC 端正常显示
- [x] 所有页面在手机端按钮可点击、文字可读
- [x] 底部 Tab 在手机端始终可见

---

## 阶段总结

**此阶段完成后系统具备：**

- ✅ 4 个年级阶段的真实词库数据（12,800 词，远超目标）
- ✅ 11 篇分级阅读文章（覆盖所有级别和类型）
- ✅ PC / 平板 / 手机三种设备完整适配
- ✅ 平板端汉堡菜单 + Drawer 导航
- ✅ 手机端底部 Tab 导航体验良好
- ✅ 所有页面底部预留 80px 防遮挡
- ✅ 表单手机端自适应（垂直布局 + 全宽输入）
- ✅ 单词学习按钮适配触摸（minHeight: 44px）

### 已修复的问题

- 前端 Home.tsx 中 LEVELS 的 `"elementary"` → `"primary"`，与后端数据统一
