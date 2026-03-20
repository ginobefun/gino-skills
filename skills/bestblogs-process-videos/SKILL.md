---
name: bestblogs-process-videos
description: "Use when 用户想批量处理 BestBlogs 待分析视频，包括转录、分析、评分，以及按需翻译高分内容。"
---

# 视频批量转录、分析与翻译 (Process Videos)

查询 BestBlogs 中等待处理的视频 → 用户选择 → 逐个转录、深度分析并更新 → **≥75 分自动翻译（可在触发时覆盖）** → 更新翻译结果。若无待预处理/分析视频，自动查询待翻译视频并处理。

评分体系基于统一评分规则（`docs/scoring-rubric.md`），视频类型的评估维度和输出格式见 `references/analysis_rubric.md`。完整 API 参数详情见 `references/api_reference.md`。

## When to Use

- 用户要处理 BestBlogs 后台等待预处理、分析或翻译的视频队列
- 用户需要一个 orchestrator 统一安排转录、内容更新、分析和翻译阶段
- 任务核心是批量视频处理，而不是单个 YouTube 视频转写

## When Not to Use

- 只要单个 YouTube transcript 时，使用 `bestblogs-transcribe-youtube`
- 只做某个单独阶段时，优先调用 `bestblogs-fetch-pending-content`、`bestblogs-analyze-content`、`bestblogs-translate-analysis-result`
- 想读取公开视频元数据或正文时，使用 `bestblogs-fetcher`

## Worker Routing

- `bestblogs-fetch-pending-content`：查询 `WAIT_PREPARE` / `WAIT_ANALYSIS` / `WAIT_TRANSLATE` 视频队列
- `bestblogs-transcribe-youtube`：单视频 transcript worker，用于 `WAIT_PREPARE` 场景
- `bestblogs-analyze-content`：对已有 transcript 或 markdown 的视频做结构化分析
- `bestblogs-translate-analysis-result`：对高分视频做翻译并保存

本 skill 负责状态分流、顺序控制和阶段衔接，不应重新承担全部单视频实现细节。

## Worker Entrypoints

优先把以下 `scripts/examples/` 当成稳定 worker 入口：

```bash
python3 scripts/examples/bestblogs_fetch_pending.py --type VIDEO --flow-status WAIT_PREPARE
python3 scripts/examples/bestblogs_fetch_pending.py --type VIDEO --flow-status WAIT_ANALYSIS
python3 scripts/examples/bestblogs_update_content.py --id RR_xxx --markdown-file ./contents/tmp/transcribe/transcribe-RR_xxx.md --strip-leading-h1
python3 scripts/examples/bestblogs_save_analysis.py --id RR_xxx --json /tmp/analysis.json
python3 scripts/examples/bestblogs_save_translate_analysis_result.py --id RR_xxx --json /tmp/translate.json
```

这些 worker 会输出统一 JSON 契约，至少包含：
- `ok`
- `action`
- `items`
- `write`
- `verify`
- `note`
- `meta`

orchestrator 应基于这些字段判断阶段是否完成，而不是依赖零散的 shell 输出。

## Gotchas

- `WAIT_PREPARE` 和 `WAIT_ANALYSIS` 的处理路径不同，不能假设两者都要重新转录
- 上传 transcript 与保存分析结果要分成独立命令，避免大内容请求失败时阻断后续步骤
- 转录文件名必须带上内容 ID，作为回写时的关联凭证
- 自动翻译阈值和批次选择由 orchestrator 决定，不应在单视频 worker 中分散定义
- **英文视频的语言处理规则**：转录时使用中文输出文字稿；`saveAnalysisResult` 保存**英文**分析结果（title、summary 等字段均为英文）；`saveTranslateResult` 保存**中文**翻译结果。分类/领域不作为跳过处理的依据，以视频内容和质量为唯一评估标准

## Related Skills

- `bestblogs-fetch-pending-content`：后台队列查询 worker
- `bestblogs-transcribe-youtube`：单视频 transcript worker
- `bestblogs-analyze-content`：视频分析 worker
- `bestblogs-translate-analysis-result`：视频翻译 worker

## 认证

需要以下环境变量：

| 变量 | 用途 | 使用场景 |
|------|------|----------|
| `BESTBLOGS_ADMIN_USER_ID` | 管理员用户 ID | 查询列表、更新内容、保存分析/翻译结果 |
| `BESTBLOGS_ADMIN_JWT_TOKEN` | 管理员 JWT Token | 查询列表、更新内容、保存分析/翻译结果 |

所有请求需携带：

```bash
-H "Authorization: Bearer $BESTBLOGS_ADMIN_JWT_TOKEN"
-H "User-Id: $BESTBLOGS_ADMIN_USER_ID"
-H "Content-Type: application/json"
```

若环境变量未设置，提示用户配置。

接口地址：`https://api.bestblogs.dev`

## 转录脚本

本 skill 依赖 `bestblogs-transcribe-youtube` skill 的脚本，按以下顺序查找：

1. 项目内：`skills/bestblogs-transcribe-youtube/scripts/transcribe.ts`（相对于本 skill 的父目录）
2. 已安装：`~/.claude/skills/bestblogs-transcribe-youtube/scripts/transcribe.ts`

## 可用端点

| 端点 | 方法 | 类型 | 用途 |
|------|------|------|------|
| `/api/admin/article/list` | POST | 读取 | 查询等待预处理/分析/翻译的视频列表 |
| `/api/admin/article/updateContent` | POST | 写入 | 更新视频转录内容 |
| `/api/admin/article/saveAnalysisResult?id={id}` | POST | 写入 | 保存本地分析结果（评分、摘要、标签等） |
| `/dify/resource/markdown` | GET | 读取 | 获取视频内容和已分析的结果（WAIT_ANALYSIS 分析 / 翻译阶段用） |
| `/api/admin/article/saveTranslateResult?id={id}` | POST | 写入 | 保存翻译后的分析结果 |

## 工作流概览（5 个阶段）

```
阶段一（查询视频列表）→ 阶段二（用户选择）→ 阶段三（逐个转录+分析）→ 阶段四（翻译高分视频）→ 阶段五（输出结果）
```

- [ ] 阶段一：查询等待处理的视频列表（WAIT_PREPARE → WAIT_ANALYSIS → WAIT_TRANSLATE）
- [ ] 阶段二：展示列表，用户选择 ⚠️ REQUIRED（快捷模式跳过）
- [ ] 阶段三：逐个处理（转录 → 更新内容 → 深度分析 → 保存结果）
- [ ] 阶段四：翻译高分视频（≥翻译阈值自动翻译，默认 80，可在触发时覆盖）
- [ ] 阶段五：输出最终结果

### 两种运行模式

**模式 A — 转录/分析 + 翻译一体化**（默认）：
1. 查询 `WAIT_PREPARE` / `WAIT_ANALYSIS` 状态视频
2. 逐个转录、更新、本地分析、保存结果
3. 分析完成后 **≥翻译阈值的视频立即翻译**（默认 75，无需用户二次确认）
4. 低于阈值的视频跳过翻译

**模式 B — 仅翻译**（无待处理视频时自动进入，或用户直接触发翻译相关短语）：
1. 查询 `WAIT_TRANSLATE` 状态视频
2. 逐个翻译

### 快捷模式

当用户在触发 skill 时**已明确指定处理范围**，跳过阶段二的确认，直接进入阶段三：

| 用户输入 | 行为 |
|----------|------|
| "处理全部视频" / "process all videos" | 查询后直接处理**全部**视频 |
| "处理前 N 个视频" / "处理前 10 个" | 查询后按列表顺序取**前 N 个**处理 |
| "翻译全部视频" / "translate all videos" | 查询待翻译视频后直接翻译**全部** |
| "翻译前 N 个视频" | 查询待翻译视频后取**前 N 个**翻译 |
| "超过 N 分翻译" / "score > N" | 覆盖默认翻译阈值，当次处理使用 >N 分作为翻译条件 |

快捷模式下仍然输出视频列表摘要（总数、优先级/语言分布），但**不等待用户选择**，立即开始处理。若查询结果为空，正常提示"暂无等待处理的视频"并结束。

---

## 阶段一：查询视频列表

### 转录/分析模式（默认）

优先使用共享 worker 查询 `WAIT_PREPARE`，若结果为空则回退到 `WAIT_ANALYSIS`：

```bash
python3 scripts/examples/bestblogs_fetch_pending.py \
  --type VIDEO \
  --flow-status WAIT_PREPARE \
  --page-size 20 \
  --max-pages 4
```

- 默认查询最近 1 周；如需更精细日期范围，再切回 `--start-date` / `--end-date`
- 若 worker JSON 的 `items` 为空，自动改用 `--flow-status WAIT_ANALYSIS` 重试

worker JSON 的 `items` 即处理队列，`meta` 中记录查询条件。

### 自动降级为翻译模式

若 `WAIT_PREPARE` 和 `WAIT_ANALYSIS` 均为空，**自动查询 `WAIT_TRANSLATE`**：

```bash
python3 scripts/examples/bestblogs_fetch_pending.py \
  --type VIDEO \
  --flow-status WAIT_TRANSLATE \
  --page-size 20 \
  --max-pages 4
```

若待翻译视频也为空，提示"暂无等待处理的视频（预处理、分析和翻译均无待处理）"并结束。**始终检查 worker JSON 中的 `ok`、`items` 和 `meta`。**

---

## 阶段二：用户选择

展示视频列表（使用 `languageDesc` 字段显示语言）：

```markdown
## 等待预处理的视频（共 N 个）  ← 或"等待分析"/"等待翻译"

| # | ID | 标题 | 链接 | 来源 | 优先级 | 语言 | 评分 | 发布日期 |
|---|-----|------|------|------|--------|------|------|---------|
| 1 | RR_xxx | 视频标题 1 | [YouTube](url) | 来源 A | HIGH | English | 85 | 2025-03-01 |
| 2 | RR_yyy | 视频标题 2 | [YouTube](url) | 来源 B | MEDIUM | 中文 | 78 | 2025-02-28 |

请选择要处理的视频：
- "全部" — 处理所有视频
- "1, 3, 5" — 处理指定编号的视频
```

等待用户选择后继续。

---

## 阶段三：逐个处理

> **仅在转录/分析模式下执行。** 翻译模式直接跳到阶段四。

**严格串行处理。** 每个视频按状态执行对应步骤：

- **WAIT_PREPARE**：步骤 A → B → C → D → E（全流程）
- **WAIT_ANALYSIS**：步骤 D → E（通过 `/dify/resource/markdown` 获取已有内容，仅需分析）

```
步骤 A: 转录视频 → 步骤 B: 保存文件 → 步骤 C: 更新内容 → 步骤 D: 深度分析 → 步骤 E: 保存分析结果
```

### ID-内容关联安全

1. 处理每个视频时，锁定当前 `{id}` 和 `{url}` 的对应关系
2. 文件名包含 `{id}`，作为关联凭证
3. `updateContent`、`saveAnalysisResult` 必须使用同一个 `{id}`
4. **禁止**将一个视频的转录/分析结果更新到另一个视频的 ID 上
5. **禁止**并行处理多个视频

### 步骤 A+B: 转录并保存

根据优先级选择思考级别：

| 优先级 | 思考级别 |
|--------|---------|
| `HIGH` | `pro` |
| 其他 (`MEDIUM`, `LOW`, `NONE`) | `think` |

```bash
mkdir -p ./contents/tmp/transcribe && \
npx -y bun <TRANSCRIBE_SCRIPT> --thinking <level> -o ./contents/tmp/transcribe/transcribe-<id>-<yyyyMMddHHmmss>.md <video-url>
```

文件保存到 `./contents/tmp/transcribe/`，文件名：`transcribe-{id}-{yyyyMMddHHmmss}.md`。

> **注意**：`pro` 模式调用 Gemini Pro（需时较长），若超时（`ETIMEDOUT`），自动降级为 `think` 模式重试一次。两次均失败时记录错误并跳过。

### 步骤 C: 更新内容

读取步骤 B 保存的文件，**去除第一行 H1 标题**后调用 API 更新。`id` 必须与文件名中的 `{id}` 一致。

> 原因：页面已有标题展示元素，内容中包含标题会导致重复。本地文件保留标题，仅在上传时去除。

H1 去除：读取文件后，若首行以 `# ` 开头则移除该行，再 strip。

```bash
python3 scripts/examples/bestblogs_update_content.py \
  --id RR_xxx \
  --markdown-file ./contents/tmp/transcribe/transcribe-RR_xxx-YYYYmmddHHMMSS.md \
  --strip-leading-h1
```

> **重要**：步骤 C 和步骤 D **必须作为独立命令分开执行**，不能用 `&&` 链式调用。原因：大内容传输时 curl 可能因 SSL 连接重置返回 exit code 35（服务端已成功写入），`&&` 会阻断后续步骤。

### 步骤 D: 深度分析

使用转录内容和视频元数据（阶段一列表），按照 `references/analysis_rubric.md` 中的评分体系进行深度分析。

**获取转录内容**：WAIT_PREPARE 使用步骤 B 本地文件；WAIT_ANALYSIS 通过 `curl -s "https://api.bestblogs.dev/dify/resource/markdown?id=RR_xxx&language=zh"` 获取（无需认证头，`success` 为**字符串类型**，使用 `markdown` 字段）。

分析输入 XML 格式和输出 JSON 格式见 `references/workflow-details.md`。

**分析要求**（完整标准见 `references/analysis_rubric.md`，分析时**必须加载并遵循**）:

1. 仔细阅读全文，按视频评估维度打分：内容价值 (35)、实用性 (25)、相关性 (20)、制作质量 (10)、创新性 (10)
2. 考虑来源优先级和原创性，检查视频减分项（念稿式、搬运、标题党等）
3. **评分校正**：≥95/≥90/≥85 分别执行自检清单
4. **输出语言**：内容字段（title、summary 等）与视频**原始语言**一致，`remark` 始终中文，`domain`/`aiSubcategory` 用枚举值。**注意**：英文视频的转录文字稿虽为中文，但分析结果仍须用英文输出，以匹配原始语言方向

### 步骤 E: 保存分析结果

**端点**：`POST /api/admin/article/saveAnalysisResult?id={id}`，id 为 query 参数。

```bash
python3 scripts/examples/bestblogs_save_analysis.py \
  --id RR_xxx \
  --json /tmp/bestblogs-analysis-RR_xxx.json
```

> 步骤 D（分析）和步骤 E（保存）**必须作为独立步骤分开执行**。先确保 JSON 合法，再调用保存 API。

### 输出进度

每处理完一个视频，更新进度：

```markdown
- [1/5] ✅ RR_xxx — 视频标题 1 (pro, 12345 字, 85 分, Software_Engineering) → 🔄 翻译中...
- [2/5] ✅ RR_yyy — 视频标题 2 (think, 8901 字, 72 分, Product_Development) → ⏭️ 跳过翻译（低于阈值）
- [3/5] ⏳ RR_zzz — 视频标题 3
```

单个视频任一步骤失败时，记录错误并继续处理下一个视频。

---

## 阶段四：翻译

### 模式 A — 分析后自动翻译

分析阶段完成后，自动对 **≥翻译阈值**（默认 75，可在触发时通过"超过 N 分翻译"覆盖）的视频执行翻译。无需用户二次确认。

对每个高分视频执行：
```
步骤 F: 获取分析结果 → 步骤 G: 翻译 → 步骤 H: 保存翻译结果
```

### 模式 B — 独立翻译

当无待处理视频（或用户直接触发翻译短语）时，对阶段一查询到的 `WAIT_TRANSLATE` 视频逐个执行步骤 F → G → H。

**严格串行处理。** ID-内容关联安全规则同样适用于翻译阶段：
- 步骤 F 获取的内容必须与步骤 H 保存的 `{id}` 一致
- **禁止**将一个视频的翻译结果保存到另一个视频的 ID

### 步骤 F: 获取分析结果

**模式 A**（分析后翻译）：直接复用阶段三步骤 D 的分析结果 JSON，无需再次请求 API。

**模式 B**（独立翻译）：使用 `/dify/resource/markdown` 端点获取：

```bash
curl -s "https://api.bestblogs.dev/dify/resource/markdown?id=RR_xxx&language=zh"
```

> **注意**：此端点无需认证头。`language` 参数影响 `languageName` 和 `destLanguageName` 的显示语言。

关键字段：
- `languageName` — 原始语言（如"中文"、"English"）
- `destLanguageName` — 目标翻译语言
- `analysisResult` — 已分析的结构化结果（**JSON 字符串**，需 `JSON.parse` 解析）

> **重要**：`success` 字段为**字符串类型**（`"true"` / `"false"`），非布尔值。检查时用 `success === "true"` 而非 `success === true`。

若 `success` 为 `"false"` 或 `analysisResult` 为空/null，跳过该视频。

`analysisResult` 解析后结构与阶段三步骤 D 的分析输出 JSON 一致（含 `title`、`oneSentenceSummary`、`summary`、`tags`、`mainPoints`、`keyQuotes`）。

### 步骤 G: 翻译分析结果

**语言方向判断**：
- **模式 A**：根据视频的 `language` 字段（`zh_CN` → 中译英，`en_US` → 英译中）
- **模式 B**：使用 `/dify/resource/markdown` 返回的 `languageName` 和 `destLanguageName`

> **英文视频特殊说明**：英文视频转录为中文文字稿，但 `saveAnalysisResult` 保存的是英文分析结果，`saveTranslateResult` 保存的是中文翻译结果。翻译步骤即是将英文分析内容翻译成中文后保存。

**需翻译字段**：`title`, `oneSentenceSummary`, `summary`, `tags`, `mainPoints[].point/explanation`, `keyQuotes`
**保持不变（不传给翻译，也不传给保存接口）**：`score`, `remark`, `domain`, `aiSubcategory`

详细翻译要求见 `references/translation-requirements.md`，翻译时**必须加载并遵循**。

翻译输出 JSON 格式见 `references/workflow-details.md`（字段：title, oneSentenceSummary, summary, tags, mainPoints, keyQuotes）。

### 步骤 H: 保存翻译结果

```bash
python3 scripts/examples/bestblogs_save_translate_analysis_result.py \
  --id RR_xxx \
  --json /tmp/bestblogs-translate-RR_xxx.json
```

**注意**：`score`、`remark`、`domain`、`aiSubcategory`、`content` **不传** — 保持分析阶段的原值。

> 步骤 G（翻译）和步骤 H（保存）**必须作为独立步骤分开执行**。

### 翻译进度

```markdown
- [1/3] ✅ RR_xxx — 视频标题 1 (English → 中文，已保存)
- [2/3] ⏭️ RR_yyy — 视频标题 2 (分析结果为空，跳过翻译)
- [3/3] 🔄 RR_zzz — 视频标题 3 翻译中...
```

---

## 阶段五：输出最终结果

完整输出模板（模式 A 转录/分析+翻译、模式 B 仅翻译）见 `references/workflow-details.md`。

输出需包含：每个视频的处理状态表格（ID、标题、转录/评分/翻译状态）+ 统计汇总（成功/失败/跳过数量、评分分布）。

> **LOW 优先级预期**：LOW 优先级来源评分上限约 89 分，合格门槛 ≥80，翻译阈值默认 75，整批 LOW 视频中达到合格线的比例较低，但多数应满足翻译阈值，高比例跳过翻译时需检查阈值配置。

---

## 错误处理

完整错误处理表见 `references/workflow-details.md`。核心原则：

- **始终检查 `success` 字段**（`/dify/resource/markdown` 的 success 为**字符串**类型）
- `401`/`403`：立即暂停，提示更新认证信息
- `ETIMEDOUT`（pro 模式）：自动降级为 `think` 重试一次
- 单个视频任一步骤失败：记录错误，跳过该视频后续步骤，继续下一个
- 分析/翻译 JSON 格式错误：重试一次，仍失败则跳过
