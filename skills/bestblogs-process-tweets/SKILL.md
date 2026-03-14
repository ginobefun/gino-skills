---
name: bestblogs-process-tweets
description: "BestBlogs 推文批量深度分析与结构化处理工作流。适用场景：(1) 查询等待分析的推文列表，(2) 按作者分组批量分析推文，(3) 自动评分、分类、提取标签和摘要，(4) 推文内容预处理工作流，(5) 快捷处理全部推文（无需确认），(6) 快捷处理前 N 个作者的推文。触发短语：'处理推文', '推文分析', 'process tweets', '分析推文', 'analyze tweets', '预处理推文', '批量分析推文', 'batch analyze tweets', '推文工作流', 'tweet workflow', 'bestblogs 推文', 'bestblogs tweet', '推文评分', '推文结构化分析', '处理待分析推文', 'process pending tweets', '处理全部推文', 'process all tweets', '处理前 5 个作者', '推特分析', '推特评分', 'twitter analysis'。"
---

# 推文批量深度分析与更新 (Process Tweets)

查询 BestBlogs 中等待分析的推文 → 按作者分组展示 → 用户选择 → 逐作者批量分析并更新到 BestBlogs。

**核心特点**：推文按作者（来源）分组处理，同一作者的所有推文构造为一个 XML 输入，一次性分析生成所有推文的结构化结果。

评分体系基于统一评分规则（`docs/scoring-rubric.md`），推文类型的评估维度和输出格式见 `references/analysis_rubric.md`。完整 API 参数详情见 `references/api_reference.md`。

## 认证

需要以下环境变量：

| 变量 | 用途 | 使用场景 |
|------|------|----------|
| `BESTBLOGS_ADMIN_USER_ID` | 管理员用户 ID | 查询推文列表、保存分析结果 |
| `BESTBLOGS_ADMIN_JWT_TOKEN` | 管理员 JWT Token | 查询推文列表、保存分析结果 |

**Admin API 请求**:
```bash
-H "Authorization: Bearer $BESTBLOGS_ADMIN_JWT_TOKEN"
-H "User-Id: $BESTBLOGS_ADMIN_USER_ID"
-H "Content-Type: application/json"
```

若环境变量未设置，提示用户配置。

接口地址：`https://api.bestblogs.dev`

## 可用端点

| 端点 | 方法 | 类型 | 用途 |
|------|------|------|------|
| `/api/admin/article/list` | POST | 读取 | 查询等待分析的推文列表 |
| `/api/admin/article/saveTweetAnalysisResult` | POST | 写入 | 批量保存推文分析结果（按作者） |

## 工作流概览（4 个阶段）

```
阶段一（查询推文列表）→ 阶段二（按作者分组，用户选择 / 快捷跳过）→ 阶段三（逐作者处理）→ 阶段四（输出结果）
```

- [ ] 阶段一：查询等待分析的推文列表
- [ ] 阶段二：按作者分组展示，用户选择 ⚠️ REQUIRED（快捷模式跳过）
- [ ] 阶段三：逐作者处理（构造 XML → 批量分析 → 保存结果）
- [ ] 阶段四：输出最终结果

### 快捷模式

当用户在触发 skill 时**已明确指定处理范围**，跳过阶段二的确认，直接进入阶段三：

| 用户输入 | 行为 |
|----------|------|
| "处理全部推文" / "process all tweets" | 查询后直接处理**全部**作者的推文 |
| "处理前 N 个作者" / "处理前 5 个" | 查询后按推文数量倒序取**前 N 个作者**处理 |

快捷模式下仍然输出作者列表摘要（总作者数、总推文数），但**不等待用户选择**，立即开始处理。若查询结果为空，正常提示"暂无等待分析的推文"并结束。

---

## 阶段一：查询等待分析的推文

```bash
curl -s -X POST https://api.bestblogs.dev/api/admin/article/list \
  -H "Authorization: Bearer $BESTBLOGS_ADMIN_JWT_TOKEN" \
  -H "User-Id: $BESTBLOGS_ADMIN_USER_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPage": 1,
    "pageSize": 100,
    "type": "TWITTER",
    "flowStatusFilter": "WAIT_ANALYSIS"
  }'
```

若 `totalCount > 100`，自动翻页拉取全部（每页 100，最多 500 条）。

**始终检查 `success` 字段。** 若列表为空，提示"暂无等待分析的推文"并结束。

### 按作者分组

拉取完成后，按 `sourceId` 字段分组：

1. 同一 `sourceId` 的推文归为一组
2. 记录每组的 `sourceName`（作者显示名）和推文数量
3. 按推文数量倒序排列（推文多的作者优先）

---

## 阶段二：用户选择

展示按作者分组的推文列表：

```markdown
## 等待分析的推文（共 N 条，M 个作者）

| # | 作者 | 来源 ID | 推文数 | 优先级 | 语言 |
|---|------|---------|--------|--------|------|
| 1 | Sam Altman(@sama) | SOURCE_xxx | 12 | HIGH | en_US |
| 2 | 宝玉(@dotey) | SOURCE_yyy | 8 | HIGH | zh_CN |
| 3 | Andrej Karpathy(@karpathy) | SOURCE_zzz | 5 | MEDIUM | en_US |

请选择要处理的作者：
- "全部" — 处理所有作者的推文
- "1, 3" — 处理指定编号的作者
```

等待用户选择后继续。

---

## 阶段三：逐作者处理

**按作者串行处理。** 每个作者必须完成以下 3 步后，再处理下一个作者：

```
步骤 A: 构造 XML 输入 → 步骤 B: 批量分析 → 步骤 C: 保存结果
```

### ID-内容关联安全

1. 处理每个作者时，锁定当前作者的 `sourceId` 和所有推文的 `{id}` 列表
2. 分析结果中的 `tweetId` 必须与输入推文的 `id` 一一对应
3. **禁止**将一个作者的分析结果保存到另一个作者的推文上
4. **禁止**并行处理多个作者
5. 保存前**校验**返回的 `tweetId` 列表是否与输入完全匹配

### 步骤 A: 构造 XML 输入

从阶段一的列表数据中提取元信息，构造符合分析系统的 XML 输入格式：

```xml
<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<TwitterAnalysis>
  <ResourceSource>
    <name>作者显示名（来自 sourceName）</name>
    <author>作者名（来自 authors[0]，若空则用 sourceName）</author>
    <description>来源描述（若有）</description>
    <language>来源语言（来自 language，如 en_US）</language>
    <priority>优先级（来自 priority）</priority>
    <category>分类（来自 category）</category>
    <subCategory>子分类（来自 aiSubCategory，若空则留空）</subCategory>
  </ResourceSource>
  <Tweets>
    <Tweet>
      <id>推文 ID（来自列表中的 id，如 RAW_xxx）</id>
      <url>原文链接（来自 url）</url>
      <text>推文文本内容（来自 title 或 description）</text>
      <language>推文语言（来自 language 的短格式，如 en / zh）</language>
      <AnalysisResult/>
      <Engagement>
        <retweetCount>转发数</retweetCount>
        <replyCount>回复数</replyCount>
        <likeCount>点赞数</likeCount>
        <quoteCount>引用数</quoteCount>
        <bookmarkCount>收藏数</bookmarkCount>
        <viewCount>浏览数</viewCount>
        <influenceScore>影响力分数</influenceScore>
      </Engagement>
      <!-- 若为回复推文，包含 ReplyInfo -->
      <!-- 若有媒体，包含 MediaList -->
    </Tweet>
    <!-- 同一作者的更多推文... -->
  </Tweets>
</TwitterAnalysis>
```

> **注意**：互动数据（Engagement）从列表接口返回的字段中提取。若列表接口未返回互动数据，则省略 `<Engagement>` 节点。

### 步骤 B: 批量分析

将构造好的 XML 作为分析输入，按照 `references/analysis_rubric.md` 中的评分体系对**每条推文独立分析**。

**分析要求**:

1. 每条推文独立评估，生成独立的 JSON 对象
2. 若推文有引用/回复关系，分析时参考上下文但仍独立评分
3. 输出语言与推文 `<language>` 字段一致（`en` → 英文输出，`zh` → 中文输出）
4. `remark` 字段始终使用中文输出
5. 考虑来源优先级（XML 中的 `<priority>` 字段）和原创性对评分的影响
6. **评分校正**：≥95/≥90/≥85 分别执行对应的自检清单
7. **写作风格**：术语不加括号注释、减少引号破折号、中文引号用「」、适度使用 Markdown，详见 `references/analysis_rubric.md`

> 完整评分标准、分布指导、减分项、分类体系均在 `references/analysis_rubric.md` 中，分析时**必须加载并遵循**。

**分析输出 JSON 数组**:

```json
[
  {
    "tweetId": "RAW_xxx",
    "title": "推文标题（简短概括，遵循原文语言）",
    "oneSentenceSummary": "一句话总结（遵循原文语言）",
    "summary": "内容摘要（遵循原文语言）",
    "domain": "PROGRAMMING / AI / PRODUCT / BUSINESS",
    "aiSubcategory": "MODELS / DEV / PRODUCT / NEWS / OTHERS",
    "tags": ["标签数组（遵循原文语言）"],
    "score": 85,
    "remark": "评分依据（始终中文）"
  }
]
```

### 步骤 C: 保存分析结果

将分析结果按作者批量保存。

**领域映射**（分析输出 → API 枚举值）:

| 分析输出 domain | API mainDomain |
|----------------|----------------|
| `AI` | `Artificial_Intelligence` |
| `PROGRAMMING` | `Programming_Technology` |
| `PRODUCT` | `Product_Design` |
| `BUSINESS` | `Business_Tech` |

**AI 子分类**：`MODELS` / `DEV` / `PRODUCT` / `NEWS` / `OTHERS` 直接映射，无需转换。

```bash
curl -s -X POST https://api.bestblogs.dev/api/admin/article/saveTweetAnalysisResult \
  -H "Authorization: Bearer $BESTBLOGS_ADMIN_JWT_TOKEN" \
  -H "User-Id: $BESTBLOGS_ADMIN_USER_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "sourceId": "SOURCE_xxx",
    "results": [
      {
        "id": "RAW_xxx",
        "title": "推文标题",
        "oneSentenceSummary": "一句话总结",
        "summary": "内容摘要",
        "mainDomain": "Artificial_Intelligence",
        "aiSubCategory": "NEWS",
        "tags": ["标签1", "标签2"],
        "totalScore": 85,
        "remark": "评分依据"
      }
    ]
  }'
```

> **重要**：步骤 B（分析）和步骤 C（保存）**必须分开执行**。先确保分析结果完整、JSON 合法、tweetId 匹配，再调用保存 API。

### 输出进度

每处理完一个作者，更新进度：

```markdown
- [1/3] ✅ Sam Altman(@sama) — 12 条推文，已分析并保存（均分 82.5）
- [2/3] 🔄 宝玉(@dotey) — 8 条推文，分析中...
- [3/3] ⏳ Andrej Karpathy(@karpathy) — 5 条推文
```

单个作者处理中若某条推文分析失败，记录错误并继续处理该作者的其他推文。若保存 API 失败，输出分析 JSON 供手动重试。

---

## 阶段四：输出最终结果

```markdown
## 处理结果

### 按作者汇总

| # | 作者 | 推文数 | 成功 | 失败 | 均分 | 分数范围 |
|---|------|--------|------|------|------|----------|
| 1 | Sam Altman(@sama) | 12 | 12 | 0 | 82.5 | 68-93 |
| 2 | 宝玉(@dotey) | 8 | 8 | 0 | 79.3 | 65-88 |
| 3 | Andrej Karpathy(@karpathy) | 5 | 4 | 1 | 84.0 | 78-91 |

### 统计
- 总作者数：3
- 总推文数：25
- 成功：24
- 失败：1

### 评分分布
- 90+ 分：2 条（8%）
- 80-89 分：10 条（40%）
- 60-79 分：11 条（44%）
- <60 分：1 条（4%）

### 高分推文 Top 5
| # | 作者 | 标题 | 评分 | 领域 |
|---|------|------|------|------|
| 1 | Sam Altman | OpenAI and Oracle Sign 4.5 GW Deal... | 93 | AI |
| 2 | Karpathy | New approach to training efficiency... | 91 | AI |
```

---

## 错误处理

| 错误 | 原因 | 处理 |
|------|------|------|
| `success: false` | API 返回错误 | 读取 `code` 和 `message`，告知用户 |
| `401` / `403` | Token 过期或无权限 | 立即暂停，提示用户更新认证信息 |
| 推文列表为空 | 无待分析推文 | 提示"暂无等待分析的推文"并结束 |
| 推文文本为空 | 列表中推文内容缺失 | 记录该推文为失败，继续处理其他推文 |
| 分析 JSON 格式错误 | 分析输出不符合预期 | 重试分析一次，仍失败则跳过该作者 |
| tweetId 不匹配 | 分析结果中的 ID 与输入不一致 | 校验失败，不保存，报告给用户 |
| saveTweetAnalysisResult 失败 | 参数错误或服务端异常 | 记录失败，输出分析 JSON 供手动重试 |
| 环境变量未设置 | 缺少认证信息 | 提示配置 `BESTBLOGS_ADMIN_USER_ID` 和 `BESTBLOGS_ADMIN_JWT_TOKEN` |
