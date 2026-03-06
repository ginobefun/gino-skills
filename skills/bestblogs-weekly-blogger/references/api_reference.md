# BestBlogs Weekly Blogger API Reference

Base URL: `https://api.bestblogs.dev`
Auth: Header `X-API-KEY` (env var `BESTBLOGS_API_KEY`)

## 目录

1. [Newsletter List](#newsletter-list) - 查询期刊列表
2. [Newsletter Detail](#newsletter-detail) - 获取期刊详情（含文章列表）
3. [Resource Markdown](#resource-markdown) - 获取文章 Markdown 正文（深度分析用）
4. [枚举值速查](#枚举值速查)
5. [错误码](#错误码)

---

## Newsletter List

`POST /openapi/v1/newsletter/list`

查询期刊列表，用于确定最新期数。

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
  -d '{"currentPage":1,"pageSize":1,"userLanguage":"zh_CN"}'
```

---

## Newsletter Detail

`GET /openapi/v1/newsletter/get?id={id}&language={language}`

获取期刊详情，包含完整推荐语和文章列表。这是博客生成的核心数据源。

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
| id | String | 文章 ID（用于调用 markdown 接口） |
| title | String | 文章标题 |
| cover | String | 封面图片 URL |
| summary | String | 文章摘要 |
| sourceId | String | 来源 ID |
| sourceName | String | 来源名称 |
| url | String | 原始链接 |
| readUrl | String | BestBlogs 站内阅读链接（博客中优先使用） |
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
curl -s "https://api.bestblogs.dev/openapi/v1/newsletter/get?id=issue85&language=zh_CN" \
  -H "X-API-KEY: $BESTBLOGS_API_KEY"
```

---

## Resource Markdown

`GET /openapi/v1/resource/markdown?id={id}`

获取资源的 Markdown 正文内容。用于深度分析重点文章，获取超越摘要的细节。

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

- 返回 `null` 时，回退到周刊详情中的 `summary` 进行分析
- 正文可能较长，重点关注核心论点、关键数据和作者信息
- 分批调用，每批 5 个并行，避免频率限制
- 特别注意从正文中确认实际作者（发布平台和作者可能不同）

---

## 枚举值速查

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
