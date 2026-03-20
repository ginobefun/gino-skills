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
- [ ] 阶段一: 并行拉取数据（7 个请求，时间范围 3d），保存为 JSON 文件
- [ ] 阶段二: 运行 process_candidates.py（过滤 + 去重 + 加权评分 + 历史去重标记）
- [ ] 阶段三: AI 从候选池中筛选 Top 10
- [ ] 阶段四: 生成三种输出
  - [ ] 4.1 纯文本版（IM/社交媒体分享）
  - [ ] 4.2 杂志风 HTML（浏览/截图）
  - [ ] 4.3 信息图海报（Top 5，via image-gen）
- [ ] 阶段五: 保存文件 + 生成日报索引
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

**保存原始数据**: 每个请求结果保存为 JSON 文件，供阶段二脚本处理。使用临时目录存放：

```bash
DIGEST_TMP="/tmp/digest-$(date +%Y%m%d)"
mkdir -p "$DIGEST_TMP"

# 每个 curl 结果保存为对应文件（7 个并行 Shell 调用）
curl -s -X POST ... > "$DIGEST_TMP/ai.json"
curl -s -X POST ... > "$DIGEST_TMP/prog.json"
curl -s -X POST ... > "$DIGEST_TMP/biz.json"
curl -s -X POST ... > "$DIGEST_TMP/prod.json"
curl -s -X POST ... > "$DIGEST_TMP/video.json"
curl -s -X POST ... > "$DIGEST_TMP/podcast.json"
curl -s -X POST ... > "$DIGEST_TMP/tweet.json"
```

---

## 阶段二：运行 process_candidates.py

使用 `scripts/process_candidates.py` 一次性完成过滤、去重、加权评分和历史去重标记：

```bash
SKILL_DIR=$(readlink -f ~/.claude/skills/bestblogs-daily-digest)

python3 "$SKILL_DIR/scripts/process_candidates.py" \
  --input-dir "$DIGEST_TMP" \
  --history-dir contents/bestblogs-digest \
  --date YYYY-MM-DD \
  --threshold 85 \
  --output "$DIGEST_TMP/candidates.json"
```

脚本自动完成：
1. **解析 + 过滤**: 7 个 JSON 文件合并，score 空值安全处理，过滤 `score >= threshold`
2. **URL 去重**: 同一内容可能出现在多个分类中
3. **加权评分**: 内容深度（score）为第一优先级，来源为核心参考，主题为辅助因素
4. **历史去重标记**: 优先读取 `digest-index.json`（轻量索引），回退到 `digest.txt` 提取标题。标记 `history_overlap: true` 供 AI 判断

输出 `candidates.json` 包含按 `weighted_score` 降序排列的候选池（默认 Top 40），每条附带 `boosts`（加权原因）和 `history_overlap`（是否与历史重复）。

**加权评分公式**（关键词列表维护在脚本中）：

```
weighted_score = score + source_priority + named_source + vendor + coding + product_interview
```

| 加权项 | 分值 | 触发条件 |
|--------|------|----------|
| 订阅源优先级 | HIGH +3 / MED 0 / LOW -3 | API 返回的 `priority` 字段 |
| 命名高优来源 | +2 | sourceName 或推文作者在脚本的名单中 |
| 头部厂商 | +2 | 标题/标签/来源匹配头部厂商（OpenAI、Google、NVIDIA、阿里巴巴等） |
| AI Coding | +2 | 标题/标签匹配 Claude Code、Cursor、Codex、MCP 等 |
| 产品设计/深度访谈 | +1 | 标题/标签匹配产品设计、UX、访谈、播客等 |

**不做时效性衰减** — 3 天窗口内的内容都具有足够时效性。

---

## 阶段三：AI 筛选 Top 10

读取 `candidates.json`，从候选池中选出 10 条最值得推荐的内容。

### 筛选原则

1. **跳过 `history_overlap: true` 的同角度内容**。但如果是对已报道事件的**深度分析、技术原理拆解、独家访谈**等新角度，仍可入选
2. **以 `weighted_score` 为主要参考**，但 AI 保留最终判断权——可基于主题多样性、阅读价值等因素调整排序
3. **同话题多个来源时**，保留评分最高的一条，记录其他来源为 `另见：来源2, 来源3`
4. **不要求覆盖每个分类或内容类型**——纯按内容重要性排序

### 筛选输出

对每条入选内容记录：
- 排名（1-10）
- 入选理由（一句话）
- 如有同话题的其他来源，记录补充来源

---

## 阶段四：生成三种输出

### 中文排版规范（适用于所有输出格式）

参考《中文文案排版指北》，以下规则适用于纯文本、HTML 和海报的所有中文输出。

**空格规则**：

| 规则 | 正确 | 错误 |
|------|------|------|
| 中英文之间加空格 | `在 LeanCloud 上` | `在LeanCloud上` |
| 中文与数字之间加空格 | `速度提升 2 倍` | `速度提升2倍` |
| 数字与单位之间加空格 | `有 10 Gbps` | `有 10Gbps` |
| 百分比/度数与数字之间**不**加空格 | `提升 15%` | `提升 15 %` |
| 全角标点与其他字符之间**不**加空格 | `买了一部 iPhone，好开心！` | `买了一部 iPhone ，好开心！` |

**标点符号规则**：

| 规则 | 正确 | 错误 |
|------|------|------|
| 使用全角中文标点 | `来源：Cursor Blog` | `来源: Cursor Blog` |
| 引号使用直角引号「」 | `定义为「AI 工厂」` | `定义为"AI 工厂"` |
| 英文整句内使用半角标点 | `「Stay hungry, stay foolish.」` | `「Stay hungry，stay foolish。」` |
| 不重复使用标点符号 | `竟然战胜了巴西队！` | `竟然战胜了巴西队！！！` |

**专有名词**：使用官方大小写（GitHub、DeepSeek、iPhone），不要 `Github`、`GITHUB`、`Iphone`。

**文案风格**：

| 规则 | 说明 |
|------|------|
| 减少括号 | 能用逗号或短句拆开就不塞括号 |
| 减少破折号 | 改用逗号、句号或分句 |
| 简洁句式 | 一句话表达一个意思，短句优先，长句拆成两句 |
| 地道中文表达 | 避免翻译腔，用自然的中文语序 |

### 4.1 纯文本版

适合直接复制到 IM 群聊（微信/飞书/Slack）或社交媒体分享。IM 不渲染 markdown，因此使用纯文本格式，URL 独立成行确保可点击。

```
BestBlogs 早报 | YYYY-MM-DD

# AI Coding / Claude 4 / DeepSeek V3

[1] 标题
2-3 句摘要，概括核心信息和为什么值得关注。
来源：sourceName | 评分：96
readUrl（BestBlogs 站内链接）

[2] 标题
一两句话摘要。
来源：sourceName | 评分：93
readUrl（BestBlogs 站内链接）

...（共 10 条）

---
BestBlogs.dev - 遇见更好的技术阅读
```

**格式规则**：
- 每条内容必须包含 `readUrl` 链接（BestBlogs 站内链接），URL 独立成行确保在 IM 中可直接点击
- Top 1 的内容适当增加篇幅（2-3 句摘要 + 为什么值得关注）
- 其余每条 1-2 句摘要
- 同话题有多个来源时：`另见：来源2, 来源3`
- 关键词 3-5 个，提取自当日最热话题，用 `/` 分隔
- 内容类型标识：推文标注 `@userName`，播客标注 `[播客 XXmin]`，视频标注 `[视频 XXmin]`，文章不标注
- **标点统一使用全角**：`来源：` `评分：` `另见：`，不使用半角冒号

### 4.2 杂志风 HTML

生成独立 HTML 文件，追求高端设计杂志（Monocle、Kinfolk）气质。详细视觉风格、HTML 结构模板和设计禁忌见 `references/html_template.md`。

### 4.3 信息图海报

使用 `image-gen` skill 生成纵向 9:16 信息图海报，仅包含 **Top 5** 内容。详细视觉风格、调用方式和设计禁忌见 `references/poster_guide.md`。

**注意**：image-gen 可能生成 JPEG 文件但保存为 `.png` 扩展名。生成后用 `file poster.png` 确认实际格式，发送微信时按实际格式选择 MIME 类型。

---

## 阶段五：保存文件 + 生成日报索引

所有输出保存到项目根目录下：

```
contents/bestblogs-digest/
  YYYY-MM-DD/
    digest.txt          # 纯文本版
    digest.html         # 杂志风 HTML
    poster.png          # 信息图海报
    digest-index.json   # 轻量索引（用于历史去重）
```

创建目录（如不存在）：

```bash
mkdir -p contents/bestblogs-digest/YYYY-MM-DD
```

**保存 digest.txt 和 digest.html 后，立即生成日报索引**：

```bash
SKILL_DIR=$(readlink -f ~/.claude/skills/bestblogs-daily-digest)

python3 "$SKILL_DIR/scripts/generate_index.py" \
  --input contents/bestblogs-digest/YYYY-MM-DD/digest.txt
```

索引文件 `digest-index.json` 包含每条内容的标题、关键词、来源、评分和 URL，供后续日期的 `process_candidates.py` 做历史去重时快速读取，避免每次解析完整 digest.txt。

保存完成后，输出纯文本版内容到对话中，并告知用户三个文件的路径。

**清理临时文件**：

```bash
rm -rf "$DIGEST_TMP"
```

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
