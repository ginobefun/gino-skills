---
name: bestblogs-process-videos
description: "BestBlogs 视频批量转录、内容更新与翻译复合工作流。适用场景：(1) 查询等待预处理的视频列表，(2) 批量转录 YouTube 视频并更新到 BestBlogs, (3) 自动根据优先级选择转录质量，(4) 视频内容预处理工作流，(5) 快捷处理全部视频（无需确认），(6) 快捷处理前 N 个视频，(7) 翻译待翻译视频的分析结果，(8) 中译英/英译中视频分析结果。触发短语：'处理视频', '视频预处理', 'process videos', '转录并更新', 'transcribe and update', '预处理视频', '批量转录', 'batch transcribe', '视频工作流', 'video workflow', 'bestblogs 视频', 'bestblogs video', '等待预处理', 'wait prepare', '视频转文字并更新', '处理待转录视频', 'process pending videos', '处理全部视频', 'process all videos', '处理前 10 个视频', '处理前 5 个', '翻译视频结果', '翻译视频分析结果', 'translate video result', '视频翻译', 'video translation', '翻译视频摘要', 'translate video summary', '翻译待处理视频', 'translate pending videos', '翻译全部视频', 'translate all videos', '翻译前 10 个视频', '翻译前 5 个视频'。"
---

# 视频批量转录、更新与翻译 (Process Videos)

查询 BestBlogs 中等待预处理的视频 → 用户选择 → 逐个转录并更新到 BestBlogs → 触发内容分析。若无待预处理视频，自动查询待翻译视频并处理翻译。

## 认证

需要两个环境变量：

| 变量 | 用途 | 使用场景 |
|------|------|----------|
| `BESTBLOGS_ADMIN_USER_ID` | 管理员用户 ID | 查询视频列表、更新内容、保存翻译结果 |
| `BESTBLOGS_ADMIN_JWT_TOKEN` | 管理员 JWT Token | 查询视频列表、更新内容、保存翻译结果 |

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
| `/api/admin/article/list` | POST | 读取 | 查询等待预处理/翻译的视频列表 |
| `/api/admin/article/updateContent` | POST | 写入 | 更新视频转录内容 |
| `/api/admin/article/runAnalysisFlow?id={id}` | POST | 写入 | 触发服务端内容分析 |
| `/dify/resource/markdown` | GET | 读取 | 获取视频内容和已分析的结果（翻译阶段用） |
| `/api/admin/article/saveTranslateResult?id={id}` | POST | 写入 | 保存翻译后的分析结果 |

## 工作流概览（5 个阶段）

```
阶段一（查询视频列表）→ 阶段二（用户选择 / 快捷跳过）→ 阶段三（逐个处理）→ 阶段四（翻译待翻译视频）→ 阶段五（输出结果）
```

- [ ] 阶段一：查询等待预处理的视频列表（无则查询待翻译）
- [ ] 阶段二：展示列表，用户选择 ⚠️ REQUIRED（快捷模式跳过）
- [ ] 阶段三：逐个处理（转录 → 保存 → 更新内容 → 触发分析）
- [ ] 阶段四：翻译待翻译视频（处理 `WAIT_TRANSLATE` 状态的视频）
- [ ] 阶段五：输出最终结果

### 两种运行模式

**模式 A — 转录 + 翻译一体化**（默认）：
1. 查询 `WAIT_PREPARE` 状态视频
2. 逐个转录、更新内容、触发分析
3. 转录阶段完成后，自动查询 `WAIT_TRANSLATE` 状态视频并翻译

**模式 B — 仅翻译**（无待预处理视频时自动进入，或用户直接触发翻译相关短语）：
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

快捷模式下仍然输出视频列表摘要（总数、优先级分布），但**不等待用户选择**，立即开始处理。若查询结果为空，正常提示"暂无等待处理的视频"并结束。

---

## 阶段一：查询视频列表

### 转录模式（默认）

```bash
curl -s -X POST https://api.bestblogs.dev/api/admin/article/list \
  -H "Authorization: Bearer $BESTBLOGS_ADMIN_JWT_TOKEN" \
  -H "User-Id: $BESTBLOGS_ADMIN_USER_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPage": 1,
    "pageSize": 20,
    "type": "VIDEO",
    "flowStatusFilter": "WAIT_PREPARE"
  }'
```

响应结构：

```json
{
  "success": true,
  "data": {
    "currentPage": 1,
    "pageSize": 20,
    "pageCount": 1,
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
        "publishDate": "2025-03-01T00:00:00.000+00:00",
        "publishDateStr": "2025-03-01"
      }
    ]
  }
}
```

### 自动降级为翻译模式

若 `WAIT_PREPARE` 结果为空，**自动查询 `WAIT_TRANSLATE`**：

```bash
curl -s -X POST https://api.bestblogs.dev/api/admin/article/list \
  -H "Authorization: Bearer $BESTBLOGS_ADMIN_JWT_TOKEN" \
  -H "User-Id: $BESTBLOGS_ADMIN_USER_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPage": 1,
    "pageSize": 20,
    "type": "VIDEO",
    "flowStatusFilter": "WAIT_TRANSLATE"
  }'
```

若待翻译视频也为空，提示"暂无等待处理的视频（预处理和翻译均无待处理）"并结束。

**始终检查 `success` 字段。**

---

## 阶段二：用户选择

展示视频列表：

```markdown
## 等待预处理的视频（共 N 个）  ← 或"等待翻译的视频"

| # | ID | 标题 | 链接 | 来源 | 优先级 | 语言 | 发布日期 |
|---|-----|------|------|------|--------|------|---------|
| 1 | RR_xxx | 视频标题 1 | [YouTube](https://www.youtube.com/watch?v=xxx) | 来源 A | HIGH | English | 2025-03-01 |
| 2 | RR_yyy | 视频标题 2 | [YouTube](https://www.youtube.com/watch?v=yyy) | 来源 B | MEDIUM | 中文 | 2025-02-28 |

请选择要处理的视频：
- "全部" — 处理所有视频
- "1, 3, 5" — 处理指定编号的视频
```

等待用户选择后继续。

---

## 阶段三：逐个处理

> **仅在转录模式下执行。** 翻译模式直接跳到阶段四。

**严格串行处理。** 每个视频必须完成以下 4 步后，再处理下一个视频：

```
步骤 A: 转录视频 → 步骤 B: 保存文件 → 步骤 C: 更新内容 → 步骤 D: 触发分析
```

### ID-内容关联安全

1. 处理每个视频时，锁定当前 `{id}` 和 `{url}` 的对应关系
2. 文件名包含 `{id}`，作为关联凭证
3. `updateContent` 和 `runAnalysisFlow` 必须使用同一个 `{id}`
4. **禁止**将一个视频的转录结果更新到另一个视频的 ID 上
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

文件保存到当前工作目录的 `./contents/tmp/transcribe/` 下，文件名：`transcribe-{id}-{yyyyMMddHHmmss}.md`。

> **注意**：`pro` 模式会调用 Gemini Pro（需时较长），若 Chrome AppleScript 超时（`ETIMEDOUT`），自动降级为 `think` 模式重试一次。两次均失败时记录错误并跳过。

### 步骤 C: 更新内容

读取步骤 B 保存的文件内容，**去除第一行的 H1 标题**（以 `# ` 开头的行）后，调用 API 更新。`id` 必须与文件名中的 `{id}` 一致。

> 原因：页面已有标题展示元素，内容中若包含标题会导致重复。本地保存的文件保留标题，仅在上传时去除。

去除标题的处理逻辑（python3）:
```python
lines = content.split('\n')
# 跳过开头的空行和第一个 H1 标题行
start = 0
for i, line in enumerate(lines):
    if line.startswith('# '):
        start = i + 1
        break
content_without_title = '\n'.join(lines[start:]).lstrip('\n')
```

```bash
curl -s -X POST https://api.bestblogs.dev/api/admin/article/updateContent \
  -H "Authorization: Bearer $BESTBLOGS_ADMIN_JWT_TOKEN" \
  -H "User-Id: $BESTBLOGS_ADMIN_USER_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "RR_xxx",
    "markdownContent": "转录的 Markdown 内容..."
  }'
```

只传 `markdownContent`，服务端会自动转换为 `displayDocument` (HTML)。

### 步骤 D: 触发内容分析

updateContent 成功后，使用**同一个 `{id}`** 触发分析：

```bash
curl -s -X POST "https://api.bestblogs.dev/api/admin/article/runAnalysisFlow?id=RR_xxx" \
  -H "Authorization: Bearer $BESTBLOGS_ADMIN_JWT_TOKEN" \
  -H "User-Id: $BESTBLOGS_ADMIN_USER_ID" \
  -H "Content-Type: application/json"
```

> **重要**：步骤 C 和步骤 D **必须作为独立命令分开执行**，不能用 `&&` 链式调用。原因：`--data-raw` 传递大内容时，curl 在服务端已成功响应后可能因 SSL 连接重置而返回 exit code 35，导致 `&&` 后的命令不执行。

### 输出进度

每处理完一个视频，更新进度：

```markdown
- [1/3] ✅ RR_xxx — 视频标题 1 (pro, 12345 字，已更新，已触发分析)
- [2/3] 🔄 RR_yyy — 视频标题 2 (think) 处理中...
- [3/3] ⏳ RR_zzz — 视频标题 3 (think)
```

单个视频任一步骤失败时，记录错误并继续处理下一个视频。

---

## 阶段四：翻译

### 模式 A — 转录后翻译

转录阶段完成后，自动查询 `WAIT_TRANSLATE` 状态的视频（`type: "VIDEO"`），对查询到的视频逐个执行翻译。若无待翻译视频，跳过此阶段。

### 模式 B — 独立翻译

当无待预处理视频（或用户直接触发翻译短语）时，对阶段一查询到的 `WAIT_TRANSLATE` 视频逐篇执行步骤 E → F → G。

**严格串行处理。** 每个视频执行：

```
步骤 E: 获取分析结果 → 步骤 F: 翻译 → 步骤 G: 保存翻译结果
```

### 步骤 E: 获取视频内容和分析结果

使用 `/dify/resource/markdown` 端点获取：

```bash
curl -s "https://api.bestblogs.dev/dify/resource/markdown?id=RR_xxx&language=zh"
```

> **注意**：此端点无需认证头，`language` 参数影响 `languageName` 和 `destLanguageName` 的显示语言。

关键字段：
- `languageName` — 原始语言（如"中文"、"English"）
- `destLanguageName` — 目标翻译语言
- `analysisResult` — 已分析的结构化结果（**JSON 字符串**，需解析）

若 `success` 为 `"false"` 或 `analysisResult` 为空，跳过该视频。

### 步骤 F: 翻译分析结果

**语言方向判断**：使用 `/dify/resource/markdown` 返回的 `languageName` 和 `destLanguageName`。

**翻译要求**（AI 翻译专家角色）:

1. **术语处理**
   - 常见技术术语直接使用，不加括号注释：AI、Agent、RAG、LLM、API、SDK、UI、UX、ML、NLP、GPT 等
   - 禁止写成「人工智能（AI）」「AI Agent（AI 智能体）」等冗余形式
   - AI 领域翻译（英译中时）：Agent → 智能体，Memory → 记忆
   - 人名、公司名、产品名保持原文或直接翻译，不加括号注释
   - 全文术语翻译保持一致

2. **语言表达**
   - 意译而非直译，使用更为地道的表述方式，确保内容准确、逻辑连贯、表达流畅
   - 尽量减少使用引号和破折号
   - 中文引号使用「」替换""
   - 保持原文语气和风格
   - 面向技术人员的阅读需求

3. **格式要求**
   - 中文与英文、数字之间添加空格
   - 可适当使用基础 Markdown 语法（**强调**、`代码`），但不要过多使用
   - 保持原 JSON 结构和 key 名称不变

4. **输出要求**
   - **只输出翻译后的 JSON，不输出任何其他内容**
   - 禁止：解释说明、括号注释、术语列表、JSON 前后的文本

**翻译输出**：与输入结构完全相同的 JSON，所有文本字段翻译为目标语言：

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

### 步骤 G: 保存翻译结果

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

> 步骤 F（翻译）和步骤 G（保存）**必须作为独立步骤分开执行**。

### 翻译进度

```markdown
- [1/3] ✅ RR_xxx — 视频标题 1 (English → 中文，已保存)
- [2/3] 🔄 RR_yyy — 视频标题 2 翻译中...
- [3/3] ⏳ RR_zzz — 视频标题 3
```

---

## 阶段五：输出最终结果

```markdown
## 处理结果

| # | ID | 标题 | 链接 | 转录 | 更新 | 分析 | 翻译 |
|---|-----|------|------|------|------|------|------|
| 1 | RR_xxx | 标题 1 | [YouTube](url) | ✅ 12345 字 | ✅ | ✅ | ✅ English→中文 |
| 2 | RR_yyy | 标题 2 | [YouTube](url) | ✅ 8901 字 | ✅ | ✅ | ✅ 中文→English |
| 3 | RR_zzz | 标题 3 | [YouTube](url) | ❌ 转录失败 | - | - | - |

### 统计
- 转录成功：2 / 失败：1
- 翻译成功：2 / 跳过：0 / 失败：0
```

仅翻译模式下省略转录、更新、分析列：

```markdown
## 翻译结果

| # | ID | 标题 | 链接 | 语言方向 | 翻译 |
|---|-----|------|------|----------|------|
| 1 | RR_xxx | 标题 1 | [YouTube](url) | English→中文 | ✅ |
| 2 | RR_yyy | 标题 2 | [YouTube](url) | 中文→English | ✅ |

### 统计
- 翻译成功：2 / 失败：0
```

---

## 错误处理

| 错误 | 原因 | 处理 |
|------|------|------|
| `success: false` | API 返回错误 | 读取 `code` 和 `message`，告知用户 |
| `401` / `403` | Token 过期或无权限 | 立即暂停，提示用户更新 `BESTBLOGS_ADMIN_JWT_TOKEN`（可在 `~/.claude/settings.json` 的 `env` 中更新） |
| `ETIMEDOUT`（Chrome AppleScript 超时） | `pro` 模式响应过慢或 Chrome 繁忙 | 自动降级为 `think` 重试一次；若仍失败，记录并跳过 |
| `ERR:parse_failed` | Gemini 无法解析该视频（可能是私有/受限/格式不支持） | 记录失败，跳过，继续下一个 |
| curl exit 35 on updateContent | SSL 连接在服务端响应后重置（内容已成功写入） | 忽略 exit code，单独执行 runAnalysisFlow |
| 转录失败（其他） | Chrome 未登录 / 网络问题 | 记录失败，跳过该视频的后续步骤，继续下一个 |
| updateContent 失败 | 内容过大或 ID 不存在 | 记录失败，跳过 runAnalysisFlow，文件已保存可手动重试 |
| runAnalysisFlow 失败 | 服务端异常 | 记录失败，不影响其他视频，可手动重触发 |
| `/dify/resource/markdown` 返回 `success: "false"` | 视频内容不可用 | 跳过翻译，继续下一个 |
| `analysisResult` 为空 | 视频尚未完成分析 | 跳过翻译，继续下一个 |
| 翻译 JSON 格式错误 | 翻译输出不符合预期格式 | 重试翻译一次，仍失败则跳过 |
| saveTranslateResult 失败 | 参数错误或服务端异常 | 记录失败，输出翻译 JSON 供手动重试 |
| 环境变量未设置 | 缺少认证信息 | 提示配置 `BESTBLOGS_ADMIN_USER_ID` 和 `BESTBLOGS_ADMIN_JWT_TOKEN` |
