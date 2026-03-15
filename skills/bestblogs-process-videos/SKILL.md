---
name: bestblogs-process-videos
description: "BestBlogs 视频批量转录、分析与翻译复合工作流。适用场景：(1) 查询等待预处理的视频列表，(2) 批量转录 YouTube 视频并更新到 BestBlogs, (3) 自动根据优先级选择转录质量，(4) 视频内容预处理与深度分析工作流，(5) 快捷处理全部视频（无需确认），(6) 快捷处理前 N 个视频，(7) 分析后自动翻译高分视频（≥80 分），(8) 翻译待翻译视频的分析结果，(9) 中译英/英译中视频分析结果。触发短语：'处理视频', '视频预处理', 'process videos', '转录并更新', 'transcribe and update', '预处理视频', '批量转录', 'batch transcribe', '视频工作流', 'video workflow', 'bestblogs 视频', 'bestblogs video', '等待预处理', 'wait prepare', '视频转文字并更新', '处理待转录视频', 'process pending videos', '处理全部视频', 'process all videos', '处理前 10 个视频', '处理前 5 个', '分析视频', 'analyze videos', '视频评分', 'video scoring', '翻译视频结果', '翻译视频分析结果', 'translate video result', '视频翻译', 'video translation', '翻译视频摘要', 'translate video summary', '翻译待处理视频', 'translate pending videos', '翻译全部视频', 'translate all videos', '翻译前 10 个视频', '翻译前 5 个视频'。"
---

# 视频批量转录、分析与翻译 (Process Videos)

查询 BestBlogs 中等待处理的视频 → 用户选择 → 逐个转录、深度分析并更新 → **≥80 分自动翻译** → 更新翻译结果。若无待预处理/分析视频，自动查询待翻译视频并处理。

评分体系基于统一评分规则（`docs/scoring-rubric.md`），视频类型的评估维度和输出格式见 `references/analysis_rubric.md`。完整 API 参数详情见 `references/api_reference.md`。

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
| `/dify/resource/markdown` | GET | 读取 | 获取视频内容和已分析的结果（翻译阶段用） |
| `/api/admin/article/saveTranslateResult?id={id}` | POST | 写入 | 保存翻译后的分析结果 |

## 工作流概览（5 个阶段）

```
阶段一（查询视频列表）→ 阶段二（用户选择）→ 阶段三（逐个转录+分析）→ 阶段四（翻译高分视频）→ 阶段五（输出结果）
```

- [ ] 阶段一：查询等待处理的视频列表（WAIT_PREPARE → WAIT_ANALYSIS → WAIT_TRANSLATE）
- [ ] 阶段二：展示列表，用户选择 ⚠️ REQUIRED（快捷模式跳过）
- [ ] 阶段三：逐个处理（转录 → 更新内容 → 深度分析 → 保存结果）
- [ ] 阶段四：翻译高分视频（≥80 分自动翻译，或处理待翻译视频）
- [ ] 阶段五：输出最终结果

### 两种运行模式

**模式 A — 转录/分析 + 翻译一体化**（默认）：
1. 查询 `WAIT_PREPARE` / `WAIT_ANALYSIS` 状态视频
2. 逐个转录、更新、本地分析、保存结果
3. 分析完成后 **≥80 分的视频立即翻译**（无需用户二次确认）
4. <80 分的视频跳过翻译

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

快捷模式下仍然输出视频列表摘要（总数、优先级/语言分布），但**不等待用户选择**，立即开始处理。若查询结果为空，正常提示"暂无等待处理的视频"并结束。

---

## 阶段一：查询视频列表

### 转录/分析模式（默认）

优先使用 `WAIT_PREPARE` 查询，若结果为空则回退到 `WAIT_ANALYSIS`：

```bash
curl -s -X POST https://api.bestblogs.dev/api/admin/article/list \
  -H "Authorization: Bearer $BESTBLOGS_ADMIN_JWT_TOKEN" \
  -H "User-Id: $BESTBLOGS_ADMIN_USER_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPage": 1,
    "pageSize": 20,
    "type": "VIDEO",
    "flowStatusFilter": "WAIT_PREPARE",
    "timeRange": "1w"
  }'
```

- 默认查询最近 1 周（`timeRange: "1w"`）
- 若 `WAIT_PREPARE` 结果为空，自动用 `flowStatusFilter: "WAIT_ANALYSIS"` 重试

响应结构：

```json
{
  "success": true,
  "data": {
    "currentPage": 1,
    "pageSize": 20,
    "totalCount": 5,
    "dataList": [
      {
        "id": "RR_xxx",
        "title": "视频标题",
        "url": "https://www.youtube.com/watch?v=xxx",
        "sourceName": "来源名",
        "priority": "HIGH",
        "priorityDesc": "高",
        "language": "en_US",
        "languageDesc": "English",
        "publishDate": "2025-03-01T00:00:00.000+00:00",
        "publishDateStr": "2025-03-01"
      }
    ]
  }
}
```

### 自动降级为翻译模式

若 `WAIT_PREPARE` 和 `WAIT_ANALYSIS` 均为空，**自动查询 `WAIT_TRANSLATE`**：

```bash
curl -s -X POST https://api.bestblogs.dev/api/admin/article/list \
  -H "Authorization: Bearer $BESTBLOGS_ADMIN_JWT_TOKEN" \
  -H "User-Id: $BESTBLOGS_ADMIN_USER_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPage": 1,
    "pageSize": 20,
    "type": "VIDEO",
    "flowStatusFilter": "WAIT_TRANSLATE",
    "timeRange": "1w"
  }'
```

若待翻译视频也为空，提示"暂无等待处理的视频（预处理、分析和翻译均无待处理）"并结束。

**始终检查 `success` 字段。**

---

## 阶段二：用户选择

展示视频列表（使用 `languageDesc` 字段显示语言）：

```markdown
## 等待预处理的视频（共 N 个）  ← 或"等待分析"/"等待翻译"

| # | ID | 标题 | 链接 | 来源 | 优先级 | 语言 | 发布日期 |
|---|-----|------|------|------|--------|------|---------|
| 1 | RR_xxx | 视频标题 1 | [YouTube](url) | 来源 A | HIGH | English | 2025-03-01 |
| 2 | RR_yyy | 视频标题 2 | [YouTube](url) | 来源 B | MEDIUM | 中文 | 2025-02-28 |

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
- **WAIT_ANALYSIS**：步骤 D → E（已有内容，仅需分析）

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

```bash
curl -s -X POST https://api.bestblogs.dev/api/admin/article/updateContent \
  -H "Authorization: Bearer $BESTBLOGS_ADMIN_JWT_TOKEN" \
  -H "User-Id: $BESTBLOGS_ADMIN_USER_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "RR_xxx",
    "markdownContent": "转录的 Markdown 内容（已去除 H1 标题）..."
  }'
```

> **重要**：步骤 C 和步骤 D **必须作为独立命令分开执行**，不能用 `&&` 链式调用。原因：大内容传输时 curl 可能因 SSL 连接重置返回 exit code 35（服务端已成功写入），`&&` 会阻断后续步骤。

### 步骤 D: 深度分析

使用转录内容（步骤 B 文件，或 WAIT_ANALYSIS 状态下通过 `/dify/resource/markdown` 获取的已有内容）和视频元数据（阶段一列表），按照 `references/analysis_rubric.md` 中的评分体系进行深度分析。

**构造分析输入 XML**:

```xml
<video>
  <metadata>
    <title>视频标题（来自列表 title 字段）</title>
    <source>来源名称（来自列表 sourceName 字段）</source>
    <url>原始链接（来自列表 url 字段）</url>
    <priority>来源优先级（来自列表 priority 字段）</priority>
  </metadata>
  <transcript>
    <![CDATA[
    转录的 Markdown 内容
    ]]>
  </transcript>
</video>
```

**分析要求**（完整标准见 `references/analysis_rubric.md`，分析时**必须加载并遵循**）:

1. 仔细阅读全文，理解核心论述和技术细节
2. 按视频评估维度打分：内容价值 (35)、实用性 (25)、相关性 (20)、制作质量 (10)、创新性 (10)
3. 考虑来源优先级（`priority` 字段）和原创性对评分的影响
4. 检查视频减分项（念稿式、搬运、标题党等）
5. **评分校正**：≥95/≥90/≥85 分别执行自检清单
6. **输出语言**：内容字段与视频同语言，`remark` 始终中文，`domain`/`aiSubcategory` 用枚举值

**分析输出 JSON**:

```json
{
  "title": "可选：仅在标题含冗余信息时填写清理后的标题",
  "oneSentenceSummary": "一句话核心总结（与视频同语言）",
  "summary": "核心内容概要（200-400 字，与视频同语言）",
  "domain": "一级分类代码",
  "aiSubcategory": "二级分类代码（核心分类必填，通用分类留空）",
  "tags": ["与视频同语言的标签（3-8 个）"],
  "mainPoints": [{"point": "主要观点", "explanation": "观点解释"}],
  "keyQuotes": ["原文金句，必须逐字引用转录内容"],
  "score": 85,
  "remark": "中文评分依据、分析和推荐等级"
}
```

### 步骤 E: 保存分析结果

**端点**：`POST /api/admin/article/saveAnalysisResult?id={id}`，id 为 query 参数。

```bash
curl -s -X POST "https://api.bestblogs.dev/api/admin/article/saveAnalysisResult?id=RR_xxx" \
  -H "Authorization: Bearer $BESTBLOGS_ADMIN_JWT_TOKEN" \
  -H "User-Id: $BESTBLOGS_ADMIN_USER_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "oneSentenceSummary": "...",
    "summary": "...",
    "domain": "Artificial_Intelligence",
    "aiSubcategory": "DEV",
    "tags": ["Tag1", "Tag2"],
    "mainPoints": [{"point": "...", "explanation": "..."}],
    "keyQuotes": ["..."],
    "score": 85,
    "remark": "中文评分依据"
  }'
```

> 步骤 D（分析）和步骤 E（保存）**必须作为独立步骤分开执行**。先确保 JSON 合法，再调用保存 API。

### 输出进度

每处理完一个视频，更新进度：

```markdown
- [1/5] ✅ RR_xxx — 视频标题 1 (pro, 12345 字, 85 分) → 🔄 翻译中...
- [2/5] ✅ RR_yyy — 视频标题 2 (think, 8901 字, 72 分) → ⏭️ 跳过翻译（<80 分）
- [3/5] ⏳ RR_zzz — 视频标题 3
```

单个视频任一步骤失败时，记录错误并继续处理下一个视频。

---

## 阶段四：翻译

### 模式 A — 分析后自动翻译

分析阶段完成后，自动对 **≥80 分** 的视频执行翻译。无需用户二次确认。

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

**`analysisResult` 解析后结构**：

```json
{
  "title": "视频标题",
  "oneSentenceSummary": "一句话总结",
  "summary": "全文摘要",
  "tags": ["标签1", "标签2"],
  "mainPoints": [{"point": "观点1", "explanation": "解释1"}],
  "keyQuotes": ["金句1", "金句2"]
}
```

### 步骤 G: 翻译分析结果

**语言方向判断**：
- **模式 A**：根据视频的 `language` 字段（`zh_CN` → 中译英，`en_US` → 英译中）
- **模式 B**：使用 `/dify/resource/markdown` 返回的 `languageName` 和 `destLanguageName`

**需翻译字段**：`title`, `oneSentenceSummary`, `summary`, `tags`, `mainPoints[].point/explanation`, `keyQuotes`
**保持不变（不传给翻译，也不传给保存接口）**：`score`, `remark`, `domain`, `aiSubcategory`

**翻译要求**（AI 翻译专家角色）:

1. **术语**：常见技术术语直接用，不加括号注释（AI、Agent、RAG、LLM 等）；AI 领域英译中：Agent → 智能体，Memory → 记忆；全文术语一致
2. **表达**：意译非直译，地道流畅；减少引号破折号；中文引号用「」；保持原文风格
3. **格式**：中英文/数字间加空格；保持原 JSON 结构和 key 不变
4. **输出**：**只输出翻译后的 JSON**，禁止解释说明、括号注释、术语列表

**翻译输出 JSON**：

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
curl -s -X POST "https://api.bestblogs.dev/api/admin/article/saveTranslateResult?id=RR_xxx" \
  -H "Authorization: Bearer $BESTBLOGS_ADMIN_JWT_TOKEN" \
  -H "User-Id: $BESTBLOGS_ADMIN_USER_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "翻译后的标题",
    "oneSentenceSummary": "翻译后的一句话总结",
    "summary": "翻译后的全文摘要",
    "tags": ["翻译后标签1", "翻译后标签2"],
    "mainPoints": [
      {"point": "翻译后的观点 1", "explanation": "翻译后的解释 1"}
    ],
    "keyQuotes": ["翻译后的金句 1", "翻译后的金句 2"]
  }'
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

### 模式 A — 转录/分析 + 翻译

```markdown
## 处理结果

| # | ID | 标题 | 链接 | 转录 | 评分 | 翻译 | 文件 |
|---|-----|------|------|------|------|------|------|
| 1 | RR_xxx | 标题 1 | [YouTube](url) | ✅ 12345 字 | 85 | ✅ English→中文 | transcribe-RR_xxx-xxx.md |
| 2 | RR_yyy | 标题 2 | [YouTube](url) | ✅ 8901 字 | 72 | ⏭️ <80分 | transcribe-RR_yyy-xxx.md |
| 3 | RR_zzz | 标题 3 | [YouTube](url) | ❌ 转录失败 | - | - | - |

### 统计
- 转录成功：2 / 失败：1 | 分析成功：2 | 翻译成功：1 / 跳过：1（<80 分）
- 评分分布：90+: 0 | 80-89: 1（已翻译） | 70-79: 1 | <70: 0
```

### 模式 B — 仅翻译

```markdown
## 翻译结果

| # | ID | 标题 | 链接 | 语言方向 | 翻译 |
|---|-----|------|------|----------|------|
| 1 | RR_xxx | 标题 1 | [YouTube](url) | English→中文 | ✅ |
| 2 | RR_yyy | 标题 2 | [YouTube](url) | 中文→English | ❌ 分析结果为空 |

### 统计
- 翻译成功：1 / 跳过：1
```

---

## 错误处理

| 错误 | 原因 | 处理 |
|------|------|------|
| `success: false` | API 返回错误 | 读取 `code` 和 `message`，告知用户 |
| `401` / `403` | Token 过期或无权限 | 立即暂停，提示用户更新 `BESTBLOGS_ADMIN_JWT_TOKEN`（可在 `~/.claude/settings.json` 的 `env` 中更新） |
| `ETIMEDOUT`（Chrome AppleScript 超时） | `pro` 模式响应过慢或 Chrome 繁忙 | 自动降级为 `think` 重试一次；若仍失败，记录并跳过 |
| `ERR:parse_failed` | Gemini 无法解析该视频（私有/受限/格式不支持） | 记录失败，跳过，继续下一个 |
| curl exit 35 on updateContent | SSL 连接在服务端响应后重置（内容已成功写入） | 忽略 exit code，继续步骤 D 分析 |
| 转录失败（其他） | Chrome 未登录 / 网络问题 | 记录失败，跳过该视频后续步骤，继续下一个 |
| updateContent 失败 | 内容过大或 ID 不存在 | 记录失败，跳过分析，文件已保存可手动重试 |
| 分析 JSON 格式错误 | 分析输出不符合预期格式 | 重试分析一次，仍失败则跳过 |
| saveAnalysisResult 失败 | 参数错误或服务端异常 | 记录失败，输出分析 JSON 供手动重试 |
| `/dify/resource/markdown` 返回 `success: "false"` | 视频内容不可用（注意 success 为**字符串**类型） | 跳过翻译，继续下一个 |
| `analysisResult` 为空/null | 视频尚未完成分析 | 跳过翻译，继续下一个 |
| `analysisResult` JSON 解析失败 | 格式异常 | 记录原始内容，跳过翻译，继续下一个 |
| 翻译 JSON 格式错误 | 翻译输出不符合预期格式 | 重试翻译一次，仍失败则跳过 |
| saveTranslateResult 失败 | 参数错误或服务端异常 | 记录失败，输出翻译 JSON 供手动重试 |
| 环境变量未设置 | 缺少认证信息 | 提示配置 `BESTBLOGS_ADMIN_USER_ID` 和 `BESTBLOGS_ADMIN_JWT_TOKEN` |
