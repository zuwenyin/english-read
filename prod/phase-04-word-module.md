# 阶段四：单词模块（前后端打通）✅ 已完成

> **状态**：5/5 任务全部完成，验收标准全部通过。
> **完成时间**：2026-06-25
>
> **思路**：将原来的 Phase 4（后端单词 API）和 Phase 7（前端单词页面）合并为一个垂直模块。
> 完成后即可选择词书 → 卡片背诵标记熟识度 → 做选择题测试，完整闭环可验证。

---

## Task 4.1：后端单词 API（词书列表 / 单词列表 / 搜索）

### 执行步骤

1. 创建 `src/routes/wordBooks.ts` + `src/services/wordBookService.ts`：
   - `GET /api/word-books?level=primary`
   - 返回词书列表，含 `word_count`
   - 注册路由

2. 创建 `src/routes/words.ts` + `src/services/wordService.ts`：
   - `GET /api/words/:bookId?page=1&pageSize=20`
   - `GET /api/words/search?keyword=apple&bookId=1`
   - **⚠️ 关键：`/search` 路由必须注册在 `/:bookId` 之前**
   - 返回分页 / 搜索格式

3. 在 `src/index.ts` 中注册路由

### API 规格（参考 technical-design.md 7.5.3-7.5.5）

- `GET /api/word-books` → `{ code: 0, data: [{ id, name, level, word_count, description }] }`
- `GET /api/words/:bookId` → `{ code: 0, data: { list, total, page, pageSize } }`
- `GET /api/words/search?keyword=xxx` → 匹配的单词列表

### 验收标准

- [x] 词书列表正常返回，含 word_count
- [x] 单词分页列表正常
- [x] 搜索正确匹配中英文
- [x] 所有接口需 JWT 鉴权
- [x] `/search` 不会被匹配为 `bookId=search`

---

## Task 4.2：后端单词进度 API

### 执行步骤

1. 创建 `src/routes/progress.ts` + `src/services/progressService.ts`：
   - `POST /api/progress/word`
     - Zod：`word_id`（必填）、`familiarity`（1-5）
     - UPSERT 逻辑（首次插入，再调更新 review_count +1 + last_reviewed）
     - 返回 `{ familiarity, review_count, last_reviewed }`
   - `GET /api/progress/words/:bookId`
     - 返回用户在该词书的单词进度列表
     - 未学过的不返回

2. 注册路由

### 验收标准

- [x] UPSERT 正确（首次插入 / 再次更新）
- [x] review_count 递增
- [x] last_reviewed 更新
- [x] familiarity 超出 1-5 返回 40001

---

## Task 4.3：前端词书市场页（/words）

### 执行步骤

1. 创建 `src/store/WordBookContext.tsx`：
   - 管理当前选中的词书 ID 和信息
   - 提供 `selectBook()` 方法

2. 创建 `src/api/wordBooks.ts`：`getWordBooks(level?)`

3. 实现 `src/pages/WordBooks.tsx`：
   - 顶级搜索栏（本地过滤词书名）
   - 阶段筛选 Tab（全部 / 小学 / 初中 / 高中 / 大学）
   - 词书卡片列表（antd Card）
   - 「选择学习」按钮 → 存 Context → 跳转 `/words/learn/:bookId`
   - 已选词书标记「当前学习」

4. 使用 `@tanstack/react-query` 缓存词书列表

### 验收标准

- [x] 词书列表正确显示
- [x] 阶段筛选 + 搜索正确工作
- [x] 选择词书后跳转正确
- [x] 「当前学习」标签正确
- [x] react-query 缓存正常

---

## Task 4.4：前端单词学习页（/words/learn/:bookId）

### 执行步骤

1. 创建 `src/api/words.ts` + `src/api/progress.ts`：
   - `getWordsByBook()` / `searchWords()`
   - `updateWordProgress()` / `getWordProgress()`

2. 创建 `src/utils/speech.ts`：
   - `speak(text)` 封装 Web Speech API
   - 不支持时降级显示音标

3. 实现 `src/pages/WordLearn.tsx`：
   - 从 URL 取 `bookId`，react-query 获取单词列表 + 进度
   - 单词卡片：word / phonetic / translation / example_sentence
   - 发音按钮
   - 进度条（antd Progress）
   - 5 个熟识度按钮（忘记🔴 / 模糊🟠 / 一般🟡 / 熟悉🔵 / 精通🟢）
   - 左右翻页（PC 按钮 / 手机滑动）

### 验收标准

- [x] 单词卡片正确显示
- [x] 熟识度标记正确保存到后端
- [x] 进度条实时更新
- [x] 发音在 Chrome/Edge 中可用，不支持时降级
- [x] 翻页正常（可循环）

---

## Task 4.5：前端单词测试页（/words/quiz/:bookId）

### 执行步骤

1. 实现 `src/pages/WordQuiz.tsx`：
   - 从词书随机抽 20 个单词
   - 每个单词生成 4 个选项（1 正确 + 3 干扰项，从同词书随机取）
   - 每题即时反馈（正确🟢 / 错误🔴 + 显示正确答案）
   - 进度条（3/20）
   - 结果页：得分 + 正确率 + 错题回顾列表

> 测试完全在前端实现，无后端 API。干扰项从同词书其他单词的翻译中随机选取。

### 验收标准

- [x] 测试页正确渲染 20 题
- [x] 正确/错误即时反馈
- [x] 结果页正确显示得分、正确率
- [x] 错题列表正确（单词 + 正确释义）

---

## 阶段总结

**此阶段完成后即可看到完整的单词学习闭环：**

```
进入 /words（词书市场）
  → 选择词书 → 跳转 /words/learn/:bookId
  → 卡片背诵 + 标记熟识度（5 级）
  → 发音跟读
  → 进度条反馈
  → 进入 /words/quiz/:bookId 做选择题测试
  → 得分 + 错题回顾
```
