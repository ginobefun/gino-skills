---
name: bestblogs-fetcher
description: "Use when 用户想浏览或拉取 BestBlogs 内容，包括文章、播客、视频、推文、期刊或来源元数据；批量分析或翻译流程请改用 processing skills。"
---

# BestBlogs Fetcher

Fetch content from BestBlogs.dev OpenAPI. Supports articles, podcasts, videos, tweets, newsletters, and source management.

For full API parameter details, read `references/api_reference.md`.

## When to Use

- 用户要读取 BestBlogs 的内容列表、正文、期刊详情或来源信息
- 用户需要原始数据和完整字段，供后续人工判断或其他 skill 继续处理
- 用户的问题本质上是 fetch / browse，而不是 digest、review 或批处理

## When Not to Use

- 想做日报或周刊摘要时，使用 `bestblogs-daily-digest` 或 `bestblogs-weekly-curator`
- 想 review 已评分内容时，使用 `bestblogs-content-reviewer`
- 想处理待分析、待翻译队列时，优先使用 `bestblogs-process-*`、`bestblogs-fetch-pending-content`、`bestblogs-analyze-content`、`bestblogs-translate-analysis-result`

## Gotchas

- 这是读取 skill，不负责重写或总结内容；默认输出应保留足够完整的字段给下游用
- 必须显式传 `sortType: "score_desc"`，否则服务端默认排序可能偏离预期
- 抓 tweet 和抓 resource 走的是不同 endpoint，字段结构不能混用
- 分页、去重和 score 过滤都在客户端处理，不要假设单页就是完整结果

## Related Skills

- `bestblogs-daily-digest`：把近期内容筛成日报
- `bestblogs-weekly-curator`：把一周内容策展成 issue
- `bestblogs-content-reviewer`：对待 review 内容做评分校准
- `bestblogs-fetch-pending-content`：读取待分析 / 待翻译工作队列，而不是公开内容池

## Shared Scripts

- 优先复用仓库级共享 client：`scripts/shared/bestblogs_client.py`
- 该脚本统一封装 OpenAPI 请求、分页和 `success:false` 校验，避免重复拼装 curl

## Auth

> Full auth configuration: `../../references/shared/auth-bestblogs.md`.

This skill uses OpenAPI only (public content reading).

## Default Fetch Strategy

When user does not specify filters, use these defaults:
- `timeFilter`: `3d` (近 3 天)
- `sortType`: `score_desc` (按评分倒序)
- `userLanguage`: `zh_CN`
- Client-side filter: score >= 85
- Default output count: **20** items (adjustable per user request)

### Fetch Plan (shared client template)

优先用共享 client 模板代替手写 `curl`：

```bash
# AI 文章
python3 scripts/examples/bestblogs_fetch_resources.py \
  --type ARTICLE \
  --category Artificial_Intelligence \
  --time-filter 3d \
  --sort-type score_desc \
  --page-size 100 \
  --max-pages 2

# 视频
python3 scripts/examples/bestblogs_fetch_resources.py \
  --type VIDEO \
  --time-filter 3d \
  --sort-type score_desc \
  --page-size 50 \
  --max-pages 2

# 播客
python3 scripts/examples/bestblogs_fetch_resources.py \
  --type PODCAST \
  --time-filter 3d \
  --sort-type score_desc \
  --page-size 50 \
  --max-pages 2
```

如果需要组合多个分类或与推文结果并行拉取，复用同一个 shared client，在 Python 层并行组织多个调用。拉取后再做客户端 `score >= 85` 过滤、去重和 merge。

### Adjusting Parameters

Adjust based on user input:
- "今天的文章" → `timeFilter: "1d"`
- "本周 AI 文章" → `timeFilter: "1w"`, only fetch AI category
- "精选文章" → add `qualifiedFilter: "true"`
- "评分 90 以上" → client-side filter score >= 90
- "给我 50 条" → output 50 items instead of default 20
- "只看播客" → only fetch PODCAST type

## Other Operations

### Get Article Markdown Content

```bash
python3 - <<'PY'
from scripts.shared.bestblogs_client import BestBlogsOpenClient

client = BestBlogsOpenClient()
payload = client.get_resource_markdown("RAW_xxx")
print(payload)
PY
```

Returns the article body as Markdown text (in `data` field). Returns `null` if content doesn't exist.

### Get Latest Newsletter

```bash
python3 - <<'PY'
from scripts.shared.bestblogs_client import BestBlogsOpenClient

client = BestBlogsOpenClient()
latest = client.list_newsletters({"currentPage": 1, "pageSize": 1, "userLanguage": "zh_CN"})
issue_id = latest["data"]["dataList"][0]["id"]
detail = client.get_newsletter_detail(issue_id, language="zh_CN")
print(detail)
PY
```

## Available Endpoints

| Endpoint | Method | Use Case |
|----------|--------|----------|
| `/openapi/v1/resource/list` | POST | 查询文章/播客/视频列表 (最常用) |
| `/openapi/v1/resource/meta` | GET | 获取单个资源的完整元数据 |
| `/openapi/v1/resource/markdown` | GET | 获取文章的 Markdown 正文内容 |
| `/openapi/v1/resource/podcast/content` | GET | 获取播客转录、章节、问答 |
| `/openapi/v1/tweet/list` | POST | 查询推文列表 (含互动数据) |
| `/openapi/v1/newsletter/list` | POST | 查询期刊列表 |
| `/openapi/v1/newsletter/get` | GET | 获取期刊详情 (含文章列表) |
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
## BestBlogs 内容列表 (YYYY-MM-DD, 近 X 天，共 N 篇)

---

### 1. [文章标题](readUrl)
- **来源**: 来源名称 | **作者**: 作者 1, 作者 2 | **评分**: 96 | **字数**: 6835 | **阅读时间**: 28 分钟
- **分类**: 人工智能 > AI 模型
- **一句话摘要**: oneSentenceSummary 内容
- **详细摘要**: summary 完整内容（不截断）
- **主要观点**:
  1. **观点标题**: 详细解释说明
  2. **观点标题**: 详细解释说明
  3. **观点标题**: 详细解释说明
- **文章金句**:
  - "金句原文 1"
  - "金句原文 2"
  - "金句原文 3"
- **标签**: 标签 1, 标签 2, 标签 3
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
- **标签**: 标签 1, 标签 2
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

> Common error codes: `../../references/shared/error-handling-bestblogs.md`.

Skill-specific errors:
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
