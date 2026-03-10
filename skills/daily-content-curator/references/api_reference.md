# Daily Content Curator API 参考

本 skill 调用两组 API: BestBlogs OpenAPI 和 XGo 开放接口。

---

## BestBlogs OpenAPI

接口地址: `https://api.bestblogs.dev`
认证: `X-API-KEY: $BESTBLOGS_API_KEY`

### 资源列表

`POST /openapi/v1/resource/list`

#### 请求体

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| currentPage | Integer | 1 | 页码 |
| pageSize | Integer | 10 | 每页数量（最大 100） |
| userLanguage | String | | 用户语言: `zh_CN`, `en_US` |
| keyword | String | | 搜索关键词 |
| category | String | | 分类: `Artificial_Intelligence`, `Programming_Technology`, `Business_Tech`, `Product_Development` |
| type | String | | 类型: `ARTICLE`, `PODCAST`, `VIDEO` |
| timeFilter | String | | 时间: `1d`, `3d`, `1w`, `1m`, `3m`, `1y` |
| sortType | String | | 排序: `default`, `time_desc`, `score_desc`, `read_desc` |
| qualifiedFilter | String | | 精选: `true`, `false`, `ALL` |

#### 响应 (dataList 项)

| 字段 | 说明 |
|------|------|
| id | 资源唯一 ID |
| title | 标题 |
| oneSentenceSummary | 一句话摘要 |
| summary | 详细摘要 |
| tags | 标签列表 |
| mainPoints | 主要观点 [{point, explanation}] |
| url | 原文链接 |
| readUrl | BestBlogs 站内链接（**输出优先**） |
| sourceName | 来源名称 |
| category / categoryDesc | 分类 |
| score | 质量评分 (0-100) |
| wordCount | 字数 |
| readTime | 阅读时间（分钟） |
| authors | 作者列表 |
| publishTimeStamp | 发布时间戳 (ms) |
| publishDateTimeStr | 完整发布时间 |

### BestBlogs 推文列表

`POST /openapi/v1/tweet/list`

#### 请求体

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| currentPage | Integer | 1 | 页码 |
| pageSize | Integer | 10 | 每页数量（最大 100） |
| userLanguage | String | | 用户语言 |
| timeFilter | String | | 时间范围 |
| sortType | String | | 排序 |
| language | String | | 推文语言: `all`, `zh`, `en` 等 |

#### 响应 (dataList 项)

| 字段 | 说明 |
|------|------|
| tweet.id | 推文 ID |
| tweet.author.userName | 作者用户名 |
| tweet.author.name | 作者显示名 |
| resourceMeta.title | 标题 |
| resourceMeta.oneSentenceSummary | 一句话摘要 |
| resourceMeta.summary | 详细摘要 |
| resourceMeta.score | 评分 |
| resourceMeta.tags | 标签 |
| resourceMeta.readUrl | 站内链接 |
| resourceMeta.url | 原文链接 |
| resourceMeta.publishTimeStamp | 发布时间戳 |

---

## XGo 开放接口

接口地址: `https://api.xgo.ing`
认证: `X-API-KEY: $XGO_API_KEY`

### 推文列表

`POST /openapi/v1/tweet/list`

#### 请求体

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| currentPage | Integer | 是 | | 页码（从 1 开始） |
| pageSize | Integer | 是 | | 每页数量（最大 100） |
| queryType | String | 否 | | `following`, `recommendation`, `user`, `bookmark` |
| tweetType | String | 否 | | `ALL`, `NO_REPLY`, `NO_RETWEET`, `ORIGINAL` |
| timeRange | String | 否 | | `TODAY`, `LAST_24H`, `WEEK`, `MONTH` |
| sortType | String | 否 | `recent` | **必须显式传递** `influence` |
| lang | String | 否 | | 语言过滤 |
| keyword | String | 否 | | 搜索关键词 |
| tags | List\<String\> | 否 | | 标签过滤 |

#### 响应

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

#### TweetDTO

| 字段 | 说明 |
|------|------|
| id | 推文 ID |
| text | 推文完整文本 |
| url | 推文原文链接 |
| lang | 推文语言 |
| createdAt | 创建时间 |
| likeCount | 点赞数 |
| retweetCount | 转推数 |
| replyCount | 回复数 |
| quoteCount | 引用数 |
| bookmarkCount | 收藏数 |
| viewCount | 浏览数 |
| influenceScore | 影响力评分 |
| hashTags | 标签 [{text}] |
| userMentions | 提及 [{userName, name}] |
| mediaList | 媒体列表 |
| quotedTweet | 引用推文 |
| author | 作者信息（UserBrief） |

#### UserBrief

| 字段 | 说明 |
|------|------|
| userName | 用户名（@handle） |
| name | 显示名称 |
| avatar | 头像 URL |
| description | 简介 |
| followersCount | 粉丝数 |

---

## 错误码速查

### BestBlogs

| HTTP 状态 | 说明 | 处理 |
|-----------|------|------|
| 401 | API Key 无效 | 检查 `BESTBLOGS_API_KEY` |
| 400 | 参数错误 | 检查枚举值 |
| 500 | 服务端错误 | 重试一次 |

### XGo

| HTTP 状态 | Code | 说明 | 处理 |
|-----------|------|------|------|
| 401 | AUTH_001/002/003 | API Key 问题 | 检查 `XGO_API_KEY` |
| 403 | AUTH_004 | 会员等级不足 | 需要 Plus 或 Pro |
| 429 | xgo-0010 | 频率限制 | 等待 10 秒重试一次 |
| **200** | xgo-0012 | 功能级会员限制 | 提示用户升级 |
| **200** | xgo-9005 | 操作不允许 | 展示 message |

**重要**: 始终先检查 `response.success` 再处理 `response.data`。XGo 部分错误返回 HTTP 200 但 `success: false`。
