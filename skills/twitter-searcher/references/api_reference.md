# XGo Twitter Searcher API Reference

Base URL: `https://api.xgo.ing`
Auth: Header `X-API-KEY` (env var `XGO_API_KEY`)

## Table of Contents

1. [Tweet Search](#tweet-search) - 实时搜索推文
2. [Tweet Latest](#tweet-latest) - 获取用户最新推文
3. [Tweet Refresh](#tweet-refresh) - 刷新指定推文数据
4. [Data Types](#data-types) - TweetDTO 等
5. [Error Codes](#error-codes)

---

## Tweet Search

`POST /openapi/v1/tweet/search`

实时搜索推文（通过 Twitter API）。搜索失败时返回空列表（优雅降级）。

### Request Body

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| query | String | Yes | | 搜索查询（最大 500 字符），支持 Twitter 搜索运算符 |
| queryType | String | No | Top | `Top`（热门）或 `Latest`（最新） |
| maxResults | Integer | No | 20 | 最大结果数（最大 100） |

### Response

**Note: This endpoint returns a flat array in `data`, NOT a paginated object. There is no `totalPage` or `currentPage`. All results are returned in a single response up to `maxResults`.**

```json
{
  "success": true,
  "code": "0",
  "message": "success",
  "traceId": "xxx",
  "data": [ TweetDTO, ... ]
}
```

Returns empty list `[]` on search failure (graceful degradation).

### Example

```bash
curl -X POST https://api.xgo.ing/openapi/v1/tweet/search \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: $XGO_API_KEY" \
  -d '{"query":"AI agents","queryType":"Top","maxResults":30}'
```

---

## Tweet Latest

`GET /openapi/v1/tweet/latest`

实时获取用户的最新推文（直接从 Twitter API 拉取）。

### Parameters

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| userName | String | No | (from API Key) | 目标用户名，不填则为 API Key 对应用户 |
| maxPages | Integer | No | 3 | 拉取页数（最大 5），每页约 20 条推文 |

### Response

```json
{
  "success": true,
  "code": "0",
  "message": "success",
  "traceId": "xxx",
  "data": [ TweetDTO, ... ]
}
```

### Example

```bash
curl "https://api.xgo.ing/openapi/v1/tweet/latest?userName=elonmusk&maxPages=3" \
  -H "X-API-KEY: $XGO_API_KEY"
```

---

## Tweet Refresh

`POST /openapi/v1/tweet/refresh`

按推文 ID 列表实时刷新推文数据（从 Twitter API 重新拉取最新互动数据）。

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| tweetIds | List\<String\> | Yes | 推文 ID 列表（最大 100 个） |

### Response

```json
{
  "success": true,
  "code": "0",
  "message": "success",
  "traceId": "xxx",
  "data": [ TweetDTO, ... ]
}
```

### Example

```bash
curl -X POST https://api.xgo.ing/openapi/v1/tweet/refresh \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: $XGO_API_KEY" \
  -d '{"tweetIds":["1234567890","9876543210"]}'
```

---

## Data Types

### TweetDTO

| Field | Type | Description |
|-------|------|-------------|
| id | String | 推文唯一 ID |
| url | String | 推文链接 `https://x.com/username/status/id` |
| text | String | 推文文本内容 |
| retweetCount | Integer | 转推数 |
| replyCount | Integer | 回复数 |
| likeCount | Integer | 点赞数 |
| quoteCount | Integer | 引用数 |
| bookmarkCount | Integer | 收藏数 |
| viewCount | Integer | 浏览数 |
| influenceScore | Integer | 影响力评分 (0-∞) |
| createdAt | Date | 创建时间 (ISO 8601) |
| lang | String | 推文语言 |
| isReply | Boolean | 是否为回复 |
| inReplyToId | String | 被回复推文 ID |
| inReplyToUserId | String | 被回复用户 ID |
| inReplyToUsername | String | 被回复用户名 |
| conversationId | String | 会话 ID |
| author | UserBrief | 作者信息 |
| quotedTweetId | String | 引用推文 ID |
| quotedTweet | TweetDTO | 引用推文完整信息 |
| retweetedTweetId | String | 转推原文 ID |
| retweetedTweet | TweetDTO | 转推原文完整信息 |
| mediaList | List\<MediaDTO\> | 媒体列表 |
| urlInfos | List\<UrlInfoDTO\> | URL 信息列表 |
| hashTags | List\<HashTagDTO\> | Hashtag 列表 |
| userMentions | List\<UserMentionDTO\> | @提及列表 |
| tags | List\<String\> | 推文标签 |

### UserBrief

| Field | Type | Description |
|-------|------|-------------|
| id | String | 用户 ID |
| name | String | 显示名称 |
| userName | String | 用户名（@handle） |
| profileImageUrl | String | 头像 URL |

### MediaDTO

| Field | Type | Description |
|-------|------|-------------|
| idStr | String | 媒体 ID |
| type | String | `photo`, `video`, `animated_gif` |
| mediaUrlHttps | String | 媒体 URL |
| url | String | 短链接 |
| displayUrl | String | 显示 URL |
| expandedUrl | String | 展开 URL |

### HashTagDTO

| Field | Type | Description |
|-------|------|-------------|
| text | String | 标签文本（不含 #） |
| indices | List\<Integer\> | 在文本中的位置 [start, end] |

### UserMentionDTO

| Field | Type | Description |
|-------|------|-------------|
| userId | String | 用户 ID |
| name | String | 显示名称 |
| userName | String | 用户名（@handle） |

---

## Error Codes

**Important**: Some errors return HTTP 200 with `success: false` in the response body. Always check `response.success` or `response.code` — do not rely on HTTP status alone.

| Code | HTTP Status | Description |
|------|-------------|-------------|
| AUTH_001 | 401 | API Key 缺失 |
| AUTH_002 | 401 | API Key 无效 |
| AUTH_003 | 401 | 用户设置无效 |
| AUTH_004 | 403 | 需要 Plus 或 Pro 会员 |
| xgo-0001 | **200** | 用户不存在（注意: HTTP 状态码为 200，需检查 `success` 字段） |
| xgo-0010 | 429 | 频率限制（PLUS 200/min, PRO 600/min） |
| xgo-1001 | 400 | 参数错误 |
| xgo-9999 | 500 | 系统错误 |

## Common Response Format

```json
{
  "success": true,
  "code": "0",
  "message": "success",
  "traceId": "xxx",
  "data": { ... }
}
```
