# XGo KOL 追踪器 API 参考

接口地址: `https://api.xgo.ing`
认证方式: 请求头 `X-API-KEY`（环境变量 `XGO_API_KEY`）

API Key 按用户绑定。服务端自动从 API Key 推断 `userName`。

## Worker-First 说明

本文件保留原始 endpoint、字段和错误码，主要用于：
- 排查 worker 返回异常
- 理解底层字段含义
- 扩展新的 worker 脚本

主流程优先使用：

```bash
python3 scripts/examples/xgo_user_activity.py TARGET_USER --recent-size 50 --top-size 50
python3 scripts/examples/xgo_following_status.py TARGET_USER
```

不要把下面的 `curl` 示例当作默认执行路径。

## 目录

1. [实时用户资料](#实时用户资料) - user/info
2. [推文列表](#推文列表) - tweet/list
3. [关注状态](#关注状态) - following/status
4. [数据类型](#数据类型) - UserDTO, TweetDTO, FollowingStatusDTO 等
5. [枚举值](#枚举值)
6. [错误码](#错误码)

---

## 实时用户资料

`GET /openapi/v1/user/info`

实时从 Twitter API 获取用户信息并刷新 DB 缓存。

### 请求参数

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| userName | String | 否 | (从 API Key 推断) | Twitter 用户名，不填则为 API Key 对应用户 |

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
    "pageSize": 50,
    "totalPage": 5,
    "totalSize": 100,
    "data": [ TweetDTO, ... ]
  }
}
```

### 示例

```bash
# 近期推文（按时间排序，全部类型）
curl -X POST https://api.xgo.ing/openapi/v1/tweet/list \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: $XGO_API_KEY" \
  -d '{"queryType":"user","userName":"elonmusk","sortType":"recent","tweetType":"ALL","currentPage":1,"pageSize":50}'

# 高影响力推文
curl -X POST https://api.xgo.ing/openapi/v1/tweet/list \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: $XGO_API_KEY" \
  -d '{"queryType":"user","userName":"elonmusk","sortType":"influence","tweetType":"ALL","currentPage":1,"pageSize":50}'
```

---

## 关注状态

`GET /openapi/v1/following/status`

检查当前用户是否关注了目标用户。

### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| targetUserName | String | 是 | 目标用户名（不含 @） |

### 响应

```json
{
  "success": true,
  "code": "0",
  "message": "success",
  "traceId": "xxx",
  "data": {
    "following": true,
    "tags": ["AI", "Tech"],
    "remark": "Tesla & SpaceX CEO"
  }
}
```

### 示例

```bash
curl "https://api.xgo.ing/openapi/v1/following/status?targetUserName=elonmusk" \
  -H "X-API-KEY: $XGO_API_KEY"
```

---

## 数据类型

### UserDTO

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
| profileBio | ProfileBioDTO | 结构化简介（含 URL 链接） |
| tags | List\<String\> | 用户标签 |
| feedId | String | RSS Feed ID（XGo 内部标识） |
| latestTweetTime | Date | 最近推文时间 |
| latestFetchTime | Date | 最近数据拉取时间 |

### ProfileBioDTO

| 字段 | 类型 | 说明 |
|------|------|------|
| description | String | 简介文本 |
| descriptionUrls | List\<UrlEntity\> | 简介中的 URL 实体列表，每项含 `url`, `expandedUrl`, `displayUrl` |
| website | UrlEntity | 用户网站 URL 实体，含 `url`, `expandedUrl`, `displayUrl` |

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

### FollowingStatusDTO

| 字段 | 类型 | 说明 |
|------|------|------|
| following | Boolean | 是否已关注 |
| tags | List\<String\> | 为该用户设置的自定义标签 |
| remark | String | 自定义备注 |

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
| xgo-0010 | 429 | 频率限制（PLUS 200次/分, PRO 600次/分） |
| xgo-0012 | **200** | 需要 Plus 或 Pro 会员（功能级限制，HTTP 200，需检查 `success`） |
| xgo-1001 | 400 | 参数错误 |
| xgo-9005 | **200** | 操作不允许（HTTP 200，需检查 `success`） |
| xgo-9999 | 500 | 系统错误 |
