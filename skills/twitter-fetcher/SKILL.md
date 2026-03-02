---
name: twitter-fetcher
description: "Fetch tweets from XGo (xgo.ing) OpenAPI - following timeline, recommendations, lists, tags, and bookmarks. Use when user wants to: (1) get latest tweets from their Twitter/X timeline, (2) fetch trending or high-influence tweets, (3) browse tweets from a specific list or tag, (4) get recommended tweets, (5) filter tweets by language/time/type. Triggered by phrases like '拉取推文', '获取推特', 'fetch tweets', 'get twitter', 'xgo推文', '我的推特Timeline', '今天的推文', 'twitter timeline', '看看推特', '推文列表', '推荐推文', or any mention of tweet/twitter fetching from XGo."
---

# Twitter Fetcher

Fetch tweets from XGo (xgo.ing) OpenAPI. Supports following timeline, recommendations, lists, tags, and bookmarks.

For full API parameter details, read `references/api_reference.md`.

## Auth

All requests require header `X-API-KEY`. Read the key from environment variable `XGO_API_KEY`:

```bash
-H "X-API-KEY: $XGO_API_KEY"
```

If `XGO_API_KEY` is not set, prompt the user to configure it.

API Base URL: `https://api.xgo.ing`

The API Key is bound to a specific XGo user account. The server auto-fills `userName` from the authenticated key, so `userName` is **optional** in most requests. Only provide `userName` when `queryType=user` to query another user's public tweets.

## Default Fetch Strategy

When user does not specify filters, use these defaults:
- `queryType`: `following` (关注者推文)
- `timeRange`: `LAST_24H` (近 24 小时)
- `sortType`: `influence` (按影响力排序)
- `tweetType`: `NO_RETWEET` (排除纯转推)
- `pageSize`: 50
- Client-side filter: `influenceScore >= 50`
- Default output count: **20** items (adjustable per user request)

### Fetch Plan (3 parallel requests)

```bash
# 1. Following tweets - page 1 (50 items)
curl -s -X POST https://api.xgo.ing/openapi/v1/tweet/list \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: $XGO_API_KEY" \
  -d '{"queryType":"following","timeRange":"LAST_24H","sortType":"influence","tweetType":"NO_RETWEET","currentPage":1,"pageSize":50}'

# 2. Following tweets - page 2 (50 items)
curl -s -X POST https://api.xgo.ing/openapi/v1/tweet/list \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: $XGO_API_KEY" \
  -d '{"queryType":"following","timeRange":"LAST_24H","sortType":"influence","tweetType":"NO_RETWEET","currentPage":2,"pageSize":50}'

# 3. Recommendation tweets (50 items)
curl -s -X POST https://api.xgo.ing/openapi/v1/tweet/list \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: $XGO_API_KEY" \
  -d '{"queryType":"recommendation","timeRange":"LAST_24H","sortType":"influence","tweetType":"NO_RETWEET","currentPage":1,"pageSize":50}'
```

Run all requests in parallel. **Always explicitly pass `sortType`** — the server default is `recent`, but this skill defaults to `influence`.

If `totalPage > currentPage`, fetch up to **4 pages total per queryType** (the plan already covers 2). If there are more pages, inform the user that results are truncated and suggest narrowing `timeRange` or raising `influenceScore` filter.

**Note on client-side filter**: `recommendation` queryType already enforces `influenceScore >= 100` server-side. The `>= 50` client-side filter effectively applies only to `following` results.

### Fetch Plans by Scenario

**Default (following + recommendation)**: Use the 3-request parallel plan above.

**User's own tweets** (`queryType: "user"`):
```bash
curl -s -X POST https://api.xgo.ing/openapi/v1/tweet/list \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: $XGO_API_KEY" \
  -d '{"queryType":"user","sortType":"recent","currentPage":1,"pageSize":100}'
```
No `influenceScore` filter needed for own tweets.

**Bookmark tweets** (`queryType: "bookmark"`):
```bash
curl -s -X POST https://api.xgo.ing/openapi/v1/tweet/list \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: $XGO_API_KEY" \
  -d '{"queryType":"bookmark","sortType":"recent","currentPage":1,"pageSize":100}'
```
No `influenceScore` filter — bookmarks are intentional saves. Use `folderId` to narrow to a specific folder.

### Adjusting Parameters

Adjust based on user input:
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
- "某个 List" → `listId: "xxx"` (需要用户提供 List ID，目前无列表发现端点)
- "标签 xxx" → `tags: ["xxx"]`
- "推荐推文" → `queryType: "recommendation"`
- "我的推文" → `queryType: "user"` (使用 user 场景 fetch plan)
- "收藏推文" → `queryType: "bookmark"` (使用 bookmark 场景 fetch plan)
- "给我 50 条" → output 50 items instead of default 20
- "影响力 80 以上" → client-side filter influenceScore >= 80

## Helper Endpoints

### Get User Languages

```bash
curl -s "https://api.xgo.ing/openapi/v1/tweet/languages" \
  -H "X-API-KEY: $XGO_API_KEY"
```

Returns available tweet languages. Can be used to set `lang` filter.

### Get Following Tags

```bash
curl -s "https://api.xgo.ing/openapi/v1/tweet/tags" \
  -H "X-API-KEY: $XGO_API_KEY"
```

Returns following tags sorted by frequency. Can be used to set `tags` filter.

### Batch Query Tweets

```bash
curl -s -X POST https://api.xgo.ing/openapi/v1/tweet/batch \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: $XGO_API_KEY" \
  -d '{"tweetIds":["1234567890","9876543210"]}'
```

Query specific tweets by ID from DB cache. Useful for re-checking bookmarked or saved tweet IDs.

## Available Endpoints

| Endpoint | Method | Use Case |
|----------|--------|----------|
| `/openapi/v1/tweet/list` | POST | 查询推文列表（最常用） |
| `/openapi/v1/tweet/batch` | POST | 按 ID 批量查询推文 |
| `/openapi/v1/tweet/languages` | GET | 获取用户推文语言 |
| `/openapi/v1/tweet/tags` | GET | 获取关注者标签 |

For complete request/response field details, see `references/api_reference.md`.

## Core Workflow

### Step 1: Fetch Pages (with cap)

Make parallel requests per the appropriate Fetch Plan. Check `totalPage` and fetch up to **4 pages total per queryType**. If more pages exist, note the truncation to the user.

### Step 2: Client-side Filter & Deduplicate

1. **Influence filter**: For `following` results, keep items with `influenceScore >= 50` (or user-specified threshold). Skip this filter for `bookmark` and `user` queryTypes.
2. **Deduplicate**: Match by tweet `id` field (guaranteed unique). If same tweet appears in both `following` and `recommendation`, keep one copy.
3. **Sort**: By `influenceScore` descending, then by `createdAt` descending

### Step 3: Output Full Details

Output all API detail fields for each tweet. Do NOT summarize or compress — downstream skills need full data for quality assessment.

## Output Format

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

### Output Field Mapping

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

### Output Completeness Rules

- `text`: Output in full, never truncate
- `hashTags`: Output ALL tags
- `userMentions`: Output ALL mentions
- `mediaList`: Count and describe all media items
- `quotedTweet`: Include author and text excerpt
- The `**互动**` line is always included; individual emoji-metric pairs within it are omitted only if their value is null or zero
- If `hashTags`, `userMentions`, or `mediaList` is empty/null, omit that line
- If `quotedTweet` is null, omit that line

## Error Handling

**Important**: Always check `response.success` before processing `response.data`. Some errors return HTTP 200 with `success: false` — do not rely on HTTP status alone.

- `401`: Check if `XGO_API_KEY` is set and valid
- `403`: OpenAPI access requires Plus or Pro membership
- `429`: Rate limit exceeded — wait 10 seconds, retry once. If still 429, report to user: "频率限制，请稍后重试。" (PLUS 200 req/min, PRO 600 req/min)
- `success: false` with non-zero `code`: Read `code` and `message` from response body, match against error codes in api_reference
- Empty `data`: User may have no followings, or time range too narrow — try widening `timeRange`
- `totalSize: 0`: No tweets match the query, suggest adjusting filters

## Common Filters Quick Reference

| Filter | Values |
|--------|--------|
| queryType | `following`, `recommendation`, `user`, `bookmark` |
| tweetType | `ALL`, `NO_REPLY`, `NO_RETWEET`, `ORIGINAL`, `NO_QUOTE` |
| timeRange | `TODAY`, `LAST_24H`, `WEEK`, `MONTH` |
| sortType | `recent`, `influence`, `replyCount`, `quoteCount`, `likeCount`, `viewCount` |
| lang | `en`, `zh`, `ja`, `ko`, etc. / `ALL` for no filter |
