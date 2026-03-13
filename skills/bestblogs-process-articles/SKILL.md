---
name: bestblogs-process-articles
description: "BestBlogs 文章批量深度分析与结构化处理工作流。适用场景：(1) 查询等待分析的文章列表，(2) 批量分析文章并生成结构化评分，(3) 自动评分、分类、提取观点和金句，(4) 文章内容预处理工作流，(5) 快捷处理全部文章（无需确认），(6) 快捷处理前 N 篇文章。触发短语：'处理文章', '文章分析', 'process articles', '分析并更新', 'analyze and update', '预处理文章', '批量分析', 'batch analyze', '文章工作流', 'article workflow', 'bestblogs 文章', 'bestblogs article', '等待分析', 'wait analysis', '文章评分', '结构化分析', 'structured analysis', '处理待分析文章', 'process pending articles', '处理全部文章', 'process all articles', '处理前 10 篇文章', '处理前 5 篇'。"
---

# 文章批量深度分析与更新 (Process Articles)

查询 BestBlogs 中等待分析的文章 → 用户选择 → 逐篇获取正文、深度分析并更新到 BestBlogs。

完整评分体系和分析标准见 `references/analysis_rubric.md`。完整 API 参数详情见 `references/api_reference.md`。

## 认证

需要以下环境变量：

| 变量 | 用途 | 使用场景 |
|------|------|----------|
| `BESTBLOGS_ADMIN_USER_ID` | 管理员用户 ID | 查询文章列表、保存分析结果 |
| `BESTBLOGS_ADMIN_JWT_TOKEN` | 管理员 JWT Token | 查询文章列表、保存分析结果 |
| `BESTBLOGS_API_KEY` | OpenAPI 密钥 | 获取文章 Markdown 正文 |

**Admin API 请求**:
```bash
-H "Authorization: Bearer $BESTBLOGS_ADMIN_JWT_TOKEN"
-H "User-Id: $BESTBLOGS_ADMIN_USER_ID"
-H "Content-Type: application/json"
```

**OpenAPI 请求**:
```bash
-H "X-API-KEY: $BESTBLOGS_API_KEY"
```

若环境变量未设置，提示用户配置。

接口地址：`https://api.bestblogs.dev`

## 可用端点

| 端点 | 方法 | 类型 | 用途 |
|------|------|------|------|
| `/api/admin/article/list` | POST | 读取 | 查询等待分析的文章列表 |
| `/openapi/v1/resource/markdown` | GET | 读取 | 获取文章 Markdown 正文 |
| `/api/admin/article/saveAnalysisResult` | POST | 写入 | 保存分析结果（评分、摘要、标签等） |

## 工作流概览（4 个阶段）

```
阶段一（查询文章列表）→ 阶段二（用户选择 / 快捷跳过）→ 阶段三（逐篇处理）→ 阶段四（输出结果）
```

- [ ] 阶段一：查询等待分析的文章列表
- [ ] 阶段二：展示列表，用户选择 ⚠️ REQUIRED（快捷模式跳过）
- [ ] 阶段三：逐篇处理（获取正文 → 深度分析 → 保存结果）
- [ ] 阶段四：输出最终结果

### 快捷模式

当用户在触发 skill 时**已明确指定处理范围**，跳过阶段二的确认，直接进入阶段三：

| 用户输入 | 行为 |
|----------|------|
| "处理全部文章" / "process all articles" | 查询后直接处理**全部**文章 |
| "处理前 N 篇文章" / "处理前 10 篇" | 查询后按列表顺序取**前 N 篇**处理 |

快捷模式下仍然输出文章列表摘要（总数、优先级分布），但**不等待用户选择**，立即开始处理。若查询结果为空，正常提示"暂无等待分析的文章"并结束。

---

## 阶段一：查询等待分析的文章

```bash
curl -s -X POST https://api.bestblogs.dev/api/admin/article/list \
  -H "Authorization: Bearer $BESTBLOGS_ADMIN_JWT_TOKEN" \
  -H "User-Id: $BESTBLOGS_ADMIN_USER_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPage": 1,
    "pageSize": 50,
    "type": "ARTICLE",
    "flowStatusFilter": "WAIT_ANALYSIS"
  }'
```

若 `totalCount > 50`，自动翻页拉取全部（每页 50，最多 200 篇）。

**始终检查 `success` 字段。** 若列表为空，提示"暂无等待分析的文章"并结束。

---

## 阶段二：用户选择

展示文章列表：

```markdown
## 等待分析的文章（共 N 篇）

| # | ID | 标题 | 来源 | 优先级 | 语言 | 发布日期 |
|---|-----|------|------|--------|------|---------|
| 1 | RAW_xxx | 文章标题 1 | 来源 A | HIGH | 中文 | 2026-03-13 |
| 2 | RAW_yyy | 文章标题 2 | 来源 B | MEDIUM | English | 2026-03-12 |

请选择要处理的文章：
- "全部" — 处理所有文章
- "1, 3, 5" — 处理指定编号的文章
```

等待用户选择后继续。

---

## 阶段三：逐篇处理

**严格串行处理。** 每篇文章必须完成以下 3 步后，再处理下一篇：

```
步骤 A: 获取正文 → 步骤 B: 深度分析 → 步骤 C: 保存结果
```

### ID-内容关联安全

1. 处理每篇文章时，锁定当前 `{id}` 和内容的对应关系
2. `saveAnalysisResult` 必须使用与获取正文相同的 `{id}`
3. **禁止**将一篇文章的分析结果保存到另一篇文章的 ID 上
4. **禁止**并行处理多篇文章

### 步骤 A: 获取文章正文

```bash
curl -s "https://api.bestblogs.dev/openapi/v1/resource/markdown?id=RAW_xxx" \
  -H "X-API-KEY: $BESTBLOGS_API_KEY"
```

响应 `data` 字段为 Markdown 字符串。若返回 `null`，记录该文章正文不可用，跳过。

### 步骤 B: 深度分析

使用文章元数据（来自阶段一列表）和正文（步骤 A）构造分析输入，按照 `references/analysis_rubric.md` 中的评分体系进行深度分析。

**构造分析输入 XML**:

```xml
<article>
  <metadata>
    <title>文章标题（来自列表的 title 字段）</title>
    <source>来源名称（来自列表的 sourceName 字段）</source>
    <url>原文链接（来自列表的 url 字段）</url>
  </metadata>
  <content>
    <![CDATA[
    Markdown 正文内容（来自步骤 A）
    ]]>
  </content>
</article>
```

**分析要求**:

1. 仔细阅读全文，理解核心论述和技术细节
2. 按照评分体系的 4 个维度打分：内容深度(40)、相关性(30)、实用性(20)、创新性(10)
3. 检查是否适用减分项
4. 生成结构化 JSON 结果
5. **评分校正**：初评 ≥90 分时，确认是否同时满足原创洞察突出、实用价值极高、有明显创新，否则下调 3-5 分

> 完整评分标准、分布指导、减分项、领域分类、示例均在 `references/analysis_rubric.md` 中，分析时**必须加载并遵循**。

**分析输出 JSON**:

```json
{
  "oneSentenceSummary": "一句话核心总结（100 字内）",
  "summary": "核心内容概要（200-400 字）",
  "domain": "所属领域（软件编程/人工智能/产品设计/商业科技）",
  "aiSubcategory": "AI 子领域（仅当领域为人工智能时：AI 模型/AI 开发/AI 产品/AI 资讯/其他）",
  "tags": ["结构化标签（3-8 个）"],
  "mainPoints": [{"point": "主要观点", "explanation": "观点解释"}],
  "keyQuotes": ["代表性金句，3-5 句"],
  "score": 85,
  "remark": "评分依据、分析和推荐等级"
}
```

### 步骤 C: 保存分析结果

将分析 JSON 中的字段映射为 API 参数后保存。

**领域映射**（中文 → API 枚举值）:

| 分析输出 domain | API mainDomain |
|----------------|----------------|
| 人工智能 | `Artificial_Intelligence` |
| 软件编程 | `Programming_Technology` |
| 产品设计 | `Product_Design` |
| 商业科技 | `Business_Tech` |

**AI 子分类映射**（仅 domain 为人工智能时）:

| 分析输出 aiSubcategory | API aiSubCategory |
|------------------------|-------------------|
| AI 模型 | `MODELS` |
| AI 开发 | `DEV` |
| AI 产品 | `PRODUCT` |
| AI 资讯 | `NEWS` |
| 其他 | `OTHERS` |

```bash
curl -s -X POST https://api.bestblogs.dev/api/admin/article/saveAnalysisResult \
  -H "Authorization: Bearer $BESTBLOGS_ADMIN_JWT_TOKEN" \
  -H "User-Id: $BESTBLOGS_ADMIN_USER_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "RAW_xxx",
    "oneSentenceSummary": "一句话总结",
    "summary": "核心内容概要",
    "mainDomain": "Artificial_Intelligence",
    "aiSubCategory": "DEV",
    "tags": ["标签1", "标签2"],
    "mainPoints": [{"point": "观点", "explanation": "解释"}],
    "keyQuotes": ["金句1", "金句2"],
    "totalScore": 85,
    "remark": "评分依据和推荐等级"
  }'
```

> **重要**：步骤 B（分析）和步骤 C（保存）**必须作为独立步骤分开执行**。先确保分析结果完整、JSON 合法，再调用保存 API。

### 输出进度

每处理完一篇文章，更新进度：

```markdown
- [1/5] ✅ RAW_xxx — 文章标题 1 (85 分，已保存)
- [2/5] 🔄 RAW_yyy — 文章标题 2 分析中...
- [3/5] ⏳ RAW_zzz — 文章标题 3
```

单篇文章任一步骤失败时，记录错误并继续处理下一篇。

---

## 阶段四：输出最终结果

```markdown
## 处理结果

| # | ID | 标题 | 来源 | 评分 | 领域 | 获取正文 | 分析 | 保存 |
|---|-----|------|------|------|------|----------|------|------|
| 1 | RAW_xxx | 标题 1 | 来源 A | 85 | 人工智能 | ✅ | ✅ | ✅ |
| 2 | RAW_yyy | 标题 2 | 来源 B | 78 | 软件编程 | ✅ | ✅ | ✅ |
| 3 | RAW_zzz | 标题 3 | 来源 C | - | - | ❌ 正文不可用 | - | - |

### 统计
- 成功：2
- 失败：1

### 评分分布
- 90+ 分：0 篇
- 80-89 分：1 篇
- 70-79 分：1 篇
- <70 分：0 篇
```

---

## 错误处理

| 错误 | 原因 | 处理 |
|------|------|------|
| `success: false` | API 返回错误 | 读取 `code` 和 `message`，告知用户 |
| `401` / `403` | Token 过期或无权限 | 立即暂停，提示用户更新认证信息 |
| markdown 返回 `null` | 文章正文尚未抓取或不可用 | 记录失败，跳过该文章，继续下一篇 |
| 分析 JSON 格式错误 | 分析输出不符合预期格式 | 重试分析一次，仍失败则跳过 |
| saveAnalysisResult 失败 | 参数错误或服务端异常 | 记录失败，输出分析 JSON 供手动重试 |
| 环境变量未设置 | 缺少认证信息 | 提示配置 `BESTBLOGS_ADMIN_USER_ID`、`BESTBLOGS_ADMIN_JWT_TOKEN`、`BESTBLOGS_API_KEY` |
