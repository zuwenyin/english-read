---
name: fix-popover-position
overview: 修复 ReadingDetail 页面点击生词后弹窗位置固定在远处的问题，改为弹窗定位在被点击单词旁边。
todos:
  - id: replace-popover
    content: 将 ReadingDetail.tsx 中的 antd Popover 替换为基于被点击单词位置动态定位的自定义浮动弹窗，包含位置计算、视口边界处理、scroll/click-outside 关闭逻辑
    status: completed
---

## 用户诉求

修复文章阅读页（/reading/:id）中点击蓝色生词后，释义弹窗位置固定远离文字的问题。期望弹窗出现在被点击单词的正下方/附近。

## 问题现状

- `ReadingDetail.tsx` 第 348-370 行的 `<Popover>` 组件，其触发子元素是固定渲染的 `<span />`，与文章内容区域无关联
- 无论点击哪个位置的单词，弹窗始终显示在 `<span />`（页面底部固定位置）旁边
- 点击事件委托 `handleContentClick` 已正确捕获被点击的 `mark` 元素和查词信息，但定位逻辑缺失

## 期望效果

- 点击任意生词，释义弹窗紧贴该单词下方显示
- 弹窗不超出视口（靠近边缘时自动翻转方向）
- 滚动页面时弹窗自动关闭
- 点击文章内容区域外或再次点击同一单词时弹窗关闭

## 技术方案

### 方案选型：自定义浮动弹窗替代 antd Popover

**原因**：antd Popover 需要固定的子元素作为锚点，而文章内容通过 `dangerouslySetInnerHTML` 渲染，单词 `<mark>` 元素分布在内容中任意位置，无法预先将 Popover 包裹每个单词。因此不适合使用 antd Popover。

**替代方案**：使用 state 控制的自定义浮动 `<div>`，通过记录被点击元素的 `getBoundingClientRect()` 计算绝对定位坐标，实现弹窗紧贴单词显示。

### 实现细节

1. **新增状态**：`popupPosition: { top: number; left: number } | null` — 记录弹窗应出现的位置
2. **修改 `handleContentClick`**：在设置 `lookupWord` 后，从 `e.target`（即被点击的 mark 元素）获取 `getBoundingClientRect()`，计算弹窗位置（默认出现在单词下方 4px）
3. **替换 Popover**：移除 antd Popover 及不必要的 `trigger`/`placement`/`onOpenChange` 等 props，改为条件渲染自定义浮动 div
4. **视口边界处理**：弹窗定位时检测是否超出视口右/下边缘，超出则翻转方向
5. **关闭逻辑**：

- 点击同一单词（toggle 行为）
- 滚动时关闭（监听 scroll 事件）
- 点击弹窗外部关闭（通过 document click listener + ref 判断）

6. **样式对齐**：弹窗样式参考原 Popover content 结构（最大宽度 220px、阴影、圆角），与 Ant Design 设计语言保持一致

### 受影响的文件

```
packages/frontend/src/pages/ReadingDetail.tsx  # [MODIFY] 替换 Popover 为自定义浮动弹窗
```

### 核心代码结构变更

- 新增 `popupPosition` state 和 `popupRef`
- `handleContentClick` 中增加位置计算逻辑
- 移除 `<Popover>` 及其子元素 `<span />`，替换为条件渲染的浮动 `<div>`
- 新增 `useEffect` 处理 scroll 关闭和 click-outside 关闭
- 样式使用内联 style 对象保持一致性
