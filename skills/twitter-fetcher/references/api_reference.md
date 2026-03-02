# XGo Twitter Fetcher API Reference

Base URL: `https://api.xgo.ing`
Auth: Header `X-API-KEY` (env var `XGO_API_KEY`)

The API Key is per-user. The server resolves `userName` from the API Key automatically.

## Table of Contents

1. [Tweet List](#tweet-list) - 查询推文列表（分页）
2. [Tweet Batch](#tweet-batch) - 按 ID 批量查询推文
3. [Tweet Languages](#tweet-languages) - 获取用户推文语言
4. [Tweet Tags](#tweet-tags) - 获取关注者标签
5. [Data Types](#data-types) - TweetDTO, UserBrief, MediaDTO 等
6. [Enums](#enums) - 枚举值速查

---

## Tweet List

`POST /openapi/v1/tweet/list`

查询推文列表，支持多种查询类型、时间范围、排序方式。**最常用的端点。**

### Request Body

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| currentPage | Integer | Yes | | 页码（1-based） |
| pageSize | Integer | Yes | | 每页数量（最大 100） |
| userName | String | No | (from API Key) | `queryType=user` 时可指定目标用户；其他场景自动使用 API Key 用户 |
| queryType | String | No | | 查询类型，见 [QueryType](#querytype) |
| tweetType | String | No | | 推文类型过滤，见 [TweetType](#tweettype) |
| lang | String | No | | 语言过滤（如 `en`, `zh`），`ALL` 不过滤 |
| timeRange | String | No | | 时间范围，见 [TimeRange](#timerange) |
| keyword | String | No | | 搜索关键词 |
| listId | String | No | | List ID（查询特定 List 中成员的推文） |
| folderId | String | No | | 收藏夹 ID（`bookmark` 查询类型时使用） |
| tags | List\<String\> | No | | 标签过滤 |
| sortType | String | No | recent (服务端默认; skill 覆盖为 `influence`) | 排序方式，见 [SortType](#sorttype)。**必须显式传递**，不要依赖默认值 |

### Response

```json
{
  "success": true,
  "code": "0",
  "message": "success",
  "traceId": "xxx",
  "data": {
    "currentPage": 1,
    "pageSize": 20,
    "totalPage": 5,
    "totalSize": 100,
    "data": [ TweetDTO, ... ]
  }
}
```

### Example

```bash
curl -X POST https://api.xgo.ing/openapi/v1/tweet/list \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: $XGO_API_KEY" \
  -d '{
    "queryType": "following",
    "timeRange": "LAST_24H",
    "sortType": "influence",
    "tweetType": "NO_RETWEET",
    "currentPage": 1,
    "pageSize": 50
  }'
```

---

## Tweet Batch

`POST /openapi/v1/tweet/batch`

按推文 ID 列表批量查询推文（从 DB 缓存）。

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| tweetIds | List\<String\> | Yes | 推文 ID 列表 |

### Response

```json
{
  "success": true,
  "code": "0",
  "data": [ TweetDTO, ... ]
}
```

### Example

```bash
curl -X POST https://api.xgo.ing/openapi/v1/tweet/batch \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: $XGO_API_KEY" \
  -d '{"tweetIds": ["1234567890", "0987654321"]}'
```

---

## Tweet Languages

`GET /openapi/v1/tweet/languages`

获取用户的推文语言列表。

### Parameters

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| userName | String | No | 自动从 API Key 推断 |

### Response

```json
{
  "success": true,
  "code": "0",
  "data": ["en", "zh", "ja"]
}
```

### Example

```bash
curl "https://api.xgo.ing/openapi/v1/tweet/languages" \
  -H "X-API-KEY: $XGO_API_KEY"
```

---

## Tweet Tags

`GET /openapi/v1/tweet/tags`

获取用户关注者的标签列表，按出现频率排序。

### Parameters

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| userName | String | No | 自动从 API Key 推断 |

### Response

```json
{
  "success": true,
  "code": "0",
  "data": ["AI", "Web3", "Startup", "Engineering"]
}
```

### Example

```bash
curl "https://api.xgo.ing/openapi/v1/tweet/tags" \
  -H "X-API-KEY: $XGO_API_KEY"
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
| videoAspectRatio | List\<Integer\> | 视频宽高比 |
| videoDurationMillis | Integer | 视频时长(ms) |
| videoVariants | List\<VideoVariantDTO\> | 视频格式列表 |

### UrlInfoDTO

| Field | Type | Description |
|-------|------|-------------|
| url | String | 短链接 |
| expandedUrl | String | 展开后的完整 URL |
| displayUrl | String | 显示 URL |
| indices | List\<Integer\> | 在文本中的位置 [start, end] |

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

## Enums

### QueryType

| Value | Description |
|-------|-------------|
| `following` | 关注者的推文 |
| `recommendation` | 推荐推文（服务端已过滤 influenceScore >= 100，客户端无需再过滤） |
| `user` | 指定用户的推文 |
| `bookmark` | 收藏的推文 |

### TweetType

| Value | Description |
|-------|-------------|
| `ALL` | 全部推文 |
| `NO_REPLY` | 排除回复 |
| `NO_RETWEET` | 排除纯转推 |
| `ORIGINAL` | 仅原创（排除回复和转推） |
| `NO_QUOTE` | 排除引用推文 |

### TimeRange

| Value | Description |
|-------|-------------|
| `TODAY` | 今天（从当天 00:00 开始） |
| `LAST_24H` | 最近 24 小时 |
| `WEEK` | 本周 |
| `MONTH` | 本月 |

### SortType

| Value | Description |
|-------|-------------|
| `recent` | 最新（按 createdAt 倒序） |
| `influence` | 影响力（按 influenceScore 倒序） |
| `replyCount` | 按回复数倒序 |
| `quoteCount` | 按引用数倒序 |
| `likeCount` | 按点赞数倒序 |
| `viewCount` | 按浏览数倒序 |

### Language (lang)

常见值: `en`, `zh`, `ja`, `ko`, `fr`, `de`, `es`, `pt`
特殊值: `ALL` — 不过滤语言

---

## Common Response Format

```json
{
  "success": true,
  "code": "0",
  "message": "success",
  "traceId": "唯一追踪 ID",
  "data": { ... }
}
```

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| AUTH_001 | 401 | API Key 缺失 |
| AUTH_002 | 401 | API Key 无效 |
| AUTH_003 | 401 | 用户设置无效 |
| AUTH_004 | 403 | 需要 Plus 或 Pro 会员 |
| xgo-0010 | 429 | 频率限制（PLUS 200/min, PRO 600/min） |
| xgo-1001 | 400 | 参数错误 |
| xgo-9999 | 500 | 系统错误 |
