---
name: twitter-searcher
description: "Search tweets in real-time and fetch latest tweets from specific users via XGo (xgo.ing) OpenAPI. Use when user wants to: (1) search Twitter/X for a specific topic or keyword, (2) find trending discussions about a subject, (3) get a specific user's latest tweets in real-time, (4) refresh specific tweets to get updated engagement data, (5) research what people are saying about something on Twitter. Triggered by phrases like '搜索推文', '搜推特', 'search tweets', 'search twitter', '找推文', '关于XX的推文', 'tweets about', '某人的最新推文', 'latest tweets from @user', '刷新推文', 'refresh tweets', '推特上怎么说', '看看大家怎么讨论', or any mention of tweet searching or real-time tweet fetching. NOTE: Use twitter-fetcher (not this skill) for timeline/feed reading like '拉取推文', '今天的推文', '推文列表'."
---

# Twitter Searcher

Search tweets in real-time and fetch latest tweets from specific users via XGo (xgo.ing) OpenAPI.

For full API parameter details, read `references/api_reference.md`.

## Auth

All requests require header `X-API-KEY`. Read the key from environment variable `XGO_API_KEY`:

```bash
-H "X-API-KEY: $XGO_API_KEY"
```

If `XGO_API_KEY` is not set, prompt the user to configure it.

API Base URL: `https://api.xgo.ing`

## Default Search Strategy

When user provides a search topic without specific parameters:
- `queryType`: `Top` (热门优先)
- `maxResults`: 30
- Default output count: **20** items (adjustable per user request)

### Search Tweets

```bash
curl -s -X POST https://api.xgo.ing/openapi/v1/tweet/search \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: $XGO_API_KEY" \
  -d '{"query":"AI agents","queryType":"Top","maxResults":30}'
```

### Adjusting Parameters

Adjust based on user input:
- "搜索 AI agents" → `query: "AI agents"`
- "最新的" / "按时间" → `queryType: "Latest"`
- "热门的" / "最火的" → `queryType: "Top"`
- "搜 50 条" → `maxResults: 50` (max 100)
- "搜索 from:elonmusk AI" → `query: "from:elonmusk AI"` (supports Twitter search operators)

### Twitter Search Operators (in query field)

| Operator | Example | Description |
|----------|---------|-------------|
| `from:` | `from:elonmusk AI` | 某用户发的含关键词推文 |
| `to:` | `to:openai` | 回复某用户的推文 |
| `#hashtag` | `#AIAgents` | 包含特定标签 |
| `min_faves:` | `AI min_faves:100` | 最少点赞数 |
| `min_retweets:` | `AI min_retweets:50` | 最少转推数 |
| `lang:` | `AI lang:en` | 指定语言 |
| `-filter:replies` | `AI -filter:replies` | 排除回复 |
| `filter:media` | `AI filter:media` | 仅含媒体 |

## Other Operations

### Fetch User's Latest Tweets (Real-time)

Fetch a user's latest tweets directly from Twitter API (not from DB cache).

```bash
curl -s "https://api.xgo.ing/openapi/v1/tweet/latest?userName=elonmusk&maxPages=3" \
  -H "X-API-KEY: $XGO_API_KEY"
```

- `userName`: Target user (defaults to authenticated user if omitted)
- `maxPages`: Pages to fetch (default 3, max 5). Each page ~20 tweets.

### Refresh Tweets by ID (Real-time)

Re-fetch specific tweets to get updated engagement metrics.

```bash
curl -s -X POST https://api.xgo.ing/openapi/v1/tweet/refresh \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: $XGO_API_KEY" \
  -d '{"tweetIds":["1234567890","9876543210"]}'
```

- `tweetIds`: Up to 100 tweet IDs per request.

## Available Endpoints

| Endpoint | Method | Type | Use Case |
|----------|--------|------|----------|
| `/openapi/v1/tweet/search` | POST | Real-time | 实时搜索推文（最常用） |
| `/openapi/v1/tweet/latest` | GET | Real-time | 获取用户最新推文 |
| `/openapi/v1/tweet/refresh` | POST | Real-time | 刷新指定推文数据 |

For complete request/response field details, see `references/api_reference.md`.

## Core Workflow

### Scenario A: Topic Search

1. **Search**: Call `tweet/search` with user's query
2. **Filter**: Remove low-quality results (short tweets, spam)
3. **Output**: Display results with full engagement metrics

### Scenario B: User's Latest Tweets

1. **Fetch**: Call `tweet/latest` with target username
2. **Sort**: Results are already in reverse chronological order
3. **Output**: Display tweets with engagement data

### Scenario C: Refresh & Track

**Prerequisite**: This scenario requires tweet IDs from a previous fetch, search, or user-provided URLs/IDs. If the user asks to "refresh" without providing IDs, ask them to share tweet URLs or IDs, or re-run Scenario A/B first.

1. **Refresh**: Call `tweet/refresh` with tweet IDs
2. **Compare**: Show updated engagement metrics
3. **Output**: Highlight changes in metrics if previous data available

## Output Format

### Search Results

```markdown
## XGo 搜索结果: "query" (共 N 条)

---

### 1. @username - DisplayName
- **影响力**: 85 | **互动**: 👍 446 🔁 134 💬 36 📑 28 👁 45K
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

### Latest Tweets

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

**Important**: `tweet/search` and `tweet/latest` return a **flat array** in `data` (e.g., `"data": [TweetDTO, ...]`), NOT a paginated object. There is no `totalPage` or `currentPage` — all results are in a single response. Do NOT apply pagination logic from twitter-fetcher to these endpoints.

### Output Field Mapping

| 输出字段 | API 字段 | 说明 |
|---------|---------|------|
| @username | `author.userName` | 用户名 |
| DisplayName | `author.name` | 显示名称 |
| 影响力 | `influenceScore` | 影响力评分 |
| 👍 | `likeCount` | 点赞数 |
| 🔁 | `retweetCount` | 转推数 |
| 💬 | `replyCount` | 回复数 |
| 📑 | `bookmarkCount` | 收藏数 |
| 👁 | `viewCount` | 浏览数（大数字用 K/M 格式化） |
| 语言 | `lang` | 推文语言 |
| 时间 | `createdAt` | 格式化为本地时间 |
| 内容 | `text` | 完整推文文本 |
| 链接 | `url` | 推文原文链接 |

### Output Completeness Rules

- `text`: Output in full, never truncate
- `hashTags`: Output ALL tags
- `userMentions`: Output ALL mentions
- `mediaList`: Count and describe all media items
- `quotedTweet`: Include author and text excerpt
- If any field is empty/null, omit that line
- Search returns empty list on failure (graceful degradation) — report "no results" to user

## Error Handling

**Important**: Always check `response.success` before processing `response.data`. Some errors return HTTP 200 with `success: false` (e.g., `xgo-0001` user not found) — do not rely on HTTP status alone.

- `401`: Check if `XGO_API_KEY` is set and valid
- `403`: OpenAPI access requires Plus or Pro membership
- `429`: Rate limit exceeded — wait 10 seconds, retry once. If still 429, report to user: "频率限制，请稍后重试。" (PLUS 200 req/min, PRO 600 req/min)
- `success: false` with non-zero `code`: Read `code` and `message` from response body, match against error codes in api_reference
- Empty results: Search may return empty list — suggest refining query terms
- `query` max 500 chars: Do NOT silently truncate. Inform the user that the query is too long and ask them to shorten it, or suggest splitting into multiple searches
