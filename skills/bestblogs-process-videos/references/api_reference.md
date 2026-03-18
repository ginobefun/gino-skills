# BestBlogs 视频处理 API 参考

## 接口地址

`https://api.bestblogs.dev`

## 认证

### Admin API 认证

用于查询视频列表、更新内容、保存分析结果和翻译结果。

```bash
-H "Authorization: Bearer $BESTBLOGS_ADMIN_JWT_TOKEN"
-H "User-Id: $BESTBLOGS_ADMIN_USER_ID"
-H "Content-Type: application/json"
```

环境变量:
- `BESTBLOGS_ADMIN_USER_ID`: 管理员用户 ID
- `BESTBLOGS_ADMIN_JWT_TOKEN`: 管理员 JWT Token

---

## 端点列表

| 端点 | 方法 | 认证 | 类型 | 用途 |
|------|------|------|------|------|
| `/api/admin/article/list` | POST | Admin | 读取 | 查询等待预处理/分析/翻译的视频列表 |
| `/api/admin/article/updateContent` | POST | Admin | 写入 | 更新视频转录内容 |
| `/api/admin/article/saveAnalysisResult` | POST | Admin | 写入 | 保存结构化分析结果 |
| `/dify/resource/markdown` | GET | 无 | 读取 | 获取视频内容和已分析的结果（WAIT_ANALYSIS 分析 / 翻译阶段用） |
| `/api/admin/article/saveTranslateResult` | POST | Admin | 写入 | 保存翻译后的分析结果 |

---

## 1. 查询视频列表

### 请求

```
POST /api/admin/article/list
```

### 请求体

```json
{
  "currentPage": 1,
  "pageSize": 20,
  "type": "VIDEO",
  "flowStatusFilter": "WAIT_PREPARE",
  "timeRange": "1w"
}
```

### 请求参数说明

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `currentPage` | int | 是 | 1 | 当前页码 |
| `pageSize` | int | 是 | 20 | 每页条数，最大 200 |
| `type` | string | 是 | - | 内容类型: `VIDEO` |
| `flowStatusFilter` | string | 是 | - | 处理流程状态: `WAIT_PREPARE` / `WAIT_ANALYSIS` / `WAIT_TRANSLATE` |
| `timeRange` | string | 否 | - | 时间范围: `1d` / `3d` / `1w` / `2w` / `1m` |
| `keyword` | string | 否 | "" | 搜索关键词 |
| `language` | string | 否 | "" | 语言过滤 |
| `priority` | string | 否 | "" | 优先级过滤 |
| `sourceId` | string | 否 | "" | 来源 ID 过滤 |

### curl 示例

```bash
curl -s -X POST https://api.bestblogs.dev/api/admin/article/list \
  -H "Authorization: Bearer $BESTBLOGS_ADMIN_JWT_TOKEN" \
  -H "User-Id: $BESTBLOGS_ADMIN_USER_ID" \
  -H "Content-Type: application/json" \
  -d '{"currentPage":1,"pageSize":20,"type":"VIDEO","flowStatusFilter":"WAIT_PREPARE","timeRange":"1w"}'
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
    "pageSize": 20,
    "totalCount": 5,
    "pageCount": 1,
    "dataList": [
      {
        "id": "RR_xxx",
        "title": "视频标题",
        "url": "https://www.youtube.com/watch?v=xxx",
        "description": "视频描述",
        "language": "en_US",
        "languageDesc": "English",
        "sourceId": "SOURCE_xxx",
        "sourceName": "来源名称",
        "mainDomain": "Artificial_Intelligence",
        "mainDomainDesc": "人工智能",
        "aiSubCategory": "DEV",
        "aiSubCategoryDesc": "AI 开发",
        "priority": "HIGH",
        "priorityDesc": "高",
        "resourceType": "VIDEO",
        "wordCount": 0,
        "authors": [],
        "tags": [],
        "totalScore": null,
        "processFlowStatus": "WAIT_PREPARE",
        "processFlowStatusDesc": "等待预处理",
        "publishDate": "2026-03-01T00:00:00.000+00:00",
        "publishDateStr": "2026-03-01"
      }
    ]
  }
}
```

### 响应字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | 内容 ID，格式 `RR_xxx` |
| `title` | string | 视频标题 |
| `url` | string | 原始链接 |
| `description` | string | 视频描述（分析前可能为空） |
| `language` | string | 语言代码: `zh_CN` / `en_US` |
| `languageDesc` | string | 语言描述（如 "English"、"中文"） |
| `sourceId` | string | 来源 ID |
| `sourceName` | string | 来源名称 |
| `mainDomain` | string | 主领域枚举值（分析前可能为空） |
| `mainDomainDesc` | string | 主领域中文描述 |
| `aiSubCategory` | string | AI 子分类（分析前可能为空） |
| `priority` | string | 优先级: `HIGH` / `MEDIUM` / `LOW` |
| `priorityDesc` | string | 优先级描述 |
| `resourceType` | string | 内容类型: `VIDEO` |
| `wordCount` | int | 字数（视频分析前通常为 0） |
| `totalScore` | int/null | AI 评分（分析前为 null） |
| `processFlowStatus` | string | 处理流程状态 |
| `publishDate` | string | 发布时间（ISO 8601） |
| `publishDateStr` | string | 发布时间描述 |

---

## 2. 更新视频转录内容

### 请求

```
POST /api/admin/article/updateContent
```

### 请求体

```json
{
  "id": "RR_xxx",
  "markdownContent": "转录的 Markdown 内容（已去除 H1 标题）..."
}
```

### 请求参数说明

| 参数 | 类型 | 位置 | 必填 | 说明 |
|------|------|------|------|------|
| `id` | string | body | 是 | 视频 ID，如 `RR_xxx` |
| `markdownContent` | string | body | 是 | 转录的 Markdown 内容，服务端自动转换为 `displayDocument` (HTML) |

### curl 示例

```bash
curl -s -X POST https://api.bestblogs.dev/api/admin/article/updateContent \
  -H "Authorization: Bearer $BESTBLOGS_ADMIN_JWT_TOKEN" \
  -H "User-Id: $BESTBLOGS_ADMIN_USER_ID" \
  -H "Content-Type: application/json" \
  -d '{"id":"RR_xxx","markdownContent":"转录内容..."}'
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

> **注意**：传输大内容时，curl 可能因 SSL 连接重置返回 exit code 35（此时服务端已成功写入）。应忽略此错误码并继续后续步骤。

---

## 3. 保存分析结果

### 请求

```
POST /api/admin/article/saveAnalysisResult?id={id}
```

> **注意**：视频 ID 通过 **query 参数** 传递，不在请求体中。

### 请求体（ResourceAnalysisResponse）

```json
{
  "title": "可选：仅当原标题含频道名等冗余时填写清理后版本",
  "oneSentenceSummary": "一句话核心总结（与视频同语言）",
  "summary": "核心内容概要，200-400 字（与视频同语言）",
  "domain": "Artificial_Intelligence",
  "aiSubcategory": "DEV",
  "tags": ["Tag1", "Tag2", "Tag3"],
  "mainPoints": [
    {"point": "主要观点 1（与视频同语言）", "explanation": "观点解释 1（与视频同语言）"},
    {"point": "主要观点 2（与视频同语言）", "explanation": "观点解释 2（与视频同语言）"}
  ],
  "keyQuotes": ["转录原文金句 1", "转录原文金句 2"],
  "score": 85,
  "remark": "中文评分依据和推荐等级"
}
```

### 请求参数说明

| 参数 | 类型 | 位置 | 必填 | 说明 |
|------|------|------|------|------|
| `id` | string | query | 是 | 视频 ID，如 `RR_xxx` |
| `title` | string | body | 否 | 仅在原标题含频道名等冗余信息时填写清理后版本 |
| `oneSentenceSummary` | string | body | 是 | 一句话核心总结，与视频同语言 |
| `summary` | string | body | 是 | 核心内容概要 200-400 字，与视频同语言 |
| `domain` | string | body | 是 | 一级分类代码（见 analysis_rubric.md 领域分类） |
| `aiSubcategory` | string | body | 否 | 二级分类代码（核心分类必填，通用分类留空） |
| `tags` | string[] | body | 是 | 结构化标签 3-8 个，与视频同语言 |
| `mainPoints` | object[] | body | 是 | 主要观点 3-5 条，每项含 `point` 和 `explanation` |
| `keyQuotes` | string[] | body | 是 | 代表性金句 3-5 句，必须逐字引用转录原文 |
| `score` | int | body | 是 | 综合评分，0-100 整数 |
| `remark` | string | body | 否 | 评分依据和推荐等级，**始终用中文** |

### curl 示例

```bash
curl -s -X POST "https://api.bestblogs.dev/api/admin/article/saveAnalysisResult?id=RR_xxx" \
  -H "Authorization: Bearer $BESTBLOGS_ADMIN_JWT_TOKEN" \
  -H "User-Id: $BESTBLOGS_ADMIN_USER_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "oneSentenceSummary": "一句话总结",
    "summary": "核心内容概要",
    "domain": "Artificial_Intelligence",
    "aiSubcategory": "DEV",
    "tags": ["Tag1", "Tag2", "Tag3"],
    "mainPoints": [
      {"point": "观点1", "explanation": "解释1"},
      {"point": "观点2", "explanation": "解释2"}
    ],
    "keyQuotes": ["金句1", "金句2"],
    "score": 85,
    "remark": "中文评分依据"
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

---

## 4. 获取视频内容和分析结果（WAIT_ANALYSIS 分析 / 翻译阶段用）

### 请求

```
GET /dify/resource/markdown?id={id}&language={language}
```

> **无需认证头。** `language` 参数影响 `languageName` 和 `destLanguageName` 的显示语言。

### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | 是 | 视频 ID，如 `RR_xxx` |
| `language` | string | 否 | 用户语言偏好，如 `zh`。影响语言名称的显示 |

### curl 示例

```bash
curl -s "https://api.bestblogs.dev/dify/resource/markdown?id=RR_xxx&language=zh"
```

### 响应格式

```json
{
  "success": "true",
  "url": "https://www.youtube.com/watch?v=xxx",
  "sourceName": "来源名称",
  "priority": "HIGH",
  "priorityScore": 80,
  "title": "视频标题",
  "languageName": "English",
  "destLanguageName": "中文",
  "wordCount": 12345,
  "markdown": "转录的 Markdown 内容...",
  "analysisResult": "{\"title\":\"视频标题\",\"oneSentenceSummary\":\"一句话总结\",\"summary\":\"全文摘要\",\"tags\":[\"Tag1\",\"Tag2\"],\"mainPoints\":[{\"point\":\"观点1\",\"explanation\":\"解释1\"}],\"keyQuotes\":[\"金句1\",\"金句2\"]}"
}
```

> **重要**：`success` 字段为**字符串类型**（`"true"` / `"false"`），非布尔值。检查时必须用字符串比较。

### 响应字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `success` | **string** | `"true"` 成功 / `"false"` 失败（**字符串类型，非布尔值**） |
| `url` | string | 原始链接 |
| `sourceName` | string | 来源名称 |
| `priority` | string | 来源优先级: `HIGHEST` / `HIGH` / `MEDIUM` / `LOW` / `LOWEST` |
| `priorityScore` | int | 来源优先级对应分数（如 HIGH=80） |
| `title` | string | 视频标题 |
| `languageName` | string | 原始语言名称（如 "English"、"中文"），用于确定翻译方向 |
| `destLanguageName` | string | 目标翻译语言名称（如 "中文"、"English"），用于确定翻译方向 |
| `wordCount` | int | 字数 |
| `markdown` | string | 转录的 Markdown 内容 |
| `analysisResult` | string | 已分析的结构化结果（**JSON 字符串**，需解析后使用） |

### analysisResult 解析后结构

```json
{
  "title": "视频标题",
  "oneSentenceSummary": "一句话核心总结",
  "summary": "全文摘要（200-400 字）",
  "tags": ["标签1", "标签2", "标签3"],
  "mainPoints": [
    {"point": "主要观点 1", "explanation": "观点解释 1"}
  ],
  "keyQuotes": ["关键引用 1", "关键引用 2"]
}
```

---

## 5. 保存翻译结果

### 请求

```
POST /api/admin/article/saveTranslateResult?id={id}
```

> **注意**：视频 ID 通过 **query 参数** 传递。端点为 `saveTranslateResult`（非 `saveAnalysisResult`）。

### 请求体（ResourceAnalysisResponse）

翻译阶段只传翻译后的文本字段，**不传** `score`、`remark`、`domain`、`aiSubcategory`、`content` 等非翻译字段。

```json
{
  "title": "翻译后的标题",
  "oneSentenceSummary": "Translated one-sentence summary",
  "summary": "Translated detailed summary...",
  "tags": ["Translated Tag1", "Translated Tag2"],
  "mainPoints": [
    {"point": "Translated point 1", "explanation": "Translated explanation 1"}
  ],
  "keyQuotes": ["Translated quote 1", "Translated quote 2"]
}
```

### 请求参数说明

| 参数 | 类型 | 位置 | 必填 | 说明 |
|------|------|------|------|------|
| `id` | string | query | 是 | 视频 ID，如 `RR_xxx` |
| `title` | string | body | 是 | 翻译后的标题 |
| `oneSentenceSummary` | string | body | 是 | 翻译后的一句话核心总结 |
| `summary` | string | body | 是 | 翻译后的详细摘要 |
| `tags` | string[] | body | 是 | 翻译后的标签列表 |
| `mainPoints` | object[] | body | 是 | 翻译后的主要观点，每项含 `point` 和 `explanation` |
| `keyQuotes` | string[] | body | 是 | 翻译后的关键引用 |

### curl 示例

```bash
curl -s -X POST "https://api.bestblogs.dev/api/admin/article/saveTranslateResult?id=RR_xxx" \
  -H "Authorization: Bearer $BESTBLOGS_ADMIN_JWT_TOKEN" \
  -H "User-Id: $BESTBLOGS_ADMIN_USER_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Translated Title",
    "oneSentenceSummary": "Translated one-sentence summary",
    "summary": "Translated detailed summary content...",
    "tags": ["Tag1", "Tag2", "Tag3"],
    "mainPoints": [
      {"point": "Point 1", "explanation": "Explanation 1"},
      {"point": "Point 2", "explanation": "Explanation 2"}
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

---

## 错误码

| HTTP 状态 | 错误码 | 说明 | 处理方式 |
|-----------|--------|------|----------|
| 401 | - | 未认证或 Token 过期 | 检查 `BESTBLOGS_ADMIN_JWT_TOKEN` 是否有效 |
| 403 | - | 无权限 | 检查 `BESTBLOGS_ADMIN_USER_ID` 是否正确 |
| 400 | - | 参数错误 | 检查请求参数格式和枚举值 |
| 404 | - | 资源不存在 | 检查视频 ID 是否有效 |
| 500 | - | 服务端错误 | 重试一次，仍失败告知用户 |
| **200** | `success: false` | 业务逻辑错误 | 展示 `message` 字段内容 |
| **200** | `success: "false"` | `/dify/resource/markdown` 端点失败 | 视频内容不可用，跳过该视频 |

**重要**: 始终先检查 `response.success` 再处理 `response.data`。注意 `/dify/resource/markdown` 端点的 `success` 为**字符串类型**，其他 Admin API 端点为**布尔类型**。
