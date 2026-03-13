---
name: bestblogs-weekly-curator
description: "BestBlogs.dev 每周精选内容策展工作流。适用场景：(1) 从本周内容中精选 20 篇文章生成周刊，(2) 按模型/开发/产品/资讯分类策展，(3) 生成周刊中英文标题和推荐语，(4) 参考往期周刊风格生成新一期，(5) 筛选高分内容制作精选合集，(6) 基于文章原文生成高质量 newsletter。触发短语：'每周精选', '周刊策展', 'weekly curation', '生成周刊', 'curate weekly', '精选文章', '本周精选', 'weekly newsletter', '制作周刊', '选文章', 'pick articles for newsletter', '策展', '生成推荐语', 'newsletter summary', '周刊推荐语', 'write newsletter'"
---

# BestBlogs 每周精选策展 (Weekly Curator)

从 BestBlogs.dev 本周内容中精选约 20 篇高质量文章，按 AI 细分类别（模型/开发/产品/资讯）组织，并基于文章原文生成高质量的中英文周刊标题和推荐语。

完整 API 参数详情见 `references/api_reference.md`。

## 认证

所有请求需要 `X-API-KEY` 请求头。从环境变量 `BESTBLOGS_API_KEY` 读取密钥：

```bash
-H "X-API-KEY: $BESTBLOGS_API_KEY"
```

若 `BESTBLOGS_API_KEY` 未设置，提示用户配置。

接口地址：`https://api.bestblogs.dev`

## 进度清单

```
- [ ] 阶段一: 获取往期周刊作为参考
- [ ] 阶段二: 拉取本周候选内容
- [ ] 阶段三: 深度分析候选内容（调用详情接口）
- [ ] 阶段四: AI 筛选与推荐（输出 30-40 篇候选清单）⚠️ 需用户确认选文
- [ ] 阶段五: 生成周刊推荐语
  - [ ] 5.1 获取入选文章原文（补充阶段三未获取的）
  - [ ] 5.2 提取主题候选 + 收集用户输入 ⚠️ 一次性确认主题/动态/重点/想法
  - [ ] 5.3 生成中英文标题和推荐语（参考往期风格）
  - [ ] 5.4 输出周刊草稿 + 结构化 JSON
```

---

## 阶段一：获取往期周刊参考

拉取最近 3 期已发布的周刊列表和详情，理解选文风格、分类比例和推荐语写法。

### 1.1 获取周刊列表

```bash
curl -s -X POST https://api.bestblogs.dev/openapi/v1/newsletter/list \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: $BESTBLOGS_API_KEY" \
  -d '{"currentPage":1,"pageSize":3,"userLanguage":"zh_CN"}'
```

### 1.2 获取每期详情（并行 6 个请求）

分别获取中文和英文版本，供阶段五参考双语写作风格：

```bash
# 中文版
curl -s "https://api.bestblogs.dev/openapi/v1/newsletter/get?id={ISSUE_ID}&language=zh_CN" \
  -H "X-API-KEY: $BESTBLOGS_API_KEY"

# 英文版
curl -s "https://api.bestblogs.dev/openapi/v1/newsletter/get?id={ISSUE_ID}&language=en_US" \
  -H "X-API-KEY: $BESTBLOGS_API_KEY"
```

从响应中保存 `zhTitle`、`enTitle`、`zhSummary`、`enSummary` 字段，供阶段五生成推荐语时参考。

### 1.3 分析往期模式

从 3 期详情中提取：
- 每期文章总数（通常 20-24 篇）
- `aiCategory` 分布比例（MODELS / DEV / PRODUCT / NEWS 各约 5 篇，DEV 有时会多 2-3 篇）
- 中文推荐语风格：开篇引题 → 个人动态 → 10 个亮点（emoji 标识）→ 结尾
- 英文推荐语风格：对应中文内容的地道英文表达（非逐字翻译）
- 标题命名模式和文章 `sort` 字段的排序规则

---

## 阶段二：拉取本周候选内容

通过两组查询覆盖候选范围，预计获取 200-400 条内容。

### 查询策略（6 个并行请求）

**第一组：AI 分类内容（88 分以上）** — 分资源类型查询：

```bash
# 2.1 AI 文章
curl -s -X POST https://api.bestblogs.dev/openapi/v1/resource/list \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: $BESTBLOGS_API_KEY" \
  -d '{"currentPage":1,"pageSize":100,"timeFilter":"1w","sortType":"score_desc","category":"Artificial_Intelligence","type":"ARTICLE","userLanguage":"zh_CN"}'

# 2.2 AI 播客
curl -s -X POST https://api.bestblogs.dev/openapi/v1/resource/list \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: $BESTBLOGS_API_KEY" \
  -d '{"currentPage":1,"pageSize":100,"timeFilter":"1w","sortType":"score_desc","category":"Artificial_Intelligence","type":"PODCAST","userLanguage":"zh_CN"}'

# 2.3 AI 视频
curl -s -X POST https://api.bestblogs.dev/openapi/v1/resource/list \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: $BESTBLOGS_API_KEY" \
  -d '{"currentPage":1,"pageSize":100,"timeFilter":"1w","sortType":"score_desc","category":"Artificial_Intelligence","type":"VIDEO","userLanguage":"zh_CN"}'
```

**第二组：全分类高分内容（90 分以上，前 100 条）** — 捕捉非 AI 分类的优质内容：

```bash
# 2.4 全分类高分文章
curl -s -X POST https://api.bestblogs.dev/openapi/v1/resource/list \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: $BESTBLOGS_API_KEY" \
  -d '{"currentPage":1,"pageSize":100,"timeFilter":"1w","sortType":"score_desc","type":"ARTICLE","userLanguage":"zh_CN"}'

# 2.5 全分类高分播客
curl -s -X POST https://api.bestblogs.dev/openapi/v1/resource/list \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: $BESTBLOGS_API_KEY" \
  -d '{"currentPage":1,"pageSize":100,"timeFilter":"1w","sortType":"score_desc","type":"PODCAST","userLanguage":"zh_CN"}'

# 2.6 全分类高分视频
curl -s -X POST https://api.bestblogs.dev/openapi/v1/resource/list \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: $BESTBLOGS_API_KEY" \
  -d '{"currentPage":1,"pageSize":100,"timeFilter":"1w","sortType":"score_desc","type":"VIDEO","userLanguage":"zh_CN"}'
```

如果第一组某个类型的 `totalCount > 100`，继续翻页获取（`currentPage: 2`）直到全部拉取。

### 客户端过滤与合并

1. **分数过滤**: 第一组保留 `score >= 88`，第二组保留 `score >= 90`
2. **去重**: 按 `id` 去重（两组可能有重叠）
3. **合并**: 将所有候选内容合并为一个列表
4. **统计**: 输出候选池概况 — 总数、各 `aiCategory` 分布、分数范围

---

## 阶段三：深度分析候选内容

对阶段二筛选后的候选池（预计 80-150 条）进行深度分析。通过调用文章详情接口获取更丰富的信息，辅助后续的精选决策。

### 3.1 初步排序

先按 `score` 降序排列，取每个 `aiCategory` 的 Top 15（共约 60 条）进入深度分析。如果某个分类不足 15 条，则全部进入。

### 3.2 调用文章详情接口（分批并行）

对进入深度分析的文章，调用 markdown 接口获取正文内容：

```bash
curl -s "https://api.bestblogs.dev/openapi/v1/resource/markdown?id={RESOURCE_ID}" \
  -H "X-API-KEY: $BESTBLOGS_API_KEY"
```

每批 5 个并行请求，避免触发频率限制。如果 markdown 返回 `null`（无正文），则依赖列表接口已有的 `summary` 和 `mainPoints` 进行判断。

### 3.3 深度评估维度

对每篇内容从 3 个维度评分（结合 markdown 正文 + 列表接口元数据）:

1. **内容质量** — 论证深度、信息密度、原创性、写作质量
   - 优质信号：有数据支撑、有代码示例、有独到见解、有实践经验
   - 低质信号：纯资讯搬运、内容空洞、标题党、过度营销
2. **信息重要性** — 对 AI 行业的影响程度
   - 高：头部厂商重大发布、突破性研究、行业政策变化
   - 中：工具更新、实践分享、趋势分析
   - 低：日常动态、边缘话题
3. **读者相关性** — 与 BestBlogs 读者群（AI 从业者、开发者、产品经理）的匹配度
   - 高：可直接指导工作实践、影响技术决策
   - 中：值得了解的行业信息
   - 低：受众面窄、过于学术或过于通俗

### 3.4 标记来源权威性

在评估过程中标记以下高权威来源：
- **头部厂商官方**: OpenAI、Anthropic、Google/DeepMind、Meta、阿里巴巴/通义、腾讯、月之暗面/Kimi、智谱/GLM、Minimax、百度/文心、字节跳动/豆包
- **业界领袖**: 检查 `authors` 字段，识别知名人物
- **订阅源优先级**: 标注 `priority` 为 `HIGH` 或 `MEDIUM` 的来源

---

## 阶段四：AI 筛选与推荐

基于阶段三的深度分析，从候选池中推荐 30-40 篇内容，按 `aiCategory` 分配到 4 个栏目。

### 分类栏目与配额

| 栏目 | aiCategory | 默认配额 | 说明 |
|------|-----------|---------|------|
| 模型与研究 | MODELS | 5 篇 (4-6) | 前沿模型发布、基准测试、论文解读 |
| 开发与工具 | DEV | 5 篇 (4-7) | 框架更新、编程教程、开发实践 |
| 产品与设计 | PRODUCT | 5 篇 (4-6) | AI 产品分析、用户体验、商业应用 |
| 资讯与报告 | NEWS | 5 篇 (4-6) | 行业动态、融资新闻、趋势分析 |

每个分类默认 5 篇，允许上下浮动 1-2 篇。4 个分类都应有内容，仅在某分类本周确实无足够优质内容时才允许缺席（极少数情况）。最终总数控制在 20 篇左右。

### 推荐数量

为给用户充分选择空间，候选清单应包含 **30-40 篇**内容（每个分类 8-10 篇），用户从中选择最终的 20 篇。这样即使去除部分文章后仍有充足的备选。

### 筛选标准

按以下优先级排序候选内容：

1. **来源权威性（最高权重）**:
   - 优先选择来源于 `priority` 为 `HIGH` 和 `MEDIUM` 的订阅源
   - 优先选择来自头部厂商的内容：OpenAI、Anthropic、Google/DeepMind、Meta、阿里巴巴/通义、腾讯、月之暗面/Kimi、智谱/GLM、Minimax、百度/文心、字节跳动/豆包
   - 优先选择业界领袖人物（如 Sam Altman、Dario Amodei、Andrej Karpathy 等）的内容
2. **内容质量综合判断**: 综合以下指标评估，而非仅看单一维度：
   - `score` 评分（高分优先）
   - `qualified` 是否精选（精选内容优先）
   - `readCount` 阅读量（高阅读量说明内容有吸引力）
   - 深度分析结果（阶段三的质量、重要性、相关性评估）
3. **信息重要性**: 重大发布、突破性进展、行业转折点等内容优先
4. **读者相关性**: 与 BestBlogs 读者群（AI 从业者、开发者、产品经理）高度相关的内容优先
5. **来源多样性**: 同一 `sourceName` 最多入选 3 篇，避免单一来源过度集中
6. **内容类型多样性**: 尽量在每个栏目中包含文章、播客、视频的混合
7. **语言平衡**: 兼顾中英文内容
8. **话题去重**: 主题高度相似的内容只保留分数最高的一篇

### 输出候选清单

按栏目分组展示候选清单，每篇必须包含**推荐理由**:

```markdown
## 候选清单（共 N 篇，建议最终选择约 20 篇）

### 模型与研究 (MODELS) — N 篇

| # | 分数 | 精选 | 阅读量 | 标题 | 来源 | 优先级 | 类型 | 推荐理由 |
|---|------|------|--------|------|------|--------|------|----------|
| 1 | 96 | Y | 1.2K | 文章标题 | 来源名称 | HIGH | 文章 | OpenAI 官方发布，重大模型更新，读者必读 |
| 2 | 94 | Y | 856 | 文章标题 | 来源名称 | MEDIUM | 播客 | 深度技术解析，对开发者实践价值高 |

### 开发与工具 (DEV) — N 篇
...

### 产品与设计 (PRODUCT) — N 篇
...

### 资讯与报告 (NEWS) — N 篇
...
```

推荐理由应从以下角度阐述（1-2 句话）:
- 为什么这篇内容重要（信息价值）
- 为什么适合 BestBlogs 读者（相关性）
- 内容质量亮点（深度、独特视角、实践指导等）

**⚠️ 等待用户确认**: 展示候选清单后暂停，等待用户：
- 从 30-40 篇中勾选最终 20 篇
- 调整某篇的去留
- 调整分类配额
- 补充遗漏的重要内容

---

## 阶段五：生成周刊推荐语

用户确认选文后，深度阅读入选文章原文，结合用户输入和往期风格，生成高质量的中英文标题和推荐语。

详细的写作风格规范、emoji 速查和完整示例见 `references/newsletter_writing_guide.md`。

### 5.1 获取入选文章原文

对用户确认的 20 篇文章，获取 markdown 原文内容。阶段三可能已获取了部分文章的原文，只需补充未获取的：

```bash
curl -s "https://api.bestblogs.dev/openapi/v1/resource/markdown?id={RESOURCE_ID}" \
  -H "X-API-KEY: $BESTBLOGS_API_KEY"
```

每批 5 个并行请求。markdown 返回 `null` 的文章，依赖列表接口的 `summary` 和 `mainPoints`。

阅读每篇原文时重点关注：
- 核心论点和关键数据
- 独到见解或判断
- 作者身份（区分实际作者与发布平台）
- 文章之间的关联性和共同趋势

### 5.2 提取主题候选 + 收集用户输入

基于 20 篇文章的原文内容提炼主题候选，同时收集用户上下文。**合并为一次交互**，避免多轮追问：

```
阅读完本期 20 篇文章后，我提炼了以下主题候选:

1. **关键词A（英文）**: 理由 — 哪些文章支撑这个主题
2. **关键词B（英文）**: 理由
3. **关键词C（英文）**: 理由
4. ...

我推荐: **关键词X** — 因为它能串联本期多数内容，同时提出了引人思考的问题。

在生成推荐语之前，还想了解:
1. 你倾向哪个主题？或者有自己的想法？
2. BestBlogs.dev 最近有什么更新或动态想提到吗？
3. 有没有特别想重点强调的文章？
4. 本周有什么个人观察或思考想融入推荐语？
```

主题提取思路：
- 跨多篇文章出现的共同模式
- 本周最重磅文章的核心概念
- 文章集体讲述的行业叙事
- 能用一个词或短语概括本周精华的思考性概念

如果用户没有特别想法，可以基于文章内容自行提炼，但主题必须等用户确认后再继续。

**等待用户确认后再进入 5.3。**

### 5.3 生成中英文标题和推荐语

参考阶段一获取的最近 3 期周刊的 `zhTitle`/`enTitle` 和 `zhSummary`/`enSummary`，学习：
- 标题的命名模式（通常："BestBlogs 周刊第 N 期：{关键词}"）
- 推荐语的叙事节奏（开篇引题 → 个人动态 → 10 个亮点 → 结尾）
- 语言风格（口语化程度、句式习惯、数据引用方式）

#### 标题格式

- 中文：`BestBlogs 周刊第 N 期: {主题关键词}`
- 英文：`BestBlogs Weekly Issue #N: {Theme Keyword}`

#### 推荐语生成要求

基于文章原文（而非仅摘要）撰写，确保信息准确、有深度：

1. **开篇段落**（2-3 句）: 用主题关键词串联本周最重要的趋势，提出引发思考的问题
2. **个人更新段落**: 融入用户提供的 BestBlogs 动态或个人实验（没有则跳过）
3. **10 个亮点**: 从 20 篇文章中提炼，每个亮点 2-3 句，带 emoji 标识
   - 覆盖 4 个分类的核心内容
   - 用户指定的重点文章优先展开
   - 相关文章可合并为一个亮点
   - 包含具体数据、关键洞察
   - 句式多样，避免千篇一律
4. **结尾**: 固定格式

#### 语言质量要求

- 中英文和数字之间加空格：`Claude Opus 4.5 发布`
- 减少不必要的引号、破折号和复杂句式
- 中文版用全角标点，英文版语感地道不像翻译
- 信息必须准确：作者归属、数据引用、核心论点与原文一致
- 加粗仅用于产品/模型名称

### 5.4 确定期数并输出

从阶段一获取的最新一期 id（如 `issue55`）推算新期数：`issue56`。

#### 输出周刊草稿

```markdown
# BestBlogs.dev 精选文章 第 N 期

> {中文推荐语全文}

---

## 模型与研究

### 1. {文章标题}
- **来源**: {sourceName} | **评分**: {score} | **类型**: {resourceTypeDesc}
- **摘要**: {oneSentenceSummary}
- **推荐理由**: {1 句话说明为什么入选本期}
- **链接**: {readUrl 或 url}

### 2. {文章标题}
...

---

## 开发与工具
...

## 产品与设计
...

## 资讯与报告
...
```

#### 输出结构化数据

```json
{
  "zhTitle": "BestBlogs 周刊第 N 期：{关键词}",
  "enTitle": "BestBlogs Weekly Issue #N: {Keyword}",
  "zhSummary": "中文推荐语全文",
  "enSummary": "English summary full text",
  "articles": [
    {
      "id": "RAW_xxx",
      "title": "文章标题",
      "aiCategory": "MODELS",
      "sort": 1
    }
  ]
}
```

`sort` 值规则：按 MODELS → DEV → PRODUCT → NEWS 顺序，从 1 开始连续编号。

---

## 参数调整

| 用户意图 | 调整方式 |
|---------|---------|
| "只选 15 篇" | 减少每个分类的配额，总数调为 15 |
| "多选一些开发类" | DEV 配额增加到 8-10，其他减少 |
| "加入推文" | 额外查询 tweet/list 接口，候选池增加推文 |
| "分数要求高一些" | 第一组阈值提高到 90，第二组提高到 92 |
| "包含上周内容" | timeFilter 改为 `3w` 或手动指定日期范围 |
| "英文内容为主" | 添加 `language: "en_US"` 过滤 |

## 错误处理

**重要**: 始终先检查 `response.success` 再处理 `response.data`。

| 错误 | 处理 |
|------|------|
| `401` (AUTH_001/002) | 检查 `BESTBLOGS_API_KEY` 是否设置且有效 |
| `403` (AUTH_003) | API Key 权限不足，提示用户 |
| `400` (PARAM_001) | 检查参数值是否匹配枚举 |
| `500` (SYS_ERROR) | 重试一次，仍失败则告知用户 |
