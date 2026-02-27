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

## Quick Operations

### Fetch Today's Top Articles

```bash
curl -s -X POST https://api.bestblogs.dev/openapi/v1/resource/list \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: $BESTBLOGS_API_KEY" \
  -d '{"timeFilter":"1d","qualifiedFilter":"true","sortType":"score_desc","userLanguage":"zh_CN","pageSize":20}'
```

### Fetch Recent 3-Day Articles by Category

```bash
curl -s -X POST https://api.bestblogs.dev/openapi/v1/resource/list \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: $BESTBLOGS_API_KEY" \
  -d '{"timeFilter":"3d","category":"Artificial_Intelligence","qualifiedFilter":"true","sortType":"score_desc","userLanguage":"zh_CN","pageSize":20}'
```

Categories: `Artificial_Intelligence`, `Business_Tech`, `Programming_Technology`, `Product_Development`

### Fetch Recent Tweets

```bash
curl -s -X POST https://api.bestblogs.dev/openapi/v1/tweet/list \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: $BESTBLOGS_API_KEY" \
  -d '{"timeFilter":"3d","language":"all","sortType":"score_desc","userLanguage":"zh_CN","pageSize":20}'
```

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

Then get details with the returned id:

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

## Output Format

When presenting fetched content to the user, format as a readable Markdown list:

```markdown
## BestBlogs 精选 (2025-02-27, 共 N 篇)

### 1. [文章标题](原文链接)
- **来源**: 来源名称 | **评分**: 96 | **阅读时间**: 28 分钟
- **分类**: 人工智能 > AI 模型
- **摘要**: 一句话摘要内容
- **标签**: 标签1, 标签2, 标签3

### 2. [文章标题](原文链接)
...
```

For tweets, include engagement metrics:

```markdown
### 1. [推文标题](推文链接)
- **作者**: @username | **评分**: 91
- **互动**: 👍 446 🔁 134 💬 36 👁 45K
- **摘要**: 一句话摘要
```

## Pagination

All list endpoints return paginated results. When the user needs more results than one page:

1. Check `totalCount` and `pageCount` in response
2. Increment `currentPage` to fetch subsequent pages
3. Report total available count to user

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
