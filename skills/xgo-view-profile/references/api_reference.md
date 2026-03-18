# XGo 用户画像查看器 API 参考

接口地址: `https://api.xgo.ing`
认证方式: 请求头 `X-API-KEY`（环境变量 `XGO_API_KEY`）

## Worker-First 说明

本文件保留底层 endpoint 和字段映射，主要用于 debug 和扩展。

默认执行路径应优先使用：

```bash
python3 scripts/examples/xgo_view_profile.py TARGET_USER --max-pages 3
python3 scripts/examples/xgo_following_status.py TARGET_USER
```

仅在需要 `userId` / `feedId` 特殊查询或排查底层响应时，再回退到下面的原始接口示例。

## 目录

1. [实时用户资料](#实时用户资料) - 实时获取用户资料
2. [缓存用户详情](#缓存用户详情) - 从 DB 查询用户详情
3. [用户最新推文](#用户最新推文) - 获取用户最新推文
4. [数据类型](#数据类型) - UserDTO, TweetDTO 等
5. [错误码](#错误码)

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

## 缓存用户详情

`GET /openapi/v1/user/details`

从 DB 缓存查询用户详情。`userId` 和 `feedId` 二选一，至少提供一个。

### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| userId | String | 否 | 用户 ID |
| feedId | String | 否 | RSS Feed ID（XGo 内部分配的 Feed 标识，来自之前 API 响应中 UserDTO 的 `feedId` 字段） |

`userId` 和 `feedId` 必须至少提供一个。若两者都没有但有 `userName`，应改用 `user/info` 端点。

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
curl "https://api.xgo.ing/openapi/v1/user/details?userId=44196397" \
  -H "X-API-KEY: $XGO_API_KEY"
```

---

## 用户最新推文

`GET /openapi/v1/tweet/latest`

实时获取用户的最新推文（直接从 Twitter API 拉取）。

### 请求参数

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| userName | String | 否 | (从 API Key 推断) | 目标用户名 |
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

结构化的用户简介，包含 URL 和实体信息。

| 字段 | 类型 | 说明 |
|------|------|------|
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
