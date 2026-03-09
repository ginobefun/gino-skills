# BestBlogs Content Reviewer API 参考

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
| `/api/admin/article/list` | POST | 读取 | 查询文章/推特列表（支持多种过滤条件） |
| `/api/admin/article/markNotQualified` | POST | 写入 | 标记为非精选并调整评分 |

---

## 1. 查询内容列表

### 请求

```
POST /api/admin/article/list
```

### 请求体

```json
{
  "currentPage": 1,
  "pageSize": 200,
  "keyword": "",
  "category": "",
  "language": "",
  "priority": "",
  "sourceId": "",
  "type": "ARTICLE",
  "qualifiedFilter": "unknown",
  "stickTopFilter": "ALL",
  "timeFilter": "1w",
  "startDate": "",
  "endDate": "",
  "mainDomainFilter": "",
  "aiSubCategoryFilter": "",
  "flowStatusFilter": "",
  "sort": null,
  "sortOrder": null,
  "userLanguage": "zh"
}
```

### 请求参数说明

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `currentPage` | int | 是 | 1 | 当前页码 |
| `pageSize` | int | 是 | 100 | 每页条数，最大 200 |
| `keyword` | string | 否 | "" | 搜索关键词 |
| `category` | string | 否 | "" | 内容分类 |
| `language` | string | 否 | "" | 语言过滤 |
| `priority` | string | 否 | "" | 优先级过滤 |
| `sourceId` | string | 否 | "" | 来源 ID 过滤 |
| `type` | string | 是 | - | 内容类型: `ARTICLE` / `TWITTER` |
| `qualifiedFilter` | string | 是 | - | 精选过滤: `unknown`(待review) / `true`(精选) / `false`(非精选) / `ALL`(全部) |
| `stickTopFilter` | string | 否 | "ALL" | 置顶过滤 |
| `timeFilter` | string | 否 | - | 时间过滤: `1d` / `3d` / `1w` / `1m` / `3m` |
| `startDate` | string | 否 | "" | 开始日期 |
| `endDate` | string | 否 | "" | 结束日期 |
| `mainDomainFilter` | string | 否 | "" | 主领域过滤: `ALL` / `Artificial_Intelligence` / `Programming_Technology` / `Business_Tech` / `Product_Design` |
| `aiSubCategoryFilter` | string | 否 | "" | AI 子分类: `MODELS` / `DEV` / `PRODUCT` / `NEWS` / `OTHERS` |
| `flowStatusFilter` | string | 否 | "" | 处理流程状态过滤 |
| `sort` | string | 否 | null | 排序字段 |
| `sortOrder` | string | 否 | null | 排序方向 |
| `userLanguage` | string | 否 | "zh" | 用户语言 |

### 本 skill 使用的查询场景

#### 场景 1: 待 review 文章

```bash
curl -s -X POST https://api.bestblogs.dev/api/admin/article/list \
  -H "Authorization: Bearer $BESTBLOGS_ADMIN_JWT_TOKEN" \
  -H "User-Id: $BESTBLOGS_ADMIN_USER_ID" \
  -H "Content-Type: application/json" \
  -d '{"currentPage":1,"pageSize":200,"keyword":"","category":"","language":"","priority":"","sourceId":"","type":"ARTICLE","qualifiedFilter":"unknown","stickTopFilter":"ALL","timeFilter":"1w","startDate":"","endDate":"","mainDomainFilter":"","aiSubCategoryFilter":"","flowStatusFilter":"","sort":null,"sortOrder":null,"userLanguage":"zh"}'
```

#### 场景 2: 待 review 推特

```bash
curl -s -X POST https://api.bestblogs.dev/api/admin/article/list \
  -H "Authorization: Bearer $BESTBLOGS_ADMIN_JWT_TOKEN" \
  -H "User-Id: $BESTBLOGS_ADMIN_USER_ID" \
  -H "Content-Type: application/json" \
  -d '{"currentPage":1,"pageSize":200,"keyword":"","category":"","language":"","priority":"","sourceId":"","type":"TWITTER","qualifiedFilter":"unknown","stickTopFilter":"ALL","timeFilter":"1w","startDate":"","endDate":"","mainDomainFilter":"","aiSubCategoryFilter":"","flowStatusFilter":"","sort":null,"sortOrder":null,"userLanguage":"zh"}'
```

#### 场景 3: 过去一个月精选文章（学习偏好）

```bash
curl -s -X POST https://api.bestblogs.dev/api/admin/article/list \
  -H "Authorization: Bearer $BESTBLOGS_ADMIN_JWT_TOKEN" \
  -H "User-Id: $BESTBLOGS_ADMIN_USER_ID" \
  -H "Content-Type: application/json" \
  -d '{"currentPage":1,"pageSize":100,"keyword":"","category":"","language":"","priority":"","sourceId":"","type":"ARTICLE","qualifiedFilter":"true","stickTopFilter":"ALL","timeFilter":"1m","startDate":"","endDate":"","mainDomainFilter":"ALL","aiSubCategoryFilter":"","flowStatusFilter":"","sort":null,"sortOrder":null,"userLanguage":"zh"}'
```

#### 场景 4: 过去三天非精选文章（学习偏好）

```bash
curl -s -X POST https://api.bestblogs.dev/api/admin/article/list \
  -H "Authorization: Bearer $BESTBLOGS_ADMIN_JWT_TOKEN" \
  -H "User-Id: $BESTBLOGS_ADMIN_USER_ID" \
  -H "Content-Type: application/json" \
  -d '{"currentPage":1,"pageSize":100,"keyword":"","category":"","language":"","priority":"","sourceId":"","type":"ARTICLE","qualifiedFilter":"false","stickTopFilter":"ALL","timeFilter":"3d","startDate":"","endDate":"","mainDomainFilter":"ALL","aiSubCategoryFilter":"","flowStatusFilter":"","sort":null,"sortOrder":null,"userLanguage":"zh"}'
```

### 响应格式

```json
{
  "success": true,
  "code": null,
  "message": null,
  "requestId": "T195ebc3063f74230885b760851db5cf2",
  "data": {
    "currentPage": 1,
    "pageSize": 200,
    "totalCount": 34,
    "pageCount": 1,
    "dataList": [
      {
        "id": "RAW_55206902",
        "title": "文章标题",
        "url": "https://example.com/article",
        "enclosureUrl": null,
        "description": "文章摘要描述",
        "cover": "https://example.com/cover.png",
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
        "priorityDesc": "Low Priority",
        "resourceType": "ARTICLE",
        "resourceTypeDesc": "文章",
        "wordCount": 5385,
        "readTime": 22,
        "readCount": 3,
        "authors": ["作者名"],
        "tags": ["Tag1", "Tag2"],
        "processed": true,
        "totalScore": 89,
        "qualified": null,
        "stickTop": null,
        "processFlowStatus": "COMPLETED",
        "processFlowStatusDesc": "已完成",
        "publishDate": "2026-03-08T06:14:00.000+00:00",
        "publishDateStr": "Today",
        "fixedContent": false
      }
    ]
  }
}
```

### 响应字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | 内容 ID，格式 `RAW_xxx` |
| `title` | string | 标题 |
| `url` | string | 原文链接 |
| `description` | string | AI 生成的摘要 |
| `cover` | string | 封面图 URL |
| `language` | string | 语言代码: `zh_CN` / `en_US` |
| `languageDesc` | string | 语言描述 |
| `sourceId` | string | 来源 ID |
| `sourceName` | string | 来源名称 |
| `mainDomain` | string | 主领域枚举值 |
| `mainDomainDesc` | string | 主领域中文描述 |
| `aiSubCategory` | string | AI 子分类: `MODELS` / `DEV` / `PRODUCT` / `NEWS` / `OTHERS` |
| `aiSubCategoryDesc` | string | AI 子分类中文描述 |
| `category` | string | 分类枚举值 |
| `categoryDesc` | string | 分类中文描述 |
| `priority` | string | 优先级: `HIGH` / `MEDIUM` / `LOW` |
| `resourceType` | string | 内容类型: `ARTICLE` / `TWITTER` |
| `wordCount` | int | 字数 |
| `readTime` | int | 预估阅读时间（分钟） |
| `readCount` | int | 阅读次数 |
| `authors` | string[] | 作者列表 |
| `tags` | string[] | 标签列表 |
| `processed` | boolean | 是否已处理 |
| `totalScore` | int | AI 评分（0-100） |
| `qualified` | boolean/null | 精选状态: `null`=待 review, `true`=精选, `false`=非精选 |
| `stickTop` | boolean/null | 置顶状态 |
| `processFlowStatus` | string | 处理流程状态: `COMPLETED` / `CANCELLED` 等 |
| `publishDate` | string | 发布时间（ISO 8601） |
| `publishDateStr` | string | 发布时间描述（Today/Yesterday/日期） |
| `fixedContent` | boolean | 是否为固定内容 |

### 主领域枚举值

| 值 | 描述 |
|---|------|
| `Artificial_Intelligence` | 人工智能 |
| `Programming_Technology` | 软件编程 |
| `Business_Tech` | 商业科技 |
| `Product_Design` | 产品设计 |

---

## 2. 标记为非精选

### 请求

```
POST /api/admin/article/markNotQualified?id={id}&adjustScore={adjustScore}
```

### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | 是 | 内容 ID，如 `RAW_55206902` |
| `adjustScore` | int | 是 | **相对**分数调整值。`+3` 表示加 3 分，`-3` 表示减 3 分，`0` 表示不调整分数仅标记 |

### curl 示例

```bash
# 标记为非精选，分数不变
curl -s -X POST "https://api.bestblogs.dev/api/admin/article/markNotQualified?id=RAW_55206902&adjustScore=0" \
  -H "Authorization: Bearer $BESTBLOGS_ADMIN_JWT_TOKEN" \
  -H "User-Id: $BESTBLOGS_ADMIN_USER_ID" \
  -H "Content-Type: application/json"

# 标记为非精选，分数上调 3 分
curl -s -X POST "https://api.bestblogs.dev/api/admin/article/markNotQualified?id=RAW_55206902&adjustScore=3" \
  -H "Authorization: Bearer $BESTBLOGS_ADMIN_JWT_TOKEN" \
  -H "User-Id: $BESTBLOGS_ADMIN_USER_ID" \
  -H "Content-Type: application/json"

# 标记为非精选，分数下调 5 分
curl -s -X POST "https://api.bestblogs.dev/api/admin/article/markNotQualified?id=RAW_55206902&adjustScore=-5" \
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
  "data": 92
}
```

`data` 字段为调整后的新分数（int 类型）。例如原分 89 + `adjustScore=3` → `data: 92`。

### 重要说明

- **写操作**: 必须在用户明确确认后才能调用
- `adjustScore` 是**相对值**，不是绝对分数
- 调用后内容的 `qualified` 状态从 `null`（待 review）变为 `false`（非精选）
- 返回的 `data` 为调整后的实际分数，可用于输出进度时展示
- 每批最多执行 5 个请求
- 单个失败不中断整批，记录错误继续
- 连续 3 次失败暂停执行

### 分页策略

每次查询最多返回 200 条。当 `totalCount` 超过 200 时，只处理第一页（按分数从高到低排序的 Top 200），剩余内容在下次 review 时处理。

---

## 错误码

| HTTP 状态 | 错误码 | 说明 | 处理方式 |
|-----------|--------|------|----------|
| 401 | - | 未认证或 Token 过期 | 检查 `BESTBLOGS_ADMIN_JWT_TOKEN` 是否设置且有效 |
| 403 | - | 无权限 | 检查 `BESTBLOGS_ADMIN_USER_ID` 是否正确 |
| 400 | - | 参数错误 | 检查请求参数格式 |
| 500 | - | 服务端错误 | 重试一次，仍失败告知用户 |
| **200** | `success: false` | 业务逻辑错误 | 展示 `message` 字段内容 |

**重要**: 始终先检查 `response.success` 再处理 `response.data`。部分错误返回 HTTP 200 但 `success: false` — 不要仅依赖 HTTP 状态码。
