# BestBlogs Translate Article Result API 参考

## 接口地址

`https://api.bestblogs.dev`

## 认证

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

### Dify 端点

获取文章内容和分析结果的 `/dify/resource/markdown` 端点**无需认证头**。

---

## 端点列表

| 端点 | 方法 | 认证 | 类型 | 用途 |
|------|------|------|------|------|
| `/api/admin/article/list` | POST | Admin | 读取 | 查询等待翻译的文章列表 |
| `/dify/resource/markdown` | GET | 无 | 读取 | 获取文章正文和已分析的结果 |
| `/api/admin/article/saveTranslateResult` | POST | Admin | 写入 | 保存翻译后的分析结果 |

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

## 2. 获取文章内容和分析结果

### 请求

```
GET /dify/resource/markdown?id={id}&language={language}
```

> **无需认证头。** `language` 参数影响 `languageName` 和 `destLanguageName` 的显示语言。

### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | 是 | 文章 ID，如 `RAW_55206902`（不带 `RAW_` 前缀也可，服务端自动补全） |
| `language` | string | 否 | 用户语言偏好，如 `zh`。影响语言名称的显示 |

### curl 示例

```bash
curl -s "https://api.bestblogs.dev/dify/resource/markdown?id=RAW_55206902&language=zh"
```

### 响应格式

```json
{
  "success": "true",
  "url": "https://example.com/article",
  "sourceName": "来源名称",
  "priority": "HIGH",
  "priorityScore": 80,
  "title": "文章标题",
  "languageName": "中文",
  "destLanguageName": "English",
  "wordCount": 5385,
  "markdown": "# 文章标题\n\n正文 Markdown 内容...",
  "analysisResult": "{\"title\":\"文章标题\",\"oneSentenceSummary\":\"一句话总结\",\"summary\":\"全文摘要\",\"tags\":[\"Tag1\",\"Tag2\"],\"mainPoints\":[{\"point\":\"观点1\",\"explanation\":\"解释1\"}],\"keyQuotes\":[\"金句1\",\"金句2\"]}"
}
```

> **注意**：`success` 字段为**字符串类型**（`"true"` / `"false"`），非布尔值。

### 响应字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `success` | string | `"true"` 成功 / `"false"` 失败（**字符串类型**） |
| `url` | string | 原文链接 |
| `sourceName` | string | 来源名称 |
| `priority` | string | 来源优先级: `HIGHEST` / `HIGH` / `MEDIUM` / `LOW` / `LOWEST` |
| `priorityScore` | int | 优先级分数 |
| `title` | string | 文章标题 |
| `languageName` | string | 原始语言名称（如 "中文"、"English"），用于确定翻译方向 |
| `destLanguageName` | string | 目标翻译语言名称（如 "English"、"中文"），用于确定翻译方向 |
| `wordCount` | int | 字数 |
| `markdown` | string | 文章 Markdown 正文（可能被截断至最大长度） |
| `analysisResult` | string | 已分析的结构化结果（**JSON 字符串**，需解析后使用） |

### analysisResult 解析后结构

`analysisResult` 是 JSON 字符串，解析后包含以下字段：

```json
{
  "title": "文章标题",
  "oneSentenceSummary": "一句话核心总结",
  "summary": "全文摘要（200-400 字）",
  "tags": ["标签1", "标签2", "标签3"],
  "mainPoints": [
    {"point": "主要观点 1", "explanation": "观点解释 1"},
    {"point": "主要观点 2", "explanation": "观点解释 2"},
    {"point": "主要观点 3", "explanation": "观点解释 3"}
  ],
  "keyQuotes": ["关键引用 1", "关键引用 2", "关键引用 3"]
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `title` | string | 文章标题 |
| `oneSentenceSummary` | string | 一句话核心总结（原始语言） |
| `summary` | string | 全文摘要（原始语言） |
| `tags` | string[] | 标签列表（原始语言） |
| `mainPoints` | object[] | 主要观点，每项含 `point`（观点）和 `explanation`（解释），原始语言 |
| `keyQuotes` | string[] | 关键引用列表（原始语言） |

**语言逻辑**：
- 中文文章（`languageName: "中文"`）→ 返回中文版分析结果（`zhOneSentenceSummary`、`zhSummary` 等）
- 英文文章（`languageName: "English"`）→ 返回英文版分析结果（`enOneSentenceSummary`、`enSummary` 等）

---

## 3. 保存翻译结果

### 请求

```
POST /api/admin/article/saveTranslateResult?id={id}
```

> **注意**：文章 ID 通过 **query 参数** 传递，不在请求体中。端点为 `saveTranslateResult`（非 `saveAnalysisResult`）。

### 请求体（ResourceAnalysisResponse）

翻译阶段只传翻译后的文本字段，**不传** `score`、`remark`、`domain`、`aiSubcategory`、`content` 等非翻译字段。

```json
{
  "title": "翻译后的标题",
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
| `title` | string | body | 是 | 翻译后的标题 |
| `oneSentenceSummary` | string | body | 是 | 翻译后的一句话核心总结 |
| `summary` | string | body | 是 | 翻译后的详细摘要 |
| `tags` | string[] | body | 是 | 翻译后的标签列表 |
| `mainPoints` | object[] | body | 是 | 翻译后的主要观点，每项含 `point` 和 `explanation` |
| `keyQuotes` | string[] | body | 是 | 翻译后的关键引用 |

### 请求体类型定义（ResourceAnalysisResponse）

```java
@Data
public class ResourceAnalysisResponse implements Serializable {
    private String title;              // 翻译后的标题
    private String oneSentenceSummary; // 翻译后的一句话总结
    private String summary;            // 翻译后的摘要
    private String content;            // 翻译阶段不传
    private String domain;             // 翻译阶段不传
    private String aiSubcategory;      // 翻译阶段不传
    private List<String> tags;         // 翻译后的标签
    private List<ResourceMainPoint> mainPoints; // 翻译后的观点
    private List<String> keyQuotes;    // 翻译后的引用
    private Integer score;             // 翻译阶段不传
    private String remark;             // 翻译阶段不传
}
```

### curl 示例

```bash
curl -s -X POST "https://api.bestblogs.dev/api/admin/article/saveTranslateResult?id=RAW_55206902" \
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
| 401 | - | 未认证或 Token 过期 | 检查 `BESTBLOGS_ADMIN_JWT_TOKEN` 是否有效 |
| 403 | - | 无权限 | 检查 `BESTBLOGS_ADMIN_USER_ID` 是否正确 |
| 400 | - | 参数错误 | 检查请求参数格式 |
| 404 | - | 资源不存在 | 检查文章 ID 是否有效 |
| 500 | - | 服务端错误 | 重试一次，仍失败告知用户 |
| **200** | `success: false` | 业务逻辑错误 | 展示 `message` 字段内容 |
| **200** | `success: "false"` | `/dify/resource/markdown` 端点失败 | 文章内容不可用，跳过该篇 |

**重要**: 始终先检查 `response.success` 再处理 `response.data`。注意 `/dify/resource/markdown` 端点的 `success` 为**字符串类型**，其他 Admin API 端点为**布尔类型**。
