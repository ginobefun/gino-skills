# XGo 每日推文简报 API 参考

接口地址: `https://api.xgo.ing`
认证方式: 请求头 `X-API-KEY`（环境变量 `XGO_API_KEY`）

API Key 按用户绑定。服务端自动从 API Key 推断 `userName`。

## Worker-First 说明

简报流程默认走 worker 链路：

```bash
python3 scripts/examples/xgo_digest_source_data.py
python3 scripts/examples/xgo_digest_rank.py
python3 scripts/examples/xgo_digest_render.py
```

本文件只保留底层 endpoint 细节，用于排查抓取问题或扩展新的 source worker。

## 目录

1. [获取所有列表](#获取所有列表) - list/all
2. [推文列表](#推文列表) - tweet/list
3. [数据类型](#数据类型) - UserListDTO, TweetDTO 等
4. [枚举值](#枚举值)
5. [错误码](#错误码)

---

## 获取所有列表

`GET /openapi/v1/list/all`

获取当前用户的所有列表，包含成员列表。用于构建 author→list 映射。

### 请求参数

无（使用 API Key 对应用户）

### 响应

```json
{
  "success": true,
  "code": "0",
  "message": "success",
  "traceId": "xxx",
  "data": [ UserListDTO, ... ]
}
```

### 示例

```bash
curl "https://api.xgo.ing/openapi/v1/list/all" \
  -H "X-API-KEY: $XGO_API_KEY"
```

---

## 推文列表

`POST /openapi/v1/tweet/list`

查询推文列表，支持多种查询类型、时间范围、排序方式。

### 请求体

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| currentPage | Integer | 是 | | 页码（从 1 开始） |
| pageSize | Integer | 是 | | 每页数量（最大 100） |
| userName | String | 否 | (从 API Key 推断) | `queryType=user` 时可指定目标用户 |
| queryType | String | 否 | | 查询类型，见 [QueryType](#querytype) |
| tweetType | String | 否 | | 推文类型过滤，见 [TweetType](#tweettype) |
| lang | String | 否 | | 语言过滤 |
| timeRange | String | 否 | | 时间范围，见 [TimeRange](#timerange) |
| keyword | String | 否 | | 搜索关键词 |
| listId | String | 否 | | 列表 ID |
| folderId | String | 否 | | 收藏夹 ID |
| tags | List\<String\> | 否 | | 标签过滤 |
| sortType | String | 否 | `recent`（服务端默认） | 排序方式，见 [SortType](#sorttype)。**必须显式传递** |

### 响应

```json
{
  "success": true,
  "code": "0",
  "message": "success",
  "traceId": "xxx",
  "data": {
    "currentPage": 1,
    "pageSize": 50,
    "totalPage": 5,
    "totalSize": 100,
    "data": [ TweetDTO, ... ]
  }
}
```

### 示例

```bash
# 关注者推文（近24小时，按影响力，排除纯转推）
curl -X POST https://api.xgo.ing/openapi/v1/tweet/list \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: $XGO_API_KEY" \
  -d '{"queryType":"following","timeRange":"LAST_24H","sortType":"influence","tweetType":"NO_RETWEET","currentPage":1,"pageSize":50}'

# 推荐推文
curl -X POST https://api.xgo.ing/openapi/v1/tweet/list \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: $XGO_API_KEY" \
  -d '{"queryType":"recommendation","timeRange":"LAST_24H","sortType":"influence","tweetType":"NO_RETWEET","currentPage":1,"pageSize":50}'
```

---

## 数据类型

### UserListDTO

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String | 列表 ID |
| userId | String | 所有者用户 ID |
| userName | String | 所有者用户名 |
| twitterListId | String | 同步的 X 列表 ID |
| ownerId | String | X 列表原始所有者 ID |
| name | String | 列表名称 |
| description | String | 列表描述 |
| privateList | Boolean | 是否私密 |
| memberCount | Integer | 成员数量 |
| members | List\<UserBrief\> | 成员列表 |
| order | Integer | 显示排序 |

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

### UrlInfoDTO

| 字段 | 类型 | 说明 |
|------|------|------|
| url | String | 短链接 |
| expandedUrl | String | 展开后的完整 URL |
| displayUrl | String | 显示 URL |
| indices | List\<Integer\> | 在文本中的位置 [start, end] |

---

## 枚举值

### QueryType

| 值 | 说明 |
|----|------|
| `following` | 关注者的推文 |
| `recommendation` | 推荐推文（服务端已过滤 influenceScore >= 100） |
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
| xgo-0002 | **200** | 列表不存在 |
| xgo-0010 | 429 | 频率限制（PLUS 200次/分, PRO 600次/分） |
| xgo-0012 | **200** | 需要 Plus 或 Pro 会员（功能级限制，HTTP 200，需检查 `success`） |
| xgo-1001 | 400 | 参数错误 |
| xgo-9005 | **200** | 操作不允许（HTTP 200，需检查 `success`） |
| xgo-9999 | 500 | 系统错误 |
