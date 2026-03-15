---
name: bestblogs-process-podcasts
description: "BestBlogs 播客内容审校、分析与翻译工作流。适用场景：(1) 查询等待分析的播客列表，(2) 审校播客转录内容（人名、术语、准确性），(3) 批量分析播客并评分，(4) 自动翻译高分播客分析结果（≥80 分），(5) 快捷处理全部播客（无需确认），(6) 快捷处理前 N 个播客，(7) 翻译待翻译播客的分析结果。触发短语：'处理播客', '播客分析', 'process podcasts', '播客审校', 'review podcasts', '分析播客', 'analyze podcasts', '播客工作流', 'podcast workflow', 'bestblogs 播客', 'bestblogs podcast', '审校播客', '校正播客', 'correct podcast', '播客翻译', 'translate podcast', '播客评分', 'score podcast', '处理全部播客', 'process all podcasts', '处理前 10 个播客', '处理前 5 个', '翻译播客结果', '翻译全部播客', 'translate all podcasts'。"
---

# 播客内容审校、分析与翻译 (Process Podcasts)

查询 BestBlogs 中等待分析的播客 → 用户选择 → 逐个审校转录内容 → 深度分析并评分 → **≥80 分自动翻译** → 更新翻译结果。若无待分析播客，自动查询待翻译播客并处理。

评分体系基于统一评分规则（`docs/scoring-rubric.md`），播客类型的评估维度和输出格式见 `references/analysis_rubric.md`。完整 API 参数详情见 `references/api_reference.md`。

## 认证

需要以下环境变量：

| 变量 | 用途 | 使用场景 |
|------|------|----------|
| `BESTBLOGS_ADMIN_USER_ID` | 管理员用户 ID | 所有 Admin API 请求 |
| `BESTBLOGS_ADMIN_JWT_TOKEN` | 管理员 JWT Token | 所有 Admin API 请求 |

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
| `/api/admin/article/list` | POST | 读取 | 查询等待分析/翻译的播客列表 |
| `/api/admin/article/podcast/content` | GET | 读取 | 获取播客转录内容 |
| `/api/admin/article/savePodcastContent` | POST | 写入 | 保存校正后的播客转录内容 |
| `/api/admin/article/saveAnalysisResult` | POST | 写入 | 保存结构化分析结果 |
| `/dify/resource/markdown` | GET | 读取 | 获取分析结果（翻译阶段用） |
| `/api/admin/article/saveTranslateResult` | POST | 写入 | 保存翻译后的分析结果 |

## 工作流概览（6 个阶段）

```
阶段一（查询列表）→ 阶段二（用户选择）→ 阶段三（逐个审校）→ 阶段四（逐个分析）→ 阶段五（翻译高分播客）→ 阶段六（输出结果）
```

- [ ] 阶段一：查询等待分析的播客列表（无则查询待翻译）
- [ ] 阶段二：展示列表，用户选择 ⚠️ REQUIRED（快捷模式跳过）
- [ ] 阶段三：逐个审校转录内容（Review + 校正 + savePodcastContent）
- [ ] 阶段四：逐个深度分析（构造分析输入 → 评分 → saveAnalysisResult）
- [ ] 阶段五：翻译高分播客（≥80 分自动翻译 → saveTranslateResult）
- [ ] 阶段六：输出最终结果

### 两种运行模式

**模式 A — 审校 + 分析 + 翻译一体化**（默认）：
1. 查询 `WAIT_ANALYSIS` 状态播客
2. 逐个审校转录内容，必要时保存校正
3. 逐个分析，分析完成后 **≥80 分的播客立即翻译**（无需用户二次确认）
4. <80 分的播客跳过翻译

**模式 B — 仅翻译**（无待分析播客时自动进入，或用户直接触发翻译相关短语）：
1. 查询 `WAIT_TRANSLATE` 状态播客
2. 跳过审校和分析，逐个翻译

### 快捷模式

当用户在触发 skill 时**已明确指定处理范围**，跳过阶段二的确认，直接进入阶段三：

| 用户输入 | 行为 |
|----------|------|
| "处理全部播客" / "process all podcasts" | 查询后直接处理**全部**播客 |
| "处理前 N 个播客" / "处理前 10 个" | 查询后按列表顺序取**前 N 个**处理 |
| "翻译全部播客" / "translate all podcasts" | 查询待翻译播客后直接翻译**全部** |
| "翻译前 N 个" | 查询待翻译播客后取**前 N 个**翻译 |

快捷模式下仍然输出播客列表摘要（总数、来源分布），但**不等待用户选择**，立即开始处理。若查询结果为空，正常提示"暂无等待处理的播客"并结束。

---

## 阶段一：查询播客列表

### 分析模式（默认）

使用 `WAIT_ANALYSIS` 查询：

```bash
curl -s -X POST https://api.bestblogs.dev/api/admin/article/list \
  -H "Authorization: Bearer $BESTBLOGS_ADMIN_JWT_TOKEN" \
  -H "User-Id: $BESTBLOGS_ADMIN_USER_ID" \
  -H "Content-Type: application/json" \
  -d '{"currentPage":1,"pageSize":50,"type":"PODCAST","flowStatusFilter":"WAIT_ANALYSIS"}'
```

- 若 `totalCount > 50`，自动翻页拉取全部（每页 50，最多 200 篇）

### 自动降级为翻译模式

若 `WAIT_ANALYSIS` 为空，**自动查询 `WAIT_TRANSLATE`**：

```bash
curl -s -X POST https://api.bestblogs.dev/api/admin/article/list \
  -H "Authorization: Bearer $BESTBLOGS_ADMIN_JWT_TOKEN" \
  -H "User-Id: $BESTBLOGS_ADMIN_USER_ID" \
  -H "Content-Type: application/json" \
  -d '{"currentPage":1,"pageSize":50,"type":"PODCAST","flowStatusFilter":"WAIT_TRANSLATE"}'
```

若待翻译播客也为空，提示"暂无等待处理的播客（分析和翻译均无待处理）"并结束。

**始终检查 `success` 字段。**

---

## 阶段二：用户选择

展示播客列表：

```markdown
## 等待分析的播客（共 N 个）

| # | ID | 标题 | 来源 | 优先级 | 语言 | 发布日期 |
|---|-----|------|------|--------|------|---------|
| 1 | RAW_xxx | 播客标题 1 | 来源 A | HIGH | 中文 | 2026-03-13 |
| 2 | RAW_yyy | 播客标题 2 | 来源 B | MEDIUM | English | 2026-03-12 |

请选择要处理的播客：
- "全部" — 处理所有播客
- "1, 3, 5" — 处理指定编号的播客
```

等待用户选择后继续。

---

## 阶段三：逐个审校

> **仅在分析模式下执行。** 翻译模式直接跳到阶段五。

**严格串行处理。** 每个播客必须完成以下 3 步后，再处理下一个：

```
步骤 A: 获取转录内容 → 步骤 B: AI 审校 → 步骤 C: 保存校正（如有）
```

### ID-内容关联安全

1. 处理每个播客时，锁定当前 `{id}` 和内容的对应关系
2. `savePodcastContent` 和 `saveAnalysisResult` 必须使用同一 `{id}`
3. **禁止**将一个播客的内容保存到另一个播客的 ID 上
4. **禁止**并行处理多个播客

### 步骤 A: 获取播客转录内容

```bash
curl -s "https://api.bestblogs.dev/api/admin/article/podcast/content?id=RAW_xxx" \
  -H "Authorization: Bearer $BESTBLOGS_ADMIN_JWT_TOKEN" \
  -H "User-Id: $BESTBLOGS_ADMIN_USER_ID"
```

响应 `data` 字段为 PodcastContentDetailDTO 对象，包含：`transcriptionSegments`、`autoChapters`、`podCastSummary`、`speakerSummaries`、`questionsAnswers`、`keywords`、`keySentences`。

若返回 `null` 或 `success: false`，标注 ❌ 转录内容不可用，跳过该播客继续下一个。

### 步骤 B: AI 审校

使用播客元数据（来自阶段一列表）和转录内容（步骤 A）进行审校。

**审校输入 XML**:

```xml
<podcast>
  <metadata>
    <title>播客标题（来自列表的 title 字段）</title>
    <source>来源名称（来自列表的 sourceName 字段）</source>
    <authors>作者/主持人列表（来自列表的 authors 字段）</authors>
    <description>播客描述（来自列表的 description 字段）</description>
    <url>原文链接（来自列表的 url 字段）</url>
  </metadata>
  <content>
    <podcast_summary>全文摘要</podcast_summary>
    <speaker_summaries>发言人总结 JSON</speaker_summaries>
    <auto_chapters>章节列表 JSON</auto_chapters>
    <questions_answers>问答列表 JSON</questions_answers>
    <keywords>关键词列表</keywords>
    <transcription_segments>转录分段 JSON（全部）</transcription_segments>
  </content>
</podcast>
```

**审校关注点**:

1. **人名校正**: `speakerSummaries` 中的 `speakerName` 是否与播客元数据（authors, sourceName）一致。通义听悟通常返回 "Speaker 1"、"Speaker 2" 等通用标签，需根据播客描述和作者信息映射为实际人名
2. **关键术语**: 转录文本中技术术语、产品名、公司名的 ASR 识别是否正确（如 "Claude" 被识别为 "Cloud"、"GPT" 被识别为 "GBT" 等）
3. **文字稿准确性**: `transcriptionSegments` 中是否有明显的语音识别错误
4. **一致性**: 同一术语/人名在不同 segment、chapter、summary 中拼写是否一致
5. **章节标题/摘要**: `autoChapters` 的 `headLine` 和 `summary` 是否准确反映内容

**审校输出**:
- 变更说明（告知用户改了什么、改了多少处）
- 若有修改：校正后的完整 PodcastContentDetailDTO JSON
- 若无需修改：明确说明"无需校正"

### 步骤 C: 保存校正内容

> **写操作 — 审校有修改时才执行。**

若步骤 B 发现需要校正，将校正后的完整内容保存：

```bash
curl -s -X POST "https://api.bestblogs.dev/api/admin/article/savePodcastContent?id=RAW_xxx" \
  -H "Authorization: Bearer $BESTBLOGS_ADMIN_JWT_TOKEN" \
  -H "User-Id: $BESTBLOGS_ADMIN_USER_ID" \
  -H "Content-Type: application/json" \
  -d @/tmp/podcast_content_RAW_xxx.json
```

> **提示**：播客转录内容可能很大，将 JSON 保存到临时文件后用 `@file` 方式传入 curl。

步骤 B（审校）和步骤 C（保存）**必须作为独立步骤分开执行**。

若无需校正，跳过步骤 C，直接进入阶段四的分析。

---

## 阶段四：逐个分析

每个播客完成审校后，立即进入分析。每个播客执行 2 步：

```
步骤 D: 深度分析 → 步骤 E: 保存分析结果
```

### 步骤 D: 深度分析

使用播客元数据和转录内容构造分析输入。从 PodcastContentDetailDTO 构造可读内容：

**构造分析输入 XML**:

```xml
<podcast>
  <metadata>
    <title>播客标题</title>
    <source>来源名称</source>
    <url>原文链接</url>
    <priority>来源优先级</priority>
  </metadata>
  <content>
    <chapters>
      ## 章节 1：{headLine}
      {summary}
      [时间: {beginTime} - {endTime}]

      ## 章节 2：{headLine}
      {summary}
    </chapters>
    <podcast_summary>{podCastSummary}</podcast_summary>
    <speaker_summaries>
      {speakerName}: {summary}
    </speaker_summaries>
    <questions_answers>
      Q: {question}
      A: {answer}
    </questions_answers>
    <key_sentences>
      - {sentence} [{beginTime}-{endTime}]
    </key_sentences>
    <transcription>
      [{speakerName}] {text}
      [{speakerName}] {text}
      ...（按时间顺序拼接全部 transcriptionSegments，标注说话人）
    </transcription>
  </content>
</podcast>
```

**分析要求**:

1. 仔细阅读全部转录内容，理解核心讨论要点
2. 按照播客评分体系的 5 个维度打分：内容价值 (35)、实用性 (25)、相关性 (20)、制作与表达 (10)、创新性 (10)
3. 考虑来源优先级（`priority` 字段）和播客类型基准分
4. 检查是否适用减分项（信息重复、过度冗长、互相吹捧等）
5. 生成结构化 JSON 结果
6. **评分校正**：≥95/≥90/≥85 分别执行对应的自检清单

> 完整评分标准、基准分、减分项、领域分类均在 `references/analysis_rubric.md` 中，分析时**必须加载并遵循**。

**输出语言规则（重要）**：

- `oneSentenceSummary`、`summary`、`tags`、`mainPoints`、`keyQuotes` **必须与播客语言一致**
  - 中文播客 → 全部用中文输出
  - 英文播客 → 全部用英文输出
- `domain`、`aiSubcategory` 使用 API 枚举值，与语言无关
- `remark` **始终用中文**
- **写作风格**：术语不加括号注释、减少引号破折号、中文引号用「」、适度使用 Markdown

**分析输出 JSON**:

```json
{
  "title": "可选：仅在标题含冗余信息时填写清理后版本，否则省略",
  "oneSentenceSummary": "一句话核心总结，与播客同语言",
  "summary": "核心内容概要（200-400 字），与播客同语言",
  "domain": "一级分类代码",
  "aiSubcategory": "二级分类代码（核心分类必填，通用分类留空）",
  "tags": ["与播客同语言的标签（3-8 个）"],
  "mainPoints": [{"point": "主要观点", "explanation": "观点解释"}],
  "keyQuotes": ["转录文本中的金句，逐字引用（3-5 句）"],
  "score": 85,
  "remark": "中文评分依据、分析和推荐等级"
}
```

### 步骤 E: 保存分析结果

```bash
curl -s -X POST "https://api.bestblogs.dev/api/admin/article/saveAnalysisResult?id=RAW_xxx" \
  -H "Authorization: Bearer $BESTBLOGS_ADMIN_JWT_TOKEN" \
  -H "User-Id: $BESTBLOGS_ADMIN_USER_ID" \
  -H "Content-Type: application/json" \
  -d '{分析结果 JSON}'
```

> **重要**：步骤 D（分析）和步骤 E（保存）**必须作为独立步骤分开执行**。

### 输出进度

每处理完一个播客，更新进度：

```markdown
- [1/5] ✅ RAW_xxx — 播客标题 1 (审校: 3 处校正 | 85 分, 已保存) → 🔄 翻译中...
- [2/5] ✅ RAW_yyy — 播客标题 2 (审校: 无需校正 | 72 分, 已保存) → ⏭️ 跳过翻译（<80 分）
- [3/5] ⏳ RAW_zzz — 播客标题 3
```

单个播客任一步骤失败时，记录错误并继续处理下一个。

---

## 阶段五：翻译

### 模式 A — 分析后自动翻译

分析阶段完成后，自动对 **≥80 分** 的播客执行翻译。无需用户二次确认。

对每个高分播客执行：
```
步骤 F: 获取分析结果 → 步骤 G: 翻译 → 步骤 H: 保存翻译结果
```

### 模式 B — 独立翻译

当无待分析播客（或用户直接触发翻译短语）时，对阶段一查询到的 `WAIT_TRANSLATE` 播客逐个执行步骤 F → G → H。

### 步骤 F: 获取分析结果

**模式 A**（分析后翻译）：直接复用阶段四步骤 D 的分析结果 JSON，无需再次请求 API。

**模式 B**（独立翻译）：使用 `/dify/resource/markdown` 端点获取：

```bash
curl -s "https://api.bestblogs.dev/dify/resource/markdown?id=RAW_xxx&language=zh"
```

> **注意**：此端点无需认证头，`language` 参数影响 `languageName` 和 `destLanguageName` 的显示语言。

关键字段：
- `languageName` — 原始语言
- `destLanguageName` — 目标翻译语言
- `analysisResult` — 已分析的结构化结果（**JSON 字符串**，需解析）

若 `success` 为 `"false"` 或 `analysisResult` 为空，跳过该播客。

### 步骤 G: 翻译分析结果

**语言方向判断**：
- **模式 A**：根据播客的 `language` 字段（`zh_CN` → 中译英，`en_US` → 英译中）
- **模式 B**：使用 `/dify/resource/markdown` 返回的 `languageName` 和 `destLanguageName`

**翻译要求**（AI 翻译专家角色）:

1. **术语处理**
   - 常见技术术语直接使用，不加括号注释：AI、Agent、RAG、LLM、API、SDK、UI、UX 等
   - 禁止写成「人工智能（AI）」「AI Agent（AI 智能体）」等冗余形式
   - AI 领域翻译（英译中时）：Agent → 智能体，Memory → 记忆
   - 人名、公司名、产品名保持原文或直接翻译，不加括号注释
   - 全文术语翻译保持一致

2. **语言表达**
   - 意译而非直译，使用地道的表述方式
   - 尽量减少使用引号和破折号
   - 中文引号使用「」替换""
   - 保持原文语气和风格

3. **格式要求**
   - 中文与英文、数字之间添加空格
   - 可适当使用基础 Markdown 语法（**强调**、`代码`），但不要过多
   - 保持原 JSON 结构和 key 名称不变

4. **输出要求**
   - **只输出翻译后的 JSON，不输出任何其他内容**

**翻译输出**：

```json
{
  "title": "翻译后的标题",
  "oneSentenceSummary": "翻译后的一句话总结",
  "summary": "翻译后的全文摘要",
  "tags": ["翻译后标签1", "翻译后标签2"],
  "mainPoints": [
    {"point": "翻译后的观点 1", "explanation": "翻译后的解释 1"}
  ],
  "keyQuotes": ["翻译后的金句 1", "翻译后的金句 2"]
}
```

### 步骤 H: 保存翻译结果

```bash
curl -s -X POST "https://api.bestblogs.dev/api/admin/article/saveTranslateResult?id=RAW_xxx" \
  -H "Authorization: Bearer $BESTBLOGS_ADMIN_JWT_TOKEN" \
  -H "User-Id: $BESTBLOGS_ADMIN_USER_ID" \
  -H "Content-Type: application/json" \
  -d '{翻译结果 JSON}'
```

**注意**：`score`、`remark`、`domain`、`aiSubcategory` **不传** — 保持分析阶段的原值。

> 步骤 G（翻译）和步骤 H（保存）**必须作为独立步骤分开执行**。

---

## 阶段六：输出最终结果

```markdown
## 处理结果

| # | ID | 标题 | 来源 | 审校 | 评分 | 领域 | 分析 | 翻译 |
|---|-----|------|------|------|------|------|------|------|
| 1 | RAW_xxx | 标题 1 | 来源 A | ✅ 3处校正 | 85 | 人工智能 | ✅ | ✅ 中文→English |
| 2 | RAW_yyy | 标题 2 | 来源 B | ⏭️ 无需校正 | 72 | 软件编程 | ✅ | ⏭️ <80分 |
| 3 | RAW_zzz | 标题 3 | 来源 C | ❌ 内容不可用 | - | - | ❌ | - |

### 统计
- 审校成功：2（校正：1 / 无需校正：1）/ 失败：1
- 分析成功：2 / 失败：1
- 翻译成功：1 / 跳过：1（<80 分）

### 评分分布
- 90+ 分：0 个
- 80-89 分：1 个（已翻译）
- 70-79 分：1 个
- <70 分：0 个
```

---

## 错误处理

| 错误 | 原因 | 处理 |
|------|------|------|
| `success: false` | API 返回错误 | 读取 `code` 和 `message`，告知用户 |
| `401` / `403` | Token 过期或无权限 | 立即暂停，提示用户更新认证信息 |
| podcast/content 返回 `null` | 转录内容不可用 | 跳过该播客，继续下一个 |
| 审校输出格式错误 | AI 输出不符合预期 | 跳过审校，直接进入分析 |
| savePodcastContent 失败 | 参数错误或服务端异常 | 记录失败，仍继续分析（使用原始未校正内容） |
| 分析 JSON 格式错误 | 分析输出不符合预期格式 | 重试分析一次，仍失败则跳过 |
| saveAnalysisResult 失败 | 参数错误或服务端异常 | 记录失败，输出分析 JSON 供手动重试 |
| `/dify/resource/markdown` 返回 `success: "false"` | 内容不可用 | 跳过翻译，继续下一个 |
| `analysisResult` 为空 | 播客尚未分析 | 跳过翻译，继续下一个 |
| 翻译 JSON 格式错误 | 翻译输出不符合预期格式 | 重试翻译一次，仍失败则跳过 |
| saveTranslateResult 失败 | 参数错误或服务端异常 | 记录失败，输出翻译 JSON 供手动重试 |
| 环境变量未设置 | 缺少认证信息 | 提示配置 `BESTBLOGS_ADMIN_USER_ID`、`BESTBLOGS_ADMIN_JWT_TOKEN` |
