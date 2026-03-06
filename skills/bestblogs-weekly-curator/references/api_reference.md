# BestBlogs Weekly Curator API Reference

Base URL: `https://api.bestblogs.dev`
Auth: Header `X-API-KEY` (env var `BESTBLOGS_API_KEY`)

## 目录

1. [Resource List](#resource-list) - 查询文章/播客/视频列表（主要数据源）
2. [Resource Markdown](#resource-markdown) - 获取文章 Markdown 正文（深度分析用）
3. [Newsletter List](#newsletter-list) - 查询期刊列表
4. [Newsletter Detail](#newsletter-detail) - 获取期刊详情（含文章列表）
5. [枚举值速查](#枚举值速查)
6. [错误码](#错误码)

---

## Resource List

`POST /openapi/v1/resource/list`

本 skill 的核心数据源，用于拉取候选内容。

### 请求体

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| currentPage | Integer | 1 | 页码 |
| pageSize | Integer | 10 | 每页数量（最大 100） |
| userLanguage | String | | 用户语言偏好: `zh_CN`, `en_US` |
| keyword | String | | 搜索关键词 |
| sourceId | String | | 订阅源 ID 过滤 |
| category | String | | 分类过滤 |
| language | String | | 内容语言过滤: `zh_CN`, `en_US` |
| type | String | | 资源类型: `ARTICLE`, `PODCAST`, `VIDEO`, `TWITTER` |
| priority | String | | 优先级: `HIGH`, `MEDIUM`, `LOW` |
| qualifiedFilter | String | | 精选过滤: `true`, `false`, `ALL` |
| timeFilter | String | | 时间范围: `1d`, `3d`, `1w`, `1m`, `3m`, `1y` |
| sortType | String | | 排序: `default`, `time_desc`, `score_desc`, `read_desc` |

### 响应字段 (dataList items)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String | 资源唯一 ID |
| originalTitle | String | 原始标题 |
| title | String | 优化后标题 |
| oneSentenceSummary | String | 一句话摘要 |
| summary | String | 详细摘要 |
| tags | Array | 标签列表 |
| mainPoints | Array | 主要观点 [{point, explanation}] |
| keyQuotes | Array | 关键引用列表 |
| url | String | 原文链接 |
| readUrl | String | BestBlogs 站内阅读链接（输出时优先使用） |
| domain | String | 域名 |
| cover | String | 封面图片 URL |
| language | String | 内容语言 |
| languageDesc | String | 语言描述 |
| sourceId | String | 来源 ID |
| sourceName | String | 来源名称 |
| sourceImage | String | 来源头像 URL |
| category | String | 主分类 |
| categoryDesc | String | 分类描述 |
| aiSubCategory | String | AI 细分类别: `MODELS`, `DEV`, `PRODUCT`, `NEWS` |
| aiSubCategoryDesc | String | AI 细分类别描述 |
| mainDomain | String | 主领域（AI 根据内容识别） |
| mainDomainDesc | String | 主领域描述 |
| resourceType | String | 资源类型 |
| resourceTypeDesc | String | 资源类型描述 |
| score | Integer | 质量评分 (0-100) |
| readCount | Integer | 阅读次数 |
| wordCount | Integer | 字数 |
| readTime | Integer | 预估阅读时间（分钟） |
| mediaDuration | Integer | 媒体时长（秒，视频/播客，可为 null） |
| authors | Array | 作者列表 |
| publishTimeStamp | Long | 发布时间戳（毫秒） |
| publishDateStr | String | 发布日期 (MM-dd) |
| publishDateTimeStr | String | 完整发布时间 |
| qualified | Boolean | 是否为精选 |

### 请求示例

```bash
curl -s -X POST https://api.bestblogs.dev/openapi/v1/resource/list \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: $BESTBLOGS_API_KEY" \
  -d '{
    "currentPage": 1,
    "pageSize": 100,
    "timeFilter": "1w",
    "sortType": "score_desc",
    "category": "Artificial_Intelligence",
    "type": "ARTICLE",
    "userLanguage": "zh_CN"
  }'
```

---

## Resource Markdown

`GET /openapi/v1/resource/markdown?id={id}`

获取资源的 Markdown 正文内容。用于阶段三深度分析，判断文章质量和内容深度。

### 请求参数 (Query)

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | String | 是 | 资源唯一 ID |

### 响应

`data` 字段直接返回 Markdown 字符串。资源不存在或无正文时返回 `null`。

```json
{
  "success": true,
  "code": null,
  "message": null,
  "requestId": "唯一请求 ID",
  "data": "# 文章标题\n\n正文 Markdown 内容..."
}
```

### 请求示例

```bash
curl -s "https://api.bestblogs.dev/openapi/v1/resource/markdown?id=RAW_4e45fa" \
  -H "X-API-KEY: $BESTBLOGS_API_KEY"
```

### 注意事项

- 返回 `null` 时，回退到使用列表接口中的 `summary` 和 `mainPoints` 进行判断
- 正文可能较长，仅需阅读前 2000 字即可判断质量
- 分批调用，每批 5 个并行，避免频率限制

---

## Newsletter List

`POST /openapi/v1/newsletter/list`

查询期刊列表，获取最近几期周刊的基本信息。

### 请求体

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| currentPage | Integer | 1 | 页码 |
| pageSize | Integer | 10 | 每页数量 |
| userLanguage | String | | 用户语言偏好: `zh_CN`, `en_US` |

### 响应字段 (dataList items)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String | 期刊 ID（如 "issue55"） |
| title | String | 期刊标题 |
| summary | String | 期刊摘要/推荐语 |
| articleCount | Integer | 收录文章数 |
| published | Boolean | 是否已发布 |
| createdTimeStr | String | 创建时间 |
| createdTimestamp | Long | 创建时间戳（毫秒） |
| updatedTimeStr | String | 更新时间 |

### 请求示例

```bash
curl -s -X POST https://api.bestblogs.dev/openapi/v1/newsletter/list \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: $BESTBLOGS_API_KEY" \
  -d '{"currentPage":1,"pageSize":3,"userLanguage":"zh_CN"}'
```

---

## Newsletter Detail

`GET /openapi/v1/newsletter/get?id={id}&language={language}`

获取期刊详情，包含完整推荐语和文章列表。

### 请求参数 (Query)

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | String | 是 | 期刊 ID |
| language | String | 否 | 语言偏好: `zh_CN`, `en_US` |

### 响应字段

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String | 期刊 ID |
| title | String | 标题（根据 language 返回） |
| summary | String | 摘要/推荐语（根据 language 返回） |
| enTitle | String | 英文标题 |
| enSummary | String | 英文摘要 |
| zhTitle | String | 中文标题 |
| zhSummary | String | 中文摘要 |
| articles | Array | 文章列表 |
| published | Boolean | 是否已发布 |
| createdTimeStr | String | 创建时间 |
| updatedTimeStr | String | 更新时间 |

### articles 字段

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String | 文章 ID |
| title | String | 文章标题 |
| cover | String | 封面图片 URL |
| summary | String | 文章摘要 |
| sourceId | String | 来源 ID |
| sourceName | String | 来源名称 |
| url | String | 原始链接 |
| domain | String | 域名 |
| score | Integer | 评分 (0-100) |
| wordCount | Integer | 字数 |
| readTime | Integer | 阅读时间（分钟） |
| publishDateStr | String | 发布日期 |
| category | String | 主分类 |
| aiCategory | String | AI 细分类别: `MODELS`, `DEV`, `PRODUCT`, `NEWS` |
| resourceType | String | 资源类型: `ARTICLE`, `PODCAST`, `VIDEO` |
| originLanguage | String | 原始语言 |
| language | String | 适用语言 |
| sort | Integer | 排序值 |

### 请求示例

```bash
curl -s "https://api.bestblogs.dev/openapi/v1/newsletter/get?id=issue55&language=zh_CN" \
  -H "X-API-KEY: $BESTBLOGS_API_KEY"
```

---

## 枚举值速查

### Category (分类)
| 值 | 描述 |
|----|------|
| `Artificial_Intelligence` | 人工智能 |
| `Business_Tech` | 商业科技 |
| `Programming_Technology` | 软件编程 |
| `Product_Development` | 产品设计 |

### AI Sub-Category (AI 细分类别)
| 值 | 描述 |
|----|------|
| `MODELS` | 模型与研究 |
| `DEV` | 开发与工具 |
| `PRODUCT` | 产品与设计 |
| `NEWS` | 资讯与报告 |

### Resource Type (资源类型)
| 值 | 描述 |
|----|------|
| `ARTICLE` | 文章 |
| `PODCAST` | 播客 |
| `VIDEO` | 视频 |
| `TWITTER` | 推特 |

### Time Filter (时间范围)
| 值 | 描述 |
|----|------|
| `1d` | 1 天 |
| `3d` | 3 天 |
| `1w` | 1 周 |
| `1m` | 1 月 |
| `3m` | 3 月 |
| `1y` | 1 年 |

### Sort Type (排序)
| 值 | 描述 |
|----|------|
| `default` | 默认 |
| `time_desc` | 时间倒序 |
| `score_desc` | 评分倒序 |
| `read_desc` | 阅读量倒序 |

---

## 错误码

| 错误码 | HTTP 状态码 | 说明 |
|--------|-----------|------|
| AUTH_001 | 401 | API Key 缺失 |
| AUTH_002 | 401 | API Key 无效 |
| AUTH_003 | 403 | 权限不足 |
| PARAM_001 | 400 | 参数错误 |
| NOT_FOUND | 404 | 资源不存在 |
| SYS_ERROR | 500 | 系统内部错误 |

**重要**: 始终先检查 `response.success` 再处理 `response.data`。
