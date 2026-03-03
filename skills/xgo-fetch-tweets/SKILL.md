---
name: xgo-fetch-tweets
description: "通过 XGo (xgo.ing) 开放接口拉取推文 — 关注者时间线、推荐、列表、标签、收藏。适用场景: (1) 拉取 Twitter/X 时间线最新推文, (2) 获取高影响力/热门推文, (3) 浏览特定列表或标签的推文, (4) 获取推荐推文, (5) 按语言/时间/类型筛选推文。触发短语: '拉取推文', '获取推特', 'fetch tweets', 'get twitter', 'xgo推文', '我的推特Timeline', '今天的推文', 'twitter timeline', '看看推特', '推文列表', '推荐推文', 或任何与 XGo 推文拉取相关的表述。"
---

# 推文拉取器 (Twitter Fetcher)

通过 XGo (xgo.ing) 开放接口拉取推文。支持关注者时间线、推荐、列表、标签和收藏等多种查询方式。

完整 API 参数详情见 `references/api_reference.md`。

## 认证

所有请求需要 `X-API-KEY` 请求头。从环境变量 `XGO_API_KEY` 读取密钥:

```bash
-H "X-API-KEY: $XGO_API_KEY"
```

若 `XGO_API_KEY` 未设置，提示用户配置。

接口地址: `https://api.xgo.ing`

API Key 绑定特定 XGo 用户账号。服务端会自动从密钥推断 `userName`，因此大多数请求中 `userName` 为**可选**参数。仅在 `queryType=user` 时需要指定 `userName` 以查询其他用户的公开推文。

## 默认拉取策略

用户未指定筛选条件时，使用以下默认值:
- `queryType`: `following`（关注者推文）
- `timeRange`: `LAST_24H`（近 24 小时）
- `sortType`: `influence`（按影响力排序）
- `tweetType`: `NO_RETWEET`（排除纯转推）
- `pageSize`: 50
- 客户端过滤: `influenceScore >= 50`
- 默认输出数量: **20** 条（可根据用户要求调整）

### 拉取方案（3 个并行请求）

```bash
# 1. 关注者推文 - 第1页（50条）
curl -s -X POST https://api.xgo.ing/openapi/v1/tweet/list \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: $XGO_API_KEY" \
  -d '{"queryType":"following","timeRange":"LAST_24H","sortType":"influence","tweetType":"NO_RETWEET","currentPage":1,"pageSize":50}'

# 2. 关注者推文 - 第2页（50条）
curl -s -X POST https://api.xgo.ing/openapi/v1/tweet/list \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: $XGO_API_KEY" \
  -d '{"queryType":"following","timeRange":"LAST_24H","sortType":"influence","tweetType":"NO_RETWEET","currentPage":2,"pageSize":50}'

# 3. 推荐推文（50条）
curl -s -X POST https://api.xgo.ing/openapi/v1/tweet/list \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: $XGO_API_KEY" \
  -d '{"queryType":"recommendation","timeRange":"LAST_24H","sortType":"influence","tweetType":"NO_RETWEET","currentPage":1,"pageSize":50}'
```

并行执行所有请求。**必须显式传递 `sortType`** — 服务端默认值为 `recent`，本 skill 默认覆盖为 `influence`。

若 `totalPage > currentPage`，每个 queryType 最多拉取 **4 页**（方案中已覆盖 2 页）。若还有更多页，告知用户结果已截断，建议缩小 `timeRange` 或提高 `influenceScore` 过滤阈值。

**客户端过滤说明**: `recommendation` 查询类型服务端已强制过滤 `influenceScore >= 100`，`>= 50` 的客户端过滤实际仅作用于 `following` 结果。

### 分场景拉取方案

**默认场景（关注 + 推荐）**: 使用上方 3 个并行请求的方案。

**用户自己的推文**（`queryType: "user"`）:
```bash
curl -s -X POST https://api.xgo.ing/openapi/v1/tweet/list \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: $XGO_API_KEY" \
  -d '{"queryType":"user","sortType":"recent","currentPage":1,"pageSize":100}'
```
自己的推文无需 `influenceScore` 过滤。

**收藏推文**（`queryType: "bookmark"`）:
```bash
curl -s -X POST https://api.xgo.ing/openapi/v1/tweet/list \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: $XGO_API_KEY" \
  -d '{"queryType":"bookmark","sortType":"recent","currentPage":1,"pageSize":100}'
```
收藏推文无需 `influenceScore` 过滤 — 收藏是用户主动保存的内容。可用 `folderId` 限定特定收藏夹。

### 参数调整

根据用户输入调整参数:
- "今天的推文" → `timeRange: "TODAY"`
- "本周推文" → `timeRange: "WEEK"`
- "本月推文" → `timeRange: "MONTH"`
- "按点赞排序" → `sortType: "likeCount"`
- "按浏览量排序" → `sortType: "viewCount"`
- "按回复排序" → `sortType: "replyCount"`
- "最新推文" → `sortType: "recent"`
- "只看原创" → `tweetType: "ORIGINAL"`
- "包括回复" → `tweetType: "ALL"`
- "搜索 AI" → `keyword: "AI"`
- "某个 List" → `listId: "xxx"`（需要用户提供 List ID，或通过 xgo-manage-lists 的 `list/all` 端点查询可用列表）
- "标签 xxx" → `tags: ["xxx"]`
- "推荐推文" → `queryType: "recommendation"`
- "我的推文" → `queryType: "user"`（使用"用户自己的推文"拉取方案）
- "收藏推文" → `queryType: "bookmark"`（使用"收藏推文"拉取方案）
- "给我 50 条" → 输出 50 条而非默认 20 条
- "影响力 80 以上" → 客户端过滤 influenceScore >= 80

## 辅助端点

### 获取用户语言列表

```bash
curl -s "https://api.xgo.ing/openapi/v1/tweet/languages" \
  -H "X-API-KEY: $XGO_API_KEY"
```

返回可用的推文语言列表，可用于设置 `lang` 筛选。

### 获取关注者标签

```bash
curl -s "https://api.xgo.ing/openapi/v1/tweet/tags" \
  -H "X-API-KEY: $XGO_API_KEY"
```

返回关注者标签（按频率排序），可用于设置 `tags` 筛选。

### 按 ID 批量查询推文

```bash
curl -s -X POST https://api.xgo.ing/openapi/v1/tweet/batch \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: $XGO_API_KEY" \
  -d '{"tweetIds":["1234567890","9876543210"]}'
```

从 DB 缓存中按推文 ID 批量查询。适用于重新检查已收藏或已保存的推文。

## 可用端点

| 端点 | 方法 | 用途 |
|------|------|------|
| `/openapi/v1/tweet/list` | POST | 查询推文列表（最常用） |
| `/openapi/v1/tweet/batch` | POST | 按 ID 批量查询推文 |
| `/openapi/v1/tweet/languages` | GET | 获取用户推文语言 |
| `/openapi/v1/tweet/tags` | GET | 获取关注者标签 |

完整请求/响应字段详情见 `references/api_reference.md`。

## 核心工作流

### 第一步: 拉取数据（有页数上限）

按对应拉取方案并行请求。检查 `totalPage`，每个 queryType 最多拉取 **4 页**。若还有更多页，向用户说明结果已截断。

### 第二步: 客户端过滤与去重

1. **影响力过滤**: 对 `following` 结果，保留 `influenceScore >= 50`（或用户指定阈值）。`bookmark` 和 `user` 查询类型跳过此过滤。
2. **去重**: 按推文 `id` 字段匹配（保证唯一）。若同一推文同时出现在 `following` 和 `recommendation` 中，仅保留一条。
3. **排序**: 按 `influenceScore` 降序，其次按 `createdAt` 降序。

### 第三步: 输出完整详情

输出每条推文的所有 API 字段。**不要概括或压缩** — 下游 skill 需要完整数据进行质量评估。

## 输出格式

```markdown
## XGo 推文列表 (YYYY-MM-DD, 近 X 时, 共 N 条)

---

### 1. @username - DisplayName
- **影响力**: 85 | **互动**: 👍 446 🔁 134 💬 36 🔄 12 📑 28 👁 45K
- **语言**: en | **时间**: 2026-02-28 14:30
- **内容**:
  推文完整文本内容...
- **链接**: [查看原文](https://x.com/username/status/id)
- **标签**: #tag1, #tag2
- **提及**: @user1, @user2
- **媒体**: 📷 2张图片 / 🎬 1个视频
- **引用推文**: [@quoted_user: 引用推文内容摘要...]

---

### 2. @username - DisplayName
...
```

### 输出字段映射

| 输出字段 | API 字段 | 说明 |
|---------|---------|------|
| @username | `author.userName` | 用户名 |
| DisplayName | `author.name` | 显示名称 |
| 影响力 | `influenceScore` | 影响力评分 |
| 👍 | `likeCount` | 点赞数 |
| 🔁 | `retweetCount` | 转推数 |
| 💬 | `replyCount` | 回复数 |
| 🔄 | `quoteCount` | 引用数 |
| 📑 | `bookmarkCount` | 收藏数 |
| 👁 | `viewCount` | 浏览数（大数字用 K/M 格式化） |
| 语言 | `lang` | 推文语言 |
| 时间 | `createdAt` | 格式化为本地时间 |
| 内容 | `text` | 完整推文文本 |
| 链接 | `url` | 推文原文链接 |
| 标签 | `hashTags[].text` | 以 # 前缀输出 |
| 提及 | `userMentions[].userName` | 以 @ 前缀输出 |
| 媒体 | `mediaList` | 统计图片/视频数量 |
| 引用推文 | `quotedTweet` | 摘要引用推文内容 |
| 转推原文 | `retweetedTweet` | 若为转推，摘要原始推文内容 |

### 输出完整性规则

- `text`: 完整输出，不得截断
- `hashTags`: 输出全部标签
- `userMentions`: 输出全部提及
- `mediaList`: 统计并描述所有媒体
- `quotedTweet`: 包含作者和文本摘要
- `**互动**` 行始终保留；其中单个指标为 null 或 0 时省略该指标
- `hashTags`、`userMentions`、`mediaList` 为空/null 时省略该行
- `quotedTweet` 为 null 时省略该行

## 错误处理

**重要**: 始终先检查 `response.success` 再处理 `response.data`。部分错误返回 HTTP 200 但 `success: false` — 不要仅依赖 HTTP 状态码。

- `401`: 检查 `XGO_API_KEY` 是否已设置且有效
- `403`: 开放接口需要 Plus 或 Pro 会员
- `429`: 频率限制 — 等待 10 秒后重试一次。若仍为 429，告知用户: "频率限制，请稍后重试。"（PLUS 200次/分, PRO 600次/分）
- `xgo-0001`（用户不存在, HTTP 200）: `queryType=user` 时若 `userName` 不存在触发。务必检查 `success` 字段
- `success: false` 且 `code` 非零: 读取响应体中的 `code` 和 `message`，对照 api_reference 中的错误码处理
- `data` 为空: 用户可能没有关注者，或时间范围太窄 — 建议扩大 `timeRange`
- `totalSize: 0`: 无推文匹配查询条件，建议调整筛选参数

## 常用筛选参数速查

| 参数 | 可选值 |
|------|--------|
| queryType | `following`, `recommendation`, `user`, `bookmark` |
| tweetType | `ALL`, `NO_REPLY`, `NO_RETWEET`, `ORIGINAL`, `NO_QUOTE` |
| timeRange | `TODAY`, `LAST_24H`, `WEEK`, `MONTH` |
| sortType | `recent`, `influence`, `replyCount`, `quoteCount`, `likeCount`, `viewCount` |
| lang | `en`, `zh`, `ja`, `ko` 等 / `ALL` 不过滤 |
