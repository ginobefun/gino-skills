---
name: xgo-digest-tweets
description: "通过 XGo (xgo.ing) 开放接口生成每日推文简报。适用场景：(1) 查看今日推文精华摘要，(2) 按列表分类浏览推文，(3) 获取关注者和推荐的每日精选，(4) 快速了解今天 Twitter 上发生了什么，(5) 生成推文日报/周报。触发短语：'每日简报', '推文简报', 'daily digest', 'tweet digest', '今日摘要', '今天推文总结', 'twitter summary', '推文精选', '每日精选', 'daily briefing', '推特日报', '今天的推特', '推文汇总', 'tweet roundup', '推特摘要', 'twitter daily', '今天有什么值得看的推文', 或任何与每日推文简报、推文摘要、推文精选相关的表述。"
---

# 每日推文简报 (Daily Tweet Digest)

通过 XGo (xgo.ing) 开放接口生成每日推文简报 — 智能筛选高价值内容，输出可读简报 + 杂志风 HTML + 信息图 + 完整版数据，一览今日精华。

完整 API 参数详情见 `references/api_reference.md`。

## 认证

所有请求需要 `X-API-KEY` 请求头。从环境变量 `XGO_API_KEY` 读取密钥：

```bash
-H "X-API-KEY: $XGO_API_KEY"
```

若 `XGO_API_KEY` 未设置，提示用户配置。

接口地址：`https://api.xgo.ing`

## 工作流概览

```
第一步: 并行拉取数据（5 请求）
第二步: 构建 author->list 映射
第三步: 去重与分类
第四步: 智能筛选与排序（Top 20）
第五步: 生成 4 种输出
  5.1 可读简报 Markdown（Top 20）
  5.2 完整版 Markdown（全部数据）
  5.3 杂志风 HTML（Top 20）
  5.4 信息图 PNG（Top 10）
```

**输出目录**: `contents/twitter-digest/YYYY-MM-DD/`（项目根目录的相对路径，按日期子目录组织）

**输出文件**:
| 文件 | 内容 | 选取 |
|------|------|------|
| `digest.md` | 可读简报，叙事式快速概览 | Top 20 |
| `digest-full.md` | 完整版，所有分类全部推文详细数据 | 全部 |
| `digest.html` | 杂志风 HTML，可浏览器打开/截图 | Top 20 |
| `digest.png` | 信息图，关键词 + 核心推文 | Top 10 |

**速率说明**: 5 请求/次，远低于 PLUS 200 次/分限制。

---

## 第一步：并行拉取数据（5 个请求）

```bash
# 1. 获取所有列表（含成员信息，用于构建映射）
curl -s "https://api.xgo.ing/openapi/v1/list/all" \
  -H "X-API-KEY: $XGO_API_KEY"

# 2. 关注者推文 - 第1页（按影响力排序，排除纯转推，近24小时）
curl -s -X POST https://api.xgo.ing/openapi/v1/tweet/list \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: $XGO_API_KEY" \
  -d '{"queryType":"following","timeRange":"LAST_24H","sortType":"influence","tweetType":"NO_RETWEET","currentPage":1,"pageSize":50}'

# 3. 关注者推文 - 第2页
curl -s -X POST https://api.xgo.ing/openapi/v1/tweet/list \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: $XGO_API_KEY" \
  -d '{"queryType":"following","timeRange":"LAST_24H","sortType":"influence","tweetType":"NO_RETWEET","currentPage":2,"pageSize":50}'

# 4. 推荐推文 - 第1页
curl -s -X POST https://api.xgo.ing/openapi/v1/tweet/list \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: $XGO_API_KEY" \
  -d '{"queryType":"recommendation","timeRange":"LAST_24H","sortType":"influence","tweetType":"NO_RETWEET","currentPage":1,"pageSize":50}'

# 5. 推荐推文 - 第2页
curl -s -X POST https://api.xgo.ing/openapi/v1/tweet/list \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: $XGO_API_KEY" \
  -d '{"queryType":"recommendation","timeRange":"LAST_24H","sortType":"influence","tweetType":"NO_RETWEET","currentPage":2,"pageSize":50}'
```

**并行执行所有 5 个请求。** 必须显式传递 `sortType: "influence"` — 服务端默认值为 `recent`。

## 第二步：构建 author->list 映射

从 `list/all` 响应中构建映射表：

```
对每个 UserListDTO:
  对每个 member (UserBrief):
    mapping[member.userName] = listName
```

一个用户可能属于多个列表，取第一个匹配的列表名（按列表 order 排序）。

## 第三步：去重与分类

### 去重

合并所有推文（请求 2-5），按推文 `id` 去重。同一推文在多个查询中仅保留一条。

### 分类规则

对每条推文，根据 `author.userName` 查映射表：

1. **在映射表中** -> 归入对应列表分类
2. **不在映射表，来自 following** -> 归入"其他"
3. **不在映射表，来自 recommendation** -> 归入"其他 (推荐)"

合并时记录来源（following/recommendation），同推文优先标记为 following。

---

## 第四步：智能筛选与排序

这一步从去重后的全部推文中，按重要性和读者迫切性选出 Top 20，不均衡分配到分类，纯按内容价值排序。

### 筛选维度与加权

对每条推文计算综合优先级分数，考虑以下维度：

#### 1. 来源权重（最重要）

**头部厂商官方账号** — 最高优先级，这些账号发布的新模型、新产品、新功能几乎必选：
- OpenAI 系：`OpenAI`, `OpenAIDevs`, `ChatGPTapp`
- Anthropic 系：`AnthropicAI`, `claudeai`, `alexalbert__`
- Google 系：`GoogleDeepMind`, `sundarpichai`
- 国内头部：DeepSeek, 阿里通义 Qwen, 月之暗面 Kimi, 智谱 GLM, MiniMax
- Meta: `AIatMeta`, `ylecun`

**行业领袖与研究者** — 高优先级，他们的观点和判断有前瞻价值：
- `karpathy`, `sama`, `AndrewYNg`, `ylecun`

**高优媒体/创作者** — 中高优先级，内容质量稳定：
- 英文：`ycombinator`, `a16z`, `LennysPodcast`, `GergelyOrosz`, `lexfridman`, `TheRundownAI`
- 中文：宝玉 (`vista8`/`dotey`), `HiTw93`, `xicilion`, 张小珺，Latent Space, Founder Park

**Builder/独立开发者** — 中优先级，实践经验有参考价值：
- `levelsio`, `garrytan`, `pmarca`, `gregisenberg`

注意：上面列出的用户名是已知的参考示例。匹配时应同时检查 `author.userName` 和 `author.name`（显示名称可能包含公司/产品名）。国内厂商账号的 handle 可能不固定，优先通过 `author.name` 中包含的关键词（如 "DeepSeek", "Qwen", "Kimi", "智谱", "MiniMax"）匹配。不在列表中的账号按默认权重处理。

#### 2. 内容主题加权

以下关键词出现在推文文本中时提升优先级：

**AI Coding（高加权）**: Claude Code, Codex, Cursor, Windsurf, Copilot, vibe coding, AI coding, agentic coding

**新模型/新产品发布（高加权）**: launching, introducing, announcing, releasing, now available, 发布，上线，开源

**方法论/深度实践（中加权）**: best practice, lesson learned, how I, architecture, framework, 实践，经验，方法论

#### 3. 基础影响力

`influenceScore` 作为基础分，但不是唯一决定因素。一条来自 Anthropic 的 influenceScore=200 的产品发布，应排在一条无关账号的 influenceScore=2000 的热门段子前面。

### 排序逻辑

```
综合分 = influenceScore * 来源权重系数 * 主题加权系数
```

参考权重系数：
- 头部厂商官方：5x
- 行业领袖：3x
- 高优媒体：2x
- Builder/独立开发者: 1.5x
- 其他：1x

主题加权：
- AI Coding 相关：2x
- 新发布/新产品：1.8x
- 方法论/实践：1.3x
- 其他：1x

### 同话题去重

多条推文讨论同一话题（如多人转发评论同一事件）时，保留综合分最高的一条，在描述中可提及其他来源的视角。

### 输出

排序后取：
- **Top 20**: 用于可读简报和杂志风 HTML
- **Top 10**: 用于信息图（从 Top 20 中取前 10）
- **全部**: 用于完整版（按原分类组织）

---

## 第五步：生成输出

确保输出目录存在：

```bash
mkdir -p contents/twitter-digest/YYYY-MM-DD
```

### 5.1 可读简报（digest.md）

这是给读者的主要阅读产物，像一篇短日报，用户应能在 2-3 分钟内读完并掌握当天最重要的推文动态。

**使用用户输入的语言编写**（用户用中文提问则中文输出，英文则英文）。

**格式**:

```markdown
# Twitter 日报 YYYY-MM-DD

> 一句话总结今日推特圈最值得关注的事。

---

## 头条

对 Top 1-3 最重要的推文，每条用 2-3 句话概括核心内容和为什么重要，嵌入 [原文链接]。如果是产品发布或重大新闻，可以多写几句提供背景。

## 值得关注

对 Top 4-10 的推文，每条用 1-2 句话概括，嵌入链接。按话题自然分组（不必按原始列表分类），相关推文可以串联在一段中。

## 快速浏览

对 Top 11-20 的推文，用简洁的列表格式：
- **@username**: 一句话概括 [链接](url)

---

*数据来源：XGo | 关注者 X 条 + 推荐 Y 条 | [完整版](digest-full.md)*
```

**写作要点**:
- 每条推文用自己的话概括核心观点，不照搬原文
- 英文推文内容概括时使用用户的语言，专有名词保留原文
- 链接自然嵌入文字中，不单独列出
- 头条部分可以加入简短评论或背景补充
- 重点是快速、清晰、不遗漏关键信息

### 5.2 完整版（digest-full.md）

保留详细输出格式，按分类组织全部推文数据。**生成前先为每个分类生成 1-2 句话的 AI 摘要**，概括该分类中的热点话题和关键信息（摘要应捕捉核心内容，不罗列每条推文）:

```markdown
## 每日推文简报 - 完整版 (YYYY-MM-DD, 共 N 条)

来源：关注者推文 X 条 + 推荐推文 Y 条，去重后 Z 条，分为 M 个分类。

---

### 分类名 (N 条中取 Top 5)

> **摘要**: 1-2 句话概括该分类热点。

#### 1. @username - DisplayName
- **影响力**: 85 | **互动**: 👍 446 🔁 134 💬 36 🔄 12 📑 8 👁 45K
- **内容**:
  推文完整文本...
- **链接**: [查看原文](url)

...
```

**字段映射和完整性规则同原版**:
- `text` 完整输出不截断
- 互动指标为 0 或 null 时省略
- 大数字用 K/M 格式化
- 分类按推文总数降序排列
- 空分类不输出

### 5.3 杂志风 HTML（digest.html）

生成一个自包含的 HTML 文件，可直接在浏览器中打开查看或截图分享。展示 Top 20 推文（Top 1-3 头条大卡片 + Top 4-20 紧凑列表）。

详细模板和设计规范见 `references/html_template.md`。

**核心设计要素**（详见 `references/html_template.md` 中的完整色彩和排版定义）:
- **风格**: 现代主义杂志美学（Monocle / Kinfolk），克制精准、大量留白、纸质噪点质感
- **品牌**: 页头和页脚体现 XGo (xgo.ing) 品牌，作为数据来源标识
- **布局**: 头条区域（Top 1-3 大卡片）+ 列表区域（Top 4-20 紧凑卡片）+ 关键词标签
- **内容**: 每条推文显示作者、一句话概括、影响力分数、关键互动指标、原文链接
- **语言**: 标题、section label、页脚等界面文字使用中文，符合用户阅读习惯

### 5.4 信息图（digest.png）

使用 `image-gen` 技能生成一张信息图，展示 Top 10 推文的核心信息。

详细提示词指南见 `references/infographic_guide.md`。

**内容要素**（详见 `references/infographic_guide.md` 中的提示词模板和设计规范）:
- 日期标题
- Top 10 推文：每条显示作者名 + 一句话核心观点 + 影响力分数
- 各分类的关键词标签

**生成命令**:

```bash
SKILL_DIR=~/.claude/skills/image-gen
bun run ${SKILL_DIR}/scripts/main.ts \
  --prompt "{根据 Top 10 内容生成的提示词}" \
  --image contents/twitter-digest/YYYY-MM-DD/digest.png \
  --provider google \
  --model gemini-3-pro-image-preview \
  --ar 9:16 \
  --quality 2k
```

信息图使用 9:16 竖版比例（适合手机浏览和社交媒体分享）。

---

## 参数调整

根据用户输入调整：
- "今日简报" -> 默认参数（LAST_24H）
- "本周简报" -> `timeRange: "WEEK"`
- "Top 10" / "Top 30" -> 调整可读简报的选取数量
- "只看 AI 分类" -> 仅输出 AI 分类的推文
- "包括转推" -> `tweetType: "ALL"`
- "只要简报" / "不要图片" -> 跳过 HTML 和信息图生成
- "详细模式" -> 仅输出完整版

## 错误处理

**重要**: 始终先检查 `response.success` 再处理 `response.data`。部分错误返回 HTTP 200 但 `success: false` — 不要仅依赖 HTTP 状态码。

- `401`: 检查 `XGO_API_KEY` 是否已设置且有效
- `403`: 开放接口需要 Plus 或 Pro 会员
- `429`: 频率限制 — 等待 10 秒后重试一次。若仍为 429，告知用户："频率限制，请稍后重试。"（PLUS 200 次/分，PRO 600 次/分）
- `success: false` 且 `code` 非零：读取响应体中的 `code` 和 `message`，对照 api_reference 中的错误码处理
- `data` 为空或 `totalSize: 0`: 该时间范围内无推文，建议扩大 `timeRange`
- `list/all` 返回空列表：所有推文归入 "其他" / "其他 (推荐)"
- `image-gen` 失败：重试一次，仍失败则跳过信息图并告知用户
- `GOOGLE_API_KEY` 未设置：跳过信息图生成，提示用户配置

---

## 职责边界

本 skill 与 `daily-content-curator` 功能相近但定位不同：
- **xgo-digest-tweets**: 专注 Twitter 推文，生成详细摘要（含翻译、分类、关键词），适合了解 Twitter 动态全貌
- **daily-content-curator**: 跨源（BestBlogs + XGo）个人阅读清单，基于兴趣打分筛选，适合决定"今天读什么"

如需跨源个性化阅读推荐，使用 `daily-content-curator`。
