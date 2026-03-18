# BestBlogs OpenAPI 参考

基础地址: `https://api.bestblogs.dev`
认证方式: Header `X-API-KEY` (env var `BESTBLOGS_API_KEY`)

## 目录

1. 资源列表 - 查询文章 / 播客 / 视频 / 推文列表
2. 资源元数据 - 获取单个资源元数据
3. 资源 Markdown 正文 - 获取资源 Markdown 正文
4. 播客内容 - 获取播客转录和章节
5. 推文列表 - 查询推文列表（含互动数据）
6. 期刊列表 - 查询期刊列表
7. 期刊详情 - 获取期刊详情
8. 订阅源列表 - 查询订阅源列表
9. 枚举值 - 枚举值速查

---

## 资源列表

`POST /openapi/v1/resource/list`

查询文章、播客、视频、推文资源列表。**最常用的端点。**

### 请求体

| 字段 | 类型 | 默认值 | 说明 |
|-------|------|---------|-------------|
| currentPage | Integer | 1 | 页码 |
| pageSize | Integer | 10 | 每页数量 |
| userLanguage | String | | 用户语言偏好：`zh_CN`, `en_US` |
| keyword | String | | 搜索关键词 |
| sourceId | String | | 订阅源 ID 过滤 |
| category | String | | 分类过滤 |
| language | String | | 内容语言过滤：`zh_CN`, `en_US` |
| type | String | | 资源类型：`ARTICLE`, `PODCAST`, `VIDEO`, `TWITTER` |
| priority | String | | 优先级：`HIGHEST`, `HIGH`, `MEDIUM`, `LOW`, `LOWEST` |
| qualifiedFilter | String | | 精选过滤：`true`, `false`, `ALL` |
| timeFilter | String | | 时间范围：`1d`, `3d`, `1w`, `1m`, `3m`, `1y` |
| sortType | String | | 排序：`default`, `time_desc`, `score_desc`, `read_desc` |

### 返回字段（dataList items）

| 字段 | 说明 |
|-------|-------------|
| id | 资源唯一 ID |
| originalTitle | 原始标题 |
| title | 优化后标题 |
| oneSentenceSummary | 一句话摘要 |
| summary | 详细摘要 |
| tags | 标签列表 |
| mainPoints | 主要观点 [{point, explanation}] |
| keyQuotes | 关键引用列表 |
| url | 原文链接 |
| readUrl | BestBlogs 站内阅读链接 (**输出时优先使用此字段**) |
| domain | 域名 |
| cover | 封面图片 URL |
| language / languageDesc | 语言 |
| sourceId / sourceName / sourceImage | 来源信息 |
| category / categoryDesc | 分类 |
| aiSubCategory / aiSubCategoryDesc | AI 细分类别 |
| mainDomain / mainDomainDesc | 主领域 |
| resourceType / resourceTypeDesc | 资源类型 |
| score | 质量评分 (0-100) |
| readCount | 阅读次数 |
| wordCount | 字数 |
| readTime | 预估阅读时间 (分钟) |
| mediaDuration | 媒体时长 (秒，视频/播客) |
| authors | 作者列表 |
| publishTimeStamp | 发布时间戳 (ms) |
| publishDateStr | 发布日期 (MM-dd) |
| publishDateTimeStr | 完整发布时间 |
| qualified | 是否精选 |

### 示例

```bash
curl -X POST https://api.bestblogs.dev/openapi/v1/resource/list \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: $BESTBLOGS_API_KEY" \
  -d '{
    "currentPage": 1,
    "pageSize": 20,
    "timeFilter": "1d",
    "qualifiedFilter": "true",
    "sortType": "score_desc",
    "userLanguage": "zh_CN"
  }'
```

---

## 资源元数据

`GET /openapi/v1/resource/meta?id={id}&language={language}`

获取单个资源的完整元数据。字段与 Resource List 相同，额外包含：
- `notExist`: 资源不存在标识 (正常为 null)
- `enclosureUrl`: 附件链接 (音频/视频文件)

注意：列表接口已返回 summary、mainPoints、keyQuotes 等详情字段，通常无需额外调用 meta。仅在需要单条资源详情时使用此端点。

### 示例

```bash
curl "https://api.bestblogs.dev/openapi/v1/resource/meta?id=RAW_4e45fa&language=zh_CN" \
  -H "X-API-KEY: $BESTBLOGS_API_KEY"
```

---

## 资源 Markdown 正文

`GET /openapi/v1/resource/markdown?id={id}`

获取资源的 Markdown 正文内容。HTML 原文经服务端自动转换为 Markdown，适合大模型直接阅读。

### 返回结果

`data` 字段直接返回 Markdown 字符串，资源不存在时返回 `null`。

```json
{
  "success": true,
  "code": null,
  "message": null,
  "requestId": "唯一请求 ID",
  "data": "# 文章标题\n\n正文 Markdown 内容..."
}
```

### 示例

```bash
curl "https://api.bestblogs.dev/openapi/v1/resource/markdown?id=RAW_4e45fa" \
  -H "X-API-KEY: $BESTBLOGS_API_KEY"
```

---

## 播客内容

`GET /openapi/v1/resource/podcast/content?id={id}`

获取播客的完整分析结果。

### 返回字段

| 字段 | 说明 |
|-------|-------------|
| id | 播客资源 ID |
| transcriptionSegments | 转录分段 [{id, speakerId, beginTime, endTime, text}] |
| autoChapters | 章节 [{id, headLine, summary, beginTime, endTime}] |
| podCastSummary | 全文摘要 |
| speakerSummaries | 发言人总结 [{speakerId, speakerName, summary}] |
| questionsAnswers | 问答 [{question, answer}] |
| keywords | 关键词列表 |
| keySentences | 关键句子 [{sentence, beginTime, endTime}] |

### 示例

```bash
curl "https://api.bestblogs.dev/openapi/v1/resource/podcast/content?id=PODCAST_abc123" \
  -H "X-API-KEY: $BESTBLOGS_API_KEY"
```

---

## 推文列表

`POST /openapi/v1/tweet/list`

查询推文列表，包含推文原始数据和 BestBlogs 分析结果。

### 请求体

| 字段 | 类型 | 默认值 | 说明 |
|-------|------|---------|-------------|
| currentPage | Integer | 1 | 页码 |
| pageSize | Integer | 10 | 每页数量 |
| userLanguage | String | | 用户语言偏好 |
| keyword | String | | 搜索关键词 |
| sourceId | String | | 推文来源账号 ID |
| category | String | | 分类过滤 |
| language | String | | 语言过滤：`zh_CN`, `en_US`, `all` |
| qualifiedFilter | String | | 精选过滤 |
| timeFilter | String | | 时间范围 |
| sortType | String | | 排序方式 |
| lowerTotalScore | Integer | | 最低总分过滤 |
| upperTotalScore | Integer | | 最高总分过滤 |
| mainDomainFilter | String | | 主领域过滤 |

### 返回结构

每个 dataList item 包含两层：
- `resourceMeta`: 资源元数据 (同 Resource List 字段，额外含 `translateContent`)
- `tweet`: 推文原始数据

**tweet 字段：**

| 字段 | 说明 |
|-------|-------------|
| id | 推文 ID |
| url | 推文链接 |
| text | 推文文本 (可能经翻译) |
| retweetCount / replyCount / likeCount / quoteCount / bookmarkCount / viewCount | 互动数据 |
| influenceScore | 影响力评分 |
| createdAt | 创建时间 (ISO 8601) |
| lang | 原始语言 |
| isReply | 是否为回复 |
| conversationId | 会话 ID |
| author | {id, name, userName, profileImageUrl} |
| quotedTweet / retweetedTweet | 引用/转推 (如有) |
| mediaList | [{type, mediaUrlHttps, url}] |
| urlInfos | [{url, expandedUrl, displayUrl}] |
| userMentions | [{userId, name, userName}] |

### 示例

```bash
curl -X POST https://api.bestblogs.dev/openapi/v1/tweet/list \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: $BESTBLOGS_API_KEY" \
  -d '{
    "timeFilter": "3d",
    "language": "all",
    "sortType": "score_desc",
    "userLanguage": "zh_CN",
    "currentPage": 1,
    "pageSize": 20
  }'
```

---

## 期刊列表

`POST /openapi/v1/newsletter/list`

查询期刊列表。

### 请求体

| 字段 | 类型 | 默认值 | 说明 |
|-------|------|---------|-------------|
| currentPage | Integer | 1 | 页码 |
| pageSize | Integer | 10 | 每页数量 |
| userLanguage | String | | 用户语言偏好 |

### 返回字段（dataList items）

| 字段 | 说明 |
|-------|-------------|
| id | 期刊 ID (如 "issue55") |
| title | 期刊标题 |
| summary | 期刊摘要 |
| articleCount | 收录文章数 |
| published | 是否已发布 |
| createdTimeStr | 创建时间 |
| createdTimestamp | 创建时间戳 (ms) |
| updatedTimeStr | 更新时间 |

---

## 期刊详情

`GET /openapi/v1/newsletter/get?id={id}&language={language}`

获取期刊详情，包含文章列表。

### 返回字段

| 字段 | 说明 |
|-------|-------------|
| id | 期刊 ID |
| title / enTitle / zhTitle | 标题 (多语言) |
| summary / enSummary / zhSummary | 摘要 (多语言) |
| articles | 文章列表 [{id, title, cover, summary, sourceId, sourceName, url, domain, score, wordCount, readTime, publishDateStr, category, aiCategory, resourceType, originLanguage, language, sort}] |
| published | 是否已发布 |
| createdTimeStr / updatedTimeStr | 时间 |

---

## 订阅源列表

`POST /openapi/v1/source/list`

查询订阅源列表。

### 请求体

| 字段 | 类型 | 默认值 | 说明 |
|-------|------|---------|-------------|
| currentPage | Integer | 1 | 页码 |
| pageSize | Integer | 10 | 每页数量 |
| keyword | String | | 搜索关键词 |
| language | String | | 语言过滤 |
| category | String | | 分类过滤 |
| resourceType | String | | 资源类型过滤 |
| priority | String | | 优先级过滤 |
| userLanguage | String | | 用户语言偏好 |

### 返回字段（dataList items）

| 字段 | 说明 |
|-------|-------------|
| id | 订阅源 ID |
| name | 名称 |
| url | 网站 URL |
| author | 作者 |
| description | 描述 |
| image | 图标 URL |
| language / languageDesc | 语言 |
| category / categoryDesc | 分类 |
| subCategory / subCategoryDesc | 子分类 |
| priority / priorityDesc | 优先级 |
| sourceType / sourceTypeDesc | 来源类型 |
| resourceType / resourceTypeDesc | 资源类型 |
| rssUrl | RSS 订阅地址 |
| countInPast3Months | 近 3 月内容总数 |
| qualifiedCountInPast3Months | 近 3 月精选数 |
| readCountInPast3Months | 近 3 月阅读量 |

---

## 枚举值

### Category (分类)
- `Artificial_Intelligence` - 人工智能
- `Business_Tech` - 商业科技
- `Programming_Technology` - 软件编程
- `Product_Development` - 产品设计

### AI Sub-Category (AI 细分类别)
- `MODELS` - AI 模型
- `DEV` - AI 开发
- `PRODUCT` - AI 产品
- `NEWS` - AI 资讯

### 资源类型（Resource Type）
- `ARTICLE` - 文章
- `PODCAST` - 播客
- `VIDEO` - 视频
- `TWITTER` - 推特

### Priority (优先级)
- `HIGHEST`, `HIGH`, `MEDIUM`, `LOW`, `LOWEST`

### Language (语言)
- `zh_CN` - 中文
- `en_US` - 英文

### Time Filter (时间范围)
- `1d` (1 天), `3d` (3 天), `1w` (1 周), `1m` (1 月), `3m` (3 月), `1y` (1 年)

### Sort Type (排序)
- `default` - 默认
- `time_desc` - 时间倒序
- `score_desc` - 评分倒序
- `read_desc` - 阅读量倒序

### Qualified Filter (精选过滤)
- `true` - 仅精选
- `false` - 仅非精选
- `ALL` - 全部

---

## Common Response Format

```json
{
  "success": true,
  "code": null,
  "message": null,
  "requestId": "唯一请求 ID",
  "data": { ... }
}
```

Paginated responses wrap data in:
```json
{
  "data": {
    "currentPage": 1,
    "pageSize": 10,
    "totalCount": 100,
    "pageCount": 10,
    "dataList": [ ... ]
  }
}
```

## 错误码

| 错误码 | HTTP 状态码 | 说明 |
|------|-------------|-------------|
| AUTH_001 | 401 | API Key 缺失 |
| AUTH_002 | 401 | API Key 无效 |
| AUTH_003 | 403 | 权限不足 |
| PARAM_001 | 400 | 参数错误 |
| NOT_FOUND | 404 | 资源不存在 |
| SYS_ERROR | 500 | 系统内部错误 |
