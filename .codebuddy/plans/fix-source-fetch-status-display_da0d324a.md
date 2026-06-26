---
name: fix-source-fetch-status-display
overview: 修复 Admin 页面各数据源状态列：拉取数为 0 时不再显示"正常"，改为"无数据"
todos:
  - id: fix-status-render
    content: 修改 Admin.tsx 第 236-239 行状态渲染逻辑，增加 fetched === 0 判断分支
    status: completed
---

## 需求

修复 Admin 页面"各数据源贡献"表格中状态列的判断逻辑。当某个数据源拉取数为 0 且无错误时，状态应显示"无数据"(warning) 而非"正常"(success)。

## 改动内容

- 修改 `packages/frontend/src/pages/Admin.tsx` 第 236-239 行 status 列的 render 函数
- 将 record 类型从 `{ errors: string[] }` 扩展为 `{ errors: string[]; fetched: number }`
- 增加 `fetched === 0` 的判断分支

## 修改范围

仅修改 `packages/frontend/src/pages/Admin.tsx` 第 236-239 行。

## 改动前后对比

**改动前：**

```
render: (_: unknown, record: { errors: string[] }) =>
  record.errors.length > 0
    ? <Tag color="error">有错误</Tag>
    : <Tag color="success">正常</Tag>,
```

**改动后：**

```
render: (_: unknown, record: { errors: string[]; fetched: number }) =>
  record.errors.length > 0
    ? <Tag color="error">有错误</Tag>
    : record.fetched === 0
      ? <Tag color="warning">无数据</Tag>
      : <Tag color="success">正常</Tag>,
```

## 状态判断逻辑

| 条件                | 显示   | Tag 颜色 |
| ------------------- | ------ | -------- |
| `errors.length > 0` | 有错误 | error    |
| `fetched === 0`     | 无数据 | warning  |
| 其他                | 正常   | success  |
