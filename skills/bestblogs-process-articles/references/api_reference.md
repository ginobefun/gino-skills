# BestBlogs Process Articles API 参考

## 接口地址

`https://api.bestblogs.dev`

## 认证

本 skill 使用两套认证方式：

### Admin API 认证

用于查询文章列表和保存分析结果。

```bash
-H "Authorization: Bearer $BESTBLOGS_ADMIN_JWT_TOKEN"
-H "User-Id: $BESTBLOGS_ADMIN_USER_ID"
-H "Content-Type: application/json"
```

环境变量:
- `BESTBLOGS_ADMIN_USER_ID`: 管理员用户 ID
- `BESTBLOGS_ADMIN_JWT_TOKEN`: 管理员 JWT Token

### OpenAPI 认证

用于获取文章 Markdown 正文。

```bash
-H "X-API-KEY: $BESTBLOGS_API_KEY"
```

环境变量:
- `BESTBLOGS_API_KEY`: OpenAPI 密钥

---

## 端点列表

| 端点 | 方法 | 认证 | 类型 | 用途 |
|------|------|------|------|------|
| `/api/admin/article/list` | POST | Admin | 读取 | 查询等待分析的文章列表 |
| `/openapi/v1/resource/markdown` | GET | OpenAPI | 读取 | 获取文章 Markdown 正文 |
| `/api/admin/article/saveAnalysisResult` | POST | Admin | 写入 | 保存结构化分析结果 |

---

## 1. 查询文章列表

### 请求

```
POST /api/admin/article/list
```

### 请求体

```json
{
  "currentPage": 1,
  "pageSize": 50,
  "type": "ARTICLE",
  "flowStatusFilter": "WAIT_ANALYSIS"
}
```

### 请求参数说明

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `currentPage` | int | 是 | 1 | 当前页码 |
| `pageSize` | int | 是 | 50 | 每页条数，最大 200 |
| `type` | string | 是 | - | 内容类型: `ARTICLE` |
| `flowStatusFilter` | string | 是 | - | 处理流程状态: `WAIT_ANALYSIS` |
| `keyword` | string | 否 | "" | 搜索关键词 |
| `category` | string | 否 | "" | 分类过滤 |
| `language` | string | 否 | "" | 语言过滤 |
| `priority` | string | 否 | "" | 优先级过滤 |
| `sourceId` | string | 否 | "" | 来源 ID 过滤 |
| `userLanguage` | string | 否 | "zh" | 用户语言 |

### curl 示例

```bash
curl -s -X POST https://api.bestblogs.dev/api/admin/article/list \
  -H "Authorization: Bearer $BESTBLOGS_ADMIN_JWT_TOKEN" \
  -H "User-Id: $BESTBLOGS_ADMIN_USER_ID" \
  -H "Content-Type: application/json" \
  -d '{"currentPage":1,"pageSize":50,"type":"ARTICLE","flowStatusFilter":"WAIT_ANALYSIS"}'
```

### 响应格式

```json
{
  "success": true,
  "code": null,
  "message": null,
  "requestId": "Txxxx",
  "data": {
    "currentPage": 1,
    "pageSize": 50,
    "totalCount": 12,
    "pageCount": 1,
    "dataList": [
      {
        "id": "RAW_55206902",
        "title": "文章标题",
        "url": "https://example.com/article",
        "description": "文章摘要描述",
        "language": "zh_CN",
        "languageDesc": "中文",
        "sourceId": "SOURCE_7e580d",
        "sourceName": "来源名称",
        "mainDomain": "Artificial_Intelligence",
        "mainDomainDesc": "人工智能",
        "aiSubCategory": "DEV",
        "aiSubCategoryDesc": "AI 开发",
        "category": "Artificial_Intelligence",
        "categoryDesc": "人工智能",
        "priority": "HIGH",
        "priorityDesc": "高",
        "resourceType": "ARTICLE",
        "wordCount": 5385,
        "readTime": 22,
        "authors": ["作者名"],
        "tags": ["Tag1", "Tag2"],
        "totalScore": null,
        "processFlowStatus": "WAIT_ANALYSIS",
        "processFlowStatusDesc": "等待分析",
        "publishDate": "2026-03-13T00:00:00.000+00:00",
        "publishDateStr": "Today"
      }
    ]
  }
}
```

### 响应字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | 内容 ID，格式 `RAW_xxx` |
| `title` | string | 文章标题 |
| `url` | string | 原文链接 |
| `description` | string | 摘要描述（分析前可能为空） |
| `language` | string | 语言代码: `zh_CN` / `en_US` |
| `languageDesc` | string | 语言描述 |
| `sourceId` | string | 来源 ID |
| `sourceName` | string | 来源名称 |
| `mainDomain` | string | 主领域枚举值（分析前可能为空） |
| `mainDomainDesc` | string | 主领域中文描述 |
| `aiSubCategory` | string | AI 子分类（分析前可能为空） |
| `category` | string | 分类枚举值 |
| `priority` | string | 优先级: `HIGH` / `MEDIUM` / `LOW` |
| `resourceType` | string | 内容类型: `ARTICLE` |
| `wordCount` | int | 字数 |
| `readTime` | int | 预估阅读时间（分钟） |
| `authors` | string[] | 作者列表 |
| `tags` | string[] | 标签列表（分析前可能为空） |
| `totalScore` | int/null | AI 评分（分析前为 null） |
| `processFlowStatus` | string | 处理流程状态 |
| `publishDate` | string | 发布时间（ISO 8601） |
| `publishDateStr` | string | 发布时间描述 |

### 主领域枚举值

| 值 | 描述 |
|---|------|
| `Artificial_Intelligence` | 人工智能 |
| `Programming_Technology` | 软件编程 |
| `Business_Tech` | 商业科技 |
| `Product_Design` | 产品设计 |

### AI 子分类枚举值

| 值 | 描述 |
|---|------|
| `MODELS` | AI 模型 |
| `DEV` | AI 开发 |
| `PRODUCT` | AI 产品 |
| `NEWS` | AI 资讯 |
| `OTHERS` | 其他 |

---

## 2. 获取文章 Markdown 正文

### 请求

```
GET /openapi/v1/resource/markdown?id={id}
```

### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | 是 | 文章 ID，如 `RAW_55206902` |

### curl 示例

```bash
curl -s "https://api.bestblogs.dev/openapi/v1/resource/markdown?id=RAW_55206902" \
  -H "X-API-KEY: $BESTBLOGS_API_KEY"
```

### 响应格式

```json
{
  "success": true,
  "code": null,
  "message": null,
  "requestId": "Txxxx",
  "data": "# 文章标题\n\n正文 Markdown 内容..."
}
```

`data` 字段直接返回 Markdown 字符串。资源不存在或正文尚未抓取时返回 `null`。

---

## 3. 保存分析结果

### 请求

```
POST /api/admin/article/saveAnalysisResult
```

### 请求体

```json
{
  "id": "RAW_55206902",
  "oneSentenceSummary": "一句话核心总结",
  "summary": "核心内容概要（200-400 字）",
  "mainDomain": "Artificial_Intelligence",
  "aiSubCategory": "DEV",
  "tags": ["标签1", "标签2", "标签3"],
  "mainPoints": [
    {"point": "主要观点 1", "explanation": "观点解释 1"},
    {"point": "主要观点 2", "explanation": "观点解释 2"}
  ],
  "keyQuotes": ["金句 1", "金句 2", "金句 3"],
  "totalScore": 85,
  "remark": "评分依据、分析和推荐等级"
}
```

### 请求参数说明

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | 是 | 文章 ID，如 `RAW_55206902` |
| `oneSentenceSummary` | string | 是 | 一句话核心总结，100 字内 |
| `summary` | string | 是 | 核心内容概要，200-400 字 |
| `mainDomain` | string | 是 | 主领域枚举值（见枚举表） |
| `aiSubCategory` | string | 否 | AI 子分类（仅人工智能领域需填写） |
| `tags` | string[] | 是 | 结构化标签，3-8 个 |
| `mainPoints` | object[] | 是 | 主要观点列表，每项含 `point` 和 `explanation` |
| `keyQuotes` | string[] | 是 | 代表性金句，3-5 句 |
| `totalScore` | int | 是 | 综合评分，0-100 整数 |
| `remark` | string | 否 | 评分依据和推荐等级 |

### curl 示例

```bash
curl -s -X POST https://api.bestblogs.dev/api/admin/article/saveAnalysisResult \
  -H "Authorization: Bearer $BESTBLOGS_ADMIN_JWT_TOKEN" \
  -H "User-Id: $BESTBLOGS_ADMIN_USER_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "RAW_55206902",
    "oneSentenceSummary": "一句话总结",
    "summary": "核心内容概要",
    "mainDomain": "Artificial_Intelligence",
    "aiSubCategory": "DEV",
    "tags": ["标签1", "标签2"],
    "mainPoints": [{"point": "观点", "explanation": "解释"}],
    "keyQuotes": ["金句1"],
    "totalScore": 85,
    "remark": "评分依据"
  }'
```

### 响应格式

```json
{
  "success": true,
  "code": null,
  "message": null,
  "requestId": "Txxxx",
  "data": true
}
```

`data` 为 `true` 表示保存成功。

### 字段映射（分析输出 → API 参数）

| 分析输出字段 | API 参数 | 转换规则 |
|-------------|---------|---------|
| `oneSentenceSummary` | `oneSentenceSummary` | 直接映射 |
| `summary` | `summary` | 直接映射 |
| `domain` | `mainDomain` | 中文→枚举值（见下方映射表） |
| `aiSubcategory` | `aiSubCategory` | 中文→枚举值（见下方映射表） |
| `tags` | `tags` | 直接映射 |
| `mainPoints` | `mainPoints` | 直接映射 |
| `keyQuotes` | `keyQuotes` | 直接映射 |
| `score` | `totalScore` | 直接映射 |
| `remark` | `remark` | 直接映射 |

### 领域映射表

| 分析输出 domain | API mainDomain |
|----------------|----------------|
| 人工智能 | `Artificial_Intelligence` |
| 软件编程 | `Programming_Technology` |
| 产品设计 | `Product_Design` |
| 商业科技 | `Business_Tech` |

### AI 子分类映射表

| 分析输出 aiSubcategory | API aiSubCategory |
|------------------------|-------------------|
| AI 模型 | `MODELS` |
| AI 开发 | `DEV` |
| AI 产品 | `PRODUCT` |
| AI 资讯 | `NEWS` |
| 其他 | `OTHERS` |

---

## 错误码

| HTTP 状态 | 错误码 | 说明 | 处理方式 |
|-----------|--------|------|----------|
| 401 | - | 未认证或 Token 过期 | 检查 `BESTBLOGS_ADMIN_JWT_TOKEN` 或 `BESTBLOGS_API_KEY` 是否有效 |
| 403 | - | 无权限 | 检查 `BESTBLOGS_ADMIN_USER_ID` 是否正确 |
| 400 | - | 参数错误 | 检查请求参数格式和枚举值 |
| 404 | - | 资源不存在 | 检查文章 ID 是否有效 |
| 500 | - | 服务端错误 | 重试一次，仍失败告知用户 |
| **200** | `success: false` | 业务逻辑错误 | 展示 `message` 字段内容 |

**重要**: 始终先检查 `response.success` 再处理 `response.data`。部分错误返回 HTTP 200 但 `success: false` — 不要仅依赖 HTTP 状态码。
