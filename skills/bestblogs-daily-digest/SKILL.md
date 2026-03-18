---
name: bestblogs-daily-digest
description: "Use when 用户想生成 BestBlogs 每日简报，从近期内容中挑选最重要的条目，并输出为文本、HTML 或海报等摘要产物。"
---

# BestBlogs 每日早报 (Daily Digest)

从 BestBlogs.dev 过去 3 天的内容中智能筛选 10 条最值得关注的信息，生成纯文本、杂志风 HTML 和信息图海报三种形式的早报。使用 3 天窗口以弥补 RSS/微信公众号/时区导致的数据延迟，同时优先推荐发布时间更近的内容，并与历史日报去重避免重复推荐。

完整 API 参数详情见 `references/api_reference.md`。

## When to Use

- 用户要基于 BestBlogs 近期内容生成一份“今天值得看什么”的日报
- 用户需要 briefing、HTML 或海报等 digest 输出，而不是原始内容清单
- 用户希望优先看近 24-72 小时的重要更新，并与历史日报做去重

## When Not to Use

- 只想拉取完整原始列表或单篇正文时，使用 `bestblogs-fetcher`
- 想策展一整期周刊时，使用 `bestblogs-weekly-curator`
- 想把日报继续编排到跨渠道生产链路里时，使用 `manage-daily-content`

## Gotchas

- 3 天窗口是有意为之，不要擅自缩成 1 天，否则容易漏掉 RSS 和时区滞后的内容
- `score` 可能为 `null`，筛选前必须做安全兜底
- 历史日报去重不是简单删同标题，要区分“重复报道”和“新增角度”
- 生成三种输出时要共享同一组 Top 10，避免不同文件讲的是三套内容

## Related Skills

- `bestblogs-fetcher`：读取原始候选池
- `bestblogs-weekly-curator`：按周粒度策展和生成 issue copy
- `manage-daily-content`：把 Digest 结果接到每日内容编排链路
- `baoyu-image-gen` 或 `baoyu-infographic`：需要增强视觉输出时再调用

## 认证

所有请求需要 `X-API-KEY` 请求头。从环境变量 `BESTBLOGS_API_KEY` 读取密钥：

```bash
-H "X-API-KEY: $BESTBLOGS_API_KEY"
```

**启动检查**（按顺序执行）:
1. 检查 `$BESTBLOGS_API_KEY` 是否已设置
2. 若未设置，执行 `source ~/.zshrc` 后再检查
3. 若仍未设置，提示用户在 `~/.zshrc` 中配置
4. 用一个轻量请求验证 key 有效性（如 `pageSize:1` 的请求），若返回 `Unauthorized` 则提示用户更新 key

接口地址：`https://api.bestblogs.dev`

## 工作流概览

```
- [ ] 阶段一: 并行拉取数据（7 个请求，时间范围 3d）
- [ ] 阶段 1.5: 读取历史日报，构建已覆盖主题列表
- [ ] 阶段二: 合并去重 + 历史去重 + AI 智能筛选 Top 10
- [ ] 阶段三: 生成三种输出
  - [ ] 3.1 纯文本版（IM/社交媒体分享）
  - [ ] 3.2 杂志风 HTML（浏览/截图）
  - [ ] 3.3 信息图海报（Top 5，via image-gen）
- [ ] 阶段四: 保存文件
```

---

## 阶段一：并行拉取数据

7 个请求并行执行，每组获取评分最高的 100 条，时间范围 **3 天**（弥补 RSS/微信/时区延迟）:

```bash
# 1. AI 文章
curl -s -X POST https://api.bestblogs.dev/openapi/v1/resource/list \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: $BESTBLOGS_API_KEY" \
  -d '{"currentPage":1,"timeFilter":"3d","sortType":"score_desc","userLanguage":"zh_CN","pageSize":100,"type":"ARTICLE","category":"Artificial_Intelligence"}'

# 2. 编程技术文章
curl -s -X POST https://api.bestblogs.dev/openapi/v1/resource/list \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: $BESTBLOGS_API_KEY" \
  -d '{"currentPage":1,"timeFilter":"3d","sortType":"score_desc","userLanguage":"zh_CN","pageSize":100,"type":"ARTICLE","category":"Programming_Technology"}'

# 3. 商业科技文章
curl -s -X POST https://api.bestblogs.dev/openapi/v1/resource/list \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: $BESTBLOGS_API_KEY" \
  -d '{"currentPage":1,"timeFilter":"3d","sortType":"score_desc","userLanguage":"zh_CN","pageSize":100,"type":"ARTICLE","category":"Business_Tech"}'

# 4. 产品设计文章
curl -s -X POST https://api.bestblogs.dev/openapi/v1/resource/list \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: $BESTBLOGS_API_KEY" \
  -d '{"currentPage":1,"timeFilter":"3d","sortType":"score_desc","userLanguage":"zh_CN","pageSize":100,"type":"ARTICLE","category":"Product_Development"}'

# 5. 视频
curl -s -X POST https://api.bestblogs.dev/openapi/v1/resource/list \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: $BESTBLOGS_API_KEY" \
  -d '{"currentPage":1,"timeFilter":"3d","sortType":"score_desc","userLanguage":"zh_CN","pageSize":100,"type":"VIDEO"}'

# 6. 播客
curl -s -X POST https://api.bestblogs.dev/openapi/v1/resource/list \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: $BESTBLOGS_API_KEY" \
  -d '{"currentPage":1,"timeFilter":"3d","sortType":"score_desc","userLanguage":"zh_CN","pageSize":100,"type":"PODCAST"}'

# 7. 推文
curl -s -X POST https://api.bestblogs.dev/openapi/v1/tweet/list \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: $BESTBLOGS_API_KEY" \
  -d '{"currentPage":1,"timeFilter":"3d","sortType":"score_desc","userLanguage":"zh_CN","pageSize":100,"language":"all"}'
```

**并行策略**: 直接使用多个并行 Shell tool call 发起 7 个请求（每个请求一个独立 Shell 调用）。单个请求失败不影响其他请求，失败的可单独重试。不要使用 Task 子任务——子任务环境可能缺少必要工具导致失败。

**客户端过滤**: 仅保留 `score >= 85` 的内容。

**⚠️ score 字段空值处理**: API 返回的 `score` 可能为 `null`/`None`，直接比较会抛出 `TypeError`。Python 脚本中必须用 `score = it.get('score') or 0` 做安全转换后再过滤：

```python
# resource/list 接口
score = it.get('score') or 0
if score < 85:
    continue

# tweet/list 接口（score 在 resourceMeta 下）
rm = it.get('resourceMeta', {})
score = rm.get('score') or 0
if score < 85:
    continue
```

---

## 阶段 1.5: 读取历史日报

读取当前项目下最近 3 天的历史日报文件，构建「已覆盖主题」列表，用于阶段二去重：

```bash
# 历史日报存放在项目根目录 contents/bestblogs-digest/ 下
# 例如今天是 2026-03-08，则依次尝试读取:
#   contents/bestblogs-digest/2026-03-07/digest.txt
#   contents/bestblogs-digest/2026-03-06/digest.txt
#   contents/bestblogs-digest/2026-03-05/digest.txt
# 目录或文件不存在则跳过该天
```

从每份历史日报中提取：
- 每条内容的**标题**和**核心主题关键词**（如 "GPT-5.4 发布"、"OpenClaw 安全"）
- 构建「已覆盖主题」列表，用于后续筛选时排除

**不存在历史文件时跳过此步骤**（首次生成或历史文件被清理）。

---

## 阶段二：合并去重 + AI 智能筛选

### 2.1 合并与去重

1. **合并数据**:
   - 请求 1-6（resource/list）: 直接取 `data.dataList` 中的资源对象
   - 请求 7（tweet/list）: 取 `data.dataList[].resourceMeta` 作为资源对象，同时保留 `tweet.author.userName` 用于输出时标注 `@用户名`
2. **URL 去重**: 按 `url` 去重（同一内容可能出现在多个分类查询结果中）
3. **主题去重（当日内部）**: 多篇内容讨论同一话题时，保留评分最高的一条，记录其他来源作为补充提及（格式：`另见: 来源2, 来源3`）
4. **历史主题去重（跨日）**: 与阶段 1.5 构建的「已覆盖主题」列表比对，排除历史日报已推荐过的**相同角度**内容。判断规则：
   - **排除**: 同一事件的重复报道（如昨天已报道 "GPT-5.4 发布"，今天另一个来源也报道了同样的发布消息）
   - **允许**: 对已报道事件的**深度分析、技术原理拆解、产品评测、独家访谈、行业影响解读**等不同角度的内容（视为新增价值，正常参与筛选排序）
   - **判断标准**: 标题和摘要是否提供了历史日报中未涵盖的实质性新信息或新视角

### 2.2 AI 智能筛选 Top 10

从合并后的候选池中选出 10 条最值得推荐的内容。筛选维度（按优先级排列）:

#### 优先级 0: 时效性加权（3d 窗口下的时间衰减）

由于使用 3 天窗口拉取数据，**发布时间越近的内容优先级越高**:
- **今天发布**: 无衰减，满权重
- **昨天发布**: 轻微降权（约 -5% 权重），仍然优先于前天
- **前天发布**: 明显降权（约 -15% 权重），仅在内容质量显著优于今天/昨天的内容时才入选

时效性加权基于 `publishTimeStamp` 字段，与当前日期对比计算。同等质量下，优先选择更新的内容。

#### 优先级 1: 头部厂商重大动态

以下厂商的新模型、新产品、新政策、重大更新**自动进入候选**:
- **国际**: OpenAI, Anthropic, Google/Gemini, Meta AI, xAI
- **国内**: 阿里巴巴/通义，腾讯，DeepSeek, 月之暗面/Kimi, 智谱/GLM, Minimax, 百度/文心，字节/豆包

#### 优先级 2: AI Coding 专题

关于以下工具、方法论、实践经验的内容**加权提升**:
- Claude Code, Codex, Cursor, Windsurf, GitHub Copilot, Devin
- AI 辅助编程最佳实践、Agent 开发、MCP 协议

#### 优先级 3: 高优来源加权

来自以下来源的内容**加权提升**（按 `sourceName` 或推文作者 `userName` 匹配）:

**文章/博客来源**:
- **国际**: Latent Space, Simon Willison's Weblog, LangChain Blog, deeplearning.ai, The GitHub Blog, InfoQ, The Cloudflare Blog, Google Developers Blog, freeCodeCamp.org, Spring Blog, Elevate (Addy Osmani), The Pragmatic Engineer, OpenClaw Blog
- **国内**: 机器之心，新智元，量子位，赛博禅心，数字生命卡兹克，十字路口 Crossing, 歸藏的 AI 工具箱，Founder Park, 腾讯科技，腾讯技术工程，InfoQ 中文，阮一峰的网络日志，宝玉的分享，SuperTechFans, Datawhale, 魔搭 ModelScope 社区，阿里技术，阿里云开发者，腾讯云开发者，大淘宝技术，前端早读课

**播客/视频来源**:
- **国际**: Lenny's Podcast, Y Combinator, a16z, The Pragmatic Engineer, OpenAI (YouTube), Anthropic (YouTube), Google DeepMind (YouTube), AI Engineer
- **国内**: 张小珺 Jùn｜商业访谈录，十字路口 Crossing (播客), 晚点 LatePost

**推文作者** (按 `userName` 匹配):
- **厂商官方**: @OpenAI, @OpenAIDevs, @AnthropicAI, @GoogleDeepMind, @GeminiApp, @cursor_ai, @LangChainAI, @github
- **行业领袖**: @sama (Sam Altman), @gdb (Greg Brockman), @karpathy (Andrej Karpathy), @AndrewYNg (Andrew Ng), @demishassabis (Demis Hassabis), @OfficialLoganK (Logan Kilpatrick), @satyanadella (Satya Nadella), @sundarpichai (Sundar Pichai)
- **投资人/创业者**: @pmarca (Marc Andreessen), @paulg (Paul Graham), @naval (Naval), @lennysan (Lenny Rachitsky), @hwchase17 (Harrison Chase)
- **中文圈**: @dotey (宝玉), @lexfridman (Lex Fridman)

#### 优先级 4: 内容质量与阅读价值

- `score` 评分（基础权重）
- 内容深度（长文/深度分析 > 短资讯）
- 读者阅读的迫切性（时效性强的 > 常青内容）
- 独特视角或原创洞察

### 筛选输出

对每条入选内容记录：
- 排名（1-10）
- 入选理由（一句话）
- 如有同话题的其他来源，记录补充来源

**不要求覆盖每个分类或内容类型** — 纯按内容重要性排序。

---

## 阶段三：生成三种输出

### 中文排版规范（适用于所有输出格式）

| 规则 | 说明 | 示例 |
|------|------|------|
| 中英文/数字间加空格 | 中文与英文单词、数字之间插入一个半角空格 | ✅ `GPT-5.4 mini 速度提升 2 倍` ❌ `GPT-5.4 mini速度提升2倍` |
| 引号使用「」 | 需要引用时使用直角引号，不使用 "" | ✅ `将数据中心定义为「AI 工厂」` ❌ `将数据中心定义为"AI工厂"` |
| 减少括号 | 能用逗号或短句拆开的信息不要塞进括号 | ✅ `Vera Rubin 平台算力达 3.6 EFLOPS，全液冷设计` ❌ `Vera Rubin 平台（3.6 EFLOPS 算力、100% 液冷）` |
| 减少破折号 | 避免频繁使用 `——`，改用逗号、句号或分句 | ✅ `核心观点：AI 前沿不再是聊天界面，而是可信的任务执行。` ❌ `核心观点——AI 前沿不再是聊天界面——而是可信的任务执行。` |
| 简洁句式 | 避免从句嵌套，一句话表达一个意思 | 短句优先，长句拆成两句 |
| 地道中文表达 | 避免翻译腔，用自然的中文语序 | ✅ `该框架支持团队定制模型和工具` ❌ `该框架允许团队在不分叉核心逻辑的情况下定制模型和工具` |

### 3.1 纯文本版

适合直接复制到 IM 群聊（微信/飞书/Slack）或社交媒体分享。IM 不渲染 markdown，因此使用纯文本格式，URL 独立成行确保可点击。

```
BestBlogs 早报 | YYYY-MM-DD

# AI Coding / Claude 4 / DeepSeek V3

[1] 标题
2-3 句摘要，概括核心信息和为什么值得关注。
来源: sourceName | 评分: 96
readUrl（BestBlogs 站内链接）

[2] 标题
一两句话摘要。
来源: sourceName | 评分: 93
readUrl（BestBlogs 站内链接）

...（共 10 条）

---
BestBlogs.dev - 遇见更好的技术阅读
```

**格式规则**:
- 每条内容必须包含 `readUrl` 链接（BestBlogs 站内链接），URL 独立成行确保在 IM 中可直接点击
- Top 1 的内容适当增加篇幅（2-3 句摘要 + 为什么值得关注）
- 其余每条 1-2 句摘要
- 同话题有多个来源时：`另见: 来源2, 来源3`
- 关键词 3-5 个，提取自当日最热话题，用 `/` 分隔
- 内容类型标识：推文标注 `@userName`，播客标注 `[播客 XXmin]`，视频标注 `[视频 XXmin]`，文章不标注

### 3.2 杂志风 HTML

生成独立 HTML 文件，追求高端设计杂志（Monocle、Kinfolk）气质。详细视觉风格、HTML 结构模板和设计禁忌见 `references/html_template.md`。

### 3.3 信息图海报

使用 `image-gen` skill 生成纵向 9:16 信息图海报，仅包含 **Top 5** 内容。详细视觉风格、调用方式和设计禁忌见 `references/poster_guide.md`。

---

## 阶段四：保存文件

所有输出保存到项目根目录下：

```
contents/bestblogs-digest/
  YYYY-MM-DD/
    digest.txt          # 纯文本版
    digest.html         # 杂志风 HTML
    poster.png          # 信息图海报
```

创建目录（如不存在）:

```bash
mkdir -p contents/bestblogs-digest/YYYY-MM-DD
```

保存完成后，输出纯文本版内容到对话中，并告知用户三个文件的路径。

---

## 参数调整

根据用户输入调整：

| 用户表述 | 参数调整 |
|---------|---------|
| "本周早报" / "这周" | `timeFilter: "1w"`，Top 10 → Top 15，历史去重仍生效 |
| "只看 AI" | 仅拉取 AI 分类 |
| "多给几条" / "Top 15" | 增加输出数量 |
| "不需要海报" / "只要文本" / 首次明确指定输出格式 | 跳过阶段 3.3 |
| "只要文本" | 仅生成纯文本版 |
| "评分 90 以上" | 客户端过滤阈值调整为 90 |

---

## 错误处理

**重要**: 始终先检查 `response.success` 再处理 `response.data`。部分错误返回 HTTP 200 但 `success: false` — 不要仅依赖 HTTP 状态码。

- `401`: 检查 `BESTBLOGS_API_KEY` 是否已设置且有效
- `400`: 参数值不合法，检查枚举值
- `500`: 重试一次，仍失败则告知用户
- `data` 为空或 `totalCount: 0`: 该时间范围内无内容。若 3d 仍无结果，建议用户尝试 `1w`
- 单个分类请求失败不影响整体：记录失败分类，用其他分类数据继续生成早报

---

## 职责边界

本 skill 与 `daily-content-curator` 功能相近但定位不同：
- **bestblogs-daily-digest**: 面向 BestBlogs 订阅者的每日简报产品，输出标准化日报格式
- **daily-content-curator**: 跨源（BestBlogs + XGo）个人阅读清单，基于个人兴趣打分筛选

如需个人阅读推荐（含 Twitter 推文），使用 `daily-content-curator`。
