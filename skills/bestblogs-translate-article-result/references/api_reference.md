# BestBlogs Translate Article Result API 参考

## 接口地址

`https://api.bestblogs.dev`

## 认证

本 skill 使用两套认证方式：

### Admin API 认证

用于查询文章列表和保存翻译结果。

```bash
-H "Authorization: Bearer $BESTBLOGS_ADMIN_JWT_TOKEN"
-H "User-Id: $BESTBLOGS_ADMIN_USER_ID"
-H "Content-Type: application/json"
```

环境变量:
- `BESTBLOGS_ADMIN_USER_ID`: 管理员用户 ID
- `BESTBLOGS_ADMIN_JWT_TOKEN`: 管理员 JWT Token

### OpenAPI 认证

用于获取文章分析结果详情。

```bash
-H "X-API-KEY: $BESTBLOGS_API_KEY"
```

环境变量:
- `BESTBLOGS_API_KEY`: OpenAPI 密钥

---

## 端点列表

| 端点 | 方法 | 认证 | 类型 | 用途 |
|------|------|------|------|------|
| `/api/admin/article/list` | POST | Admin | 读取 | 查询等待翻译的文章列表 |
| `/openapi/v1/resource/meta` | GET | OpenAPI | 读取 | 获取文章完整分析结果 |
| `/api/admin/article/saveAnalysisResult` | POST | Admin | 写入 | 保存翻译后的分析结果 |

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
  "flowStatusFilter": "WAIT_TRANSLATION"
}
```

### 请求参数说明

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `currentPage` | int | 是 | 1 | 当前页码 |
| `pageSize` | int | 是 | 50 | 每页条数，最大 200 |
| `type` | string | 是 | - | 内容类型: `ARTICLE` |
| `flowStatusFilter` | string | 是 | - | 处理流程状态: `WAIT_TRANSLATION` |
| `keyword` | string | 否 | "" | 搜索关键词 |
| `category` | string | 否 | "" | 分类过滤 |
| `language` | string | 否 | "" | 语言过滤 |
| `priority` | string | 否 | "" | 优先级过滤 |
| `sourceId` | string | 否 | "" | 来源 ID 过滤 |
| `startDate` | string | 否 | "" | 开始日期 `YYYY-MM-DD` |
| `endDate` | string | 否 | "" | 结束日期 `YYYY-MM-DD` |
| `userLanguage` | string | 否 | "zh" | 用户语言 |

### curl 示例

```bash
curl -s -X POST https://api.bestblogs.dev/api/admin/article/list \
  -H "Authorization: Bearer $BESTBLOGS_ADMIN_JWT_TOKEN" \
  -H "User-Id: $BESTBLOGS_ADMIN_USER_ID" \
  -H "Content-Type: application/json" \
  -d '{"currentPage":1,"pageSize":50,"type":"ARTICLE","flowStatusFilter":"WAIT_TRANSLATION"}'
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
        "totalScore": 85,
        "processFlowStatus": "WAIT_TRANSLATION",
        "processFlowStatusDesc": "等待翻译",
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
| `description` | string | 摘要描述 |
| `language` | string | 语言代码: `zh_CN` / `en_US` |
| `languageDesc` | string | 语言描述 |
| `sourceId` | string | 来源 ID |
| `sourceName` | string | 来源名称 |
| `mainDomain` | string | 主领域枚举值 |
| `mainDomainDesc` | string | 主领域中文描述 |
| `aiSubCategory` | string | AI 子分类 |
| `category` | string | 分类枚举值 |
| `priority` | string | 优先级: `HIGH` / `MEDIUM` / `LOW` |
| `resourceType` | string | 内容类型: `ARTICLE` |
| `wordCount` | int | 字数 |
| `readTime` | int | 预估阅读时间（分钟） |
| `authors` | string[] | 作者列表 |
| `tags` | string[] | 标签列表 |
| `totalScore` | int | AI 评分 |
| `processFlowStatus` | string | 处理流程状态 |
| `publishDate` | string | 发布时间（ISO 8601） |
| `publishDateStr` | string | 发布时间描述 |

---

## 2. 获取文章分析结果详情

### 请求

```
GET /openapi/v1/resource/meta?id={id}&language={language}
```

### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | 是 | 文章 ID，如 `RAW_55206902` |
| `language` | string | 否 | 用户语言偏好，如 `zh_CN` |

### curl 示例

```bash
curl -s "https://api.bestblogs.dev/openapi/v1/resource/meta?id=RAW_55206902&language=zh_CN" \
  -H "X-API-KEY: $BESTBLOGS_API_KEY"
```

### 响应格式

```json
{
  "success": true,
  "code": null,
  "message": null,
  "requestId": "Txxxx",
  "data": {
    "id": "RAW_55206902",
    "originalTitle": "原始标题",
    "title": "优化后标题",
    "oneSentenceSummary": "一句话核心总结",
    "summary": "详细摘要内容...",
    "tags": ["Tag1", "Tag2", "Tag3"],
    "mainPoints": [
      {"point": "主要观点 1", "explanation": "观点解释 1"},
      {"point": "主要观点 2", "explanation": "观点解释 2"},
      {"point": "主要观点 3", "explanation": "观点解释 3"}
    ],
    "keyQuotes": ["关键引用 1", "关键引用 2", "关键引用 3"],
    "url": "https://example.com/article",
    "readUrl": "https://www.bestblogs.dev/article/xxx",
    "domain": "example.com",
    "cover": "https://example.com/cover.jpg",
    "language": "zh_CN",
    "languageDesc": "中文",
    "sourceId": "SOURCE_7e580d",
    "sourceName": "来源名称",
    "sourceImage": "https://example.com/source.png",
    "category": "Artificial_Intelligence",
    "categoryDesc": "人工智能",
    "aiSubCategory": "DEV",
    "aiSubCategoryDesc": "AI 开发",
    "mainDomain": "Artificial_Intelligence",
    "mainDomainDesc": "人工智能",
    "resourceType": "ARTICLE",
    "resourceTypeDesc": "文章",
    "score": 85,
    "readCount": 120,
    "wordCount": 5385,
    "readTime": 22,
    "authors": ["作者名"],
    "publishTimeStamp": 1710288000000,
    "publishDateStr": "03-13",
    "publishDateTimeStr": "2026-03-13 08:00",
    "qualified": true,
    "notExist": null
  }
}
```

### 翻译相关字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `title` | string | 优化后标题（如分析阶段有修改） |
| `originalTitle` | string | 原始标题 |
| `oneSentenceSummary` | string | 一句话核心总结 |
| `summary` | string | 详细摘要 |
| `tags` | string[] | 标签列表 |
| `mainPoints` | object[] | 主要观点，每项含 `point` 和 `explanation` |
| `keyQuotes` | string[] | 关键引用列表 |
| `language` | string | 语言代码，用于判断翻译方向 |
| `notExist` | any | 非 null 表示资源不存在 |

---

## 3. 保存翻译结果

### 请求

```
POST /api/admin/article/saveAnalysisResult?id={id}
```

> **注意**：文章 ID 通过 **query 参数** 传递，不在请求体中。

### 请求体（翻译阶段）

翻译阶段只传翻译相关字段，不传 `score`、`remark`、`domain`、`aiSubcategory` 等分析字段。

```json
{
  "title": "翻译后的标题（可选，仅原分析结果有 title 时传）",
  "oneSentenceSummary": "Translated one-sentence summary",
  "summary": "Translated detailed summary...",
  "tags": ["Translated Tag1", "Translated Tag2", "Translated Tag3"],
  "mainPoints": [
    {"point": "Translated point 1", "explanation": "Translated explanation 1"},
    {"point": "Translated point 2", "explanation": "Translated explanation 2"},
    {"point": "Translated point 3", "explanation": "Translated explanation 3"}
  ],
  "keyQuotes": ["Translated quote 1", "Translated quote 2", "Translated quote 3"]
}
```

### 请求参数说明

| 参数 | 类型 | 位置 | 必填 | 说明 |
|------|------|------|------|------|
| `id` | string | query | 是 | 文章 ID，如 `RAW_55206902` |
| `title` | string | body | 否 | 翻译后的标题（仅原分析结果中有 title 时传入） |
| `oneSentenceSummary` | string | body | 是 | 翻译后的一句话核心总结 |
| `summary` | string | body | 是 | 翻译后的详细摘要 |
| `tags` | string[] | body | 是 | 翻译后的标签列表 |
| `mainPoints` | object[] | body | 是 | 翻译后的主要观点，每项含 `point` 和 `explanation` |
| `keyQuotes` | string[] | body | 是 | 翻译后的关键引用 |

### curl 示例

```bash
curl -s -X POST "https://api.bestblogs.dev/api/admin/article/saveAnalysisResult?id=RAW_55206902" \
  -H "Authorization: Bearer $BESTBLOGS_ADMIN_JWT_TOKEN" \
  -H "User-Id: $BESTBLOGS_ADMIN_USER_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "oneSentenceSummary": "Translated one-sentence summary",
    "summary": "Translated detailed summary content...",
    "tags": ["Tag1", "Tag2", "Tag3"],
    "mainPoints": [
      {"point": "Point 1", "explanation": "Explanation 1"},
      {"point": "Point 2", "explanation": "Explanation 2"},
      {"point": "Point 3", "explanation": "Explanation 3"}
    ],
    "keyQuotes": ["Quote 1", "Quote 2", "Quote 3"]
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

---

## 错误码

| HTTP 状态 | 错误码 | 说明 | 处理方式 |
|-----------|--------|------|----------|
| 401 | - | 未认证或 Token 过期 | 检查 `BESTBLOGS_ADMIN_JWT_TOKEN` 或 `BESTBLOGS_API_KEY` 是否有效 |
| 403 | - | 无权限 | 检查 `BESTBLOGS_ADMIN_USER_ID` 是否正确 |
| 400 | - | 参数错误 | 检查请求参数格式 |
| 404 | - | 资源不存在 | 检查文章 ID 是否有效 |
| 500 | - | 服务端错误 | 重试一次，仍失败告知用户 |
| **200** | `success: false` | 业务逻辑错误 | 展示 `message` 字段内容 |

**重要**: 始终先检查 `response.success` 再处理 `response.data`。部分错误返回 HTTP 200 但 `success: false` — 不要仅依赖 HTTP 状态码。
