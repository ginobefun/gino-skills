---
name: bestblogs-article-recommender
description: "Use when 用户想为一条 BestBlogs 内容生成中英文推荐语，并可选更新 BestBlogs 中的 featured reason。"
---

# BestBlogs 文章推荐语生成器

为 BestBlogs.dev 内容生成两个版本的中英文推荐语，用于精选周刊展示。推荐语聚焦文章核心观点、关键信息和亮点内容，帮助读者快速判断是否值得阅读。

## When to Use

- 用户已经有明确的 BestBlogs 资源 ID 或详情页链接，需要生成精选推荐语
- 用户要为单篇或少量内容写中英文推荐文案，而不是整期周刊
- 用户可能需要在生成后把 featured reason 回写到 BestBlogs

## When Not to Use

- 需要挑选本周内容或生成整期周刊时，使用 `bestblogs-weekly-curator`
- 需要对待审内容做评分纠偏和阅读 shortlist 时，使用 `bestblogs-content-reviewer`
- 只想查看内容原文或元数据时，使用 `bestblogs-fetcher`

## Gotchas

- 更新 featured reason 是写操作，必须先给用户看两个版本并等待明确选择
- `meta` 和 `markdown` 需要分开取；`markdown` 缺失时只能退化为基于元数据写推荐语
- 推荐语必须忠于原文，不能为了“好看”补充未出现的观点
- 批量模式下先统一生成，再统一询问是否回写，避免边写边改造成状态混乱

## Related Skills

- `bestblogs-fetcher`：获取正文、元数据和期刊详情
- `bestblogs-weekly-curator`：为整期周刊生成标题与推荐语
- `bestblogs-weekly-blogger`：把周刊进一步扩写为博客文章
- `bestblogs-content-reviewer`：先做评分 review，再把值得推荐的内容送到这里

## 认证

需要以下环境变量：

| 变量 | 用途 | 使用场景 |
|------|------|----------|
| `BESTBLOGS_API_KEY` | OpenAPI 密钥 | 获取内容元数据和正文 |
| `BESTBLOGS_ADMIN_USER_ID` | 管理员用户 ID | 更新推荐理由 |
| `BESTBLOGS_ADMIN_JWT_TOKEN` | 管理员 JWT Token | 更新推荐理由 |

**OpenAPI 请求**（获取内容数据）:
```bash
-H "X-API-KEY: $BESTBLOGS_API_KEY"
```

**Admin API 请求**（更新推荐理由）:
```bash
-H "Authorization: Bearer $BESTBLOGS_ADMIN_JWT_TOKEN"
-H "User-Id: $BESTBLOGS_ADMIN_USER_ID"
-H "Content-Type: application/json"
```

若必要的环境变量未设置，提示用户配置。Admin 环境变量仅在用户选择更新推荐理由时才需要。

接口地址：`https://api.bestblogs.dev`

## 工作流

### 第一步：解析输入，提取内容 ID

用户输入格式：
- 完整链接：`https://www.bestblogs.dev/article/8a16b2e5` → 提取 `8a16b2e5`
- 短 ID: `8a16b2e5` → 直接使用
- 带前缀 ID: `RAW_8a16b2e5` → 直接使用

从 URL 中提取最后一段路径作为 ID。

### 第二步：并行获取内容数据

同时发起两个请求：

```bash
# 获取元数据（标题、摘要、观点、金句、标签等）
curl -s "https://api.bestblogs.dev/openapi/v1/resource/meta?id={ID}" \
  -H "X-API-KEY: $BESTBLOGS_API_KEY"

# 获取 Markdown 正文
curl -s "https://api.bestblogs.dev/openapi/v1/resource/markdown?id={ID}" \
  -H "X-API-KEY: $BESTBLOGS_API_KEY"
```

若 meta 接口返回错误或 `success: false`，提示用户检查 ID 是否正确。markdown 接口返回 null 时，仅基于 meta 数据生成推荐语。

### 第三步：分析内容

从获取的数据中提取关键信息：

**从 meta 数据中获取**:
- `title`: 文章标题
- `summary`: 摘要
- `oneSentenceSummary`: 一句话摘要
- `mainPoints`: 主要观点列表（含 `point` 和 `explanation`）
- `keyQuotes`: 核心金句
- `tags`: 标签
- `category` / `subCategory`: 分类
- `type`: 内容类型（ARTICLE / VIDEO / PODCAST / TWITTER）
- `authors`: 作者
- `sourceName`: 来源

**从 Markdown 正文中获取**:
- 文章的论证逻辑和结构
- 具体的数据、案例、方法论
- 作者的独特视角或创新之处

**分析要点**:
1. 这篇内容的核心价值是什么？
2. 最值得读者关注的 2-3 个关键信息是什么？
3. 对目标读者有什么实际价值？
4. 内容的独特之处或创新点在哪里？

### 第四步：识别内容领域和类型

根据 `category` 和 `type` 调整推荐语风格。详细的领域和类型指导见 `references/examples_and_guidelines.md`。

**内容领域**:
- 人工智能：关注技术深度、实际应用、性能数据
- 编程技术：关注代码质量、架构设计、工具实践
- 产品开发：关注用户价值、策略框架、实操方法
- 商业科技：关注商业模式、市场洞察、决策依据

**内容类型**:
- 文章：聚焦核心论点和关键收获
- 视频：注明时长，强调演示和视觉学习价值
- 播客：注明时长和嘉宾，突出讨论主题
- 推文/推文串：捕捉核心论点，简洁有力

### 第五步：撰写两个版本的推荐语

**版本一：推荐版本（Standard）**
- 中文 150-200 字，英文 80-120 词
- 完整呈现内容价值，涵盖核心观点和关键亮点
- 结构：主题定位 → 核心内容 → 关键亮点 → 实际价值
- 语气：专业、客观、信息密度高

**版本二：精炼简洁版本（Concise）**
- 中文 80-120 字，英文 50-80 词
- 只保留最核心的信息，适合快速扫描
- 结构：核心主题 → 关键方法/内容 → 直接价值
- 语气：直接、精炼、无冗余

### 第六步：质量检查

撰写完成后，逐条检查：

**内容准确性**:
- 所有信息均来自原文，没有编造或过度推断
- 核心观点准确反映文章内容
- 数据、术语引用正确

**语言质量**（详细规范见 `references/writing_standards.md`）:
- 中文表达自然流畅，无翻译腔
- 英文地道专业，非中文直译
- 中英文、数字之间有空格（如 `LLM 应用开发`、`性能提升了 50%`）
- 使用正确的中文标点（，。、：""）
- 无多余引号、破折号、复杂句式

**术语处理**（详细规范见 `references/terminology_guidelines.md`）:
- 通用技术术语保持英文：API、LLM、RAG、SDK、CI/CD
- 有公认中文译名的概念用中文：机器学习、深度学习、代码审查
- 中英文版本术语处理保持一致

**版本差异化**:
- 版本一和版本二有明确的信息层次差异
- 版本二不是版本一的简单删减，而是重新提炼

### 第七步：用户确认与更新推荐理由

输出两个版本后，询问用户是否需要更新该内容的推荐理由：

- 用户选择 **版本一** 或 **版本二** → 调用 admin API 更新
- 用户选择 **不更新** → 跳过

**更新推荐理由** — 写操作，必须在用户明确确认后才能调用：

```bash
python3 scripts/examples/bestblogs_update_featured_reason.py \
  --id "{RESOURCE_ID}" \
  --zh-text "中文推荐语" \
  --en-text "English recommendation"
```

其中 `id` 使用第一步解析出的内容 ID，`zhFeaturedReason` 和 `enFeaturedReason` 使用用户选择的版本对应的中英文推荐语。

> 当前公开 references 没有给出 featured reason 的稳定读回字段。该模板会先写入，再读取 meta 做 best-effort 校验，并明确提示限制。

更新成功后告知用户。若失败，检查 admin 环境变量是否已配置。

## 输出模板

```markdown
## 版本一：推荐版本

### 中文

[推荐语正文]

### English

[Recommendation text]

---

## 版本二：精炼简洁版本

### 中文

[推荐语正文]

### English

[Recommendation text]
```

输出推荐语后，附加提示：

```
---
是否需要更新该内容的推荐理由？请选择：
- **1** — 使用版本一更新
- **2** — 使用版本二更新
- **跳过** — 不更新
```

## 写作核心原则

推荐语的目的是帮助读者快速判断一篇内容是否值得投入时间阅读，会作为精选周刊的描述内容展示。因此需要：

1. **聚焦核心**: 提炼文章最有价值的信息，而非泛泛概述
2. **信息准确**: 每个观点都有原文依据，不夸大不编造
3. **语句流畅**: 读起来顺畅自然，减少不必要的修饰和复杂句式
4. **可读性好**: 信息密度适中，结构清晰，扫一眼就能抓到重点

**避免的写法**:
- 过度使用引号：~~"AI"模型需要"结构化"的"短指令"~~ → AI 模型需要结构化的短指令
- 括号滥用：~~GitHub 团队 (基于大量用户反馈) 提供了 (经过验证的) 编写策略~~ → GitHub 团队基于大量用户反馈，提供了经过验证的编写策略
- 浮夸表述：~~这是史上最强大的、绝无仅有的、不可或缺的指南~~ → 这是一份实用的操作手册
- 空洞修饰：~~这篇文章写得很好，内容很丰富~~ → 文章系统介绍了 X 技术的核心原理和实践案例
- 口语过渡：~~那么，让我们来看看这篇文章主要讲了什么~~ → 文章主要介绍了...

## 批量处理

当用户提供多个 ID 或链接时：

1. 并行发起所有内容的 API 请求以提高效率
2. 逐个输出每篇内容的两版推荐语
3. 全部输出完成后，统一询问用户每篇内容的更新选择（版本一 / 版本二 / 跳过）
4. 用户确认后批量执行更新，逐条输出进度

## 错误处理

**OpenAPI 接口**:
- `401`: 检查 `BESTBLOGS_API_KEY` 是否已设置且有效
- `404`: 内容 ID 可能无效，提示用户检查
- `500`: 重试一次，仍然失败则告知用户
- meta 返回 `success: false`: 提示用户检查 ID
- markdown 返回 `null`: 仅基于 meta 数据生成（可能信息不够完整，告知用户）

**Admin API 接口**:
- `401/403`: 检查 `BESTBLOGS_ADMIN_JWT_TOKEN` 和 `BESTBLOGS_ADMIN_USER_ID` 是否已设置且有效，Token 可能已过期
- 返回 `success: false`: 展示错误信息，提示用户检查
