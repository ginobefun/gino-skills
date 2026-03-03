---
name: xgo-search-tweets
description: "通过 XGo (xgo.ing) 开放接口实时搜索推文、获取特定用户最新推文。适用场景: (1) 按关键词/话题搜索推文, (2) 查找热门讨论, (3) 实时获取某用户最新推文, (4) 刷新指定推文获取最新互动数据, (5) 了解推特上对某话题的讨论。触发短语: '搜索推文', '搜推特', 'search tweets', 'search twitter', '找推文', '关于XX的推文', 'tweets about', '某人的最新推文', 'latest tweets from @user', '刷新推文', 'refresh tweets', '推特上怎么说', '看看大家怎么讨论', 或任何与推文搜索或实时推文获取相关的表述。注意: 拉取时间线/Feed（如 '拉取推文', '今天的推文', '推文列表'）请使用 xgo-fetch-tweets。"
---

# 推文搜索器 (Twitter Searcher)

通过 XGo (xgo.ing) 开放接口实时搜索推文、获取特定用户最新推文。

完整 API 参数详情见 `references/api_reference.md`。

## 认证

所有请求需要 `X-API-KEY` 请求头。从环境变量 `XGO_API_KEY` 读取密钥:

```bash
-H "X-API-KEY: $XGO_API_KEY"
```

若 `XGO_API_KEY` 未设置，提示用户配置。

接口地址: `https://api.xgo.ing`

## 默认搜索策略

用户提供搜索话题但未指定具体参数时，使用以下默认值:
- `queryType`: `Top`（热门优先）
- `maxResults`: 30
- 默认输出数量: **20** 条（可根据用户要求调整）

### 搜索推文

```bash
curl -s -X POST https://api.xgo.ing/openapi/v1/tweet/search \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: $XGO_API_KEY" \
  -d '{"query":"AI agents","queryType":"Top","maxResults":30}'
```

### 参数调整

根据用户输入调整参数:
- "搜索 AI agents" → `query: "AI agents"`
- "最新的" / "按时间" → `queryType: "Latest"`
- "热门的" / "最火的" → `queryType: "Top"`
- "搜 50 条" → `maxResults: 50`（最大 100）
- "搜索 from:elonmusk AI" → `query: "from:elonmusk AI"`（支持 Twitter 搜索运算符）

### Twitter 搜索运算符（用在 query 字段中）

| 运算符 | 示例 | 说明 |
|--------|------|------|
| `from:` | `from:elonmusk AI` | 某用户发的含关键词推文 |
| `to:` | `to:openai` | 回复某用户的推文 |
| `#hashtag` | `#AIAgents` | 包含特定标签 |
| `min_faves:` | `AI min_faves:100` | 最少点赞数 |
| `min_retweets:` | `AI min_retweets:50` | 最少转推数 |
| `lang:` | `AI lang:en` | 指定语言 |
| `-filter:replies` | `AI -filter:replies` | 排除回复 |
| `filter:media` | `AI filter:media` | 仅含媒体 |

搜索运算符与 `queryType` 互不影响，可自由组合。

## 其他操作

### 获取用户最新推文（实时）

从 Twitter API 实时拉取用户最新推文（非 DB 缓存）。

```bash
curl -s "https://api.xgo.ing/openapi/v1/tweet/latest?userName=elonmusk&maxPages=3" \
  -H "X-API-KEY: $XGO_API_KEY"
```

- `userName`: 目标用户名（不填则为 API Key 对应用户）
- `maxPages`: 拉取页数（默认 3，最大 5），每页约 20 条推文

### 按 ID 刷新推文（实时）

重新拉取指定推文以获取最新互动数据。

```bash
curl -s -X POST https://api.xgo.ing/openapi/v1/tweet/refresh \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: $XGO_API_KEY" \
  -d '{"tweetIds":["1234567890","9876543210"]}'
```

- `tweetIds`: 每次最多 100 个推文 ID。

## 可用端点

| 端点 | 方法 | 类型 | 用途 |
|------|------|------|------|
| `/openapi/v1/tweet/search` | POST | 实时 | 实时搜索推文（最常用） |
| `/openapi/v1/tweet/latest` | GET | 实时 | 获取用户最新推文 |
| `/openapi/v1/tweet/refresh` | POST | 实时 | 刷新指定推文数据 |

完整请求/响应字段详情见 `references/api_reference.md`。

## 核心工作流

### 场景 A: 话题搜索

1. **搜索**: 调用 `tweet/search`，传入用户的查询词
2. **过滤**: 移除低质量结果（过短推文、垃圾信息）
3. **输出**: 展示结果及完整互动指标

### 场景 B: 用户最新推文

1. **拉取**: 调用 `tweet/latest`，传入目标用户名
2. **排序**: 结果已按时间倒序排列
3. **输出**: 展示推文及互动数据

### 场景 C: 刷新与追踪

**前置条件**: 此场景需要推文 ID（来自之前的拉取、搜索，或用户提供的 URL/ID）。若用户要求"刷新"但未提供 ID，请让用户提供推文链接或 ID，或先执行场景 A/B 获取 ID。

1. **刷新**: 调用 `tweet/refresh`，传入推文 ID 列表
2. **对比**: 展示更新后的互动指标
3. **输出**: 若有历史数据，高亮指标变化

## 输出格式

### 搜索结果

```markdown
## XGo 搜索结果: "query" (共 N 条)

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

### 用户最新推文

```markdown
## @username 的最新推文 (共 N 条)

---

### 1. 2026-02-28 14:30
- **影响力**: 85 | **互动**: 👍 446 🔁 134 💬 36 🔄 12 📑 28 👁 45K
- **语言**: en
- **内容**:
  推文完整文本内容...
- **链接**: [查看原文](https://x.com/username/status/id)
- **标签**: #tag1, #tag2
- **提及**: @user1, @user2
- **媒体**: 📷 2张图片 / 🎬 1个视频
- **引用推文**: [@quoted_user: 引用推文内容摘要...]

---
```

**重要**: `tweet/search` 和 `tweet/latest` 的 `data` 字段返回的是**扁平数组**（如 `"data": [TweetDTO, ...]`），不是分页对象。没有 `totalPage` 或 `currentPage` — 所有结果在单次响应中返回。**不要**对这些端点使用 xgo-fetch-tweets 的分页逻辑。

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
- `retweetedTweet`: 若为转推，包含原始推文作者和内容摘要
- 任何字段为空/null 时省略该行
- 搜索失败时返回空列表（优雅降级）— 向用户报告"无结果"

## 错误处理

**重要**: 始终先检查 `response.success` 再处理 `response.data`。部分错误返回 HTTP 200 但 `success: false`（如 `xgo-0001` 用户不存在）— 不要仅依赖 HTTP 状态码。

- `401`: 检查 `XGO_API_KEY` 是否已设置且有效
- `403`: 开放接口需要 Plus 或 Pro 会员
- `429`: 频率限制 — 等待 10 秒后重试一次。若仍为 429，告知用户: "频率限制，请稍后重试。"（PLUS 200次/分, PRO 600次/分）
- `success: false` 且 `code` 非零: 读取响应体中的 `code` 和 `message`，对照 api_reference 中的错误码处理
- 结果为空: 搜索可能返回空列表 — 建议用户调整搜索词
- `query` 最大 500 字符: **不要**静默截断。告知用户查询过长，请缩短内容或拆分为多次搜索
