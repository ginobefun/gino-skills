# XGo Twitter User Profiler API Reference

Base URL: `https://api.xgo.ing`
Auth: Header `X-API-KEY` (env var `XGO_API_KEY`)

## Table of Contents

1. [User Info](#user-info) - 实时获取用户资料
2. [User Details](#user-details) - 从 DB 查询用户详情
3. [Tweet Latest](#tweet-latest) - 获取用户最新推文
4. [Data Types](#data-types) - UserDTO, TweetDTO 等
5. [Error Codes](#error-codes)

---

## User Info

`GET /openapi/v1/user/info`

实时从 Twitter API 获取用户信息并刷新 DB 缓存。

### Parameters

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| userName | String | No | (from API Key) | Twitter 用户名，不填则为 API Key 对应用户 |

### Response

```json
{
  "success": true,
  "code": "0",
  "message": "success",
  "traceId": "xxx",
  "data": UserDTO
}
```

### Example

```bash
curl "https://api.xgo.ing/openapi/v1/user/info?userName=elonmusk" \
  -H "X-API-KEY: $XGO_API_KEY"
```

---

## User Details

`GET /openapi/v1/user/details`

从 DB 缓存查询用户详情。`userId` 和 `feedId` 二选一。

### Parameters

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| userId | String | No | 用户 ID |
| feedId | String | No | RSS Feed ID |

At least one of `userId` or `feedId` must be provided.

### Response

```json
{
  "success": true,
  "code": "0",
  "message": "success",
  "traceId": "xxx",
  "data": UserDTO
}
```

### Example

```bash
curl "https://api.xgo.ing/openapi/v1/user/details?userId=44196397" \
  -H "X-API-KEY: $XGO_API_KEY"
```

---

## Tweet Latest

`GET /openapi/v1/tweet/latest`

实时获取用户的最新推文（直接从 Twitter API 拉取）。

### Parameters

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| userName | String | No | (from API Key) | 目标用户名 |
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

## Data Types

### UserDTO

| Field | Type | Description |
|-------|------|-------------|
| id | String | Twitter 用户 ID |
| name | String | 显示名称 |
| userName | String | Twitter handle (@用户名) |
| profileImageUrl | String | 头像 URL |
| url | String | 用户网站 URL |
| location | String | 位置 |
| description | String | 个人简介 |
| followers | Integer | 粉丝数 |
| following | Integer | 关注数 |
| favouritesCount | Integer | 点赞数 |
| statusesCount | Integer | 推文数 |
| mediaCount | Integer | 媒体数 |
| createdAt | Date | 账号创建日期 |
| coverPicture | String | 封面图片 URL |
| profileBio | ProfileBioDTO | 结构化 bio（含 URL 链接） |
| tags | List\<String\> | 用户标签 |
| feedId | String | RSS Feed ID |
| latestTweetTime | Date | 最近推文时间 |
| latestFetchTime | Date | 最近数据拉取时间 |

### ProfileBioDTO

结构化的用户简介，包含 URL 和实体信息。

| Field | Type | Description |
|-------|------|-------------|
| description | String | 简介文本（与 UserDTO.description 相同） |
| descriptionUrls | List\<UrlEntity\> | 简介中的 URL 实体列表，每项含 `url`, `expandedUrl`, `displayUrl` |
| website | UrlEntity | 用户网站 URL 实体，含 `url`, `expandedUrl`, `displayUrl` |

示例:
```json
{
  "description": "Building the future https://t.co/xxx",
  "descriptionUrls": [
    { "url": "https://t.co/xxx", "expandedUrl": "https://example.com", "displayUrl": "example.com" }
  ],
  "website": { "url": "https://t.co/yyy", "expandedUrl": "https://mysite.com", "displayUrl": "mysite.com" }
}
```

### TweetDTO

| Field | Type | Description |
|-------|------|-------------|
| id | String | 推文唯一 ID |
| url | String | 推文链接 |
| text | String | 推文文本内容 |
| retweetCount | Integer | 转推数 |
| replyCount | Integer | 回复数 |
| likeCount | Integer | 点赞数 |
| quoteCount | Integer | 引用数 |
| bookmarkCount | Integer | 收藏数 |
| viewCount | Integer | 浏览数 |
| influenceScore | Integer | 影响力评分 |
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
