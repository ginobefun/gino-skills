---
name: bestblogs-daily-digest
description: "BestBlogs.dev 每日内容早报。适用场景: (1) 生成每日早报/日报, (2) 获取过去 24 小时最值得阅读的内容, (3) 每天早上 9 点的内容精选, (4) 今日 AI/技术领域有什么重要动态, (5) 生成早报海报和分享文案。触发短语: '每日早报', '今日早报', 'daily digest', '早报', '日报', '今天有什么值得看的', 'morning briefing', '每日精选', 'daily briefing', '生成早报', '今日精选', 'bestblogs 早报', 'bestblogs digest', '内容早报', '技术早报', 'AI 早报', '每日推荐'"
---

# BestBlogs 每日早报 (Daily Digest)

从 BestBlogs.dev 过去 24 小时的内容中智能筛选 10 条最值得关注的信息，生成纯文本、杂志风 HTML 和信息图海报三种形式的早报。

完整 API 参数详情见 `references/api_reference.md`。

## 认证

所有请求需要 `X-API-KEY` 请求头。从环境变量 `BESTBLOGS_API_KEY` 读取密钥:

```bash
-H "X-API-KEY: $BESTBLOGS_API_KEY"
```

若 `BESTBLOGS_API_KEY` 未设置，提示用户配置。

接口地址: `https://api.bestblogs.dev`

## 工作流概览

```
- [ ] 阶段一: 并行拉取数据（7 个请求）
- [ ] 阶段二: 合并去重 + AI 智能筛选 Top 10
- [ ] 阶段三: 生成三种输出
  - [ ] 3.1 纯文本版（IM/社交媒体分享）
  - [ ] 3.2 杂志风 HTML（浏览/截图）
  - [ ] 3.3 信息图海报（Top 5，via image-gen）
- [ ] 阶段四: 保存文件
```

---

## 阶段一: 并行拉取数据

7 个请求并行执行，每组获取评分最高的 100 条，时间范围 1 天:

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

# 5. 视频
curl -s -X POST https://api.bestblogs.dev/openapi/v1/resource/list \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: $BESTBLOGS_API_KEY" \
  -d '{"currentPage":1,"timeFilter":"1d","sortType":"score_desc","userLanguage":"zh_CN","pageSize":100,"type":"VIDEO"}'

# 6. 播客
curl -s -X POST https://api.bestblogs.dev/openapi/v1/resource/list \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: $BESTBLOGS_API_KEY" \
  -d '{"currentPage":1,"timeFilter":"1d","sortType":"score_desc","userLanguage":"zh_CN","pageSize":100,"type":"PODCAST"}'

# 7. 推文
curl -s -X POST https://api.bestblogs.dev/openapi/v1/tweet/list \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: $BESTBLOGS_API_KEY" \
  -d '{"currentPage":1,"timeFilter":"1d","sortType":"score_desc","userLanguage":"zh_CN","pageSize":100,"language":"all"}'
```

**并行执行所有 7 个请求。** 客户端过滤: 仅保留 `score >= 85` 的内容。

---

## 阶段二: 合并去重 + AI 智能筛选

### 2.1 合并与去重

1. **合并数据**:
   - 请求 1-6（resource/list）: 直接取 `data.dataList` 中的资源对象
   - 请求 7（tweet/list）: 取 `data.dataList[].resourceMeta` 作为资源对象，同时保留 `tweet.author.userName` 用于输出时标注 `@用户名`
2. **URL 去重**: 按 `url` 去重（同一内容可能出现在多个分类查询结果中）
3. **主题去重**: 多篇内容讨论同一话题时，保留评分最高的一条，记录其他来源作为补充提及（格式: `另见: 来源2, 来源3`）

### 2.2 AI 智能筛选 Top 10

从合并后的候选池中选出 10 条最值得推荐的内容。筛选维度（按优先级排列）:

#### 优先级 1: 头部厂商重大动态

以下厂商的新模型、新产品、新政策、重大更新**自动进入候选**:
- **国际**: OpenAI, Anthropic, Google/Gemini, Meta AI, xAI
- **国内**: 阿里巴巴/通义, 腾讯, DeepSeek, 月之暗面/Kimi, 智谱/GLM, Minimax, 百度/文心, 字节/豆包

#### 优先级 2: AI Coding 专题

关于以下工具、方法论、实践经验的内容**加权提升**:
- Claude Code, Codex, Cursor, Windsurf, GitHub Copilot, Devin
- AI 辅助编程最佳实践、Agent 开发、MCP 协议

#### 优先级 3: 高优来源加权

来自以下来源的内容**加权提升**（按来源名称 `sourceName` 匹配）:
- **国际**: Lenny's Podcast, Y Combinator, The Pragmatic Engineer, a16z, Lex Fridman, Latent Space, Simon Willison, Stratechery
- **国内**: 宝玉, 张小珺, 数字生命卡兹克, 赛博禅心, 腾讯科技, Founder Park, 晚点LatePost, 极客公园

#### 优先级 4: 内容质量与阅读价值

- `score` 评分（基础权重）
- 内容深度（长文/深度分析 > 短资讯）
- 读者阅读的迫切性（时效性强的 > 常青内容）
- 独特视角或原创洞察

### 筛选输出

对每条入选内容记录:
- 排名（1-10）
- 入选理由（一句话）
- 如有同话题的其他来源，记录补充来源

**不要求覆盖每个分类或内容类型** — 纯按内容重要性排序。

---

## 阶段三: 生成三种输出

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
- 同话题有多个来源时: `另见: 来源2, 来源3`
- 关键词 3-5 个，提取自当日最热话题，用 `/` 分隔
- 内容类型标识: 推文标注 `@userName`，播客标注 `[播客 XXmin]`，视频标注 `[视频 XXmin]`，文章不标注

### 3.2 杂志风 HTML

生成一个可直接在浏览器打开的独立 HTML 文件，信息量介于纯文本和海报之间，适合浏览和截图分享。

整体追求**高端设计杂志**（Monocle、Kinfolk）的气质 — 低调、专业、有文化底蕴，经得起反复观看。

**视觉风格**（BestBlogs 品牌 + 现代主义杂志美学）:

| 维度 | 规范 |
|------|------|
| **色彩体系** | 墨蓝 `#1a365d`（主色/标题/序号）、琥珀 `#d97706`（唯一强调色，仅用于 Top 1）、米白纸张 `#fefdfb`（背景）、深炭灰 `#374151`（正文）、中灰 `#6b7280`（辅助信息） |
| **标题字体** | Georgia, 'Noto Serif SC', serif — 衬线体营造书卷气质 |
| **正文字体** | -apple-system, 'PingFang SC', 'Helvetica Neue', sans-serif |
| **数字/评分** | 'Inter', sans-serif — 等宽数字对齐 |
| **质感纹理** | body 叠加细腻纸质噪点（CSS SVG filter，opacity 0.03），营造纸张手工质感 |
| **卡片风格** | 无边框，仅用极淡分隔线 `#e5e7eb` 区隔条目；避免堆叠阴影，保持平面克制感 |
| **Top 1 强调** | 左侧 3px 琥珀色竖线 + 浅琥珀背景 `rgba(217,119,6,0.06)`，克制而醒目 |
| **留白** | 大量留白让信息有呼吸感 — 卡片间距 32px，内边距 24px，标题与摘要间距 12px |
| **宽度** | max-width 640px 居中，窄幅阅读体验 |

**HTML 结构**:

```html
<!-- 独立 HTML，内联所有 CSS + SVG 噪点，无外部依赖 -->
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BestBlogs 早报 | YYYY-MM-DD</title>
  <style>
    /* 纸质噪点纹理 */
    body::before {
      content: '';
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      opacity: 0.03; pointer-events: none; z-index: 9999;
      background-image: url("data:image/svg+xml,..."); /* inline SVG noise */
    }
    /* 其余样式内联 */
  </style>
</head>
<body style="background: #fefdfb;">
  <!-- 头部区域 -->
  <!--   "BestBlogs 早报" 品牌标题（墨蓝，衬线体，letter-spacing 0.05em） -->
  <!--   日期（中灰，小号） -->
  <!--   关键词标签（墨蓝边框胶囊，背景透明，font-size 12px） -->

  <!-- Top 1 精选卡片 -->
  <!--   琥珀色左边线 + 微暖背景 -->
  <!--   标题（墨蓝衬线体，font-size 20px） -->
  <!--   2-3 句摘要 + 主要观点 -->
  <!--   来源 | 分类 | 评分 -->

  <!-- 2-10 常规条目 -->
  <!--   序号（墨蓝，Inter 字体，与标题同行） -->
  <!--   标题（可点击链接，衬线体，font-size 17px） -->
  <!--   1-2 句摘要（深炭灰，font-size 14px，line-height 1.6） -->
  <!--   来源 | 类型标签 | 评分（中灰，font-size 12px） -->
  <!--   条目间以极淡分隔线区隔 -->

  <!-- 底部 -->
  <!--   细分隔线 -->
  <!--   "BestBlogs.dev" 品牌标识（墨蓝，letter-spacing） -->
  <!--   "遇见更好的技术阅读"（中灰，font-size 12px） -->
</body>
</html>
```

**每张卡片包含**:
- 墨蓝序号 + 衬线体标题（可点击，链接到 readUrl）
- 来源 | 分类 | 评分（中灰辅助行）
- 1-2 句摘要（深炭灰正文）
- Top 1 额外展示: 主要观点（如有）、为什么值得关注
- 内容类型标识: 文章无标注、推文 `@` 前缀、播客/视频显示时长胶囊标签

**设计禁忌**:
- 不要使用渐变背景、发光效果、蓝紫科技感
- 不要给每张卡片加投影 — 用分隔线代替
- 不要塞满画面 — 留白是设计的一部分
- 不要超过两种强调色 — 琥珀是唯一的点睛

### 3.3 信息图海报

使用 `image-gen` skill 生成纵向信息图海报，仅包含 **Top 5** 内容。

**海报视觉风格**:

整体气质: 高端建筑事务所作品集或 Monocle 杂志信息页 — 瑞士国际主义的克制与精准，每个元素恰到好处。

- **色彩**: 墨蓝 `#1a365d` 为主调 + 琥珀 `#d97706` 仅 Top 1 点睛 + 米白 `#fefdfb` 纸张背景
- **质感**: 细腻纸质噪点纹理覆盖全图，营造手工印刷质感，而非光滑数码感
- **布局**: 纵向 9:16，上下留白充足（顶部至少 60px，底部至少 80px）
- **头部**: "BestBlogs 早报" 衬线体标题 + 日期 + 3 个关键词胶囊标签（墨蓝细边框）
- **主体**: 5 条内容，每条用序号 + 标题 + 一句话摘要 + 来源，条目间用极细分隔线
- **Top 1**: 左侧琥珀色竖线标记，标题加大，视觉权重最高
- **底部**: "BestBlogs.dev" 品牌标识 + 细线收尾
- **字体风格**: 标题用衬线体（有文化底蕴感），正文用无衬线体（清晰易读）
- **留白**: 大量留白让信息有呼吸感，条目间距 > 内容高度的 40%

**海报设计禁忌**:
- 不要蓝紫渐变科技感、不要发光粒子效果
- 不要圆角气泡卡片堆叠 — 用平面排版 + 分隔线
- 不要用力过猛 — 克制即高级

调用方式:

```bash
# 1. 定位 image-gen skill 目录（resolve symlink）
IMAGE_GEN_SKILL_DIR=$(readlink -f ~/.claude/skills/image-gen 2>/dev/null || readlink -f ~/.claude/skills/baoyu-image-gen 2>/dev/null)

# 2. 将海报内容描述写入 prompt 文件（保存在输出目录）
#    prompt 文件包含: 完整视觉风格描述 + 品牌色值 + 5 条内容的标题和摘要

# 3. 生成海报
${BUN_X} ${IMAGE_GEN_SKILL_DIR}/scripts/main.ts \
  --promptfiles <output-dir>/poster-prompt.md \
  --image <output-dir>/poster.png \
  --ar 9:16 \
  --quality 2k
```

若 image-gen skill 未安装，跳过海报生成并告知用户。

---

## 阶段四: 保存文件

所有输出保存到项目根目录下:

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

根据用户输入调整:

| 用户表述 | 参数调整 |
|---------|---------|
| "本周早报" / "这周" | `timeFilter: "1w"`，Top 10 → Top 15 |
| "只看 AI" | 仅拉取 AI 分类 |
| "多给几条" / "Top 15" | 增加输出数量 |
| "不需要海报" | 跳过阶段 3.3 |
| "只要文本" | 仅生成纯文本版 |
| "评分 90 以上" | 客户端过滤阈值调整为 90 |

---

## 错误处理

**重要**: 始终先检查 `response.success` 再处理 `response.data`。部分错误返回 HTTP 200 但 `success: false` — 不要仅依赖 HTTP 状态码。

- `401`: 检查 `BESTBLOGS_API_KEY` 是否已设置且有效
- `400`: 参数值不合法，检查枚举值
- `500`: 重试一次，仍失败则告知用户
- `data` 为空或 `totalCount: 0`: 该时间范围内无内容。若 1d 无结果，建议用户尝试 `3d`
- 单个分类请求失败不影响整体: 记录失败分类，用其他分类数据继续生成早报
