# XGo 推文拉取器 API 参考

接口地址: `https://api.xgo.ing`
认证方式: 请求头 `X-API-KEY`（环境变量 `XGO_API_KEY`）

API Key 按用户绑定。服务端自动从 API Key 推断 `userName`。

## 目录

1. [推文列表](#推文列表) - 查询推文列表（分页）
2. [批量查询推文](#批量查询推文) - 按 ID 批量查询推文
3. [推文语言](#推文语言) - 获取用户推文语言
4. [关注者标签](#关注者标签) - 获取关注者标签
5. [数据类型](#数据类型) - TweetDTO, UserBrief, MediaDTO 等
6. [枚举值](#枚举值) - 枚举值速查

---

## 推文列表

`POST /openapi/v1/tweet/list`

查询推文列表，支持多种查询类型、时间范围、排序方式。**最常用的端点。**

### 请求体

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| currentPage | Integer | 是 | | 页码（从 1 开始） |
| pageSize | Integer | 是 | | 每页数量（最大 100） |
| userName | String | 否 | (从 API Key 推断) | `queryType=user` 时可指定目标用户；其他场景自动使用 API Key 用户 |
| queryType | String | 否 | | 查询类型，见 [QueryType](#querytype) |
| tweetType | String | 否 | | 推文类型过滤，见 [TweetType](#tweettype) |
| lang | String | 否 | | 语言过滤（如 `en`, `zh`），`ALL` 不过滤 |
| timeRange | String | 否 | | 时间范围，见 [TimeRange](#timerange) |
| keyword | String | 否 | | 搜索关键词 |
| listId | String | 否 | | 列表 ID（查询特定列表中成员的推文） |
| folderId | String | 否 | | 收藏夹 ID（`bookmark` 查询类型时使用） |
| tags | List\<String\> | 否 | | 标签过滤 |
| sortType | String | 否 | `recent`（服务端默认） | 排序方式，见 [SortType](#sorttype)。此 skill 始终显式传递 `influence`，**必须显式传递**，不要依赖服务端默认值 |

### 响应

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

### 示例

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

## 批量查询推文

`POST /openapi/v1/tweet/batch`

按推文 ID 列表批量查询推文（从 DB 缓存）。

### 请求体

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| tweetIds | List\<String\> | 是 | 推文 ID 列表 |

### 响应

```json
{
  "success": true,
  "code": "0",
  "data": [ TweetDTO, ... ]
}
```

### 示例

```bash
curl -X POST https://api.xgo.ing/openapi/v1/tweet/batch \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: $XGO_API_KEY" \
  -d '{"tweetIds": ["1234567890", "0987654321"]}'
```

---

## 推文语言

`GET /openapi/v1/tweet/languages`

获取用户的推文语言列表。

### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| userName | String | 否 | 自动从 API Key 推断 |

### 响应

```json
{
  "success": true,
  "code": "0",
  "data": ["en", "zh", "ja"]
}
```

### 示例

```bash
curl "https://api.xgo.ing/openapi/v1/tweet/languages" \
  -H "X-API-KEY: $XGO_API_KEY"
```

---

## 关注者标签

`GET /openapi/v1/tweet/tags`

获取用户关注者的标签列表，按出现频率排序。

### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| userName | String | 否 | 自动从 API Key 推断 |

### 响应

```json
{
  "success": true,
  "code": "0",
  "data": ["AI", "Web3", "Startup", "Engineering"]
}
```

### 示例

```bash
curl "https://api.xgo.ing/openapi/v1/tweet/tags" \
  -H "X-API-KEY: $XGO_API_KEY"
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

## 枚举值

### QueryType

| 值 | 说明 |
|----|------|
| `following` | 关注者的推文 |
| `recommendation` | 推荐推文（服务端已过滤 influenceScore >= 100，客户端无需再过滤） |
| `user` | 指定用户的推文 |
| `bookmark` | 收藏的推文 |

### TweetType

| 值 | 说明 |
|----|------|
| `ALL` | 全部推文 |
| `NO_REPLY` | 排除回复 |
| `NO_RETWEET` | 排除纯转推 |
| `ORIGINAL` | 仅原创（排除回复和转推） |
| `NO_QUOTE` | 排除引用推文 |

### TimeRange

| 值 | 说明 |
|----|------|
| `TODAY` | 今天（从当天 00:00 开始） |
| `LAST_24H` | 最近 24 小时 |
| `WEEK` | 本周 |
| `MONTH` | 本月 |

### SortType

| 值 | 说明 |
|----|------|
| `recent` | 最新（按 createdAt 倒序） |
| `influence` | 影响力（按 influenceScore 倒序） |
| `replyCount` | 按回复数倒序 |
| `quoteCount` | 按引用数倒序 |
| `likeCount` | 按点赞数倒序 |
| `viewCount` | 按浏览数倒序 |

### 语言 (lang)

常见值: `en`, `zh`, `ja`, `ko`, `fr`, `de`, `es`, `pt`
特殊值: `ALL` — 不过滤语言

---

## 统一响应格式

```json
{
  "success": true,
  "code": "0",
  "message": "success",
  "traceId": "唯一追踪 ID",
  "data": { ... }
}
```

## 错误码

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
