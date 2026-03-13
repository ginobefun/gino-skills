# BestBlogs Process Tweets API 参考

## 接口地址

`https://api.bestblogs.dev`

## 认证

Admin API 认证，所有请求携带以下请求头:

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

| 端点 | 方法 | 类型 | 用途 |
|------|------|------|------|
| `/api/admin/article/list` | POST | 读取 | 查询等待分析的推文列表 |
| `/api/admin/article/saveTweetAnalysisResult` | POST | 写入 | 按作者批量保存推文分析结果 |

---

## 1. 查询推文列表

### 请求

```
POST /api/admin/article/list
```

### 请求体

```json
{
  "currentPage": 1,
  "pageSize": 100,
  "type": "TWITTER",
  "flowStatusFilter": "WAIT_ANALYSIS"
}
```

### 请求参数说明

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `currentPage` | int | 是 | 1 | 当前页码 |
| `pageSize` | int | 是 | 100 | 每页条数，最大 200 |
| `type` | string | 是 | - | 内容类型，固定为 `TWITTER` |
| `flowStatusFilter` | string | 是 | - | 处理流程状态: `WAIT_ANALYSIS` |
| `keyword` | string | 否 | "" | 搜索关键词 |
| `category` | string | 否 | "" | 分类过滤 |
| `language` | string | 否 | "" | 语言过滤 |
| `priority` | string | 否 | "" | 优先级过滤 |
| `sourceId` | string | 否 | "" | 来源 ID 过滤（可用于查特定作者） |
| `userLanguage` | string | 否 | "zh" | 用户语言 |

### curl 示例

```bash
curl -s -X POST https://api.bestblogs.dev/api/admin/article/list \
  -H "Authorization: Bearer $BESTBLOGS_ADMIN_JWT_TOKEN" \
  -H "User-Id: $BESTBLOGS_ADMIN_USER_ID" \
  -H "Content-Type: application/json" \
  -d '{"currentPage":1,"pageSize":100,"type":"TWITTER","flowStatusFilter":"WAIT_ANALYSIS"}'
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
    "pageSize": 100,
    "totalCount": 45,
    "pageCount": 1,
    "dataList": [
      {
        "id": "RAW_12345678",
        "title": "推文文本内容（可能截断）",
        "url": "https://x.com/sama/status/1947640330318156074",
        "description": "推文摘要描述（分析前可能为空）",
        "language": "en_US",
        "languageDesc": "English",
        "sourceId": "SOURCE_abc123",
        "sourceName": "Sam Altman(@sama)",
        "mainDomain": null,
        "mainDomainDesc": null,
        "aiSubCategory": null,
        "category": "Artificial_Intelligence",
        "categoryDesc": "人工智能",
        "priority": "HIGH",
        "priorityDesc": "高",
        "resourceType": "TWITTER",
        "wordCount": 280,
        "authors": ["Sam Altman"],
        "tags": null,
        "totalScore": null,
        "processFlowStatus": "WAIT_ANALYSIS",
        "processFlowStatusDesc": "等待分析",
        "publishDate": "2026-03-13T08:30:00.000+00:00",
        "publishDateStr": "Today"
      }
    ]
  }
}
```

### 响应字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | 推文资源 ID，格式 `RAW_xxx` |
| `title` | string | 推文文本内容（可能截断） |
| `url` | string | 推文原文链接 |
| `description` | string | 摘要描述（分析前可能为空） |
| `language` | string | 语言代码: `zh_CN` / `en_US` |
| `languageDesc` | string | 语言描述 |
| `sourceId` | string | 来源 ID（同一作者共享） |
| `sourceName` | string | 来源名称（作者显示名，如 `Sam Altman(@sama)`） |
| `mainDomain` | string/null | 主领域枚举值（分析前为 null） |
| `aiSubCategory` | string/null | AI 子分类（分析前为 null） |
| `category` | string | 来源分类枚举值 |
| `priority` | string | 优先级: `HIGH` / `MEDIUM` / `LOW` |
| `resourceType` | string | 内容类型: `TWITTER` |
| `wordCount` | int | 推文字数 |
| `authors` | string[] | 作者列表 |
| `tags` | string[]/null | 标签列表（分析前为 null） |
| `totalScore` | int/null | 评分（分析前为 null） |
| `processFlowStatus` | string | 处理流程状态 |
| `publishDate` | string | 发布时间（ISO 8601） |
| `publishDateStr` | string | 发布时间描述 |

### 按作者分组策略

拉取所有待分析推文后，按 `sourceId` 分组：

```
{
  "SOURCE_abc123": {
    "sourceName": "Sam Altman(@sama)",
    "language": "en_US",
    "priority": "HIGH",
    "category": "Artificial_Intelligence",
    "tweets": [
      { "id": "RAW_12345678", "title": "...", "url": "...", ... },
      { "id": "RAW_12345679", "title": "...", "url": "...", ... }
    ]
  },
  "SOURCE_def456": { ... }
}
```

按每组推文数量倒序排列。

---

## 2. 批量保存推文分析结果

### 请求

```
POST /api/admin/article/saveTweetAnalysisResult
```

### 请求体

```json
{
  "sourceId": "SOURCE_abc123",
  "results": [
    {
      "id": "RAW_12345678",
      "title": "推文标题",
      "oneSentenceSummary": "一句话总结",
      "summary": "内容摘要",
      "mainDomain": "Artificial_Intelligence",
      "aiSubCategory": "NEWS",
      "tags": ["标签1", "标签2"],
      "totalScore": 85,
      "remark": "评分依据"
    },
    {
      "id": "RAW_12345679",
      "title": "另一条推文标题",
      "oneSentenceSummary": "一句话总结",
      "summary": "内容摘要",
      "mainDomain": "Artificial_Intelligence",
      "aiSubCategory": "DEV",
      "tags": ["标签1", "标签2"],
      "totalScore": 78,
      "remark": "评分依据"
    }
  ]
}
```

### 请求参数说明

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `sourceId` | string | 是 | 作者来源 ID，如 `SOURCE_abc123` |
| `results` | object[] | 是 | 推文分析结果数组 |

**results 数组中每个对象的字段**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | 是 | 推文资源 ID，如 `RAW_12345678` |
| `title` | string | 是 | 推文标题（简短概括） |
| `oneSentenceSummary` | string | 是 | 一句话核心总结 |
| `summary` | string | 是 | 内容摘要 |
| `mainDomain` | string | 是 | 主领域枚举值（见映射表） |
| `aiSubCategory` | string | 否 | AI 子分类（仅人工智能领域） |
| `tags` | string[] | 是 | 结构化标签，3-7 个 |
| `totalScore` | int | 是 | 综合评分，0-100 整数 |
| `remark` | string | 否 | 评分依据和推荐等级 |

### curl 示例

```bash
curl -s -X POST https://api.bestblogs.dev/api/admin/article/saveTweetAnalysisResult \
  -H "Authorization: Bearer $BESTBLOGS_ADMIN_JWT_TOKEN" \
  -H "User-Id: $BESTBLOGS_ADMIN_USER_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "sourceId": "SOURCE_abc123",
    "results": [
      {
        "id": "RAW_12345678",
        "title": "OpenAI and Oracle Sign 4.5 GW Deal for Stargate",
        "oneSentenceSummary": "OpenAI announces a deal with Oracle for 4.5 GW capacity.",
        "summary": "Major infrastructure partnership for the Stargate project.",
        "mainDomain": "Artificial_Intelligence",
        "aiSubCategory": "NEWS",
        "tags": ["Stargate", "OpenAI", "Oracle"],
        "totalScore": 93,
        "remark": "里程碑级内容"
      }
    ]
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
| `tweetId` | `id` | 直接映射（即推文资源 ID） |
| `title` | `title` | 直接映射 |
| `oneSentenceSummary` | `oneSentenceSummary` | 直接映射 |
| `summary` | `summary` | 直接映射 |
| `domain` | `mainDomain` | 枚举值→API 枚举值（见映射表） |
| `aiSubcategory` | `aiSubCategory` | 直接映射（枚举值相同） |
| `tags` | `tags` | 直接映射 |
| `score` | `totalScore` | 直接映射 |
| `remark` | `remark` | 直接映射 |

### 领域映射表

| 分析输出 domain | API mainDomain |
|----------------|----------------|
| `AI` | `Artificial_Intelligence` |
| `PROGRAMMING` | `Programming_Technology` |
| `PRODUCT` | `Product_Design` |
| `BUSINESS` | `Business_Tech` |

### AI 子分类

`MODELS` / `DEV` / `PRODUCT` / `NEWS` / `OTHERS` — 分析输出与 API 枚举值一致，无需转换。

---

## 错误码

| HTTP 状态 | 错误码 | 说明 | 处理方式 |
|-----------|--------|------|----------|
| 401 | - | 未认证或 Token 过期 | 检查 `BESTBLOGS_ADMIN_JWT_TOKEN` 是否有效 |
| 403 | - | 无权限 | 检查 `BESTBLOGS_ADMIN_USER_ID` 是否正确 |
| 400 | - | 参数错误 | 检查请求参数格式和枚举值 |
| 500 | - | 服务端错误 | 重试一次，仍失败告知用户 |
| **200** | `success: false` | 业务逻辑错误 | 展示 `message` 字段内容 |

**重要**: 始终先检查 `response.success` 再处理 `response.data`。部分错误返回 HTTP 200 但 `success: false` — 不要仅依赖 HTTP 状态码。
