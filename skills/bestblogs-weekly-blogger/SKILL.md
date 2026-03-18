---
name: bestblogs-weekly-blogger
description: "Use when 用户想把 BestBlogs 周刊一期内容扩写成带有更多评论、结构和配图的博客文章。"
---

# BestBlogs 周刊博客生成器 (Weekly Blogger)

从 BestBlogs.dev 已发布的周刊中，生成一篇图文并茂、风格连贯、具有个人洞察的博客文章。

博客不是周刊的简单搬运，而是一篇有主题线索、有层次感、有个人思考的深度导读。好的周刊博客让读者在 5 分钟内抓住本周 AI 领域最值得关注的趋势，同时在重点内容上获得超越摘要的理解。

完整 API 参数详情见 `references/api_reference.md`，博客写作风格指南见 `references/blog_style_guide.md`。

## When to Use

- 用户已经有一份 BestBlogs 周刊 issue，想进一步扩写成博客文章
- 用户希望把 issue 中的重点内容、个人洞察和视觉素材整合成更完整的叙事
- 输出目标是 blog post，而不是 issue copy 或原始候选池

## When Not to Use

- 还在挑本周哪些内容该进周刊时，使用 `bestblogs-weekly-curator`
- 只想生成单篇内容推荐语时，使用 `bestblogs-article-recommender`
- 只想浏览周刊或原始内容时，使用 `bestblogs-fetcher`

## Gotchas

- 这不是“把周刊摘要改写长一点”，必须先确定主题线索和重点文章
- 个人洞察是关键输入；没有用户补充时也要显式说明采用了默认推断
- 图片生成和上传是后续阶段，不应在文章结构尚未稳定前提前做
- 博客链接优先使用 BestBlogs 站内链接，避免正文里混入原站和聚合站两套 URL

## Related Skills

- `bestblogs-weekly-curator`：先产出周刊 issue 的选文与推荐语
- `bestblogs-fetcher`：读取周刊详情和重点文章正文
- `baoyu-cover-image`、`baoyu-article-illustrator`：补视觉素材时调用
- `baoyu-post-to-wechat`、`baoyu-post-to-x`：写完博客后继续分发

## 认证

所有请求需要 `X-API-KEY` 请求头。从环境变量 `BESTBLOGS_API_KEY` 读取密钥：

```bash
-H "X-API-KEY: $BESTBLOGS_API_KEY"
```

若 `BESTBLOGS_API_KEY` 未设置，提示用户配置。

接口地址：`https://api.bestblogs.dev`

## 进度清单

```
- [ ] 阶段一: 获取周刊数据
- [ ] 阶段二: 深度分析重点文章
- [ ] 阶段三: 收集个人洞察 ⚠️ 需用户输入
- [ ] 阶段四: 构思主题与结构
- [ ] 阶段五: 生成博客文章
- [ ] 阶段六: 生成配图与封面 ⚠️ 需确认风格
- [ ] 阶段七: 上传图片到 R2 并替换链接
```

---

## 阶段一：获取周刊数据

### 1.1 确定期数

用户通常会指定期数（如「写第 85 期博客」）。如果未指定，获取最新一期：

```bash
curl -s -X POST https://api.bestblogs.dev/openapi/v1/newsletter/list \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: $BESTBLOGS_API_KEY" \
  -d '{"currentPage":1,"pageSize":1,"userLanguage":"zh_CN"}'
```

### 1.2 获取周刊详情

```bash
curl -s "https://api.bestblogs.dev/openapi/v1/newsletter/get?id={ISSUE_ID}&language=zh_CN" \
  -H "X-API-KEY: $BESTBLOGS_API_KEY"
```

从响应中提取：
- `title`: 周刊标题（含关键词，如「驾驭工程」）
- `summary`: 完整推荐语（已包含 10 个亮点的提炼）
- `articles`: 完整文章列表（含 id, title, summary, sourceName, score, aiCategory, resourceType, sort 等）

### 1.3 读取参考博客

博客默认输出到 `/Users/gino/Documents/Github/ginonotes-blog/posts/reading/notes/`，用户也可以指定其他路径。

在该目录下查找最近的博客文件作为风格参考（最多 3 篇）:

```bash
ls /Users/gino/Documents/Github/ginonotes-blog/posts/reading/notes/ | grep bestblogs_weekly | tail -3
```

使用 Read 工具读取最近一篇（如有多篇，优先读最新的），理解：
- frontmatter 格式（title, date, description, category, tags, cover, slug）
- 章节组织方式（按主题而非分类平铺）
- 叙述风格和语言习惯
- 图片插入模式

### 1.4 初步分析

从周刊推荐语和文章列表中识别：
- 本期关键词/主题（从 `title` 提取，如「驾驭工程」「编排」）
- 各 aiCategory 的文章分布
- 高分文章（score >= 93）和精选文章（qualified: true）
- 需要重点展开的候选文章（3-5 篇）

---

## 阶段二：深度分析重点文章

不是所有文章都需要深度分析。选择 5-8 篇重点文章获取原始内容，其余依赖周刊提供的 summary 即可。

### 2.1 选择重点文章的标准

按以下优先级选取：
1. 与本期主题最相关、能串联主线的文章
2. 高分 + 高阅读量 + 精选的文章
3. 来自权威来源的重磅发布（头部厂商官方、知名技术博客）
4. 内容深度足以展开讨论的长文或深度访谈

### 2.2 获取文章 Markdown 内容

对选中的重点文章，并行获取原始内容（每批 5 个）:

```bash
curl -s "https://api.bestblogs.dev/openapi/v1/resource/markdown?id={ARTICLE_ID}" \
  -H "X-API-KEY: $BESTBLOGS_API_KEY"
```

返回的 `data` 字段为 Markdown 字符串。内容可能很长，重点关注：
- 文章的核心论点和框架
- 关键数据和引用
- 独特的洞察或判断
- 作者身份和背景（特别注意区分实际作者与发布平台）

如果 markdown 返回 null，回退到周刊提供的 summary 和 mainPoints。

### 2.3 深度分析要点

对每篇重点文章提炼：
- 核心论点（一句话）
- 为什么值得重点展开（对读者的价值）
- 与本期其他文章的关联（能否串联成主题线索）
- 需要在博客中澄清或补充的信息（如文章作者归属）

---

## 阶段三：收集个人洞察

⚠️ 这是需要用户参与的环节。

向用户询问以下信息（简洁地一次性问完，不要逐条追问）:

1. **个人近期动态**: 最近在做什么项目，有什么进展？（会融入开头和结尾）
2. **本期哪些内容印象深刻**: 有没有特别喜欢或想重点推荐的文章？
3. **个人思考**: 对本周 AI 趋势有什么感想或观点？
4. **补充信息**: 有没有需要特别说明或更正的内容？

周刊推荐语中通常包含个人近期动态和思考（一般在第二段），可以作为参考素材。如果用户表示没有特别想法或让 AI 自由发挥，可以基于推荐语中的内容生成，但仍建议向用户确认是否需要补充。

---

## 阶段四：构思主题与结构

这一步在写作前完成，决定博客的骨架。

### 4.1 确定主题线索

从周刊标题和推荐语中提取关键词作为全文主线。好的主题线索能把 20 篇文章串联成一个连贯的故事，而不是按 MODELS/DEV/PRODUCT/NEWS 机械分类。

**参考模式**（来自往期）:
- 第 84 期「编排」: 模型能力提升 → 工程师角色转变 → 实践落地 → 深层思考
- 第 85 期「驾驭工程」: 模型大一统 → 驾驭工程方法论 → 一线实践 → 设计变革 → 哲学思考

### 4.2 设计章节结构

通常 5-7 个章节，每个章节围绕一个子主题，包含 2-5 篇文章。章节之间有逻辑递进关系。

**结构原则**:
- 重磅发布或最重要的内容放在前面
- 方法论和框架性内容集中展开
- 实践案例紧跟方法论
- 产品和设计可以独立成节或并入实践
- 深度思考和哲学性内容放在靠后位置
- 结尾是个人感想，回扣主题

**篇幅分配不应均匀**。重点文章（如本周的头条发布、最有深度的方法论文章、个人最喜欢的内容）应该用 200-400 字展开讨论，包含文章的核心论点、关键细节和个人解读。普通文章 50-100 字带过即可。这种层次感是博客区别于简单列表的关键。

### 4.3 简要大纲

在开始写作前，先列出：
- 各章节标题
- 每章包含哪些文章
- 哪些文章是重点展开的（标记出来）
- 章节间的过渡逻辑

---

## 阶段五：生成博客文章

### 5.1 文件信息

**默认路径**: `/Users/gino/Documents/Github/ginonotes-blog/posts/reading/notes/{DATE}_bestblogs_weekly_issue_{N}.mdx`

其中 `{DATE}` 为 YYYYMMDD 格式，`{N}` 为期数。用户可以指定其他输出路径。

**Frontmatter**:

```yaml
---
title: BestBlogs 周刊第 {N} 期：{关键词}
date: {YYYY-MM-DD}
description: {一句话描述本期主题和亮点，50-80 字}
category: reading
tags: BestBlogs, {3-4 个相关标签}
cover: cover_bestblogs_{N}.png
slug: bestblogs-weekly-issue-{N}
---
```

### 5.2 图片占位符

写作阶段先使用占位路径，阶段六会生成实际图片并替换：

```markdown
![章节描述](bestblogs-issue-{N}-{seq}.png)
```

其中 `{seq}` 从 1 开始递增。通常 6-8 张图。首图和尾图固定：
- 首图：`bestblogs-issue-{N}-1.png`（周刊标题图）
- 尾图：`bestblogs-issue-{N}-{last}.png`（「保持好奇，我们下周见」）

### 5.3 写作风格

详见 `references/blog_style_guide.md`，核心要点：

- 中文为主，英文专有名词保留原文，中英文和数字之间加空格
- 叙述流畅自然，像在和朋友分享本周读到的好内容
- 减少引号、破折号和复杂句式
- 文章链接统一使用 BestBlogs 站内链接 (`readUrl` 字段)
- 提及文章时自然嵌入链接，不要单独列出链接行
- 信息必须准确：作者归属、数据引用、核心论点都要与原文一致
- 对于发布在第三方平台的文章（如 martinfowler.com），注意区分平台和实际作者

### 5.4 结构模板

```
开头段（2-3 段）
  - 本期关键词和主题概述
  - 个人近期动态（1-2 句）
  - 首图

章节 1: {重磅内容}
  - 章节配图
  - 重点展开 1-2 篇核心文章
  - 其他相关文章简要提及

章节 2-5: {各子主题}
  - 按主题组织，不按分类
  - 重点文章深入讨论，普通文章简要串联
  - 章节间有过渡句

思考/感悟章节
  - 深度内容或哲学性讨论
  - 与本期主题呼应

结尾段
  - 回扣主题关键词
  - 个人感想（3-5 句，点到为止）
  - 链接到 BestBlogs.dev 完整周刊
  - 「保持好奇，我们下周见。」
  - 尾图
```

### 5.5 输出

使用 Write 工具直接创建 MDX 文件。写完后告知用户：
- 文件路径
- 章节结构概览
- 图片占位符列表（含 alt 描述，用于阶段六生成提示词）
- 需要人工核实的信息点（如有）

继续进入阶段六生成配图。

---

## 阶段六和七：配图生成与上传

配图生成（image-gen CLI）和 R2 上传的完整流程详见 `references/image_workflow.md`，包含环境变量检查、图片生成命令、R2 上传脚本和链接替换步骤。

核心要点：
- 环境变量：`GOOGLE_API_KEY`（图片生成）、`CLOUDFLARE_ACCOUNT_ID` / `R2_*`（上传）
- 工作目录：`/tmp/bestblogs-issue-{N}/`
- 图片占位符替换为 `{R2_PUBLIC_URL}/Banana/` 下的实际 URL

---

## 错误处理

**重要**: 始终先检查 `response.success` 再处理 `response.data`。

| 错误 | 处理 |
|------|------|
| `401` (AUTH_001/002) | 检查 `BESTBLOGS_API_KEY` 是否设置且有效 |
| `404` (NOT_FOUND) | 周刊期数可能不存在，提示用户确认 |
| markdown 返回 null | 回退到 summary + mainPoints |
| `500` (SYS_ERROR) | 重试一次，仍失败则告知用户 |
| 图片生成失败 | 重试一次，仍失败则跳过该图并告知用户手动处理 |
| `GOOGLE_API_KEY` 未设置 | 提示用户配置，阶段六无法执行 |
| R2 环境变量缺失 | 提示用户配置，阶段七无法执行，图片保留在本地 |
| R2 上传失败 | 重试一次，仍失败则保留本地路径并告知用户 |
