---
name: bestblogs-fetcher
description: "Fetch and browse content from BestBlogs.dev OpenAPI - articles, podcasts, videos, tweets, and newsletters. Use when user wants to: (1) get latest articles or trending content, (2) search BestBlogs for specific topics or keywords, (3) fetch today's or recent high-quality content, (4) browse newsletters/issues, (5) get article details or full content, (6) explore podcast transcripts, (7) list content sources. Triggered by phrases like '拉取BestBlogs内容', '获取最新文章', '今天有什么好文章', 'fetch bestblogs', 'get latest posts', '查看精选', '拉取推文', '获取播客', '查看期刊', or any mention of BestBlogs content retrieval."
---

# BestBlogs Fetcher

Fetch content from BestBlogs.dev OpenAPI. Supports articles, podcasts, videos, tweets, newsletters, and source management.

For full API parameter details, read `references/api_reference.md`.

## Auth

All requests require header `X-API-KEY`. Read the key from environment variable `BESTBLOGS_API_KEY`:

```bash
-H "X-API-KEY: $BESTBLOGS_API_KEY"
```

If `BESTBLOGS_API_KEY` is not set, prompt the user to configure it.

## Default Fetch Strategy

When user does not specify filters, use these defaults:
- `timeFilter`: `3d` (近 3 天)
- `sortType`: `score_desc` (按评分倒序)
- `userLanguage`: `zh_CN`
- Client-side filter: score >= 85
- Default output count: **20** items (adjustable per user request)

### Fetch Plan (5 parallel requests, max ~500 items)

```bash
# 1. AI articles (100 items)
curl -s -X POST https://api.bestblogs.dev/openapi/v1/resource/list \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: $BESTBLOGS_API_KEY" \
  -d '{"timeFilter":"3d","sortType":"score_desc","userLanguage":"zh_CN","pageSize":100,"type":"ARTICLE","category":"Artificial_Intelligence"}'

# 2. Non-AI articles: Programming + Business + Product (100 items)
curl -s -X POST https://api.bestblogs.dev/openapi/v1/resource/list \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: $BESTBLOGS_API_KEY" \
  -d '{"timeFilter":"3d","sortType":"score_desc","userLanguage":"zh_CN","pageSize":100,"type":"ARTICLE","category":"Programming_Technology"}'
# Note: also fetch Business_Tech and Product_Development if needed, or omit category to get all non-AI articles

# 3. Videos (50 items)
curl -s -X POST https://api.bestblogs.dev/openapi/v1/resource/list \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: $BESTBLOGS_API_KEY" \
  -d '{"timeFilter":"3d","sortType":"score_desc","userLanguage":"zh_CN","pageSize":50,"type":"VIDEO"}'

# 4. Podcasts (50 items)
curl -s -X POST https://api.bestblogs.dev/openapi/v1/resource/list \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: $BESTBLOGS_API_KEY" \
  -d '{"timeFilter":"3d","sortType":"score_desc","userLanguage":"zh_CN","pageSize":50,"type":"PODCAST"}'

# 5. Tweets (200 items, use tweet endpoint)
curl -s -X POST https://api.bestblogs.dev/openapi/v1/tweet/list \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: $BESTBLOGS_API_KEY" \
  -d '{"timeFilter":"3d","language":"all","sortType":"score_desc","userLanguage":"zh_CN","pageSize":100}'
# Fetch page 2 for tweets if needed (to reach 200)
```

Run all 5 requests in parallel. After fetching, client-side filter **score >= 85**, then deduplicate and merge.

### Adjusting Parameters

Adjust based on user input:
- "今天的文章" → `timeFilter: "1d"`
- "本周 AI 文章" → `timeFilter: "1w"`, only fetch AI category
- "精选文章" → add `qualifiedFilter: "true"`
- "评分90以上" → client-side filter score >= 90
- "给我50条" → output 50 items instead of default 20
- "只看播客" → only fetch PODCAST type

## Other Operations

### Get Article Markdown Content

```bash
curl -s "https://api.bestblogs.dev/openapi/v1/resource/markdown?id={RESOURCE_ID}" \
  -H "X-API-KEY: $BESTBLOGS_API_KEY"
```

Returns the article body as Markdown text (in `data` field). Returns `null` if content doesn't exist.

### Get Latest Newsletter

```bash
curl -s -X POST https://api.bestblogs.dev/openapi/v1/newsletter/list \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: $BESTBLOGS_API_KEY" \
  -d '{"pageSize":1,"userLanguage":"zh_CN"}'
```

Then get details:

```bash
curl -s "https://api.bestblogs.dev/openapi/v1/newsletter/get?id={NEWSLETTER_ID}&language=zh_CN" \
  -H "X-API-KEY: $BESTBLOGS_API_KEY"
```

## Available Endpoints

| Endpoint | Method | Use Case |
|----------|--------|----------|
| `/openapi/v1/resource/list` | POST | 查询文章/播客/视频列表(最常用) |
| `/openapi/v1/resource/meta` | GET | 获取单个资源的完整元数据 |
| `/openapi/v1/resource/markdown` | GET | 获取文章的 Markdown 正文内容 |
| `/openapi/v1/resource/podcast/content` | GET | 获取播客转录、章节、问答 |
| `/openapi/v1/tweet/list` | POST | 查询推文列表(含互动数据) |
| `/openapi/v1/newsletter/list` | POST | 查询期刊列表 |
| `/openapi/v1/newsletter/get` | GET | 获取期刊详情(含文章列表) |
| `/openapi/v1/source/list` | POST | 查询订阅源列表 |

For complete request/response field details, see `references/api_reference.md`.

## Core Workflow

### Step 1: Fetch All Pages

Make parallel requests per the Default Fetch Strategy. Check `totalCount` / `pageCount` and continue paginating until all data is retrieved.

### Step 2: Client-side Filter & Deduplicate

1. **Score filter**: Keep items with `score >= 85` (or user-specified threshold)
2. **Deduplicate**: Match by `title` similarity or same `url` — keep the highest-scored version
3. **Sort**: By score descending, then by publish time descending

### Step 3: Output Full Details

Output all API detail fields for each item. Do NOT summarize or compress — downstream skills need full data for quality assessment.

## Output Format

Use `readUrl` (BestBlogs 站内链接) for all links. Use `url` only as fallback when `readUrl` is absent.

### Articles / Podcasts / Videos

```markdown
## BestBlogs 内容列表 (YYYY-MM-DD, 近 X 天, 共 N 篇)

---

### 1. [文章标题](readUrl)
- **来源**: 来源名称 | **作者**: 作者1, 作者2 | **评分**: 96 | **字数**: 6835 | **阅读时间**: 28 分钟
- **分类**: 人工智能 > AI 模型
- **一句话摘要**: oneSentenceSummary 内容
- **详细摘要**: summary 完整内容（不截断）
- **主要观点**:
  1. **观点标题**: 详细解释说明
  2. **观点标题**: 详细解释说明
  3. **观点标题**: 详细解释说明
- **文章金句**:
  - "金句原文1"
  - "金句原文2"
  - "金句原文3"
- **标签**: 标签1, 标签2, 标签3
- **发布时间**: publishDateTimeStr

---

### 2. [文章标题](readUrl)
...
```

### Tweets

```markdown
### 1. [推文标题](readUrl)
- **作者**: @username | **评分**: 91 | **影响力**: 90
- **互动**: 👍 446 🔁 134 💬 36 💾 28 👁 45K
- **一句话摘要**: oneSentenceSummary
- **详细摘要**: summary 完整内容
- **主要观点**:
  1. **观点标题**: 详细解释
- **金句**:
  - "金句原文"
- **标签**: 标签1, 标签2
- **发布时间**: publishDateTimeStr
```

### Output Completeness Rules

- `summary`: Output in full, never truncate
- `mainPoints`: Output ALL points with both `point` and `explanation`
- `keyQuotes`: Output ALL quotes
- `tags`: Output ALL tags
- If `mainPoints` or `keyQuotes` is empty, omit that section
- For tweets with `translateContent`, include it after the summary

## Error Handling

- `401`: Check if `BESTBLOGS_API_KEY` is set and valid
- `400`: Verify parameter values match allowed enums
- `404`: Resource ID may be invalid
- `500`: Retry once, then report to user

## Common Filters Quick Reference

| Filter | Values |
|--------|--------|
| timeFilter | `1d`, `3d`, `1w`, `1m`, `3m`, `1y` |
| qualifiedFilter | `true` (精选), `false`, `ALL` |
| sortType | `default`, `time_desc`, `score_desc`, `read_desc` |
| category | `Artificial_Intelligence`, `Business_Tech`, `Programming_Technology`, `Product_Development` |
| type | `ARTICLE`, `PODCAST`, `VIDEO`, `TWITTER` |
| language | `zh_CN`, `en_US` |
