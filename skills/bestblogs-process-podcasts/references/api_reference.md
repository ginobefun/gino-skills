# BestBlogs Process Podcasts API 参考

## 接口地址

`https://api.bestblogs.dev`

## 认证

本 skill 使用两套认证方式：

### Admin API 认证

用于查询播客列表、获取/保存播客内容、保存分析结果和翻译结果。

```bash
-H "Authorization: Bearer $BESTBLOGS_ADMIN_JWT_TOKEN"
-H "User-Id: $BESTBLOGS_ADMIN_USER_ID"
-H "Content-Type: application/json"
```

环境变量:
- `BESTBLOGS_ADMIN_USER_ID`: 管理员用户 ID
- `BESTBLOGS_ADMIN_JWT_TOKEN`: 管理员 JWT Token

### Dify 端点

用于翻译阶段获取分析结果，无需认证头。

---

## 端点列表

| 端点 | 方法 | 认证 | 类型 | 用途 |
|------|------|------|------|------|
| `/api/admin/article/list` | POST | Admin | 读取 | 查询等待分析/翻译的播客列表 |
| `/api/admin/article/podcast/content` | GET | Admin | 读取 | 获取播客转录内容 |
| `/api/admin/article/savePodcastContent` | POST | Admin | 写入 | 保存校正后的播客转录内容 |
| `/api/admin/article/saveAnalysisResult` | POST | Admin | 写入 | 保存结构化分析结果 |
| `/dify/resource/markdown` | GET | 无 | 读取 | 获取分析结果（翻译阶段用） |
| `/api/admin/article/saveTranslateResult` | POST | Admin | 写入 | 保存翻译后的分析结果 |

---

## 1. 查询播客列表

### 请求

```
POST /api/admin/article/list
```

### 请求体

```json
{
  "currentPage": 1,
  "pageSize": 50,
  "type": "PODCAST",
  "flowStatusFilter": "WAIT_ANALYSIS"
}
```

### 请求参数说明

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `currentPage` | int | 是 | 1 | 当前页码 |
| `pageSize` | int | 是 | 50 | 每页条数，最大 200 |
| `type` | string | 是 | - | 内容类型: `PODCAST` |
| `flowStatusFilter` | string | 是 | - | 处理状态: `WAIT_ANALYSIS` / `WAIT_TRANSLATE` |
| `keyword` | string | 否 | "" | 搜索关键词 |
| `language` | string | 否 | "" | 语言过滤 |
| `priority` | string | 否 | "" | 优先级过滤 |
| `sourceId` | string | 否 | "" | 来源 ID 过滤 |
| `startDate` | string | 否 | "" | 开始日期 YYYY-MM-DD |
| `endDate` | string | 否 | "" | 结束日期 YYYY-MM-DD |

### curl 示例

```bash
curl -s -X POST https://api.bestblogs.dev/api/admin/article/list \
  -H "Authorization: Bearer $BESTBLOGS_ADMIN_JWT_TOKEN" \
  -H "User-Id: $BESTBLOGS_ADMIN_USER_ID" \
  -H "Content-Type: application/json" \
  -d '{"currentPage":1,"pageSize":50,"type":"PODCAST","flowStatusFilter":"WAIT_ANALYSIS"}'
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
    "totalCount": 5,
    "pageCount": 1,
    "dataList": [
      {
        "id": "RAW_12345678",
        "title": "播客标题",
        "url": "https://example.com/podcast/episode",
        "description": "播客描述",
        "language": "zh_CN",
        "languageDesc": "中文",
        "sourceId": "SOURCE_abc123",
        "sourceName": "播客来源名称",
        "mainDomain": null,
        "priority": "MEDIUM",
        "resourceType": "PODCAST",
        "authors": ["主持人", "嘉宾"],
        "tags": [],
        "totalScore": null,
        "processFlowStatus": "WAIT_ANALYSIS",
        "publishDate": "2026-03-14T00:00:00.000+00:00",
        "publishDateStr": "Yesterday"
      }
    ]
  }
}
```

### 响应字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | 内容 ID，格式 `RAW_xxx` |
| `title` | string | 播客标题 |
| `url` | string | 播客链接 |
| `description` | string | 播客描述 |
| `language` | string | 语言代码: `zh_CN` / `en_US` |
| `sourceName` | string | 来源名称（节目名） |
| `priority` | string | 优先级: `HIGH` / `MEDIUM` / `LOW` |
| `resourceType` | string | `PODCAST` |
| `authors` | string[] | 作者/主持人列表 |
| `totalScore` | int/null | AI 评分（分析前为 null） |
| `processFlowStatus` | string | 处理状态 |
| `publishDateStr` | string | 发布时间描述 |

---

## 2. 获取播客转录内容

### 请求

```
GET /api/admin/article/podcast/content?id={id}
```

### 请求参数

| 参数 | 类型 | 位置 | 必填 | 说明 |
|------|------|------|------|------|
| `id` | string | query | 是 | 播客 ID，如 `RAW_12345678` |

### curl 示例

```bash
curl -s "https://api.bestblogs.dev/api/admin/article/podcast/content?id=RAW_12345678" \
  -H "Authorization: Bearer $BESTBLOGS_ADMIN_JWT_TOKEN" \
  -H "User-Id: $BESTBLOGS_ADMIN_USER_ID"
```

### 响应格式

```json
{
  "success": true,
  "code": null,
  "message": null,
  "requestId": "Txxxx",
  "data": {
    "id": "RAW_12345678",
    "transcriptionSegments": [
      {"id": 1, "speakerId": "1", "beginTime": 0, "endTime": 5200, "text": "大家好，欢迎来到..."},
      {"id": 2, "speakerId": "2", "beginTime": 5300, "endTime": 12800, "text": "谢谢邀请，很高兴..."}
    ],
    "autoChapters": [
      {"id": 1, "headLine": "开场介绍", "summary": "主持人介绍嘉宾背景...", "beginTime": 0, "endTime": 120000},
      {"id": 2, "headLine": "技术讨论", "summary": "深入讨论 AI Agent...", "beginTime": 120000, "endTime": 600000}
    ],
    "podCastSummary": "本期播客讨论了...",
    "speakerSummaries": [
      {"speakerId": "1", "speakerName": "Speaker 1", "summary": "主持人引导讨论..."},
      {"speakerId": "2", "speakerName": "Speaker 2", "summary": "嘉宾分享了..."}
    ],
    "questionsAnswers": [
      {"question": "AI Agent 的未来发展方向？", "answer": "嘉宾认为..."}
    ],
    "keywords": ["AI Agent", "大模型", "应用开发"],
    "keySentences": [
      {"sentence": "核心观点句子...", "beginTime": 180000, "endTime": 195000}
    ]
  }
}
```

### PodcastContentDetailDTO 字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | 播客资源 ID，同 RawResource ID |
| `transcriptionSegments` | SpeechSegment[] | 转录分段列表 |
| `autoChapters` | AutoChapter[] | 自动章节列表 |
| `podCastSummary` | string | 全文摘要 |
| `speakerSummaries` | SpeakerSummary[] | 发言人总结列表 |
| `questionsAnswers` | QuestionsAnswerPair[] | 问答列表 |
| `keywords` | string[] | 关键词列表 |
| `keySentences` | KeySentence[] | 关键句子列表 |

### 嵌套类型定义

**SpeechSegment**

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | int | 分段序号 |
| `speakerId` | string | 说话人 ID |
| `beginTime` | long | 开始时间（毫秒） |
| `endTime` | long | 结束时间（毫秒） |
| `text` | string | 转录文本 |

**AutoChapter**

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | int | 章节序号 |
| `headLine` | string | 章节标题 |
| `summary` | string | 章节摘要 |
| `beginTime` | long | 开始时间（毫秒） |
| `endTime` | long | 结束时间（毫秒） |

**SpeakerSummary**

| 字段 | 类型 | 说明 |
|------|------|------|
| `speakerId` | string | 说话人 ID |
| `speakerName` | string | 说话人名称 |
| `summary` | string | 发言总结 |

**QuestionsAnswerPair**

| 字段 | 类型 | 说明 |
|------|------|------|
| `question` | string | 问题 |
| `answer` | string | 答案 |

**KeySentence**

| 字段 | 类型 | 说明 |
|------|------|------|
| `sentence` | string | 关键句子 |
| `beginTime` | long | 开始时间（毫秒） |
| `endTime` | long | 结束时间（毫秒） |

---

## 3. 保存播客转录内容（校正后）

### 请求

```
POST /api/admin/article/savePodcastContent?id={id}
```

> **写操作 — 审校有修改时自动执行。**
> **注意**：播客 ID 通过 **query 参数** 传递，不在请求体中。

### 请求体

入参结构同 PodcastContentDetailDTO（见上方字段定义），仅需传入修改过的完整对象。

```json
{
  "transcriptionSegments": [...],
  "autoChapters": [...],
  "podCastSummary": "校正后的全文摘要",
  "speakerSummaries": [...],
  "questionsAnswers": [...],
  "keywords": [...],
  "keySentences": [...]
}
```

### curl 示例

```bash
curl -s -X POST "https://api.bestblogs.dev/api/admin/article/savePodcastContent?id=RAW_12345678" \
  -H "Authorization: Bearer $BESTBLOGS_ADMIN_JWT_TOKEN" \
  -H "User-Id: $BESTBLOGS_ADMIN_USER_ID" \
  -H "Content-Type: application/json" \
  -d @podcast_content.json
```

> **提示**：播客转录内容可能很大，建议将 JSON 保存到临时文件后用 `@file` 方式传入。

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

## 4. 保存分析结果

### 请求

```
POST /api/admin/article/saveAnalysisResult?id={id}
```

> **注意**：播客 ID 通过 **query 参数** 传递，不在请求体中。

### 请求体（ResourceAnalysisResponse）

```json
{
  "title": "可选：仅当原标题含冗余信息时填写清理后版本",
  "oneSentenceSummary": "一句话核心总结（与原文同语言）",
  "summary": "核心内容概要，200-400 字（与原文同语言）",
  "domain": "Artificial_Intelligence",
  "aiSubcategory": "DEV",
  "tags": ["Tag1", "Tag2", "Tag3"],
  "mainPoints": [
    {"point": "主要观点 1（与原文同语言）", "explanation": "观点解释 1（与原文同语言）"}
  ],
  "keyQuotes": ["原文金句 1", "原文金句 2"],
  "score": 85,
  "remark": "中文评分依据和推荐等级"
}
```

### 请求参数说明

| 参数 | 类型 | 位置 | 必填 | 说明 |
|------|------|------|------|------|
| `id` | string | query | 是 | 播客 ID |
| `title` | string | body | 否 | 仅在原标题含冗余信息时填写 |
| `oneSentenceSummary` | string | body | 是 | 一句话核心总结，与原文同语言 |
| `summary` | string | body | 是 | 核心内容概要 200-400 字，与原文同语言 |
| `domain` | string | body | 是 | 一级分类代码 |
| `aiSubcategory` | string | body | 否 | 二级分类代码（核心分类必填，通用分类留空） |
| `tags` | string[] | body | 是 | 标签 3-8 个，与原文同语言 |
| `mainPoints` | object[] | body | 是 | 主要观点 3-5 条 |
| `keyQuotes` | string[] | body | 是 | 代表性金句 3-5 句 |
| `score` | int | body | 是 | 综合评分 0-100 |
| `remark` | string | body | 否 | 评分依据，始终用中文 |

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
curl -s -X POST "https://api.bestblogs.dev/api/admin/article/saveAnalysisResult?id=RAW_12345678" \
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

---

## 5. 获取分析结果（翻译阶段用）

### 请求

```
GET /dify/resource/markdown?id={id}&language={language}
```

> **无需认证头。** `language` 参数影响 `languageName` 和 `destLanguageName` 的显示语言。

### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | 是 | 播客 ID，如 `RAW_12345678` |
| `language` | string | 否 | 用户语言偏好，如 `zh` |

### curl 示例

```bash
curl -s "https://api.bestblogs.dev/dify/resource/markdown?id=RAW_12345678&language=zh"
```

### 响应格式

```json
{
  "success": "true",
  "url": "https://example.com/podcast",
  "sourceName": "来源名称",
  "priority": "MEDIUM",
  "title": "播客标题",
  "languageName": "中文",
  "destLanguageName": "English",
  "analysisResult": "{\"oneSentenceSummary\":\"...\",\"summary\":\"...\",\"tags\":[...],\"mainPoints\":[...],\"keyQuotes\":[...]}"
}
```

> **注意**：`success` 字段为**字符串类型**（`"true"` / `"false"`），非布尔值。`analysisResult` 为 JSON 字符串，需解析后使用。

### analysisResult 解析后结构

```json
{
  "title": "播客标题",
  "oneSentenceSummary": "一句话核心总结",
  "summary": "全文摘要",
  "tags": ["标签1", "标签2"],
  "mainPoints": [
    {"point": "主要观点 1", "explanation": "观点解释 1"}
  ],
  "keyQuotes": ["关键引用 1", "关键引用 2"]
}
```

---

## 6. 保存翻译结果

### 请求

```
POST /api/admin/article/saveTranslateResult?id={id}
```

> **注意**：播客 ID 通过 **query 参数** 传递。只传翻译后的文本字段，**不传** `score`、`remark`、`domain`、`aiSubcategory`。

### 请求体

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

### curl 示例

```bash
curl -s -X POST "https://api.bestblogs.dev/api/admin/article/saveTranslateResult?id=RAW_12345678" \
  -H "Authorization: Bearer $BESTBLOGS_ADMIN_JWT_TOKEN" \
  -H "User-Id: $BESTBLOGS_ADMIN_USER_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Translated Title",
    "oneSentenceSummary": "Translated one-sentence summary",
    "summary": "Translated detailed summary...",
    "tags": ["Tag1", "Tag2"],
    "mainPoints": [
      {"point": "Point 1", "explanation": "Explanation 1"}
    ],
    "keyQuotes": ["Quote 1", "Quote 2"]
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
| 404 | - | 资源不存在 | 检查播客 ID 是否有效 |
| 500 | - | 服务端错误 | 重试一次，仍失败告知用户 |
| **200** | `success: false` | 业务逻辑错误 | 展示 `message` 字段内容 |
| **200** | `success: "false"` | `/dify/resource/markdown` 端点失败 | 内容不可用，跳过该篇 |

**重要**: 始终先检查 `response.success` 再处理 `response.data`。注意 `/dify/resource/markdown` 端点的 `success` 为**字符串类型**，其他 Admin API 端点为**布尔类型**。
