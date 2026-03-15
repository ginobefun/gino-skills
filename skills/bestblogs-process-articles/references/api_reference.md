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
| `/api/admin/article/runPrepareFlow` | POST | Admin | 写入 | 触发文章预处理（空正文兜底） |
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

### 一级分类枚举值（domain）

| 值 | 描述 | 类型 |
|---|------|------|
| `Artificial_Intelligence` | 人工智能 | 核心 |
| `Programming_Technology` | 软件编程 | 核心 |
| `Product_Development` | 产品设计 | 核心 |
| `Business_Tech` | 商业科技 | 核心 |
| `Productivity_Growth` | 个人成长 | 核心 |
| `Finance_Economy` | 投资财经 | 通用 |
| `News_Media` | 媒体资讯 | 通用 |
| `Lifestyle_Culture` | 生活文化 | 通用 |

### 二级分类枚举值（subCategory）

| 一级 | 值 | 描述 |
|------|---|------|
| AI | `MODELS` | AI 模型与研究 |
| AI | `AI_CODING` | AI 编程 |
| AI | `DEV` | AI 应用开发 |
| AI | `PRODUCT` | AI 产品与工具 |
| AI | `NEWS` | AI 行业动态 |
| SE | `SE_FRONTEND` | 前端开发 |
| SE | `SE_BACKEND` | 后端与架构 |
| SE | `SE_DEVOPS` | DevOps 与云 |
| SE | `SE_TOOLS` | 开源与工具 |
| SE | `SE_PRACTICE` | 工程实践 |
| PD | `PD_PM` | 产品管理 |
| PD | `PD_DESIGN` | UX/UI 设计 |
| PD | `PD_CREATIVE` | 创意与视觉 |
| BT | `BT_STARTUP` | 创业与投资 |
| BT | `BT_NEWS` | 科技资讯 |
| BT | `BT_INSIGHT` | 商业洞察 |
| BT | `BT_PEOPLE` | 人物与访谈 |
| PG | `PG_TOOLS` | 效率工具 |
| PG | `PG_CAREER` | 职业发展 |
| PG | `PG_LEARNING` | 思维与学习 |

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

当 markdown 返回 `null` 或空字符串时，建议立即调用 `runPrepareFlow` 并重试 markdown 1-3 次（每次间隔 2-3 秒）。

---

## 3. 触发预处理流程（空正文兜底）

### 请求

```
POST /api/admin/article/runPrepareFlow?id={id}
```

> **注意**：文章 ID 通过 **query 参数** 传递，不在请求体中。

### 请求参数

| 参数 | 类型 | 位置 | 必填 | 说明 |
|------|------|------|------|------|
| `id` | string | query | 是 | 文章 ID，如 `RAW_55206902` |

### curl 示例

```bash
curl -s -X POST "https://api.bestblogs.dev/api/admin/article/runPrepareFlow?id=RAW_55206902" \
  -H "Authorization: Bearer $BESTBLOGS_ADMIN_JWT_TOKEN" \
  -H "User-Id: $BESTBLOGS_ADMIN_USER_ID" \
  -H "Content-Type: application/json"
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

`data=true` 表示预处理任务触发成功。建议随后重试 `/openapi/v1/resource/markdown` 获取正文。

---

## 4. 保存分析结果

### 请求

```
POST /api/admin/article/saveAnalysisResult?id={id}
```

> **注意**：文章 ID 通过 **query 参数** 传递，不在请求体中。

### 请求体（ResourceAnalysisResponse）

```json
{
  "title": "可选：仅当原标题含网站名称等冗余时填写清理后版本",
  "oneSentenceSummary": "一句话核心总结（与原文同语言）",
  "summary": "核心内容概要，200-400 字（与原文同语言）",
  "domain": "Artificial_Intelligence",
  "aiSubcategory": "DEV",
  "tags": ["Tag1", "Tag2", "Tag3"],
  "mainPoints": [
    {"point": "主要观点 1（与原文同语言）", "explanation": "观点解释 1（与原文同语言）"},
    {"point": "主要观点 2（与原文同语言）", "explanation": "观点解释 2（与原文同语言）"},
    {"point": "主要观点 3（与原文同语言）", "explanation": "观点解释 3（与原文同语言）"}
  ],
  "keyQuotes": ["原文金句 1", "原文金句 2", "原文金句 3"],
  "score": 85,
  "remark": "中文评分依据和推荐等级"
}
```

> **说明**：`content` 字段（正文 Markdown）仅在翻译阶段使用，分析阶段**无需传入**。

### 请求参数说明

| 参数 | 类型 | 位置 | 必填 | 说明 |
|------|------|------|------|------|
| `id` | string | query | 是 | 文章 ID，如 `RAW_55206902` |
| `title` | string | body | 否 | 仅在原标题含网站名等冗余信息时填写清理后版本，否则省略 |
| `oneSentenceSummary` | string | body | 是 | 一句话核心总结，与原文同语言 |
| `summary` | string | body | 是 | 核心内容概要 200-400 字，与原文同语言 |
| `content` | string | body | 否 | 正文 Markdown，**分析阶段不传**，仅翻译阶段使用 |
| `domain` | string | body | 是 | 一级分类代码（见下方枚举表） |
| `aiSubcategory` | string | body | 否 | 二级分类代码（核心分类必填，通用分类留空） |
| `tags` | string[] | body | 是 | 结构化标签 3-8 个，与原文同语言 |
| `mainPoints` | object[] | body | 是 | 主要观点 3-5 条，每项含 `point` 和 `explanation`，与原文同语言 |
| `keyQuotes` | string[] | body | 是 | 代表性金句 3-5 句，必须逐字引用原文 |
| `score` | int | body | 是 | 综合评分，0-100 整数 |
| `remark` | string | body | 否 | 评分依据和推荐等级，**始终用中文** |

### 一级分类枚举值（domain）

| 领域 | 枚举值 | 类型 |
|------|--------|------|
| 人工智能 | `Artificial_Intelligence` | 核心 |
| 软件编程 | `Programming_Technology` | 核心 |
| 产品设计 | `Product_Development` | 核心 |
| 商业科技 | `Business_Tech` | 核心 |
| 个人成长 | `Productivity_Growth` | 核心 |
| 投资财经 | `Finance_Economy` | 通用 |
| 媒体资讯 | `News_Media` | 通用 |
| 生活文化 | `Lifestyle_Culture` | 通用 |

### 二级分类枚举值（subCategory）

| 一级分类 | 二级分类 | 枚举值 |
|---------|---------|--------|
| 人工智能 | AI 模型与研究 | `MODELS` |
| 人工智能 | AI 编程 | `AI_CODING` |
| 人工智能 | AI 应用开发 | `DEV` |
| 人工智能 | AI 产品与工具 | `PRODUCT` |
| 人工智能 | AI 行业动态 | `NEWS` |
| 软件编程 | 前端开发 | `SE_FRONTEND` |
| 软件编程 | 后端与架构 | `SE_BACKEND` |
| 软件编程 | DevOps 与云 | `SE_DEVOPS` |
| 软件编程 | 开源与工具 | `SE_TOOLS` |
| 软件编程 | 工程实践 | `SE_PRACTICE` |
| 产品设计 | 产品管理 | `PD_PM` |
| 产品设计 | UX/UI 设计 | `PD_DESIGN` |
| 产品设计 | 创意与视觉 | `PD_CREATIVE` |
| 商业科技 | 创业与投资 | `BT_STARTUP` |
| 商业科技 | 科技资讯 | `BT_NEWS` |
| 商业科技 | 商业洞察 | `BT_INSIGHT` |
| 商业科技 | 人物与访谈 | `BT_PEOPLE` |
| 个人成长 | 效率工具 | `PG_TOOLS` |
| 个人成长 | 职业发展 | `PG_CAREER` |
| 个人成长 | 思维与学习 | `PG_LEARNING` |

### curl 示例

```bash
curl -s -X POST "https://api.bestblogs.dev/api/admin/article/saveAnalysisResult?id=RAW_55206902" \
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
      {"point": "观点2", "explanation": "解释2"},
      {"point": "观点3", "explanation": "解释3"}
    ],
    "keyQuotes": ["金句1", "金句2", "金句3"],
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

`data` 为 `true` 表示保存成功。

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

对于 `runPrepareFlow`，若返回 `success: true, data: true`，表示预处理已触发；并不保证 markdown 会立即可用，需重试读取正文。

**重要**: 始终先检查 `response.success` 再处理 `response.data`。部分错误返回 HTTP 200 但 `success: false` — 不要仅依赖 HTTP 状态码。
