---
name: curate-daily-content
description: "Use when 用户想从 BestBlogs 和 X 中得到一份每天值得阅读、回应或轻量起草的选题清单；完整端到端流程请使用 daily-content-management。"
---

# 每日内容选题与轻量创作 (Daily Content Curator)

跨 BestBlogs + Twitter (XGo) 两个数据源，基于个人兴趣偏好筛选 30 个选题，按「值得深入」「适合互动」「可以快评」三个维度分层，并生成多平台适配的轻量创作内容。

## When to Use

- 当用户想知道今天有哪些值得读、值得聊、值得转发的主题
- 当用户需要把 BestBlogs 和 X 的输入合并成可操作的日常选题清单
- 当用户需要轻量级互动建议或快评草稿，而不是正式长文生产

## When Not to Use

- 需要完整的日常内容编排和发布流程：用 `manage-daily-content`
- 已经有素材，只想生成正式平台文案：用 `synthesize-content`
- 只想深读单篇文章：用 `guide-reading` 或 `read-deeply`

## Gotchas

- 这里的轻量创作只是选题辅助，不等同于最终发布文案
- 评分和聚类用于排序，不等同于最终内容计划；真正执行前仍需要用户判断
- 不要跳过历史去重和工作区同步，否则会重复推荐相同主题
- 若用户已经明确选定素材，继续跑全量筛选通常是在浪费上下文和时间

## Related Skills

- `manage-daily-content`：全流程编排和阶段协调
- `guide-reading`：将清单变成逐篇阅读流程
- `read-deeply`：对清单中的重点文章做深度分析
- `synthesize-content`：把选中的素材转成正式内容
- `content-analytics`：复盘哪些主题长期有效

## Boundary

本 skill 负责“找什么值得做”，不负责“把它完整做完”：
- 输出的是候选主题、排序结果和轻量建议
- 正式草稿生产交给 `synthesize-content`
- 多阶段发布和审阅交给 `manage-daily-content`

**核心原则**: 选题和创作服务于两个目标——个人表达（记录真实进展、分享可复用经验）和读者价值（帮读者快速理解并可直接行动）。好内容是这两个目标对齐的自然结果，不刻意追求流量。

完整 API 参数详情见 `references/api_reference.md`。
创作范例与平台适配详见 `references/content-creation-guide.md`。

## 认证

本 skill 需要两组 API Key:

| 环境变量 | 用途 |
|---------|------|
| `BESTBLOGS_API_KEY` | BestBlogs OpenAPI 密钥 |
| `XGO_API_KEY` | XGo 开放接口密钥 |

```bash
-H "X-API-KEY: $BESTBLOGS_API_KEY"   # BestBlogs
-H "X-API-KEY: $XGO_API_KEY"         # XGo
```

若任一 Key 未设置，提示用户配置。单个 Key 缺失时，仅从另一数据源筛选并告知用户。

BestBlogs 接口：`https://api.bestblogs.dev`
XGo 接口：`https://api.xgo.ing`

## 工作流概览

```
- [ ] 阶段零: 加载风格画像 + 历史记录
- [ ] 阶段一: 并行拉取数据（BestBlogs 7 请求 + XGo 3 请求）
- [ ] 阶段二: 统一格式 + 去重 + 话题聚合
- [ ] 阶段三: 多维度评分 + 选题分类
- [ ] 阶段四: 输出选题清单（30 个选题 + 互动建议）
- [ ] 阶段五: 生成轻量创作内容 ⚠️ 需用户选择
- [ ] 阶段六: 保存记录 + 同步 workspace
```

---

## 阶段零：加载上下文

### 风格画像（必须加载）

优先读取 `${CLAUDE_PLUGIN_DATA}/gino-skills/manage-daily-content/memory/style-profile.md`，仅在缺失时临时兼容旧路径 `contents/style-profile.md`，提取关键约束用于阶段三评分和阶段五创作。
**所有创作输出必须通过 stable style-profile 中的生成前/生成后检查清单**。

### 历史筛选记录

读取最近 3 天的 `contents/daily-curation/YYYY-MM-DD/curation.md`（不存在则跳过），提取已推荐内容的标题和 URL 构建去重集合。

### 内容策略画像（可选）

尝试读取 `contents/content-strategy.md`（由 content-analytics 生成），存在则叠加话题权重和来源偏好。

---

## 阶段一：并行拉取数据

### BestBlogs 数据源（7 个请求）

时间范围默认 `1d`，客户端按 `publishTimeStamp` 过滤近 12 小时（早间）或 8 小时（晚间）。

```bash
# 1-4. 文章（AI / 编程 / 商业科技 / 产品设计，各 pageSize:100）
curl -s -X POST https://api.bestblogs.dev/openapi/v1/resource/list \
  -H "Content-Type: application/json" -H "X-API-KEY: $BESTBLOGS_API_KEY" \
  -d '{"currentPage":1,"timeFilter":"1d","sortType":"score_desc","userLanguage":"zh_CN","pageSize":100,"type":"ARTICLE","category":"Artificial_Intelligence"}'
# category 依次替换: Programming_Technology, Business_Tech, Product_Development

# 5. 播客（pageSize:50）
curl -s -X POST https://api.bestblogs.dev/openapi/v1/resource/list \
  -H "Content-Type: application/json" -H "X-API-KEY: $BESTBLOGS_API_KEY" \
  -d '{"currentPage":1,"timeFilter":"1d","sortType":"score_desc","userLanguage":"zh_CN","pageSize":50,"type":"PODCAST"}'

# 6. 视频（pageSize:50）
# 同上，type 替换为 VIDEO

# 7. BestBlogs 推文
curl -s -X POST https://api.bestblogs.dev/openapi/v1/tweet/list \
  -H "Content-Type: application/json" -H "X-API-KEY: $BESTBLOGS_API_KEY" \
  -d '{"currentPage":1,"timeFilter":"1d","sortType":"score_desc","userLanguage":"zh_CN","pageSize":100,"language":"all"}'
```

### XGo 数据源（3 个请求）

```bash
# 8-9. 关注者推文（2 页，各 pageSize:50）
curl -s -X POST https://api.xgo.ing/openapi/v1/tweet/list \
  -H "Content-Type: application/json" -H "X-API-KEY: $XGO_API_KEY" \
  -d '{"queryType":"following","timeRange":"LAST_24H","sortType":"influence","tweetType":"NO_RETWEET","currentPage":1,"pageSize":50}'
# currentPage:2 同上

# 10. 推荐推文
curl -s -X POST https://api.xgo.ing/openapi/v1/tweet/list \
  -H "Content-Type: application/json" -H "X-API-KEY: $XGO_API_KEY" \
  -d '{"queryType":"recommendation","timeRange":"LAST_24H","sortType":"influence","tweetType":"NO_RETWEET","currentPage":1,"pageSize":50}'
```

**所有 10 个请求并行执行。** 必须显式传递 `sortType`。

客户端过滤：BestBlogs 保留 `score >= 75`，XGo 保留 `influenceScore >= 40`。

---

## 阶段二：统一格式 + 去重 + 话题聚合

### 2.1 统一格式

将两个数据源映射为通用结构。字段映射详见 `references/api_reference.md`。

关键映射：
- BestBlogs: `oneSentenceSummary` → summary, `readUrl` 优先于 `url`, `score` 直接使用
- XGo: `influenceScore` 按对数归一化 `min(100, 20 * log2(influenceScore + 1))`

### 2.2 去重

1. **URL 去重**: 同 URL 保留评分高者
2. **跨源推文去重**: 同一推文保留 BestBlogs 版本（有 AI 摘要）
3. **历史去重**: 排除最近 3 天已推荐的相同 URL

### 2.3 话题聚合

将讨论同一话题的内容归为话题簇，**不再只保留评分最高的一条**。

**聚合信号**（满足任一即归为同一话题）:
- 讨论同一产品/工具/公司（如都在讨论 Claude 4）
- 讨论同一事件/发布/公告
- 讨论同一技术概念且有不同立场
- 一篇是另一篇的评论/回应

**话题簇结构**:
- `topic`: 话题名称
- `mainContent`: 评分最高的内容
- `relatedDiscussions`: 同话题的其他来源，每条记录 `{author, viewpoint, url}`
- `heatLevel`: `hot`（3+ 来源讨论）/ `warm`（2 来源）/ `niche`（单一来源但质量高）

---

## 阶段三：多维度评分 + 选题分类

### 评分体系（5 个维度，共 100 分）

#### 3.1 基础质量（30%）

直接使用数据源评分，XGo 推文用对数归一化。

#### 3.2 个人兴趣匹配（25%）

**高兴趣（+20-25）**: AI Agent/Coding, Claude Code, MCP, LLM 应用, Prompt Engineering, 分布式系统
**中兴趣（+12-18）**: 产品设计, 开发者工具, 独立开发, 创业/SaaS, 内容创作, React/Next.js
**低兴趣（+5-8）**: 其他前端框架, 移动开发, Web3, 纯资讯
若能访问 `gino-bot/USER.md`，用其技术栈和关注领域覆盖默认配置。

#### 3.3 读者共鸣潜力（20%）

评估内容发出后对读者的价值，基于可观测信号：

- **实用性**（+8）: 内容含可复用方法、工具推荐、操作步骤，读者可直接行动
- **共鸣点**（+6）: 触及技术人共同痛点，比如效率焦虑、技术选型纠结、AI 替代担忧——但表达方式是提供解法而非放大焦虑
- **信息增量**（+6）: 读者在其他渠道不容易看到的视角、数据或一手经验
- **反直觉/有趣**（+5）: 挑战常见认知的发现，或巧妙的类比和洞察

注意：读者共鸣不等于迎合情绪。符合 style-profile 的原则——分享心态优先，帮助读者快速理解并可直接行动。

#### 3.4 互动潜力（15%）

基于可观测信号评估互动价值：

- **已有讨论**（+6）: 推文 replyCount/quoteCount 高，或话题簇有 2+ 来源
- **观点碰撞**（+4）: 同一话题存在明显不同立场
- **个人可贡献**（+5）: 与个人正在做的事直接相关，能补充一手经验或独特视角

#### 3.5 时效性 + 多样性（10%）

- 发布 < 6h: +5, 6-12h: +4, 12-24h: +3, 1-2d: +1
- 类型多样性调节：若已有 8+ 篇文章，后续文章 -2；若清单无推文/播客/视频，对应类型 +3

### 选题分类

基于综合分和内容特征分为三类，**分类不完全依赖分数阈值**：

| 分类 | 数量 | 分类信号 |
|------|------|---------|
| 🔥 值得深入 | 8-10 | 综合分高 + 兴趣匹配高 + 有深度值得展开 |
| 💬 适合互动 | 10-12 | 话题簇有多方讨论，或个人可贡献独特视角，或内容有趣/反直觉 |
| ⚡ 可以快评 | 8-10 | 信息密度高但一两句话可以说清，适合金句或快速分享 |

**注意**: 一个低分但争议性强、有讨论价值的内容应该进「适合互动」而非被过滤掉。分类看内容特征，不只看分数。

---

## 阶段四：输出选题清单

### 输出格式

```markdown
# 📋 每日选题 | YYYY-MM-DD

> 从 BestBlogs N 篇 + XGo M 条中筛选，共 30 个选题

---

## 🔥 值得深入（N 个）

### 1. 话题名称
- **来源**: [标题](url) | 作者 | 来源名
- **核心内容**: 2-3 句概括
- **相关讨论**:
  - @作者A: 观点概括 [链接](url)
  - @作者B: 不同看法 [链接](url)
- **各方观点**: 简要对比
- **为什么值得深入**: 与个人实践的关联 + 对读者的价值
- **推荐分**: 95 | **兴趣**: AI Coding | **读者价值**: 含可复用工作流

---

## 💬 适合互动（N 个）

### 11. 话题名称
- **推荐互动**: 🔁 转发并评论 / 💬 回复 / 引用转发
- **来源**: [内容](url) | @作者名
- **核心内容**: 1-2 句
- **讨论背景**: 为什么有讨论价值
- **互动角度**: 从什么角度切入（基于个人经验）
- **推荐分**: 82 | **互动潜力**: 高

---

## ⚡ 可以快评（N 个）

### 23. 话题名称
- **来源**: [内容](url) | 作者
- **一句话**: 核心信息点
- **快评角度**: 可以从什么方向点评
- **推荐分**: 72
```

### 输出完整性与准确性规则

- 标题、摘要完整输出不截断
- `readUrl` 优先于 `url`（BestBlogs 内容）
- **信息准确性**: 所有观点归属必须注明出处，不臆造他人观点。各方观点概括来自原文，不做推测
- **原文可追溯**: 每条相关讨论必须附原文链接，读者可验证
- 相关讨论列出所有同话题来源，不省略
- 推文标注 `@作者名`，播客/视频标注时长

---

## 阶段五：轻量创作 ⚠️ 需用户选择

输出选题清单后，等待用户选择选题编号和创作类型。

### 创作类型

| 类型 | 字数 | 适用场景 |
|------|------|---------|
| **快评** | 1-2 句 | 转发评论、金句提炼、快速洞察 |
| **分享帖** | 300-500 字 | 详细分享、经验探讨、观点输出 |

**不做长文创作**。长文需先 deep-reading 深入阅读 + 个人参与思考，再 content-synthesizer 产出。

### 创作流程

1. 用户指定：选题编号 + 创作类型 + 目标平台（推特/朋友圈/小红书/即刻）
2. 优先加载 `${CLAUDE_PLUGIN_DATA}/gino-skills/manage-daily-content/memory/style-profile.md` 的平台适配策略，缺失时才临时兼容旧路径 `contents/style-profile.md`
3. 生成初稿，参考 `references/content-creation-guide.md` 中的范例和反例
4. 通过生成前/生成后检查清单审核
5. 输出最终版本 + 检查结果

### 创作核心约束

来自 stable style-profile，每次创作必须遵守：

1. **人设**: 真实一线 builder，分享心态优先
2. **语气**: 平实友好，信息密度高，同行交流感
3. **结构**: 先结论再原因再做法
4. **视角**: 多用「我观察到」「我踩过」「我建议」
5. **真实感**: 保留不确定性和进行时表达
6. **禁用**: 恐惧渲染、宏大空泛、说教语气
7. **排版**: 不用引号/破折号/括号，中英数间加空格

**读者意识**: 创作时除了表达自己的真实想法，还要思考——读者看到这条内容后能获得什么？是一个可以马上用的方法，一个新的看问题的角度，还是一个值得思考的问题？

平台适配详细策略和正反例详见 `references/content-creation-guide.md`。

---

## 阶段六：保存记录

```
contents/daily-curation/YYYY-MM-DD/
  curation.md / curation-am.md / curation-pm.md
```

```bash
mkdir -p contents/daily-curation/YYYY-MM-DD
```

### Daily Workspace 集成

```bash
mkdir -p contents/tmp/workspace/YYYY-MM-DD/article-details contents/tmp/workspace/YYYY-MM-DD/tweet-details
```

写入 `raw-articles.md` 和 `raw-tweets.md`（列表级基础信息，不含全文）。

---

## 参数调整

| 用户表述 | 调整 |
|---------|------|
| "早间" / "早上" | BestBlogs `timeFilter: "1d"` + XGo `LAST_24H` |
| "晚间" / "下午" | 客户端过滤近 8 小时 |
| "本周" / "这周" | BestBlogs `1w` + XGo `WEEK` |
| "只看 AI/文章/推文" | 限制数据源/分类 |
| "精简一些" | 缩减到 15-20 个选题 |
| "帮我写 #N" / "转发 #N" | 进入阶段五，生成快评 |
| "详细聊 #N" | 生成 300-500 字分享帖 |

---

## 与其他 Skill 的协作

### 职责边界

| 对比 Skill | 本 skill | 对比 skill | 关键区别 |
|-----------|---------|-----------|---------|
| bestblogs-daily-digest | 个人选题+轻量创作 | BestBlogs 订阅者简报 | 个人创作 vs 产品用户 |
| content-synthesizer | 快评/短帖 | 深度内容转化 | 快评 vs 长文 |
| deep-reading | 广度筛选 | 单篇深入分析 | 筛选 vs 分析 |

### 下游衔接

| 下游 Skill | 衔接方式 |
|-----------|---------|
| reading-workflow | 「值得深入」选题 → 加载阅读 |
| deep-reading | 用户选择某选题 → 深度分析 |
| content-synthesizer | 深入阅读后 → 产出长文 |
| post-to-x / x-actions | 快评/分享帖 → 发布/互动 |

---

## 错误处理

**重要**: 始终先检查 `response.success` 再处理 `response.data`。

### BestBlogs API

- `401`: 检查 `BESTBLOGS_API_KEY`
- `400`: 参数值不合法
- `500`: 重试一次
- `data` 为空: 建议扩大时间范围

### XGo API

- `401` (AUTH_001/002/003): 检查 `XGO_API_KEY`
- `403` (AUTH_004): 需要 Plus/Pro 会员
- `429` (xgo-0010): 等待 10 秒重试
- **HTTP 200** `xgo-0012`: 功能级会员限制
- **HTTP 200** `xgo-9005`: 操作不允许

### 单数据源失败

任一数据源失败时从另一源筛选并告知用户。单个分类请求失败不影响整体。
