# 文章处理工作流详细参考

## 分析输出 JSON 格式

```json
{
  "title": "可选：仅在标题含网站名称等冗余信息时填写清理后的标题，否则省略",
  "oneSentenceSummary": "一句话核心总结，与原文同语言",
  "summary": "核心内容概要（200-400 字），与原文同语言",
  "domain": "一级分类代码：Artificial_Intelligence / Programming_Technology / Product_Development / Business_Tech / Productivity_Growth / Finance_Economy / News_Media / Lifestyle_Culture",
  "aiSubcategory": "二级分类代码（核心分类必填，通用分类留空）",
  "tags": ["与原文同语言的标签（3-8 个）"],
  "mainPoints": [{"point": "主要观点（3-5 条，与原文同语言）", "explanation": "观点解释（与原文同语言）"}],
  "keyQuotes": ["原文金句，必须逐字引用原文（3-5 句）"],
  "score": 85,
  "remark": "中文评分依据、分析和推荐等级"
}
```

## 领域分类枚举值

### 一级分类（`domain` 字段）

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

### 二级分类（`aiSubcategory` 字段，5 个核心分类必填，3 个通用分类留空）

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

### 分类判断关键边界

- **AI_CODING vs SE_***：AI 工具的使用方法/评测/技巧 → AI_CODING；工程实践本身只是恰好用了 AI → SE_*
- **AI_DEV vs AI_CODING**：构建 AI 应用（RAG/Agent）→ DEV；用 AI 辅助写代码 → AI_CODING
- **BT vs Productivity_Growth**：组织级管理/商业思考 → BT_INSIGHT；个人成长/效率 → PG_*
- **核心 vs 通用**：优先匹配 5 个核心分类；不匹配时归入 3 个通用分类

## 翻译输出 JSON 格式

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

## 阶段五：输出结果模板

```markdown
## 处理结果

| # | ID | 标题 | 来源 | 评分 | 领域 | 分析 | 翻译 |
|---|-----|------|------|------|------|------|------|
| 1 | RAW_xxx | 标题 1 | 来源 A | 85 | 人工智能 | ✅ | ✅ 中文→English |
| 2 | RAW_yyy | 标题 2 | 来源 B | 72 | 软件编程 | ✅ | ⏭️ <80分 |
| 3 | RAW_zzz | 标题 3 | 来源 C | - | - | ❌ 正文不可用 | - |

### 统计
- 分析成功：2 / 失败：1
- 翻译成功：1 / 跳过：1（<80 分）

### 评分分布
- 90+ 分：0 篇
- 80-89 分：1 篇（已翻译）
- 70-79 分：1 篇
- <70 分：0 篇
```

## 错误处理

| 错误 | 原因 | 处理 |
|------|------|------|
| `success: false` | API 返回错误 | 读取 `code` 和 `message`，告知用户 |
| `401` / `403` | Token 过期或无权限 | 立即暂停，提示用户更新认证信息 |
| markdown 返回 `null`/空字符串 | 正文未抓取或抓取异常 | 先调用 `runPrepareFlow`，成功后重试 markdown（最多 3 次），仍失败再跳过 |
| `runPrepareFlow` 失败 | 预处理接口异常或参数错误 | 记录失败并跳过该文章，继续下一篇 |
| 分析 JSON 格式错误 | 分析输出不符合预期格式 | 重试分析一次，仍失败则跳过 |
| saveAnalysisResult 失败 | 参数错误或服务端异常 | 记录失败，输出分析 JSON 供手动重试 |
| `/dify/resource/markdown` 返回 `success: "false"` | 文章内容不可用 | 跳过翻译，继续下一篇 |
| `analysisResult` 为空 | 文章尚未分析 | 跳过翻译，继续下一篇 |
| 翻译 JSON 格式错误 | 翻译输出不符合预期格式 | 重试翻译一次，仍失败则跳过 |
| saveTranslateResult 失败 | 参数错误或服务端异常 | 记录失败，输出翻译 JSON 供手动重试 |
| 环境变量未设置 | 缺少认证信息 | 提示配置 `BESTBLOGS_ADMIN_USER_ID`、`BESTBLOGS_ADMIN_JWT_TOKEN`、`BESTBLOGS_API_KEY` |
