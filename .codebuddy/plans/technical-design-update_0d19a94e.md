---
name: technical-design-update
overview: 根据用户决策修复 technical-design.md 中的 11 个问题，包括密码重置方案、首页双重状态、quiz_score 存储格式、词书选择流程、Docker 部署描述、缓存失效策略、补充缺失内容（React Query、IProgressRepository、统计 API、路由冲突注释等）
todos:
  - id: update-auth-flow
    content: 移除密码找回描述：2.2节、10.3节登录页、7.4节API列表
    status: completed
  - id: update-homepage
    content: 明确首页双重状态，更新10.1节和11.1节Tab说明
    status: completed
    dependencies:
      - update-auth-flow
  - id: update-wordbook-flow
    content: /words直接显示词书市场，更新10.4节和11.1节
    status: completed
    dependencies:
      - update-homepage
  - id: update-tech-stack
    content: 3.3节补充@tanstack/react-query，6.1节补充IProgressRepository
    status: completed
  - id: update-api-list
    content: 7.4节新增stats/overview和cache/clear接口，加路由冲突注释
    status: completed
    dependencies:
      - update-tech-stack
  - id: update-db-and-api
    content: 5.6节quiz_score改JSON明细，7.5.8加user_progress，7.5.9同步更新
    status: completed
    dependencies:
      - update-api-list
  - id: update-cache-and-deploy
    content: 13.2节缓存失效策略更新，15.3节Docker单容器方案更新
    status: completed
    dependencies:
      - update-db-and-api
---

## 用户需求

更新 `prod/technical-design.md` 技术方案文档，修复 review 中发现的 11 个问题，纳入用户已确认的所有决策，使文档达到开发终稿标准。

## 核心修改点

1. 移除密码找回功能（登录页去掉「忘记密码」链接，API列表移除forgot-password）
2. 明确首页双重状态（未选年级→选择页，已选年级→学习概览页）
3. quiz_score 改为存储 JSON 明细（5.6节表结构 + 7.5.9请求体）
4. /words 直接显示词书市场（10.4节 + 11.1节）
5. Docker 改为单容器方案（Nginx 托管前端 + 反代后端）
6. 缓存失效策略改为服务启动加载 + POST /api/cache/clear 接口
7. 新增 GET /api/stats/overview 统计 API（个人中心数据来源）
8. 前端技术栈补充 @tanstack/react-query
9. Repository 接口列表补充 IProgressRepository
10. 文章详情接口（7.5.8）返回 user_progress 字段（历史答题记录）
11. API 路由冲突说明（/search 需注册在 /:bookId 之前）
