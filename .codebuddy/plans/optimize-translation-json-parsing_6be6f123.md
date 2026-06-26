---
name: optimize-translation-json-parsing
overview: 优化 DeepSeek 翻译响应的 JSON 解析：添加 JSON 修复策略、降低无效 warn 日志级别
todos:
  - id: add-json-repair-strategy
    content: 在 tryParseJson 中策略3之后新增策略4：修复 JSON 字符串内未转义双引号后再解析
    status: completed
  - id: downgrade-log-level
    content: 将 "JSON parse failed" 日志从 logger.warn 降为 logger.debug，修复成功时加 debug 日志
    status: completed
---

## 优化目标

优化 `deepseekService.ts` 中 `translateContent` 方法的 JSON 解析逻辑，解决 DeepSeek 返回的翻译 JSON 因包含未转义双引号导致解析失败并产生 warn 日志的问题。

## 具体改动

1. **新增 JSON 修复策略**：在现有 3 种 JSON 解析策略之后、纯文本回退之前，增加第 4 种策略——对翻译数组中的字符串值进行未转义双引号修复后再尝试 JSON.parse
2. **日志级别调整**：将 "JSON parse failed, trying plain-text fallback" 的 `logger.warn` 降为 `logger.debug`，避免对正常运行产生干扰
3. **修复日志**：JSON 修复策略成功时记录 debug 日志，便于排查

## 技术方案

### 修改范围

仅修改 `packages/backend/src/services/deepseekService.ts` 中 `translateContent` 方法的 `tryParseJson` 内部函数（约第 284-343 行）。

### 实现策略

#### JSON 修复策略（新增策略4）

在策略3（正则提取 `{...}` 再 JSON.parse）失败后，新增策略4：**对 rawContent 进行未转义引号修复**。

修复思路：由于 DeepSeek 返回的结构固定为 `{"translations": ["str1", "str2", ...]}`，可以利用正则匹配 `"translations": [...]` 数组部分，将数组内每个字符串元素中出现的未转义 ASCII 双引号 `"` 替换为转义形式 `\"`，然后重新 JSON.parse。

具体步骤：

1. 先尝试提取 `"translations"\s*:\s*\[([\s\S]*)\]` 匹配的数组内容
2. 对数组内的每个字符串元素（以 `", "` 为分隔），将其内部单独出现的 `"`（非字符串边界引号）替换为 `\"`
3. 重建完整 JSON 字符串后尝试 JSON.parse
4. 修复成功则返回 translations 数组，并记录 debug 日志

```
// 伪代码
const arrayMatch = text.match(/"translations"\s*:\s*\[([\s\S]*)\]/);
if (arrayMatch) {
  const arrayContent = arrayMatch[1];
  // 修复数组内未转义的双引号
  const fixed = fixUnescapedQuotesInJsonArray(arrayContent);
  const rebuilt = `{"translations": [${fixed}]}`;
  try { JSON.parse(rebuilt); ... } catch { ... }
}
```

#### 日志调整

- `logger.warn` → `logger.debug`（第 329 行）
- 新增：策略4 修复成功时输出 `[DeepSeek] translateContent: JSON repaired, got N translations`

### 风险控制

- 修复策略仅影响 JSON 解析逻辑，不改变 API 调用和返回数据结构
- 修复失败时继续走原有的纯文本回退（策略5/6），不影响现有降级能力
- 不引入新依赖，纯字符串处理
