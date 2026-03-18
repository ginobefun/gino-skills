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

#### 响应结构

```json
{
  "currentPage": 1,
  "pageSize": 100,
  "totalCount": 59,
  "pageCount": 1,
  "dataList": [ ResourceDTO, ... ]
}
```

#### ResourceDTO (dataList 项)

| 字段 | 说明 | 可能为 null |
|------|------|-------------|
| id | 资源唯一 ID | 否 |
| title | 标题 | **是** |
| oneSentenceSummary | 一句话摘要 | **是** |
| summary | 详细摘要 | **是** |
| tags | 标签列表 | **是** |
| mainPoints | 主要观点 [{point, explanation}] | **是** |
| url | 原文链接 | **是** |
| readUrl | BestBlogs 站内链接（**输出优先**） | **是** |
| sourceName | 来源名称 | **是** |
| category / categoryDesc | 分类 | **是** |
| score | 质量评分 (0-100) | **是** |
| wordCount | 字数 | **是** |
| readTime | 阅读时间（分钟） | **是** |
| authors | 作者列表 | **是** |
| publishTimeStamp | 发布时间戳 (ms) | **是** |
| publishDateTimeStr | 完整发布时间 | **是** |

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

#### 响应结构

```json
{
  "currentPage": 1,
  "pageSize": 100,
  "totalCount": 200,
  "pageCount": 2,
  "dataList": [ TweetResourceDTO, ... ]
}
```

#### TweetResourceDTO (dataList 项)

| 字段 | 说明 | 可能为 null |
|------|------|-------------|
| tweet.id | 推文 ID | 否 |
| tweet.author.userName | 作者用户名 | **是** |
| tweet.author.name | 作者显示名 | **是** |
| resourceMeta.title | 标题 | **是** |
| resourceMeta.oneSentenceSummary | 一句话摘要 | **是** |
| resourceMeta.summary | 详细摘要 | **是** |
| resourceMeta.score | 评分 | **是** |
| resourceMeta.tags | 标签 | **是** |
| resourceMeta.readUrl | 站内链接 | **是** |
| resourceMeta.url | 原文链接 | **是** |
| resourceMeta.publishTimeStamp | 发布时间戳 | **是** |

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

| 字段 | 说明 | 可能为 null |
|------|------|-------------|
| id | 推文 ID | 否 |
| text | 推文完整文本 | **是** |
| url | 推文原文链接 | **是** |
| lang | 推文语言 | **是** |
| createdAt | 创建时间 | **是** |
| likeCount | 点赞数 | **是** (默认 0) |
| retweetCount | 转推数 | **是** (默认 0) |
| replyCount | 回复数 | **是** (默认 0) |
| quoteCount | 引用数 | **是** (默认 0) |
| bookmarkCount | 收藏数 | **是** (默认 0) |
| viewCount | 浏览数 | **是** (默认 0) |
| influenceScore | 影响力评分 | **是** |
| hashTags | 标签 [{text}] | **是** |
| userMentions | 提及 [{userName, name}] | **是** |
| mediaList | 媒体列表 | **是** |
| quotedTweet | 引用推文 | **是** |
| author | 作者信息（UserBrief） | **是** |

#### UserBrief

| 字段 | 说明 | 可能为 null |
|------|------|-------------|
| userName | 用户名（@handle） | **是** |
| name | 显示名称 | **是** |
| avatar | 头像 URL | **是** |
| description | 简介 | **是** |
| followersCount | 粉丝数 | **是** (默认 0) |

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

---

## 代码示例

### 历史去重

```python
from datetime import datetime, timedelta

seen_urls = set()
today = datetime.now()
for offset in [1, 2, 3]:  # 最近3天
    date = (today - timedelta(days=offset)).strftime('%Y-%m-%d')
    history_path = f"contents/daily-curation/{date}/curation.md"
    # 读取文件并提取所有 URL 加入 seen_urls
```

### 安全字段取值

```python
# 安全取值（处理可能为 null 的字段）
title = item.get('title') or ''
score = item.get('score') or 0
summary = item.get('oneSentenceSummary') or ''
authors = item.get('authors') or ['Unknown']
url = item.get('readUrl') or item.get('url') or ''
```
