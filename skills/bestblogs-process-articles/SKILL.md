---
name: bestblogs-process-articles
description: "Use when 用户想批量处理 BestBlogs 待分析文章，包括拉取正文、生成分析、保存结果，或翻译高分内容。"
---

# 文章批量深度分析与翻译 (Process Articles)

查询 BestBlogs 中等待分析的文章 → 用户选择 → 逐篇获取正文、深度分析并更新 → **≥80 分自动翻译** → 更新翻译结果。若无待分析文章，自动查询待翻译文章并处理。

评分体系基于统一评分规则（`docs/scoring-rubric.md`），文章类型的评估维度和输出格式见 `references/analysis_rubric.md`。完整 API 参数详情见 `references/api_reference.md`。

## When to Use

- 用户要处理 BestBlogs 后台等待分析或等待翻译的文章队列
- 用户需要一个 orchestrator 负责挑出待处理文章、组织顺序并把任务分发给 worker
- 用户想按“分析优先，满足阈值再翻译”的文章流水线运行

## When Not to Use

- 只想读取公开文章内容或元数据时，使用 `bestblogs-fetcher`
- 只需要做某个单独阶段时，优先直接使用 `bestblogs-fetch-pending-content`、`bestblogs-analyze-content`、`bestblogs-translate-analysis-result`
- 想处理播客、视频或推文队列时，使用对应的 `bestblogs-process-*`

## Worker Routing

- `bestblogs-fetch-pending-content`：查询 `WAIT_PREPARE` / `WAIT_ANALYSIS` / `WAIT_TRANSLATE` 队列并生成待处理列表
- `bestblogs-analyze-content`：对单篇文章执行正文获取、预处理兜底和结构化分析
- `bestblogs-translate-analysis-result`：对已分析且满足条件的文章执行翻译并保存

本 skill 应主要负责模式判断、用户选择、执行顺序和阶段衔接，不应在正文前部重复定义所有 worker 的实现细节。

## Worker Entrypoints

优先把以下 `scripts/examples/` 当成稳定 worker 入口，而不是重复手写 `curl`：

```bash
python3 scripts/examples/bestblogs_fetch_pending.py --type ARTICLE --flow-status WAIT_ANALYSIS
python3 scripts/examples/bestblogs_save_analysis.py --id RAW_xxx --json /tmp/analysis.json
python3 scripts/examples/bestblogs_save_translate_analysis_result.py --id RAW_xxx --json /tmp/translate.json
```

这些 worker 会输出统一 JSON 契约，至少包含：
- `ok`
- `action`
- `items`
- `write`
- `verify`
- `note`
- `meta`

orchestrator 应基于这些字段做阶段判断和结果汇总，而不是依赖临时文本格式。

## Gotchas

- 文章处理必须严格串行，避免正文、分析结果和保存 ID 串写
- `WAIT_PREPARE` 和 `WAIT_ANALYSIS` 为空时要自动切到翻译模式，而不是直接结束
- 获取正文为空时要先走预处理兜底，再决定是否跳过
- 自动翻译阈值属于 orchestration 规则，分析 worker 不应自行决定批量范围

## Related Skills

- `bestblogs-fetch-pending-content`：后台队列查询 worker
- `bestblogs-analyze-content`：分析 worker
- `bestblogs-translate-analysis-result`：翻译 worker
- `bestblogs-fetcher`：公开内容读取 skill

## 认证

需要以下环境变量：

| 变量 | 用途 | 使用场景 |
|------|------|----------|
| `BESTBLOGS_ADMIN_USER_ID` | 管理员用户 ID | 查询文章列表、保存分析/翻译结果 |
| `BESTBLOGS_ADMIN_JWT_TOKEN` | 管理员 JWT Token | 查询文章列表、保存分析/翻译结果 |
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
| `/api/admin/article/list` | POST | 读取 | 查询等待分析/翻译的文章列表 |
| `/openapi/v1/resource/markdown` | GET | 读取 | 获取文章 Markdown 正文 |
| `/dify/resource/markdown` | GET | 读取 | 获取文章正文和已分析的结果（翻译阶段用） |
| `/api/admin/article/runPrepareFlow?id={id}` | POST | 写入 | 空内容兜底预处理（触发正文抓取/修复） |
| `/api/admin/article/saveAnalysisResult?id={id}` | POST | 写入 | 保存分析结果（评分、摘要、标签等） |
| `/api/admin/article/saveTranslateResult?id={id}` | POST | 写入 | 保存翻译后的分析结果 |

## 工作流概览（5 个阶段）

```
阶段一（查询文章列表）→ 阶段二（用户选择）→ 阶段三（逐篇分析）→ 阶段四（翻译高分文章）→ 阶段五（输出结果）
```

- [ ] 阶段一：查询等待分析的文章列表（无则查询待翻译）
- [ ] 阶段二：展示列表，用户选择 ⚠️ REQUIRED（快捷模式跳过）
- [ ] 阶段三：逐篇处理（获取正文 → 深度分析 → 保存结果）
- [ ] 阶段四：翻译高分文章（≥80 分自动翻译，或处理待翻译文章）
- [ ] 阶段五：输出最终结果

### 两种运行模式

**模式 A — 分析 + 翻译一体化**（默认）：
1. 查询 `WAIT_PREPARE` / `WAIT_ANALYSIS` 状态文章
2. 逐篇分析，分析完成后 **≥80 分的文章立即翻译**（无需用户二次确认）
3. <80 分的文章跳过翻译

**模式 B — 仅翻译**（无待分析文章时自动进入，或用户直接触发翻译相关短语）：
1. 查询 `WAIT_TRANSLATE` 状态文章
2. 逐篇翻译

### 快捷模式

当用户在触发 skill 时**已明确指定处理范围**，跳过阶段二的确认，直接进入阶段三：

| 用户输入 | 行为 |
|----------|------|
| "处理全部文章" / "process all articles" | 查询后直接处理**全部**文章 |
| "处理前 N 篇文章" / "处理前 10 篇" | 查询后按列表顺序取**前 N 篇**处理 |
| "翻译全部文章" / "translate all articles" | 查询待翻译文章后直接翻译**全部** |
| "翻译前 N 篇" | 查询待翻译文章后取**前 N 篇**翻译 |

快捷模式下仍然输出文章列表摘要（总数、优先级/语言分布），但**不等待用户选择**，立即开始处理。若查询结果为空，正常提示"暂无等待处理的文章"并结束。

---

## 阶段一：查询文章列表

### 分析模式（默认）

优先使用共享 worker 查询 `WAIT_PREPARE`，若结果为空则回退到 `WAIT_ANALYSIS`：

```bash
python3 scripts/examples/bestblogs_fetch_pending.py \
  --type ARTICLE \
  --flow-status WAIT_PREPARE \
  --page-size 50 \
  --max-pages 4 \
  --start-date YYYY-MM-DD \
  --end-date YYYY-MM-DD
```

- 日期默认为最近 1 周（`startDate` = 今天 -7 天，`endDate` = 今天）
- 若返回 JSON 中 `items` 为空，自动改用 `--flow-status WAIT_ANALYSIS` 重试
- 若 `totalCount > 50`，自动翻页拉取全部（每页 50，最多 200 篇）

### 自动降级为翻译模式

若 `WAIT_PREPARE` 和 `WAIT_ANALYSIS` 均为空，**自动查询 `WAIT_TRANSLATE`**：

```bash
python3 scripts/examples/bestblogs_fetch_pending.py \
  --type ARTICLE \
  --flow-status WAIT_TRANSLATE \
  --page-size 50 \
  --max-pages 4 \
  --start-date YYYY-MM-DD \
  --end-date YYYY-MM-DD
```

若待翻译文章也为空，提示"暂无等待处理的文章（分析和翻译均无待处理）"并结束。

**始终检查 worker JSON 中的 `ok`、`items` 和 `meta.flowStatus`。**

---

## 阶段二：用户选择

展示文章列表：

```markdown
## 等待分析的文章（共 N 篇）  ← 或"等待翻译的文章"

| # | ID | 标题 | 来源 | 优先级 | 语言 | 评分 | 发布日期 |
|---|-----|------|------|--------|------|------|---------|
| 1 | RAW_xxx | 文章标题 1 | 来源 A | HIGH | 中文 | - | 2026-03-13 |
| 2 | RAW_yyy | 文章标题 2 | 来源 B | MEDIUM | English | 85 | 2026-03-12 |

请选择要处理的文章：
- "全部" — 处理所有文章
- "1, 3, 5" — 处理指定编号的文章
```

等待用户选择后继续。

---

## 阶段三：逐篇分析

> **仅在分析模式下执行。** 翻译模式直接跳到阶段四。

**严格串行处理。** 每篇文章必须完成以下 3 步后，再处理下一篇：

```
步骤 A: 获取正文 → 步骤 B: 深度分析 → 步骤 C: 保存结果
```

### ID-内容关联安全

1. 处理每篇文章时，锁定当前 `{id}` 和内容的对应关系
2. `saveAnalysisResult` 必须使用与获取正文相同的 `{id}`
3. **禁止**将一篇文章的分析结果保存到另一篇文章的 ID 上
4. **禁止**并行处理多篇文章

### 步骤 A: 获取文章正文（含空内容兜底预处理）

```bash
curl -s "https://api.bestblogs.dev/openapi/v1/resource/markdown?id=RAW_xxx" \
  -H "X-API-KEY: $BESTBLOGS_API_KEY"
```

响应 `data` 字段为 Markdown 字符串。

若返回 `null` 或空字符串，执行兜底预处理：

```bash
curl -s -X POST "https://api.bestblogs.dev/api/admin/article/runPrepareFlow?id=RAW_xxx" \
  -H "Authorization: Bearer $BESTBLOGS_ADMIN_JWT_TOKEN" \
  -H "User-Id: $BESTBLOGS_ADMIN_USER_ID" \
  -H "Content-Type: application/json"
```

兜底规则（必须按顺序）：

1. `runPrepareFlow` 返回 `success: true` 且 `data: true` 时，等待 2-3 秒后重试获取 markdown
2. 最多重试 3 次（建议每次间隔 2-3 秒）
3. 任一重试拿到非空 `data` 后，继续步骤 B 分析
4. 若 3 次后仍为空，标注 ❌ 正文不可用（已触发预处理），跳过该篇继续下一篇
5. 若 `runPrepareFlow` 返回失败，标注 ❌ 预处理失败，跳过该篇继续下一篇

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
2. 按照评分体系的 5 个维度打分：内容深度 (35)、实用性 (25)、相关性 (20)、表达质量 (10)、创新性 (10)
3. 考虑来源优先级（接口返回的 `priority` 字段）和原创性对评分的影响
4. 检查是否适用减分项（编译转述类上限 89 分，优质策展类不适用聚合减分）
5. 生成结构化 JSON 结果
6. **评分校正**：≥95/≥90/≥85 分别执行对应的自检清单

> 完整评分标准、分布指导、减分项、领域分类、示例均在 `references/analysis_rubric.md` 中，分析时**必须加载并遵循**。

**输出语言规则（重要）**：

- `oneSentenceSummary`、`summary`、`tags`、`mainPoints`、`keyQuotes` 等内容字段**必须与原文语言一致**
  - 英文文章 → 全部用英文输出
  - 中文文章 → 全部用中文输出
- `domain`、`aiSubcategory` 使用 API 枚举值（见下方），与语言无关
- `remark` **始终用中文**（评分依据供内部审核使用）
- 后续翻译阶段会自动处理高分文章的翻译，分析阶段只输出原文语言
- **写作风格**：术语不加括号注释、减少引号破折号、中文引号用「」、适度使用 Markdown，详见 `references/analysis_rubric.md`

分析输出 JSON 格式、领域分类枚举值（一级/二级）和分类判断边界见 `references/workflow-details.md`。

### 步骤 C: 保存分析结果

**端点**：`POST /api/admin/article/saveAnalysisResult?id={id}`，id 为 query 参数。

```bash
python3 scripts/examples/bestblogs_save_analysis.py \
  --id RAW_xxx \
  --json /tmp/bestblogs-analysis-RAW_xxx.json \
  --language zh
```

> **重要**：步骤 B（分析）和步骤 C（保存）**必须作为独立步骤分开执行**。先确保分析结果完整、JSON 合法，再调用保存 API。

### 输出进度

每处理完一篇文章，更新进度：

```markdown
- [1/5] ✅ RAW_xxx — 文章标题 1 (85 分，已保存) → 🔄 翻译中...
- [2/5] ✅ RAW_yyy — 文章标题 2 (72 分，已保存) → ⏭️ 跳过翻译（<80 分）
- [3/5] ⏳ RAW_zzz — 文章标题 3
```

单篇文章任一步骤失败时，记录错误并继续处理下一篇。

---

## 阶段四：翻译

### 模式 A — 分析后自动翻译

分析阶段完成后，自动对 **≥80 分** 的文章执行翻译。无需用户二次确认。

对每篇高分文章执行：
```
步骤 D: 获取分析结果 → 步骤 E: 翻译 → 步骤 F: 保存翻译结果
```

### 模式 B — 独立翻译

当无待分析文章（或用户直接触发翻译短语）时，对阶段一查询到的 `WAIT_TRANSLATE` 文章逐篇执行步骤 D → E → F。

### 步骤 D: 获取文章内容和分析结果

**模式 A**（分析后翻译）：直接复用阶段三步骤 B 的分析结果 JSON，无需再次请求 API。

**模式 B**（独立翻译）：使用 `/dify/resource/markdown` 端点获取：

```bash
curl -s "https://api.bestblogs.dev/dify/resource/markdown?id=RAW_xxx&language=zh"
```

> **注意**：此端点无需认证头，`language` 参数影响 `languageName` 和 `destLanguageName` 的显示语言。

响应字段详见 `references/api_reference.md`。关键字段：
- `languageName` — 原始语言（如"中文"、"English"）
- `destLanguageName` — 目标翻译语言
- `analysisResult` — 已分析的结构化结果（**JSON 字符串**，需解析）

若 `success` 为 `"false"` 或 `analysisResult` 为空，跳过该篇。

### 步骤 E: 翻译分析结果

**语言方向判断**：
- **模式 A**：根据文章的 `language` 字段（`zh_CN` → 中译英，`en_US` → 英译中）
- **模式 B**：使用 `/dify/resource/markdown` 返回的 `languageName` 和 `destLanguageName`

详细翻译要求见 `references/translation-requirements.md`，翻译时**必须加载并遵循**。

翻译输出 JSON 格式见 `references/workflow-details.md`（字段：title, oneSentenceSummary, summary, tags, mainPoints, keyQuotes）。

### 步骤 F: 保存翻译结果

```bash
python3 scripts/examples/bestblogs_save_translate_analysis_result.py \
  --id RAW_xxx \
  --json /tmp/bestblogs-translate-RAW_xxx.json \
  --language zh
```

**注意**：`score`、`remark`、`domain`、`aiSubcategory`、`content` **不传** — 保持分析阶段的原值。
当前 references 没有暴露稳定的 translated-analysis read API。该模板会写入后再读取资源，确认内容仍可读，并明确这是 best-effort 校验。

> 步骤 E（翻译）和步骤 F（保存）**必须作为独立步骤分开执行**。

---

## 阶段五：输出最终结果

完整输出模板见 `references/workflow-details.md`。

输出需包含：每篇文章的处理状态表格（ID、标题、评分/分析/翻译状态）+ 统计汇总（分析/翻译成功/失败/跳过数量、评分分布）。

---

## 错误处理

完整错误处理表见 `references/workflow-details.md`。核心原则：

- **始终检查 `success` 字段**（`/dify/resource/markdown` 的 success 为**字符串**类型）
- `401`/`403`：立即暂停，提示更新认证信息
- markdown 返回空：先调 `runPrepareFlow`，重试最多 3 次，仍失败再跳过
- 分析/翻译 JSON 格式错误：重试一次，仍失败则跳过
- 单篇文章任一步骤失败：记录错误，继续下一篇
