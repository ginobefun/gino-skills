---
name: xgo-digest-tweets
description: "Use when 用户想基于 XGo 数据生成近期推文简报，把内容按主题分组或汇总成摘要，而不是查看原始时间线。"
---

# 每日推文简报 (Daily Tweet Digest)

通过 XGo (xgo.ing) 开放接口生成每日推文简报 — 智能筛选高价值内容，输出可读简报 + 杂志风 HTML + 信息图 + 完整版数据，一览今日精华。

完整 API 参数详情见 `references/api_reference.md`。

## When to Use

- 用户要一份最近推文的 digest、briefing 或视觉化简报，而不是原始时间线
- 用户需要把关注流和推荐流汇总成“今天发生了什么”
- 输出目标是 `digest.md`、`digest.html` 或信息图，而不是单次查询结果

## When Not to Use

- 只想抓取原始 timeline、列表流或书签流时，使用 `xgo-fetch-tweets`
- 想按关键词或条件搜索推文时，使用 `xgo-search-tweets`
- 想深挖某个账号时，使用 `xgo-view-profile` 或 `xgo-track-kol`

## Gotchas

- 服务端默认排序不是 `influence`，必须显式传 `sortType: "influence"`
- 同一推文会同时出现在 following 和 recommendation，需要按 `id` 去重
- 高互动不等于高价值，生成 digest 时要做内容质量再排序
- Top 20、Top 10 和完整版应来自同一套去重后的基准数据

## Related Skills

- `xgo-fetch-tweets`：读取原始时间线、列表流、书签流
- `xgo-search-tweets`：按关键词和过滤条件搜索推文
- `xgo-view-profile`：查看某个账号及其近期推文
- `manage-daily-content`：把 digest 结果接到每日内容编排链路

## Shared Scripts

- 优先复用 `scripts/shared/xgo_client.py`
- 数据抓取优先走 `scripts/examples/xgo_digest_source_data.py`
- ranking / render 优先走 `scripts/examples/xgo_digest_rank.py` 和 `scripts/examples/xgo_digest_render.py`
- `scripts/process-tweets.js` 和 `scripts/generate-digest.js` 视为 worker 内部实现，不再作为 orchestrator 直接入口

## Worker Entrypoints

优先把以下入口当成稳定 worker，而不是手写 5 个 `curl` 请求：

```bash
python3 scripts/examples/xgo_digest_source_data.py --output /tmp/xgo_digest_source_data.json
python3 scripts/examples/xgo_digest_rank.py --source-data /tmp/xgo_digest_source_data.json --output /tmp/tweet_digest_data.json
python3 scripts/examples/xgo_digest_render.py --digest-data /tmp/tweet_digest_data.json
```

其中：
- `xgo_digest_source_data.py` 负责拉取 `list/all`、following feed、recommendation feed，并输出统一 JSON 契约
- `xgo_digest_rank.py` 负责包装 `process-tweets.js`，输出 Top 20 / Top 10 和完整 digest 数据
- `xgo_digest_render.py` 负责包装 `generate-digest.js`，输出生成文件列表和产物目录

orchestrator 应优先消费 worker 的 JSON 输出，而不是依赖散落的 shell 日志。

## 认证

认证方式见 `../../references/shared/auth-xgo.md`。

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

## 第一步：拉取 digest 源数据

```bash
python3 scripts/examples/xgo_digest_source_data.py \
  --time-range LAST_24H \
  --sort-type influence \
  --tweet-type NO_RETWEET \
  --page-size 50 \
  --max-pages 2 \
  --output /tmp/xgo_digest_source_data.json
```

worker 会统一抓取：
- `list/all`
- following feed
- recommendation feed

必须显式传递 `--sort-type influence`，因为服务端默认排序仍然是 `recent`。
worker JSON 中：
- `items` 为 following + recommendation 的合并原始推文
- `verify.lists` 为列表数据
- `meta` 记录每类来源的数量和抓取参数

## 第二步：构建 author->list 映射

从 worker 输出中的 `verify.lists` 构建映射表：

```
对每个 UserListDTO:
  对每个 member (UserBrief):
    mapping[member.userName] = listName
```

一个用户可能属于多个列表，取第一个匹配的列表名（按列表 order 排序）。

## 第三步：去重与分类

### 去重

合并 worker 输出中的 following / recommendation 推文，按推文 `id` 去重。同一推文在多个查询中仅保留一条。

### 分类规则

对每条推文，根据 `author.userName` 查映射表：

1. **在映射表中** -> 归入对应列表分类
2. **不在映射表，来自 following** -> 归入"其他"
3. **不在映射表，来自 recommendation** -> 归入"其他 (推荐)"

合并时记录来源（following/recommendation），同推文优先标记为 following。

---

## 第四步：智能筛选与排序

这一步从去重后的全部推文中，按重要性和读者迫切性选出 Top 20，不均衡分配到分类，纯按内容价值排序。

详细的筛选维度、来源权重、主题加权、排序公式、同话题去重和内容质量判断规则见 `references/scoring-rules.md`。

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

> 一句话总结今日推特圈最值得关注的事（基于 Top 3 头条内容提炼）。

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

保留详细输出格式，按分类组织全部推文数据。**为每个分类生成 1-2 句话的 AI 摘要**，概括该分类中的热点话题和关键信息（摘要应捕捉核心内容，不罗列每条推文）:

```markdown
## 每日推文简报 - 完整版 (YYYY-MM-DD, 共 N 条)

来源：关注者推文 X 条 + 推荐推文 Y 条，去重后 Z 条，分为 M 个分类。

---

### 分类名 (N 条)

> **摘要**: [AI生成的1-2句话摘要，概括该分类的核心热点]

#### 1. @username - DisplayName
- **影响力**: 85 | **互动**: 👍 446 🔁 134 💬 36 🔄 12 📑 8 👁 45K
- **内容**:
  推文完整文本...
- **链接**: [查看原文](url)

...
```

**AI 摘要生成要点**:
- 分析该分类下所有推文的共同主题
- 提取 1-2 个最关键的趋势或事件
- 用简洁的语言概括，不罗列具体推文
- 示例："该分类主要讨论 Claude 的最新功能发布，包括 100万token 上下文窗口开放和多个实际应用案例分享。"

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

**生成方式**:

1. 先生成信息图提示词文件 `infographic-prompt.txt`（供用户或后续步骤使用）
2. 若 `GOOGLE_API_KEY` 已设置，调用 `image-gen` 技能生成：

```bash
# 使用 skill 的脚本生成（如 image-gen 提供）
# 或手动调用 image-gen skill
/image-gen "{生成的提示词内容}" --ar 9:16 --provider google
```

3. 若 API Key 未设置，跳过生成并提示用户手动调用

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

通用错误码见 `../../references/shared/error-handling-xgo.md`。本 skill 额外关注：

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

---

## 实现参考

本 skill 的工作流可通过以下方式实现：

### 方式一：worker 链路（推荐）

1. 先运行抓取 worker：
   - `scripts/examples/xgo_digest_source_data.py`

2. 再运行 ranking worker：
   - `scripts/examples/xgo_digest_rank.py`

3. 最后运行 render worker：
   - `scripts/examples/xgo_digest_render.py`

4. 工作流拆分：
   - worker 负责共享 API 调用和稳定 JSON 输出
   - `process-tweets.js` 负责 ranking worker 内部的本地排名与分类
   - `generate-digest.js` 负责 render worker 内部的最终产物生成

3. 输出目录结构：
   ```
   contents/twitter-digest/YYYY-MM-DD/
   ├── digest.md          # 可读简报
   ├── digest-full.md     # 完整版
   ├── digest.html        # 杂志风 HTML
   └── infographic-prompt.txt  # 信息图提示词
   ```

### 方式二：直接调用 shared client 或内部脚本

如需更灵活的控制，直接在 Python 中调用 `scripts/shared/xgo_client.py`，而不是回退到手写 `curl`。
只有在需要修改内部算法或渲染逻辑时，才直接编辑 `scripts/process-tweets.js` 或 `scripts/generate-digest.js`。
参考 `references/api_reference.md` 获取端点文档和 DTO 定义。

### 关键实现细节

**去重逻辑**：
- 使用推文 `id` 作为唯一键
- 同一推文出现在多个查询结果中时，优先保留 `source: "following"`

**综合分数计算**：
```javascript
const sourceWeights = {
  headline_vendor: 5,   // 头部厂商
  industry_leader: 3,   // 行业领袖
  premium_media: 2,     // 高优媒体
  builder: 1.5,         // 独立开发者
  default: 1
};

const topicWeights = {
  ai_coding: 2,         // AI Coding
  new_release: 1.8,     // 新发布
  methodology: 1.3,     // 方法论
  default: 1
};

const score = influenceScore * sourceWeight * topicWeight;
```

**分类组织**：
- 按 `list/all` 返回的列表名组织推文
- 未匹配到列表的推文归入 "其他"（following 来源）或 "其他 (推荐)"
- 完整版按分类输出，简报不按分类组织
