---
name: fix-double-letter-prefix-in-options
overview: 修复答题选项中 "A. A." 双字母前缀问题：更新 DeepSeek prompt 明确禁止字母前缀 + 后端入库前清洗 + 前端渲染兜底兼容存量数据。
todos:
  - id: update-deepseek-prompt
    content: 修改 deepseekService.ts 的 SYSTEM_PROMPT，明确要求 options 不包含字母前缀，并在 processBatch 返回前对 options 调用 stripOptionPrefix 清洗
    status: completed
  - id: fix-frontend-options
    content: 修改 ReadingDetail.tsx 两处选项渲染（答题区和结果区），对 opt 先 strip 字母前缀再拼接渲染
    status: completed
  - id: verify-fix
    content: 使用 [skill:requesting-code-review] 审查改动，确认三层防御链路完整
    status: completed
    dependencies:
      - update-deepseek-prompt
      - fix-frontend-options
---

## 问题描述

文章阅读页面的选择题选项出现"A. A. In the Tang Dynasty"、"B. B. In 2014"等双字母前缀，原因是 DeepSeek API 返回的 options 有时自带"A. "前缀，而前端渲染又追加了一次字母前缀。

## 修复目标

- **新拉取文章**：DeepSeek 生成不带前缀的干净选项
- **存量文章**：前端渲染兜底自动 strip 已有前缀
- **后端安全网**：入库前自动清洗，防止任何来源的脏数据

## 技术方案

### 三层防御策略

| 层级 | 改动位置                                 | 作用                            |
| ---- | ---------------------------------------- | ------------------------------- |
| 源头 | `deepseekService.ts` SYSTEM_PROMPT       | 明确要求 AI 不输出字母前缀      |
| 入库 | `deepseekService.ts` processBatch 返回值 | 入库前 strip 选项前缀（安全网） |
| 渲染 | `ReadingDetail.tsx` 两处选项渲染         | 存量数据兼容，前端兜底 strip    |

### 选项清洗逻辑

统一使用 `stripOptionPrefix(opt: string): string` 工具函数：

```
匹配 "^[A-D][.．、]\s*" 正则，去掉 "A. "、"B．"、"C、" 等前缀
```

### 改动文件

| 文件                 | 改动                                                                                                                 |
| -------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `deepseekService.ts` | 更新 SYSTEM_PROMPT；在 `processBatch` 返回前对每个 question 的 options 调用 strip；新增 `stripOptionPrefix` 导出函数 |
| `ReadingDetail.tsx`  | 在答题区（第 637-641 行）和答题结果区（第 527-528 行）的 `{letter}. {opt}` 处，对 opt 先调用 strip                   |

## Agent Extensions

### SubAgent

- **code-explorer**
- Purpose: 确认 `ReadingDetail.tsx` 中所有选项渲染位置及 `deepseekService.ts` 中 processBatch 返回值的精确结构
- Expected outcome: 精确定位所有需要修改的代码行，确保无遗漏

### Skill

- **writing-plans**
- Purpose: 将修复方案转化为可执行的计划，确保步骤完整
- Expected outcome: 生成包含具体文件路径和修改内容的 todolist
