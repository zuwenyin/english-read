---
name: sentence-level-translation
overview: 将文章翻译从"段落级全文对照"改为"逐句中英对照"格式，涉及 DeepSeek prompt 修改、新后端 API、前端渲染改造，旧格式文章可通过按钮手动重新翻译。
todos:
  - id: add-update-translation-repo
    content: 在 IArticleRepository 接口和 SqliteArticleRepository 实现中新增 updateTranslation 方法
    status: completed
  - id: add-sentence-translate-service
    content: 在 deepseekService.ts 新增 translateContentBySentence() 方法，修改 prompt 输出句子级翻译 JSON
    status: completed
  - id: add-retranslate-admin-api
    content: 在 admin.ts 路由中新增 POST /api/admin/articles/:id/retranslate 端点
    status: completed
    dependencies:
      - add-update-translation-repo
      - add-sentence-translate-service
  - id: add-retranslate-frontend-api
    content: 在 admin.ts 前端 API 层新增 retranslateArticle 函数
    status: completed
  - id: update-reading-detail-render
    content: 修改 ReadingDetail.tsx 翻译渲染区：新增格式自动检测 + 逐句对照渲染 + 旧格式兼容提示
    status: completed
  - id: add-retranslate-admin-ui
    content: 在 Admin.tsx 页面新增"文章翻译管理"卡片，支持输入文章 ID 触发重新翻译
    status: completed
    dependencies:
      - add-retranslate-frontend-api
  - id: verify-and-review
    content: 使用 [skill:test-driven-development] 验证翻译格式正确性，使用 [skill:requesting-code-review] 进行代码审查
    status: completed
    dependencies:
      - add-sentence-translate-service
      - update-reading-detail-render
      - add-retranslate-admin-ui
---

## 用户需求

将文章翻译从**段落级对照**（英文段落 → 中文段落）改为**逐句对照**（英文句 → 中文句 → 英文句 → 中文句）。

## 产品概述

在答题提交后的结果页，用户查看"文章翻译"时，看到的不再是"整段英文在上、整段中文在下"，而是每句英文下方紧跟其对应的中文翻译，便于逐句对照学习。

## 核心功能

- **逐句翻译生成**：修改 DeepSeek AI 的翻译 prompt，让 AI 按句子切分并输出 `{sentences: [{en, zh}]}` 格式
- **新旧格式兼容**：前端自动检测翻译 JSON 结构，新格式逐句渲染，旧格式保持段落级渲染
- **管理端重翻按钮**：在 Admin 页面提供"重新翻译"按钮，可对单篇文章触发句子级重翻，解决存量旧格式问题
- **UI 样式**：英文黑色加粗，中文灰色带蓝色左边框，逐句交替排列
- **影响范围限于结果页**：阅读页面不增加翻译切换功能

## 技术栈

- 后端：Express + TypeScript + node:sqlite（DatabaseSync）
- 前端：React 18 + TypeScript + Ant Design 5（wrapper）
- AI：DeepSeek API（deepseek-chat 模型）
- 不引入新依赖

## 实施方案

### 整体策略

采用**后端驱动**方案：修改 DeepSeek prompt 使 AI 输出句子级翻译，新增管理端 API 供手动触发重翻，前端自动检测格式并分支渲染。新建 `translateContentBySentence()` 方法，与现有 `translateContent()` 并行存在，互不影响。

### 新数据格式设计

```
[
  {
    "sentences": [
      { "en": "First sentence.", "zh": "第一句。" },
      { "en": "Second sentence.", "zh": "第二句。" }
    ]
  }
]
```

与旧格式 `[{text, translation}]` 通过结构差异区分：新格式第一项包含 `sentences` 数组。

### DeepSeek Prompt 改动

- **核心指令**：让 AI 对每段文本进行句子切分，逐句翻译后按 `{sentences: [{en, zh}]}` 格式输出
- **Prompt 策略**：让 AI 自己负责句子切分（而非前端正则），因为 AI 能正确处理缩写（Mr./U.S.）、小数等特殊情况
- **JSON 格式约束**：要求返回 `{"paragraphs":[{"sentences":[{"en":"...","zh":"..."}]}]}` 格式，每个段落一个 sentences 数组
- **多重回退**：复用现有的 JSON 解析回退策略（代码块提取 → 正则匹配 → JSON 修复 → 纯文本回退）

### 前后端兼容策略

- 前端 `translations` 数组判断逻辑：`translations[0]?.sentences` 存在 → 新格式；`translations[0]?.text` 存在 → 旧格式
- 旧格式：保持现有段落级渲染 + 提示"翻译格式较旧，可在管理后台重新翻译"
- 新格式：`sentences` 逐句交替渲染

## 涉及文件

```
packages/backend/src/services/deepseekService.ts          # [MODIFY] 新增 translateContentBySentence() 方法
packages/backend/src/repositories/interfaces/IArticleRepository.ts  # [MODIFY] 新增 updateTranslation() 接口
packages/backend/src/repositories/sqlite/SqliteArticleRepository.ts # [MODIFY] 实现 updateTranslation()
packages/backend/src/routes/admin.ts                       # [MODIFY] 新增 POST /retranslate/:id 端点
packages/frontend/src/api/admin.ts                         # [MODIFY] 新增 retranslateArticle() 函数
packages/frontend/src/pages/ReadingDetail.tsx              # [MODIFY] 译文区新增格式检测 + 逐句渲染
packages/frontend/src/pages/Admin.tsx                      # [MODIFY] 新增"重新翻译"功能区块
```

## 实现要点

### 1. DeepSeek 句子级翻译

- 新方法 `translateContentBySentence(content: string): Promise<string>`
- 与 `translateContent()` 共享 HTML 去标签、段落拆分、语言检测逻辑
- 修改 prompt：让 AI 输出 `{"paragraphs": [{"sentences": [{"en": "...", "zh": "..."}]}]}`
- 复用 tryParseJson / tryRepairJson 回退策略

### 2. Repository 更新方法

- `IArticleRepository` 新增 `updateTranslation(articleId: number, contentTranslation: string): Promise<void>`
- SQLite 实现：`UPDATE articles SET content_translation = ? WHERE id = ?`

### 3. 管理端 API

- `POST /api/admin/articles/:id/retranslate`：调用 `translateContentBySentence()` → `updateTranslation()`
- 返回 `{ success: true, message: "翻译已更新" }`

### 4. 前端渲染

- 解析 `content_translation` 后，检查第一个元素的 key 判断新旧格式
- 新格式：`sentences.map(s => (<div>英文→中文</div>))`
- 英文：`fontWeight: 600, color: "#1a1a1a"`；中文：`color: "#555", paddingLeft: 12, borderLeft: "3px solid #1677ff"`

### 5. Admin 页面

- 新增"文章翻译管理"卡片：输入文章 ID → 点击"重新翻译"
- 显示翻译结果预览（前 3 句）

## 使用的 Agent 扩展

### SubAgent

- **code-explorer**
- 用途：在实施阶段验证数据流完整性，确认 content_translation 从生成到存储到渲染的全链路
- 预期结果：确认所有相关文件已正确修改，新旧格式兼容逻辑正确

### Skill

- **requesting-code-review**
- 用途：全部实现完成后，进行代码审查确保方案质量
- 预期结果：审查通过，代码无回归问题

- **test-driven-development**
- 用途：为新增的 translateContentBySentence() 方法编写测试验证
- 预期结果：翻译格式正确、回退策略有效
