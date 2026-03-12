---
name: daily-content-curator
description: "每日个人内容智能筛选 — 跨 BestBlogs + Twitter 两个数据源，基于个人偏好评分，生成分层阅读清单。适用场景: (1) 生成今天的个性化阅读清单, (2) 跨源筛选最值得阅读的内容, (3) 早间/晚间内容推荐, (4) 按兴趣偏好筛选文章和推文, (5) 每日阅读规划。触发短语: '今天读什么', '阅读清单', '每日筛选', '内容推荐', '生成阅读清单', 'daily curation', 'what to read', 'reading list', '今日推荐', '帮我筛选', '有什么值得看', '内容筛选', 'curate content', '早间阅读', '晚间阅读', 'morning reading', '推荐阅读', '个性化推荐'"
---

# 每日内容筛选 (Daily Content Curator)

跨 BestBlogs + Twitter (XGo) 两个数据源，基于个人兴趣偏好和多维度评分，每日筛选 10-20 条最值得阅读的内容，输出分层阅读清单（必读 / 推荐 / 备选）。

完整 API 参数详情见 `references/api_reference.md`。

## 认证

本 skill 需要两组 API Key:

| 环境变量 | 用途 |
|---------|------|
| `BESTBLOGS_API_KEY` | BestBlogs OpenAPI 密钥 |
| `XGO_API_KEY` | XGo 开放接口密钥 |

```bash
# BestBlogs 请求
-H "X-API-KEY: $BESTBLOGS_API_KEY"

# XGo 请求
-H "X-API-KEY: $XGO_API_KEY"
```

若任一 Key 未设置，提示用户配置。单个 Key 缺失时，仅从另一数据源筛选并告知用户。

BestBlogs 接口: `https://api.bestblogs.dev`
XGo 接口: `https://api.xgo.ing`

## 工作流概览

```
- [ ] 阶段零: 读取历史筛选记录（用于去重）
- [ ] 阶段一: 并行拉取数据（BestBlogs 7 请求 + XGo 3 请求）
- [ ] 阶段二: 统一格式 + 去重合并（含历史去重）
- [ ] 阶段三: 个人偏好多维度评分
- [ ] 阶段四: 分层输出阅读清单
- [ ] 阶段五: 保存筛选记录
```

---

## 阶段一: 并行拉取数据

### BestBlogs 数据源（7 个请求）

时间范围默认 `12h`（早间）或 `8h`（晚间），用户可调整。因 BestBlogs 无 `12h` 参数，使用 `1d` 并客户端按 `publishTimeStamp` 过滤。

```bash
# 1. AI 文章
curl -s -X POST https://api.bestblogs.dev/openapi/v1/resource/list \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: $BESTBLOGS_API_KEY" \
  -d '{"currentPage":1,"timeFilter":"1d","sortType":"score_desc","userLanguage":"zh_CN","pageSize":100,"type":"ARTICLE","category":"Artificial_Intelligence"}'

# 2. 编程技术文章
curl -s -X POST https://api.bestblogs.dev/openapi/v1/resource/list \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: $BESTBLOGS_API_KEY" \
  -d '{"currentPage":1,"timeFilter":"1d","sortType":"score_desc","userLanguage":"zh_CN","pageSize":100,"type":"ARTICLE","category":"Programming_Technology"}'

# 3. 商业科技文章
curl -s -X POST https://api.bestblogs.dev/openapi/v1/resource/list \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: $BESTBLOGS_API_KEY" \
  -d '{"currentPage":1,"timeFilter":"1d","sortType":"score_desc","userLanguage":"zh_CN","pageSize":100,"type":"ARTICLE","category":"Business_Tech"}'

# 4. 产品设计文章
curl -s -X POST https://api.bestblogs.dev/openapi/v1/resource/list \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: $BESTBLOGS_API_KEY" \
  -d '{"currentPage":1,"timeFilter":"1d","sortType":"score_desc","userLanguage":"zh_CN","pageSize":100,"type":"ARTICLE","category":"Product_Development"}'

# 5. 播客
curl -s -X POST https://api.bestblogs.dev/openapi/v1/resource/list \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: $BESTBLOGS_API_KEY" \
  -d '{"currentPage":1,"timeFilter":"1d","sortType":"score_desc","userLanguage":"zh_CN","pageSize":50,"type":"PODCAST"}'

# 6. 视频
curl -s -X POST https://api.bestblogs.dev/openapi/v1/resource/list \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: $BESTBLOGS_API_KEY" \
  -d '{"currentPage":1,"timeFilter":"1d","sortType":"score_desc","userLanguage":"zh_CN","pageSize":50,"type":"VIDEO"}'

# 7. BestBlogs 推文
curl -s -X POST https://api.bestblogs.dev/openapi/v1/tweet/list \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: $BESTBLOGS_API_KEY" \
  -d '{"currentPage":1,"timeFilter":"1d","sortType":"score_desc","userLanguage":"zh_CN","pageSize":100,"language":"all"}'
```

### XGo 数据源（3 个请求）

```bash
# 8. 关注者推文 - 第1页
curl -s -X POST https://api.xgo.ing/openapi/v1/tweet/list \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: $XGO_API_KEY" \
  -d '{"queryType":"following","timeRange":"LAST_24H","sortType":"influence","tweetType":"NO_RETWEET","currentPage":1,"pageSize":50}'

# 9. 关注者推文 - 第2页
curl -s -X POST https://api.xgo.ing/openapi/v1/tweet/list \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: $XGO_API_KEY" \
  -d '{"queryType":"following","timeRange":"LAST_24H","sortType":"influence","tweetType":"NO_RETWEET","currentPage":2,"pageSize":50}'

# 10. 推荐推文
curl -s -X POST https://api.xgo.ing/openapi/v1/tweet/list \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: $XGO_API_KEY" \
  -d '{"queryType":"recommendation","timeRange":"LAST_24H","sortType":"influence","tweetType":"NO_RETWEET","currentPage":1,"pageSize":50}'
```

**所有 10 个请求并行执行。** 必须显式传递 `sortType`。

客户端过滤: BestBlogs 内容保留 `score >= 75`，XGo 推文保留 `influenceScore >= 40`。

---

## 阶段零: 读取历史筛选记录

读取最近 3 天的历史筛选记录，构建「已推荐内容」列表用于去重:

```bash
# 历史记录存放在 contents/daily-curation/ 下
# 例如今天 2026-03-10，依次尝试读取:
#   contents/daily-curation/2026-03-09/curation.md
#   contents/daily-curation/2026-03-08/curation.md
#   contents/daily-curation/2026-03-07/curation.md
# 目录或文件不存在则跳过
```

从每份历史记录中提取已推荐内容的**标题**和 **URL**，构建去重集合。
首次运行或无历史文件时跳过此步骤。

---

## 阶段二: 统一格式 + 去重合并

### 2.1 统一为通用内容格式

将两个数据源的内容统一为以下结构:

```
{
  source: "bestblogs" | "xgo",
  type: "article" | "tweet" | "podcast" | "video",
  id: string,
  title: string,
  summary: string,
  url: string,
  readUrl: string,          // BestBlogs 站内链接（仅 bestblogs 源）
  author: string,
  sourceName: string,
  category: string,
  tags: string[],
  score: number,            // BestBlogs score 或 XGo influenceScore
  publishTime: timestamp,
  wordCount: number,
  readTime: number,
  interactions: {           // 仅推文
    likes, retweets, replies, views
  }
}
```

**BestBlogs 文章映射**:
- `title` → title
- `oneSentenceSummary` → summary
- `readUrl` → readUrl（优先）, `url` → url
- `score` → score
- `category` → category
- `publishTimeStamp` → publishTime

**XGo 推文映射**:
- `text`（前 100 字）→ title
- `text` → summary
- `url` → url
- `influenceScore` → score（需按 3.1 节的对数公式归一化到 0-100）
- `author.userName` → author
- `createdAt` → publishTime

### 2.2 去重

1. **URL 去重**: 同一 URL 出现在多个查询中，保留评分较高的一条
2. **跨数据源推文去重**: 若同一推文同时出现在 BestBlogs 和 XGo（通过推文 URL 或作者+内容匹配），保留 BestBlogs 版本（有 AI 摘要和标签，信息更完整）
3. **历史去重**: 与阶段零构建的「已推荐内容」集合比对，排除最近 3 天已推荐过的**相同内容**（按 URL 匹配）。注意：同一话题的不同角度文章不排除
4. **同话题去重**: 多篇内容讨论同一话题时，保留评分最高的一条，记录补充来源

---

## 阶段三: 个人偏好多维度评分

### 加载内容策略画像（反馈闭环）

评分前，尝试读取 `contents/content-strategy.md`（由 `content-analytics` 生成）。

- **文件存在**: 提取话题权重调整、高价值来源、内容类型建议，应用到 3.2/3.4/3.5 评分中
- **文件不存在**: 使用下方默认配置（首次运行或未执行过 analytics 时）

对每条内容计算**综合推荐分**（0-100），权重如下:

### 3.1 基础质量分（40%）

直接使用数据源评分:
- BestBlogs 文章: `score` 字段（已是 0-100）
- XGo 推文: `influenceScore` 按对数归一化到 0-100:
  - `normalizedScore = min(100, 20 * log2(influenceScore + 1))`
  - 参考: influenceScore 50 → ~57, 100 → ~67, 500 → ~80, 2000 → ~91
  - 这保证了高 influenceScore 推文有区分度，而不是简单截断

### 3.2 个人兴趣匹配度（30%）

根据内容标题、摘要、标签匹配个人兴趣主题。兴趣主题从用户画像（`gino-bot/USER.md`）加载，以下为默认配置:

**高兴趣（匹配 +25-30 分）**:
- AI Agent, AI Coding, Claude Code, MCP 协议
- LLM 应用开发, 提示词工程, Prompt Engineering
- Anthropic, Claude, Cursor, Windsurf
- 分布式系统, 系统设计

**中兴趣（匹配 +15-20 分）**:
- 产品设计, 开发者工具, 独立开发
- 创业, SaaS, 商业模式
- 内容创作, 个人品牌
- React, Next.js, TypeScript

**低兴趣（匹配 +5-10 分）**:
- 前端框架（非 React）, 移动开发
- 区块链, Web3
- 纯资讯聚合

**不匹配（+0 分）**: 未命中任何兴趣主题

若能访问 USER.md，使用其中的技术栈和关注领域覆盖以上默认配置。

**策略画像叠加**: 若 `content-strategy.md` 存在，将其中的 `推荐权重调整` 叠加到匹配分数上。例如策略画像中"AI Coding +5"，则匹配到 AI Coding 的内容在上述基础分上再 +5。

### 3.3 时效性（15%）

- 发布 < 6 小时: +15
- 发布 6-12 小时: +12
- 发布 12-24 小时: +8
- 发布 1-2 天: +4
- 发布 > 2 天: +0

### 3.4 来源可信度（10%）

**高可信度来源（+8-10 分）**:

文章/博客:
- 国际: Latent Space, Simon Willison, LangChain Blog, deeplearning.ai, The GitHub Blog, Anthropic Blog, OpenAI Blog
- 国内: 机器之心, 宝玉的分享, 阮一峰的网络日志, InfoQ 中文

推文作者:
- 厂商官方: @OpenAI, @AnthropicAI, @GoogleDeepMind, @cursor_ai
- 行业领袖: @karpathy, @sama, @AndrewYNg

**中可信度来源（+4-6 分）**: 知名技术博客、行业媒体
**未知来源（+2 分）**: 首次出现的来源

**策略画像叠加**: 若 `content-strategy.md` 中有 `高价值来源` 列表，列表中的来源额外 +3 分。

### 3.5 内容类型多样性（5%）

确保阅读清单不全是同一类型:
- 若当前清单已有 5+ 篇文章，后续文章 -2 分
- 若清单中无推文，推文 +3 分
- 若清单中无播客/视频，播客视频 +3 分

---

## 阶段四: 分层输出阅读清单

按综合推荐分排序，分为三层:

### 输出格式

```markdown
# 📖 每日阅读清单 | YYYY-MM-DD 早间/晚间

> 从 BestBlogs N 篇 + XGo M 条中筛选，共 X 条推荐

---

## 🔥 必读（3-5 条）

综合推荐分 Top 5，每条内容必须值得花时间深入阅读。

### 1. [标题](readUrl 或 url)
- **来源**: 来源名 | **作者**: 作者名 | **类型**: 文章/推文/播客
- **推荐分**: 95 | **基础分**: 92 | **兴趣匹配**: AI Coding
- **为什么必读**: 一句话说明推荐理由（结合内容价值 + 个人相关性）
- **摘要**: 2-3 句核心内容概括
- **预计阅读**: 15 分钟

---

## ⭐ 推荐（5-10 条）

值得阅读但不紧急，可在碎片时间浏览。

### 6. [标题](readUrl 或 url)
- **来源**: 来源名 | **类型**: 文章
- **推荐分**: 78 | **兴趣匹配**: 产品设计
- **一句话**: 核心内容概括
- **预计阅读**: 8 分钟

---

## 📌 备选（5 条）

有一定价值，时间充裕时可阅读。

### 16. [标题](url)
- **来源**: 来源名 | **类型**: 推文
- **推荐分**: 65
- **一句话**: 核心内容概括

---

## 📊 筛选统计

| 维度 | 数值 |
|------|------|
| BestBlogs 候选 | N 篇文章 + M 条推文 |
| XGo 候选 | K 条推文 |
| 去重后 | X 条 |
| 最终推荐 | Y 条（必读 A + 推荐 B + 备选 C） |
| 内容类型分布 | 文章 X / 推文 Y / 播客 Z |
| 兴趣命中 | 高 X / 中 Y / 低 Z |
```

### 输出完整性规则

- `title` / `summary`: 完整输出，不截断
- `readUrl` 优先于 `url`（BestBlogs 内容）
- 大数字用 K/M 格式化
- 数据源标识: 文章标题后无需标注来源类型，通过"类型"字段区分
- 推文类型内容标注 `@作者名`
- 播客/视频标注时长

---

## 阶段五: 保存筛选记录

将本次筛选结果保存到项目根目录:

```
contents/daily-curation/
  YYYY-MM-DD/
    curation.md          # 完整阅读清单（阶段四输出）
    curation-am.md       # 早间版本（如果一天生成两次）
    curation-pm.md       # 晚间版本
```

创建目录（如不存在）:
```bash
mkdir -p contents/daily-curation/YYYY-MM-DD
```

保存完成后，输出阅读清单内容到对话中，并告知用户文件路径。

### Daily Workspace 集成

同时将原始数据写入每日共享工作区，供下游 skills（daily-content-management、reading-workflow、content-synthesizer 等）直接复用，避免重复 API 调用：

```bash
mkdir -p contents/daily-workspace/YYYY-MM-DD/article-details contents/daily-workspace/YYYY-MM-DD/tweet-details
```

写入文件：
- `contents/daily-workspace/YYYY-MM-DD/raw-articles.md` — BestBlogs 文章列表（基础信息：标题、URL、摘要、评分、来源、标签、readUrl）
- `contents/daily-workspace/YYYY-MM-DD/raw-tweets.md` — XGo 推文列表（基础信息：内容、作者、互动数据、影响力分、URL）

**关键**: 只存列表级别的基础信息，不含文章全文。详情按需由下游 skill 获取后缓存到 `article-details/` 或 `tweet-details/`。

文件格式详见 `skills/daily-content-management/references/workspace-spec.md`。

---

## 参数调整

| 用户表述 | 调整 |
|---------|------|
| "早间阅读" / "早上" | BestBlogs `timeFilter: "1d"` + XGo `timeRange: "LAST_24H"` |
| "晚间阅读" / "下午" | BestBlogs `timeFilter: "1d"` 客户端过滤近 8 小时 + XGo `timeRange: "LAST_24H"` |
| "本周" / "这周" | BestBlogs `timeFilter: "1w"` + XGo `timeRange: "WEEK"`，扩大至 30 条 |
| "只看 AI" | 仅拉取 AI 分类 + AI 相关推文 |
| "只看文章" | 仅从 BestBlogs 拉取文章 |
| "只看推文" | 仅从 XGo 拉取推文 |
| "多给一些" | 扩大到 25-30 条 |
| "精简一些" | 缩减到 8-10 条 |
| "评分 90 以上" | 基础质量分阈值调整 |

---

## 与其他 Skill 的协作

### 职责边界

本 skill 与以下 skills 有相似功能但**定位不同**:

| 对比 Skill | 本 skill | 对比 skill | 关键区别 |
|-----------|---------|-----------|---------|
| bestblogs-daily-digest | 个人阅读清单 | BestBlogs 订阅者简报 | 受众不同: 个人 vs 产品用户 |
| xgo-digest-tweets | 跨源筛选含推文 | 推文专属摘要日报 | 范围不同: 跨源打分 vs Twitter 详细摘要 |
| bestblogs-content-reviewer | 筛选阅读 | 审核评分 | 目的不同: 个人阅读 vs 产品运营 |

如需推文详细摘要（含翻译、分类、关键词提取），使用 `xgo-digest-tweets`。
如需面向 BestBlogs 读者的每日简报，使用 `bestblogs-daily-digest`。

### 下游衔接

| 下游 Skill | 衔接方式 |
|-----------|---------|
| reading-workflow | 输出 `curation.md` → reading-workflow 阶段一加载 |
| deep-reading | 用户选择必读文章后，直接调用 deep-reading 进行深度分析 |
| content-synthesizer | 阅读后的素材传递给 content-synthesizer 生成内容 |

---

## 错误处理

**重要**: 始终先检查 `response.success` 再处理 `response.data`。部分错误返回 HTTP 200 但 `success: false` — 不要仅依赖 HTTP 状态码。

### BestBlogs API 错误

- `401`: 检查 `BESTBLOGS_API_KEY` 是否已设置且有效
- `400`: 参数值不合法，检查枚举值
- `500`: 重试一次，仍失败则告知用户
- `data` 为空: 该时间范围内无内容，建议扩大时间范围

### XGo API 错误

- `401` (AUTH_001/002/003): 检查 `XGO_API_KEY` 是否已设置且有效
- `403` (AUTH_004): 开放接口需要 Plus 或 Pro 会员
- `429` (xgo-0010): 频率限制 — 等待 10 秒后重试一次（PLUS 200次/分, PRO 600次/分）
- **HTTP 200** `xgo-0012`: 功能级会员限制 — 提示升级
- **HTTP 200** `xgo-9005`: 操作不允许 — 展示 message
- `data` 为空: 无推文匹配，建议扩大 `timeRange`

### 单数据源失败处理

- 任一数据源完全失败时，从另一数据源筛选并告知用户: "⚠️ [数据源名] 拉取失败，本次仅从 [另一数据源] 筛选"
- 单个分类请求失败不影响整体: 记录失败项，用其他数据继续
