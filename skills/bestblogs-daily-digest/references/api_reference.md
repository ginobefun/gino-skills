# BestBlogs Daily Digest API Reference

Base URL: `https://api.bestblogs.dev`
Auth: Header `X-API-KEY` (env var `BESTBLOGS_API_KEY`)

---

## Resource List

`POST /openapi/v1/resource/list`

查询文章、播客、视频资源列表。

### Request Body

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| currentPage | Integer | 1 | 页码 |
| pageSize | Integer | 10 | 每页数量（最大 100） |
| userLanguage | String | | 用户语言偏好：`zh_CN`, `en_US` |
| keyword | String | | 搜索关键词 |
| sourceId | String | | 订阅源 ID 过滤 |
| category | String | | 分类过滤 |
| language | String | | 内容语言过滤 |
| type | String | | 资源类型：`ARTICLE`, `PODCAST`, `VIDEO`, `TWITTER` |
| qualifiedFilter | String | | 精选过滤：`true`, `false`, `ALL` |
| timeFilter | String | | 时间范围：`1d`, `3d`, `1w`, `1m`, `3m`, `1y` |
| sortType | String | | 排序：`default`, `time_desc`, `score_desc`, `read_desc` |

### Response Fields (dataList items)

| Field | Description |
|-------|-------------|
| id | 资源唯一 ID |
| title | 优化后标题 |
| originalTitle | 原始标题 |
| oneSentenceSummary | 一句话摘要 |
| summary | 详细摘要 |
| tags | 标签列表 |
| mainPoints | 主要观点 [{point, explanation}] |
| keyQuotes | 关键引用列表 |
| url | 原文链接 |
| readUrl | BestBlogs 站内阅读链接（**输出时优先使用**） |
| sourceName | 来源名称 |
| sourceImage | 来源图标 URL |
| category | 分类（枚举值） |
| categoryDesc | 分类描述（中文） |
| aiSubCategory | AI 细分类别 |
| aiSubCategoryDesc | AI 细分类别描述 |
| resourceType | 资源类型 |
| resourceTypeDesc | 资源类型描述 |
| score | 质量评分 (0-100) |
| readCount | 阅读次数 |
| wordCount | 字数 |
| readTime | 预估阅读时间（分钟） |
| mediaDuration | 媒体时长（秒，视频/播客） |
| authors | 作者列表 |
| publishDateTimeStr | 完整发布时间 |
| qualified | 是否精选 |

### Example

```bash
curl -s -X POST https://api.bestblogs.dev/openapi/v1/resource/list \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: $BESTBLOGS_API_KEY" \
  -d '{"timeFilter":"1d","sortType":"score_desc","userLanguage":"zh_CN","pageSize":100,"type":"ARTICLE","category":"Artificial_Intelligence"}'
```

---

## Tweet List

`POST /openapi/v1/tweet/list`

查询推文列表，包含推文原始数据和 BestBlogs 分析结果。

### Request Body

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| currentPage | Integer | 1 | 页码 |
| pageSize | Integer | 10 | 每页数量 |
| userLanguage | String | | 用户语言偏好 |
| keyword | String | | 搜索关键词 |
| category | String | | 分类过滤 |
| language | String | | 语言过滤：`zh_CN`, `en_US`, `all` |
| qualifiedFilter | String | | 精选过滤 |
| timeFilter | String | | 时间范围 |
| sortType | String | | 排序方式 |

### Response Structure

每个 dataList item 包含两层:

- `resourceMeta`: 资源元数据（字段同 Resource List）
- `tweet`: 推文原始数据

**tweet 字段:**

| Field | Description |
|-------|-------------|
| id | 推文 ID |
| url | 推文链接 |
| text | 推文文本 |
| retweetCount / replyCount / likeCount / quoteCount / bookmarkCount / viewCount | 互动数据 |
| influenceScore | 影响力评分 |
| author | {id, name, userName, profileImageUrl} |
| mediaList | [{type, mediaUrlHttps, url}] |

### Example

```bash
curl -s -X POST https://api.bestblogs.dev/openapi/v1/tweet/list \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: $BESTBLOGS_API_KEY" \
  -d '{"timeFilter":"1d","sortType":"score_desc","userLanguage":"zh_CN","pageSize":100,"language":"all"}'
```

---

## Enums

### Category
- `Artificial_Intelligence` - 人工智能
- `Business_Tech` - 商业科技
- `Programming_Technology` - 软件编程
- `Product_Development` - 产品设计

### Resource Type
- `ARTICLE` - 文章
- `PODCAST` - 播客
- `VIDEO` - 视频
- `TWITTER` - 推特

### Time Filter
- `1d` (1 天), `3d` (3 天), `1w` (1 周), `1m` (1 月), `3m` (3 月), `1y` (1 年)

### Sort Type
- `default` - 默认
- `time_desc` - 时间倒序
- `score_desc` - 评分倒序
- `read_desc` - 阅读量倒序

---

## Common Response Format

```json
{
  "success": true,
  "code": null,
  "message": null,
  "requestId": "唯一请求 ID",
  "data": {
    "currentPage": 1,
    "pageSize": 100,
    "totalCount": 150,
    "pageCount": 2,
    "dataList": [ ... ]
  }
}
```

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| AUTH_001 | 401 | API Key 缺失 |
| AUTH_002 | 401 | API Key 无效 |
| AUTH_003 | 403 | 权限不足 |
| PARAM_001 | 400 | 参数错误 |
| NOT_FOUND | 404 | 资源不存在 |
| SYS_ERROR | 500 | 系统内部错误 |
