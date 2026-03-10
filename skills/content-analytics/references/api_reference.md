# Content Analytics API 参考

接口地址: `https://api.xgo.ing`
认证: `X-API-KEY: $XGO_API_KEY`

---

## 推文列表

`POST /openapi/v1/tweet/list`

本 skill 使用 `queryType: "user"` 拉取自己的推文数据。

### 请求体

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| currentPage | Integer | 是 | | 页码（从 1 开始） |
| pageSize | Integer | 是 | | 每页数量（最大 100） |
| queryType | String | 是 | | 固定使用 `user` |
| sortType | String | 否 | `recent` | `recent`（时间倒序）或 `influence`（影响力排序） |
| tweetType | String | 否 | | `ALL`, `NO_REPLY`, `NO_RETWEET`, `ORIGINAL` |
| timeRange | String | 否 | | `TODAY`, `LAST_24H`, `WEEK`, `MONTH` |

### 响应

```json
{
  "success": true,
  "code": "0",
  "data": {
    "currentPage": 1,
    "totalPage": 5,
    "totalSize": 100,
    "data": [ TweetDTO, ... ]
  }
}
```

### TweetDTO（用于分析的关键字段）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String | 推文唯一 ID |
| text | String | 推文完整文本 |
| url | String | 推文链接 |
| lang | String | 语言 |
| createdAt | Long | 创建时间戳 (ms) |
| likeCount | Integer | 点赞数 |
| retweetCount | Integer | 转推数 |
| replyCount | Integer | 回复数 |
| quoteCount | Integer | 引用数 |
| bookmarkCount | Integer | 收藏数 |
| viewCount | Integer | 浏览数 |
| influenceScore | Integer | 影响力评分 |
| hashTags | List | 标签 [{text}] |
| userMentions | List | 提及 [{userName, name}] |
| mediaList | List | 媒体列表 |
| quotedTweet | TweetDTO | 引用的推文 |
| retweetedTweet | TweetDTO | 转推的原始推文 |
| author | UserBrief | 作者信息 |

### UserBrief

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String | 用户 ID |
| userName | String | 用户名（@后面的部分） |
| name | String | 显示名称 |
| avatar | String | 头像 URL |
| followers | Integer | 粉丝数 |
| following | Integer | 关注数 |

---

## 用户信息

`GET /openapi/v1/user/info`

获取 API Key 绑定用户的账号信息快照。

### 请求

```bash
curl -s "https://api.xgo.ing/openapi/v1/user/info" \
  -H "X-API-KEY: $XGO_API_KEY"
```

### 响应 (UserInfoDTO)

| 字段 | 类型 | 说明 |
|------|------|------|
| userName | String | 用户名 |
| name | String | 显示名称 |
| avatar | String | 头像 URL |
| description | String | 简介 |
| followers | Integer | 粉丝数 |
| following | Integer | 关注数 |
| statusesCount | Integer | 推文总数 |
| favouritesCount | Integer | 点赞总数 |
| mediaCount | Integer | 媒体数 |
| createdAt | String | 账号创建时间 |
| latestTweetTime | String | 最新推文时间 |
| latestFetchTime | String | 最近数据刷新时间 |

---

## 错误码

| HTTP 状态 | Code | 说明 | 处理 |
|-----------|------|------|------|
| 401 | AUTH_001/002/003 | API Key 问题 | 检查 `XGO_API_KEY` |
| 403 | AUTH_004 | 会员等级不足 | 需要 Plus 或 Pro |
| 429 | xgo-0010 | 频率限制 | 等待 10 秒重试一次 |
| **200** | xgo-0001 | 用户不存在 | 检查 API Key 绑定 |
| **200** | xgo-0012 | 功能级会员限制 | 提示升级 |
| **200** | xgo-9005 | 操作不允许 | 展示 message |

**重要**: 始终先检查 `response.success` 再处理 `response.data`。
