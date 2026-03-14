---
name: bestblogs-translate-article-result
description: "BestBlogs 文章分析结果翻译工作流（中译英/英译中）。适用场景：(1) 将已分析的文章结果翻译为另一种语言，(2) 批量翻译文章摘要、标签、观点等分析字段，(3) 中文分析结果翻译为英文，(4) 英文分析结果翻译为中文，(5) 快捷翻译全部待翻译文章，(6) 快捷翻译前 N 篇文章。触发短语：'翻译文章结果', '翻译分析结果', 'translate article result', '文章翻译', 'article translation', '翻译摘要', 'translate summary', '中译英', '英译中', 'translate to english', 'translate to chinese', '批量翻译', 'batch translate', '翻译待处理', 'translate pending', 'bestblogs 翻译', 'bestblogs translate', '处理翻译', 'process translation', '翻译全部文章', 'translate all articles', '翻译前 10 篇', '翻译前 5 篇'。"
---

# 文章分析结果翻译 (Translate Article Result)

查询 BestBlogs 中等待翻译的文章 → 用户选择 → 逐篇获取分析结果、翻译并更新到 BestBlogs。

翻译基于已有的分析结果（`oneSentenceSummary`、`summary`、`tags`、`mainPoints`、`keyQuotes`），将其从原始语言翻译为目标语言。完整 API 参数详情见 `references/api_reference.md`。

## 认证

需要以下环境变量：

| 变量 | 用途 | 使用场景 |
|------|------|----------|
| `BESTBLOGS_ADMIN_USER_ID` | 管理员用户 ID | 查询文章列表、保存翻译结果 |
| `BESTBLOGS_ADMIN_JWT_TOKEN` | 管理员 JWT Token | 查询文章列表、保存翻译结果 |
| `BESTBLOGS_API_KEY` | OpenAPI 密钥 | 获取文章分析结果详情 |

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
| `/api/admin/article/list` | POST | 读取 | 查询等待翻译的文章列表 |
| `/openapi/v1/resource/meta` | GET | 读取 | 获取文章完整分析结果 |
| `/api/admin/article/saveAnalysisResult?id={id}` | POST | 写入 | 保存翻译后的分析结果 |

## 工作流概览（4 个阶段）

```
阶段一（查询待翻译文章）→ 阶段二（用户选择 / 快捷跳过）→ 阶段三（逐篇翻译）→ 阶段四（输出结果）
```

- [ ] 阶段一：查询等待翻译的文章列表
- [ ] 阶段二：展示列表，用户选择 ⚠️ REQUIRED（快捷模式跳过）
- [ ] 阶段三：逐篇处理（获取分析结果 → 翻译 → 保存结果）
- [ ] 阶段四：输出最终结果

### 快捷模式

当用户在触发 skill 时**已明确指定处理范围**，跳过阶段二的确认，直接进入阶段三：

| 用户输入 | 行为 |
|----------|------|
| "翻译全部文章" / "translate all articles" | 查询后直接翻译**全部**文章 |
| "翻译前 N 篇文章" / "翻译前 10 篇" | 查询后按列表顺序取**前 N 篇**翻译 |

快捷模式下仍然输出文章列表摘要（总数、语言分布），但**不等待用户选择**，立即开始翻译。若查询结果为空，正常提示"暂无等待翻译的文章"并结束。

---

## 阶段一：查询等待翻译的文章

使用 `WAIT_TRANSLATION` 查询等待翻译的文章：

```bash
curl -s -X POST https://api.bestblogs.dev/api/admin/article/list \
  -H "Authorization: Bearer $BESTBLOGS_ADMIN_JWT_TOKEN" \
  -H "User-Id: $BESTBLOGS_ADMIN_USER_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPage": 1,
    "pageSize": 50,
    "type": "ARTICLE",
    "flowStatusFilter": "WAIT_TRANSLATION",
    "startDate": "YYYY-MM-DD",
    "endDate": "YYYY-MM-DD"
  }'
```

- 日期默认为最近 1 周（`startDate` = 今天 -7 天，`endDate` = 今天）
- 若 `totalCount > 50`，自动翻页拉取全部（每页 50，最多 200 篇）

**始终检查 `success` 字段。** 查询为空时，提示"暂无等待翻译的文章"并结束。

---

## 阶段二：用户选择

展示文章列表：

```markdown
## 等待翻译的文章（共 N 篇）

| # | ID | 标题 | 来源 | 语言 | 评分 | 发布日期 |
|---|-----|------|------|------|------|---------|
| 1 | RAW_xxx | 文章标题 1 | 来源 A | 中文 | 85 | 2026-03-13 |
| 2 | RAW_yyy | 文章标题 2 | 来源 B | English | 90 | 2026-03-12 |

请选择要翻译的文章：
- "全部" — 翻译所有文章
- "1, 3, 5" — 翻译指定编号的文章
```

等待用户选择后继续。

---

## 阶段三：逐篇翻译

**严格串行处理。** 每篇文章必须完成以下 3 步后，再处理下一篇：

```
步骤 A: 获取分析结果 → 步骤 B: 翻译 → 步骤 C: 保存结果
```

### ID-内容关联安全

1. 处理每篇文章时，锁定当前 `{id}` 和内容的对应关系
2. `saveAnalysisResult` 必须使用与获取分析结果相同的 `{id}`
3. **禁止**将一篇文章的翻译结果保存到另一篇文章的 ID 上
4. **禁止**并行处理多篇文章

### 步骤 A: 获取文章分析结果

使用 OpenAPI resource meta 端点获取文章完整分析结果：

```bash
curl -s "https://api.bestblogs.dev/openapi/v1/resource/meta?id=RAW_xxx&language=zh_CN" \
  -H "X-API-KEY: $BESTBLOGS_API_KEY"
```

从响应中提取以下字段构造翻译输入：
- `title` — 标题
- `oneSentenceSummary` — 一句话总结
- `summary` — 全文摘要
- `tags` — 标签列表
- `mainPoints` — 主要观点（含 `point` 和 `explanation`）
- `keyQuotes` — 关键引用

若返回 `notExist` 或关键分析字段（`oneSentenceSummary`、`summary`）为空，说明文章尚未分析，在进度中标注 ❌ 分析结果不可用，**跳过该篇**，继续下一篇。

### 步骤 B: 翻译分析结果

**语言方向判断**：
- 根据文章的 `language` 字段判断原始语言
  - `zh_CN` → 原始语言：中文，目标语言：英文
  - `en_US` → 原始语言：英文，目标语言：中文
- 若语言字段为其他值，默认翻译为中文

**构造翻译输入 JSON**:

```json
{
  "title": "原始标题（来自分析结果）",
  "oneSentenceSummary": "一句话总结",
  "summary": "全文摘要",
  "tags": ["标签1", "标签2"],
  "mainPoints": [
    {"point": "观点1", "explanation": "解释1"},
    {"point": "观点2", "explanation": "解释2"}
  ],
  "keyQuotes": ["金句1", "金句2"]
}
```

**翻译要求**（AI 翻译专家角色）:

1. **术语处理**
   - 保留常用技术缩写：AI、UX、LLM、API、SDK、UI、ML、NLP、GPT 等
   - AI 领域翻译（英译中时）：Agent → 智能体，Memory → 记忆
   - 人名、公司名、产品名保持原文或直接翻译，不加括号注释
   - 全文术语翻译保持一致

2. **语言表达**
   - 意译而非直译，符合目标语言表达习惯
   - 保持原文语气和风格
   - 面向技术人员的阅读需求

3. **格式要求**
   - 中文与英文、数字之间添加空格
   - 保持原 JSON 结构和 key 名称不变

4. **输出要求**
   - **只输出翻译后的 JSON，不输出任何其他内容**
   - 禁止：解释说明、括号注释（如"某某（公司名）"）、术语列表、JSON 前后的文本

**翻译输出**：与输入结构完全相同的 JSON，所有文本字段翻译为目标语言。

### 步骤 C: 保存翻译结果

**端点**：`POST /api/admin/article/saveAnalysisResult?id={id}`，id 为 query 参数。

将翻译后的 JSON 作为请求体保存：

```bash
curl -s -X POST "https://api.bestblogs.dev/api/admin/article/saveAnalysisResult?id=RAW_xxx" \
  -H "Authorization: Bearer $BESTBLOGS_ADMIN_JWT_TOKEN" \
  -H "User-Id: $BESTBLOGS_ADMIN_USER_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "翻译后的标题（可选，仅原分析结果中有 title 时才传）",
    "oneSentenceSummary": "翻译后的一句话总结",
    "summary": "翻译后的全文摘要",
    "tags": ["Translated Tag1", "Translated Tag2"],
    "mainPoints": [
      {"point": "Translated point 1", "explanation": "Translated explanation 1"},
      {"point": "Translated point 2", "explanation": "Translated explanation 2"}
    ],
    "keyQuotes": ["Translated quote 1", "Translated quote 2"]
  }'
```

**注意**：
- 翻译阶段**不传** `score`、`remark`、`domain`、`aiSubcategory` — 这些字段保持分析阶段的原值
- `title` 仅在原分析结果包含该字段时才传入翻译版本
- 步骤 B（翻译）和步骤 C（保存）**必须作为独立步骤分开执行**。先确保翻译结果完整、JSON 合法，再调用保存 API

### 输出进度

每处理完一篇文章，更新进度：

```markdown
- [1/5] ✅ RAW_xxx — 文章标题 1 (中文 → English，已保存)
- [2/5] 🔄 RAW_yyy — 文章标题 2 翻译中...
- [3/5] ⏳ RAW_zzz — 文章标题 3
```

单篇文章任一步骤失败时，记录错误并继续处理下一篇。

---

## 阶段四：输出最终结果

```markdown
## 翻译结果

| # | ID | 标题 | 来源 | 翻译方向 | 获取分析 | 翻译 | 保存 |
|---|-----|------|------|----------|----------|------|------|
| 1 | RAW_xxx | 标题 1 | 来源 A | 中文→English | ✅ | ✅ | ✅ |
| 2 | RAW_yyy | 标题 2 | 来源 B | English→中文 | ✅ | ✅ | ✅ |
| 3 | RAW_zzz | 标题 3 | 来源 C | - | ❌ 分析结果不可用 | - | - |

### 统计
- 成功：2
- 失败：1

### 语言分布
- 中文→English：1 篇
- English→中文：1 篇
```

---

## 错误处理

| 错误 | 原因 | 处理 |
|------|------|------|
| `success: false` | API 返回错误 | 读取 `code` 和 `message`，告知用户 |
| `401` / `403` | Token 过期或无权限 | 立即暂停，提示用户更新认证信息 |
| meta 返回 `notExist` | 文章不存在 | 记录失败，跳过该文章，继续下一篇 |
| 分析字段为空 | 文章尚未分析 | 记录失败，跳过该文章，继续下一篇 |
| 翻译 JSON 格式错误 | 翻译输出不符合预期格式 | 重试翻译一次，仍失败则跳过 |
| saveAnalysisResult 失败 | 参数错误或服务端异常 | 记录失败，输出翻译 JSON 供手动重试 |
| 环境变量未设置 | 缺少认证信息 | 提示配置 `BESTBLOGS_ADMIN_USER_ID`、`BESTBLOGS_ADMIN_JWT_TOKEN`、`BESTBLOGS_API_KEY` |
