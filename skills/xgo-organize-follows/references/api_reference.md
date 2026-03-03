# XGo 关注整理助手 API 参考

接口地址: `https://api.xgo.ing`
认证方式: 请求头 `X-API-KEY`（环境变量 `XGO_API_KEY`）

API Key 按用户绑定。服务端自动从 API Key 推断 `userName`。

## 目录

1. [关注统计](#关注统计) - following/stats
2. [关注列表](#关注列表) - following/list
3. [获取所有列表](#获取所有列表) - list/all
4. [实时用户资料](#实时用户资料) - user/info
5. [推文列表](#推文列表) - tweet/list
6. [添加成员](#添加成员) - list/addMember
7. [创建或更新列表](#创建或更新列表) - list/save
8. [数据类型](#数据类型)
9. [枚举值](#枚举值)
10. [错误码](#错误码)

---

## 关注统计

`GET /openapi/v1/following/stats`

获取关注统计数据，包含分类信息。

### 请求参数

无（使用 API Key 对应用户）

### 响应

```json
{
  "success": true,
  "code": "0",
  "message": "success",
  "traceId": "xxx",
  "data": {
    "count": 356,
    "listCount": 8,
    "categorizedCount": 280,
    "uncategorizedCount": 76,
    "distribution": {
      "AI Researchers": 45,
      "Web3 Builders": 38
    }
  }
}
```

### 示例

```bash
curl "https://api.xgo.ing/openapi/v1/following/stats" \
  -H "X-API-KEY: $XGO_API_KEY"
```

---

## 关注列表

`GET /openapi/v1/following/list`

分页获取当前用户的关注列表（从 DB 缓存查询）。

### 请求参数

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| page | Integer | 否 | 1 | 页码（最小 1） |
| size | Integer | 否 | 20 | 每页数量（最大 100） |

### 响应

```json
{
  "success": true,
  "code": "0",
  "message": "success",
  "traceId": "xxx",
  "data": {
    "currentPage": 1,
    "pageSize": 100,
    "totalPage": 4,
    "totalSize": 356,
    "data": [ UserDTO(基本字段), ... ]
  }
}
```

**注意**: 此端点返回的 UserDTO 仅包含基本字段: id, name, userName, profileImageUrl, markTags, markNotes。

### 示例

```bash
curl "https://api.xgo.ing/openapi/v1/following/list?page=1&size=100" \
  -H "X-API-KEY: $XGO_API_KEY"
```

---

## 获取所有列表

`GET /openapi/v1/list/all`

获取当前用户的所有列表，包含成员列表。

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

## 实时用户资料

`GET /openapi/v1/user/info`

实时从 Twitter API 获取用户信息并刷新 DB 缓存。

### 请求参数

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| userName | String | 否 | (从 API Key 推断) | Twitter 用户名 |

### 响应

```json
{
  "success": true,
  "code": "0",
  "message": "success",
  "traceId": "xxx",
  "data": UserDTO
}
```

### 示例

```bash
curl "https://api.xgo.ing/openapi/v1/user/info?userName=elonmusk" \
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
    "pageSize": 5,
    "totalPage": 10,
    "totalSize": 50,
    "data": [ TweetDTO, ... ]
  }
}
```

### 示例

```bash
# 最新原创推文（5条）
curl -X POST https://api.xgo.ing/openapi/v1/tweet/list \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: $XGO_API_KEY" \
  -d '{"queryType":"user","userName":"elonmusk","sortType":"recent","tweetType":"ORIGINAL","currentPage":1,"pageSize":5}'

# 最热原创推文（5条）
curl -X POST https://api.xgo.ing/openapi/v1/tweet/list \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: $XGO_API_KEY" \
  -d '{"queryType":"user","userName":"elonmusk","sortType":"influence","tweetType":"ORIGINAL","currentPage":1,"pageSize":5}'
```

---

## 添加成员

`POST /openapi/v1/list/addMember`

将用户添加到列表。

### 请求体

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| listId | String | 是 | 列表 ID |
| member | UserBrief | 是 | 要添加的成员 |
| member.id | String | 是 | 用户 ID（**必填**） |
| member.name | String | 否 | 显示名称 |
| member.userName | String | 否 | 用户名（@handle） |
| member.profileImageUrl | String | 否 | 头像 URL |

### 限制

| 会员等级 | 每个列表最大成员数 |
|---------|-----------------|
| PLUS | 200 |
| PRO | 1000 |

### 响应

```json
{
  "success": true,
  "code": "0",
  "message": "success",
  "traceId": "xxx",
  "data": "LIST_abc12345"
}
```

### 示例

```bash
curl -X POST https://api.xgo.ing/openapi/v1/list/addMember \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: $XGO_API_KEY" \
  -d '{"listId":"LIST_abc12345","member":{"id":"44196397","name":"Elon Musk","userName":"elonmusk"}}'
```

---

## 创建或更新列表

`POST /openapi/v1/list/save`

创建新列表或更新已有列表。省略 `id` 为创建，提供 `id` 为更新。

### 请求体

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | String | 否 | 列表 ID。省略为创建，提供为更新 |
| name | String | 是 | 列表名称 |
| description | String | 否 | 列表描述 |
| privateList | Boolean | 否 | 是否为私密列表 |
| order | Integer | 否 | 显示排序 |

### 限制

| 会员等级 | 最大列表数 |
|---------|----------|
| PLUS | 20 |
| PRO | 100 |

### 响应

```json
{
  "success": true,
  "code": "0",
  "message": "success",
  "traceId": "xxx",
  "data": "LIST_abc12345"
}
```

### 示例

```bash
curl -X POST https://api.xgo.ing/openapi/v1/list/save \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: $XGO_API_KEY" \
  -d '{"name":"Crypto","description":"加密货币和 Web3 相关","privateList":false}'
```

---

## 数据类型

### FollowingStatsResult

| 字段 | 类型 | 说明 |
|------|------|------|
| count | Integer | 总关注数 |
| listCount | Integer | 列表数量 |
| categorizedCount | Integer | 已分类到列表的用户数 |
| uncategorizedCount | Integer | 未分类的用户数 |
| distribution | Map\<String, Integer\> | 每个列表名称对应的成员数 |

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

### UserDTO（完整版 — user/info 返回）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String | Twitter 用户 ID |
| name | String | 显示名称 |
| userName | String | Twitter handle（@用户名） |
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
| profileBio | ProfileBioDTO | 结构化简介 |
| tags | List\<String\> | 用户标签 |
| feedId | String | RSS Feed ID |
| latestTweetTime | Date | 最近推文时间 |
| latestFetchTime | Date | 最近数据拉取时间 |

### UserDTO（基本版 — following/list 返回）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String | Twitter 用户 ID |
| name | String | 显示名称 |
| userName | String | 用户名（@handle） |
| profileImageUrl | String | 头像 URL |
| markTags | List\<String\> | 自定义标签 |
| markNotes | String | 自定义备注 |

### ProfileBioDTO

| 字段 | 类型 | 说明 |
|------|------|------|
| description | String | 简介文本 |
| descriptionUrls | List\<UrlEntity\> | 简介中的 URL 实体列表 |
| website | UrlEntity | 用户网站 URL 实体 |

### TweetDTO

| 字段 | 类型 | 说明 |
|------|------|------|
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
| indices | List\<Integer\> | 在文本中的位置 |

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
| `recommendation` | 推荐推文 |
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
| `TODAY` | 今天 |
| `LAST_24H` | 最近 24 小时 |
| `WEEK` | 本周 |
| `MONTH` | 本月 |

### SortType

| 值 | 说明 |
|----|------|
| `recent` | 最新 |
| `influence` | 影响力 |
| `replyCount` | 按回复数 |
| `quoteCount` | 按引用数 |
| `likeCount` | 按点赞数 |
| `viewCount` | 按浏览数 |

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
| xgo-0001 | **200** | 用户不存在（HTTP 200，需检查 `success`） |
| xgo-0002 | **200** | 列表不存在 |
| xgo-0003 | **200** | 成员不存在（HTTP 200，需检查 `success`） |
| xgo-0005 | **200** | 成员数超限（PLUS 200, PRO 1000） |
| xgo-0010 | 429 | 频率限制（PLUS 200次/分, PRO 600次/分） |
| xgo-0011 | **200** | 列表数超限（PLUS 20, PRO 100） |
| xgo-0012 | **200** | 需要 Plus 或 Pro 会员（功能级限制，HTTP 200，需检查 `success`） |
| xgo-1001 | 400 | 参数错误 |
| xgo-9005 | **200** | 操作不允许 |
| xgo-9999 | 500 | 系统错误 |
