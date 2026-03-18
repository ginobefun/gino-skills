---
name: bestblogs-process-podcasts
description: "Use when 用户想批量处理 BestBlogs 待分析播客，包括审校转录、分析、保存评分，或翻译高分播客分析结果。"
---

# 播客内容审校、分析与翻译 (Process Podcasts)

查询 BestBlogs 中等待分析的播客 → 用户选择 → 逐个审校转录内容并深度分析 → **≥80 分自动翻译** → 更新翻译结果。若无待分析播客，自动查询待翻译播客并处理。

评分体系基于统一评分规则（`docs/scoring-rubric.md`），播客类型的评估维度和输出格式见 `references/analysis_rubric.md`。完整 API 参数详情见 `references/api_reference.md`。

## When to Use

- 用户要处理 BestBlogs 后台等待分析或等待翻译的播客队列
- 用户需要 orchestrator 串起“获取转录内容、审校、分析、翻译”这些阶段
- 任务是批量队列处理，而不是查看单个播客详情

## When Not to Use

- 只想读取公开播客内容时，使用 `bestblogs-fetcher`
- 只做某一阶段时，优先调用 `bestblogs-fetch-pending-content`、`bestblogs-analyze-content`、`bestblogs-translate-analysis-result`
- 想处理文章、视频或推文队列时，使用对应类型的 `bestblogs-process-*`

## Worker Routing

- `bestblogs-fetch-pending-content`：查询待分析 / 待翻译播客队列
- `bestblogs-analyze-content`：对单个播客执行转录审校和结构化分析
- `bestblogs-translate-analysis-result`：对已分析播客执行翻译并保存

本 skill 负责模式切换、批次顺序和用户选择；单条内容的审校和分析逻辑归 worker 所有。

## Worker Entrypoints

优先把以下 `scripts/examples/` 当成稳定 worker 入口：

```bash
python3 scripts/examples/bestblogs_fetch_pending.py --type PODCAST --flow-status WAIT_ANALYSIS
python3 scripts/examples/bestblogs_save_podcast_content.py --id RAW_xxx --json /tmp/podcast-content.json
python3 scripts/examples/bestblogs_save_analysis.py --id RAW_xxx --json /tmp/analysis.json
python3 scripts/examples/bestblogs_save_translate_analysis_result.py --id RAW_xxx --json /tmp/translate.json
```

这些脚本统一输出 JSON 契约，至少包含 `ok`、`action`、`items`、`write`、`verify`、`note`、`meta`。
orchestrator 应消费这些字段来判断保存是否完成、是否需要重试，以及最终如何汇总结果。

## Gotchas

- 播客内容通常体积大，校正保存应走临时文件，不要把大 JSON 直接内联到命令里
- `WAIT_ANALYSIS` 和 `WAIT_TRANSLATE` 是不同阶段，不能混在同一批里一起处理
- 审校步骤只在确有修改时写回，避免无差别覆写转录内容
- 每个播客的 `savePodcastContent` 和 `saveAnalysisResult` 必须复用同一个 ID

## Related Skills

- `bestblogs-fetch-pending-content`：后台队列查询 worker
- `bestblogs-analyze-content`：播客分析 worker
- `bestblogs-translate-analysis-result`：播客翻译 worker
- `bestblogs-fetcher`：读取公开播客和相关元数据

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

## 工作流概览（5 个阶段）

```
阶段一（查询列表）→ 阶段二（用户选择）→ 阶段三（逐个审校+分析）→ 阶段四（翻译高分播客）→ 阶段五（输出结果）
```

- [ ] 阶段一：查询等待分析的播客列表（无则查询待翻译）
- [ ] 阶段二：展示列表，用户选择 ⚠️ REQUIRED（快捷模式跳过）
- [ ] 阶段三：逐个处理（获取转录 → 审校 → 保存校正 → 深度分析 → 保存结果）
- [ ] 阶段四：翻译高分播客（≥80 分自动翻译，或处理待翻译播客）
- [ ] 阶段五：输出最终结果

### 两种运行模式

**模式 A — 审校 + 分析 + 翻译一体化**（默认）：
1. 查询 `WAIT_ANALYSIS` 状态播客
2. 逐个审校 + 分析，分析完成后 **≥80 分的播客立即翻译**（无需用户二次确认）
3. <80 分的播客跳过翻译

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

使用共享 worker 查询 `WAIT_ANALYSIS`：

```bash
python3 scripts/examples/bestblogs_fetch_pending.py \
  --type PODCAST \
  --flow-status WAIT_ANALYSIS \
  --page-size 50 \
  --max-pages 4 \
  --start-date YYYY-MM-DD \
  --end-date YYYY-MM-DD
```

- 日期默认为最近 1 周（`startDate` = 今天 -7 天，`endDate` = 今天）
- 若 `totalCount > 50`，自动翻页拉取全部（每页 50，最多 200 个）

### 自动降级为翻译模式

若 `WAIT_ANALYSIS` 为空，**自动查询 `WAIT_TRANSLATE`**：

```bash
python3 scripts/examples/bestblogs_fetch_pending.py \
  --type PODCAST \
  --flow-status WAIT_TRANSLATE \
  --page-size 50 \
  --max-pages 4 \
  --start-date YYYY-MM-DD \
  --end-date YYYY-MM-DD
```

若待翻译播客也为空，提示"暂无等待处理的播客（分析和翻译均无待处理）"并结束。

**始终检查 worker JSON 中的 `ok`、`items` 和 `meta.flowStatus`。**

---

## 阶段二：用户选择

展示播客列表：

```markdown
## 等待分析的播客（共 N 个）  ← 或"等待翻译的播客"

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

## 阶段三：逐个审校 + 分析

> **仅在分析模式下执行。** 翻译模式直接跳到阶段四。

**严格串行处理。** 每个播客必须完成以下 5 步后，再处理下一个：

```
步骤 A: 获取转录内容 → 步骤 B: AI 审校 → 步骤 C: 保存校正（如有）→ 步骤 D: 深度分析 → 步骤 E: 保存分析结果
```

### ID-内容关联安全

1. 处理每个播客时，锁定当前 `{id}` 和内容的对应关系
2. `savePodcastContent`、`saveAnalysisResult` 必须使用同一 `{id}`
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

审校输入 XML 格式、审校关注点和审校输出规范见 `references/workflow-details.md`。

核心审校要点：人名校正（Speaker 1/2 → 实际人名）、ASR 术语纠错、文字稿准确性、全文一致性、章节标题准确性。

### 步骤 C: 保存校正内容

> **写操作 — 审校有修改时才执行。**

若步骤 B 发现需要校正，将校正后的完整内容保存：

```bash
python3 scripts/examples/bestblogs_save_podcast_content.py \
  --id RAW_xxx \
  --json /tmp/podcast_content_RAW_xxx.json
```

> **提示**：播客转录内容可能很大，将 JSON 保存到临时文件后用 `@file` 方式传入 curl。

若无需校正，跳过步骤 C，直接进入步骤 D 分析。

### 步骤 D: 深度分析

使用播客元数据和转录内容构造分析输入。从 PodcastContentDetailDTO 构造可读内容：

分析输入 XML 格式和输出 JSON 格式见 `references/workflow-details.md`。

**分析要求**（完整标准见 `references/analysis_rubric.md`，分析时**必须加载并遵循**）:

1. 仔细阅读全部转录内容，按播客评分维度打分：内容价值 (35)、实用性 (25)、相关性 (20)、制作与表达 (10)、创新性 (10)
2. 考虑来源优先级和播客类型基准分，检查减分项（信息重复、过度冗长、互相吹捧等）
3. **评分校正**：≥95/≥90/≥85 分别执行自检清单
4. **输出语言**：内容字段与播客同语言，`remark` 始终中文，`domain`/`aiSubcategory` 用枚举值
5. **写作风格**：术语不加括号注释、减少引号破折号、中文引号用「」

### 步骤 E: 保存分析结果

```bash
curl -s -X POST "https://api.bestblogs.dev/api/admin/article/saveAnalysisResult?id=RAW_xxx" \
  -H "Authorization: Bearer $BESTBLOGS_ADMIN_JWT_TOKEN" \
  -H "User-Id: $BESTBLOGS_ADMIN_USER_ID" \
  -H "Content-Type: application/json" \
  -d '{分析结果 JSON}'
```

> **重要**：步骤 D（分析）和步骤 E（保存）**必须作为独立步骤分开执行**。先确保分析结果完整、JSON 合法，再调用保存 API。

### 输出进度

每处理完一个播客，更新进度：

```markdown
- [1/5] ✅ RAW_xxx — 播客标题 1 (审校: 3 处校正 | 85 分, 已保存) → 🔄 翻译中...
- [2/5] ✅ RAW_yyy — 播客标题 2 (审校: 无需校正 | 72 分, 已保存) → ⏭️ 跳过翻译（<80 分）
- [3/5] ⏳ RAW_zzz — 播客标题 3
```

单个播客任一步骤失败时，记录错误并继续处理下一个。

---

## 阶段四：翻译

### 模式 A — 分析后自动翻译

分析阶段完成后，自动对 **≥80 分** 的播客执行翻译。无需用户二次确认。

对每个高分播客执行：
```
步骤 F: 获取分析结果 → 步骤 G: 翻译 → 步骤 H: 保存翻译结果
```

### 模式 B — 独立翻译

当无待分析播客（或用户直接触发翻译短语）时，对阶段一查询到的 `WAIT_TRANSLATE` 播客逐个执行步骤 F → G → H。

### 步骤 F: 获取分析结果

**模式 A**（分析后翻译）：直接复用阶段三步骤 D 的分析结果 JSON，无需再次请求 API。

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

详细翻译要求见 `references/translation-requirements.md`，翻译时**必须加载并遵循**。

翻译输出 JSON 格式见 `references/workflow-details.md`（字段：title, oneSentenceSummary, summary, tags, mainPoints, keyQuotes）。

### 步骤 H: 保存翻译结果

```bash
python3 scripts/examples/bestblogs_save_translate_analysis_result.py \
  --id RAW_xxx \
  --json /tmp/podcast_translate_RAW_xxx.json \
  --language zh
```

**注意**：`score`、`remark`、`domain`、`aiSubcategory` **不传** — 保持分析阶段的原值。

> 步骤 G（翻译）和步骤 H（保存）**必须作为独立步骤分开执行**。

---

## 阶段五：输出最终结果

完整输出模板见 `references/workflow-details.md`。

输出需包含：每个播客的处理状态表格（ID、标题、审校/评分/分析/翻译状态）+ 统计汇总（审校/分析/翻译成功/失败/跳过数量、评分分布）。

---

## 错误处理

完整错误处理表见 `references/workflow-details.md`。核心原则：

- **始终检查 `success` 字段**
- `401`/`403`：立即暂停，提示更新认证信息
- podcast/content 返回 `null`：跳过该播客
- 审校失败：跳过审校，使用原始内容继续分析
- 分析/翻译 JSON 格式错误：重试一次，仍失败则跳过
- 单个播客任一步骤失败：记录错误，继续下一个
