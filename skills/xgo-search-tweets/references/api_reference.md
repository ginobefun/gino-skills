# XGo 推文搜索器 API 参考

接口地址: `https://api.xgo.ing`
认证方式: 请求头 `X-API-KEY`（环境变量 `XGO_API_KEY`）

## 目录

1. [搜索推文](#搜索推文) - 实时搜索推文
2. [用户最新推文](#用户最新推文) - 获取用户最新推文
3. [刷新推文](#刷新推文) - 刷新指定推文数据
4. [数据类型](#数据类型) - TweetDTO 等
5. [错误码](#错误码)

---

## 搜索推文

`POST /openapi/v1/tweet/search`

实时搜索推文（通过 Twitter API）。搜索失败时返回空列表（优雅降级）。

### 请求体

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| query | String | 是 | | 搜索查询（最大 500 字符），支持 Twitter 搜索运算符 |
| queryType | String | 否 | `Top` | `Top`（热门）或 `Latest`（最新） |
| maxResults | Integer | 否 | 20 | 最大结果数（最大 100） |

### 响应

**注意: 此端点的 `data` 返回扁平数组，不是分页对象。没有 `totalPage` 或 `currentPage`。所有结果在单次响应中返回（不超过 `maxResults`）。**

```json
{
  "success": true,
  "code": "0",
  "message": "success",
  "traceId": "xxx",
  "data": [ TweetDTO, ... ]
}
```

搜索失败时返回空列表 `[]`（优雅降级）。

### 示例

```bash
curl -X POST https://api.xgo.ing/openapi/v1/tweet/search \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: $XGO_API_KEY" \
  -d '{"query":"AI agents","queryType":"Top","maxResults":30}'
```

---

## 用户最新推文

`GET /openapi/v1/tweet/latest`

实时获取用户的最新推文（直接从 Twitter API 拉取）。

### 请求参数

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| userName | String | 否 | (从 API Key 推断) | 目标用户名，不填则为 API Key 对应用户 |
| maxPages | Integer | 否 | 3 | 拉取页数（最大 5），每页约 20 条推文 |

### 响应

```json
{
  "success": true,
  "code": "0",
  "message": "success",
  "traceId": "xxx",
  "data": [ TweetDTO, ... ]
}
```

### 示例

```bash
curl "https://api.xgo.ing/openapi/v1/tweet/latest?userName=elonmusk&maxPages=3" \
  -H "X-API-KEY: $XGO_API_KEY"
```

---

## 刷新推文

`POST /openapi/v1/tweet/refresh`

按推文 ID 列表实时刷新推文数据（从 Twitter API 重新拉取最新互动数据）。

### 请求体

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| tweetIds | List\<String\> | 是 | 推文 ID 列表（最大 100 个） |

### 响应

```json
{
  "success": true,
  "code": "0",
  "message": "success",
  "traceId": "xxx",
  "data": [ TweetDTO, ... ]
}
```

### 示例

```bash
curl -X POST https://api.xgo.ing/openapi/v1/tweet/refresh \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: $XGO_API_KEY" \
  -d '{"tweetIds":["1234567890","9876543210"]}'
```

---

## 数据类型

### TweetDTO

| 字段 | 类型 | 说明 |
|------|------|------|
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
| hashTags | List\<HashTagDTO\> | 话题标签列表 |
| userMentions | List\<UserMentionDTO\> | @提及列表 |
| tags | List\<String\> | 推文标签 |

### UserBrief

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String | 用户 ID |
| name | String | 显示名称 |
| userName | String | 用户名（@handle） |
| profileImageUrl | String | 头像 URL |

### MediaDTO

| 字段 | 类型 | 说明 |
|------|------|------|
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

| 字段 | 类型 | 说明 |
|------|------|------|
| url | String | 短链接 |
| expandedUrl | String | 展开后的完整 URL |
| displayUrl | String | 显示 URL |
| indices | List\<Integer\> | 在文本中的位置 [start, end] |

### HashTagDTO

| 字段 | 类型 | 说明 |
|------|------|------|
| text | String | 标签文本（不含 #） |
| indices | List\<Integer\> | 在文本中的位置 [start, end] |

### UserMentionDTO

| 字段 | 类型 | 说明 |
|------|------|------|
| userId | String | 用户 ID |
| name | String | 显示名称 |
| userName | String | 用户名（@handle） |

---

## 错误码

**重要**: 部分错误返回 HTTP 200 但响应体中 `success: false`。始终检查 `response.success` 或 `response.code` — 不要仅依赖 HTTP 状态码。

| 错误码 | HTTP 状态码 | 说明 |
|--------|------------|------|
| AUTH_001 | 401 | API Key 缺失 |
| AUTH_002 | 401 | API Key 无效 |
| AUTH_003 | 401 | 用户设置无效 |
| AUTH_004 | 403 | 需要 Plus 或 Pro 会员 |
| xgo-0001 | **200** | 用户不存在（注意: HTTP 状态码为 200，需检查 `success` 字段） |
| xgo-0010 | 429 | 频率限制（PLUS 200次/分, PRO 600次/分） |
| xgo-1001 | 400 | 参数错误 |
| xgo-9999 | 500 | 系统错误 |

## 统一响应格式

```json
{
  "success": true,
  "code": "0",
  "message": "success",
  "traceId": "xxx",
  "data": { ... }
}
```
