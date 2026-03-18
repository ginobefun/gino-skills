---
name: manage-daily-content
description: "Use when 用户想执行完整的每日内容工作流，覆盖内容获取、选题、起草、审阅和多渠道发布。"
---

# 每日内容管理 (Daily Content Management)

编排每日内容全流程：数据获取 → 选题生成 → 内容创作 → 多渠道分发。

## When to Use

- 当用户想启动今天的完整内容工作，而不是只做其中一个局部步骤
- 当用户需要把选题、阅读、创作、审阅、分发串成一条工作流
- 当用户明确要做跨平台内容编排，而不是单平台写作或单次发布

## When Not to Use

- 只想筛选今天值得看的内容：用 `curate-daily-content`
- 只想把素材改写成某个平台文案：用 `synthesize-content`
- 只想开始阅读和记录想法：用 `guide-reading`
- 只想发布到具体平台：用 `post-to-x`、`post-to-wechat` 或消息 / action skills

## Gotchas

- 这是编排器，不是评分器、写作器或发布器本体；不要在这里重新定义 worker skill 的细节规则
- 不要在用户尚未确认选题前直接进入大批量创作或分发
- 工作区是共享状态，不要绕过缓存重复抓取同一份详情数据
- 若某个环节已有专门 skill，优先委托而不是在这里复制一套并行逻辑

## Related Skills

- `curate-daily-content`：获取素材、聚类、评分、轻量建议
- `guide-reading`：逐篇阅读流程和反思记录
- `read-deeply`：深度分析单篇长文或论文
- `synthesize-content`：将素材转换成平台内容
- `post-to-x` / `post-to-wechat`：执行正式发布

## Orchestrator Boundary

本 skill 只负责定义阶段顺序、确认点和 handoff：
- 选题和排序由 `curate-daily-content` 负责
- 阅读流程由 `guide-reading` 负责，深度分析由 `read-deeply` 负责
- 平台化内容生成由 `synthesize-content` 负责
- 平台发布由对应发布 skill 负责

若某阶段已经进入对应 worker skill，就以 worker skill 的规则为准，不在这里重复裁决实现细节

**三个核心设计原则**:
1. **一鱼多吃** — 一个内容适配多个渠道，而非为每个渠道独立创作
2. **工作区共享** — 中间数据持久化到 Daily Workspace，各 skill 共享，避免重复查询和 token 浪费
3. **个人风格驱动** — 从用户真实的博客和社交媒体内容中学习表达方式，生成有真人感的内容

个人写作风格和兴趣领域见用户画像（`gino-bot/USER.md`），按需加载。

## Runtime Conventions

This skill follows `docs/skill-runtime-conventions.md`.

- Shared daily artifacts stay under `contents/tmp/workspace/YYYY-MM-DD/`
- Durable orchestration state, histories, or future sync cursors should live under `${CLAUDE_PLUGIN_DATA}/gino-skills/manage-daily-content/` or `.gino-skills/data/manage-daily-content/`
- Explicit setup should converge on `.gino-skills/manage-daily-content/config.json`
- `contents/style-profile.md` is a reusable content artifact, not the canonical place for runtime state; treat it as temporary compatibility output scheduled for deprecation

## Shared Scripts

- `scripts/examples/content_style_profile_state.py`：读取或写入 stable style profile
- `scripts/examples/daily_plan_state.py`：读取或写入 stable daily plan，并可同步工作区副本
- `scripts/shared/content_state.py`：统一处理 style profile、plan 和 reading memory 的 stable-state IO

## Worker Entrypoints

涉及稳定状态时，优先走这些 worker，而不是直接手写路径：

```bash
python3 scripts/examples/content_style_profile_state.py paths
python3 scripts/examples/content_style_profile_state.py write --from-file ./style-profile.md --sync-legacy
python3 scripts/examples/daily_plan_state.py write --day 2026-03-18 --from-file ./plan.md --sync-workspace
python3 scripts/examples/daily_plan_state.py read --day 2026-03-18
```

## 每日产出目标

| 维度 | 数量 | 说明 |
|------|------|------|
| 选题候选 | 20 个 | 从 BestBlogs + XGo 数据中筛选，同主题聚合 |
| 内容创作 | 10 个 | 用户从 20 个选题中选择 |
| 长文博客 | 1 篇 | 1500-3000 字，有特殊创作流程 |
| 中等内容 | 3 个 | 推文串/小红书/公众号短文 |
| 短内容 | 6 个 | 推文/即刻/朋友圈 |

## 工作流概览

```
- [ ] 阶段零: 初始化工作区 + 加载个人风格画像
- [ ] 阶段一: 数据获取 — 调用 daily-content-curator，原始数据存入工作区
- [ ] 阶段二: 选题生成 — 同主题聚合 → 20 个选题候选
- [ ] 阶段三: 用户选题 ⚠️ REQUIRED — 用户从 20 个中选择 ~10 个
- [ ] 阶段四: 内容创作 — 基于个人风格，逐个生成多渠道内容
- [ ] 阶段五: 审阅确认 ⚠️ REQUIRED — 用户审阅每个内容的多渠道版本
- [ ] 阶段六: 分发执行 ⛔ BLOCKING — 确认后调用发布 skills
- [ ] 阶段七: 记录归档 — 保存当日内容计划和产出到工作区
```

---

## 阶段零：初始化工作区 + 个人风格加载

### Daily Workspace 初始化

每日工作区是所有 skill 共享中间数据的核心枢纽。各 skill 的查询结果、处理中间产物统一存放，后续 skill 优先从工作区读取，不重复查询 API。

```bash
mkdir -p contents/tmp/workspace/YYYY-MM-DD
```

工作区结构详见 `references/workspace-spec.md`，核心文件：

```
contents/tmp/workspace/YYYY-MM-DD/
  raw-articles.md          # BestBlogs 原始文章列表（基础信息）
  raw-tweets.md            # XGo 原始推文列表（基础信息）
  article-details/         # 文章详情缓存（按需获取，避免重复拉取）
    {article-id}.md        # 单篇文章全文（由 deep-reading 等 skill 获取后缓存）
  tweet-details/           # 推文详情缓存
    {tweet-id}.md          # 推文完整内容 + 上下文
  topic-clusters.md        # 同主题聚合结果（阶段二产出）
  plan.md                  # 选题计划和执行状态
  outputs/                 # 创作产出
    {序号}-{slug}.md       # 每个选题的多渠道内容
```

**工作区共享规则**:
- 任何 skill 首次获取某内容的详情后，保存到 `article-details/` 或 `tweet-details/`
- 后续 skill（如 deep-reading、content-synthesizer）优先检查缓存，命中则跳过 API 调用
- 工作区数据仅保留当天 + 前 3 天，更早的可清理

### 个人风格画像加载

**目的**: 让生成的内容具有用户真实的表达方式和思维特征，而非千篇一律的 AI 腔。

#### 风格数据来源

按优先级加载以下风格参考数据：

1. **已有风格画像**（优先）: 通过 `scripts/examples/content_style_profile_state.py read` 或读取 `${CLAUDE_PLUGIN_DATA}/gino-skills/manage-daily-content/memory/style-profile.md`；若不存在再临时兼容旧路径 `contents/style-profile.md`
2. **用户画像文件**: 读取 `gino-bot/USER.md` 中的写作偏好和表达方式
3. **历史创作内容**: 读取最近 7 天的已发布内容
   - `contents/blog-posts/` — 博客文章
   - `contents/tmp/workspace/*/outputs/` — 历史创作产出
4. **真实社交媒体内容**: 通过 XGo API 获取用户最近发布的推文
   ```bash
   curl -s -X POST https://api.xgo.ing/openapi/v1/tweet/list \
     -H "Content-Type: application/json" \
     -H "X-API-KEY: $XGO_API_KEY" \
     -d '{"queryType":"own","timeRange":"LAST_7D","sortType":"influence","currentPage":1,"pageSize":50}'
   ```
5. **博客文章库**: 若用户博客项目可访问，读取最近 5 篇博客文章

#### 风格画像生成/更新

从以上数据源提取风格特征后，生成风格画像并写入 stable memory。详细模板格式和更新规则见 `references/style-profile-spec.md`。

---

## 阶段一：数据获取

委托 `curate-daily-content` 获取今日素材池。此处只负责判断是否已有可复用结果，以及把结果纳入今日工作区。

**优先读取已有数据**（避免重复查询）:
1. 检查 `contents/daily-curation/YYYY-MM-DD/curation.md` — 若存在直接使用
2. 检查 `contents/bestblogs-digest/YYYY-MM-DD/digest.txt` — 补充 BestBlogs 数据
3. 检查 `contents/twitter-digest/YYYY-MM-DD/digest.md` — 补充 Twitter 数据

**若素材池不存在**: 提示用户先运行 daily-content-curator，或询问是否现在执行。

### 原始数据存入工作区

将获取到的数据保存到工作区，供后续阶段和其他 skill 使用：

- 文章列表基础信息 → `raw-articles.md`（标题、URL、摘要、评分、来源）
- 推文列表基础信息 → `raw-tweets.md`（内容、作者、互动数据、影响力分）
- 通过 `scripts/examples/daily_plan_state.py read --day ...` 优先读取最近 3 天的 stable daily plan；工作区 `plan.md` 仅作同日副本，用于选题去重

**关键**: 此阶段只保存列表级别的基础信息，文章全文/推文详情按需在后续阶段获取并缓存到 `article-details/` 和 `tweet-details/`。

---

## 阶段二：选题生成（含同主题聚合）

对素材池进行同主题聚合（关键词聚类、事件聚合、观点对比、信息互补），输出到 `topic-clusters.md`。基于聚合结果生成 20 个选题候选，覆盖 AI/编程/产品/商业/个人成长五大领域，按长文(1)/中篇(3)/短篇(6)三种类型分配。选题遵循个人视角优先、多源综合、避免搬运、历史去重等规则。

详细选题生成规范（聚合方法、输出格式模板、选题卡片格式、维度占比、生成规则）见 `references/topic-generation-spec.md`。

---

## 阶段三：用户选题确认

⚠️ **REQUIRED** — 必须等待用户选择

展示 20 个选题后，引导用户选择：

```
请从以上 20 个选题中选择你今天要创作的内容：

建议配额：1 个长文 + 3 个中篇 + 6 个短篇 = 10 个内容

你可以：
- 按编号选择（如 "01, 03, 05, 08, 11, 13, 15, 17, 18, 20"）
- 调整类型（如 "05 改为短文"）
- 修改角度（如 "03 从个人经验角度写"）
- 补充选题（如 "加一个关于 XX 的短文"）
- 调整渠道（如 "08 不发小红书"）
```

用户确认后，锁定最终选题清单。对选中的选题，如需文章详情：
- 检查 `article-details/{id}.md` 是否已缓存
- 未缓存则获取全文并存入缓存，供阶段四创作使用

---

## 阶段四：内容创作

### 创作前：加载个人风格

从 `${CLAUDE_PLUGIN_DATA}/gino-skills/manage-daily-content/memory/style-profile.md` 读取个人风格画像；若缺失则临时回退到 `contents/style-profile.md`，在每个内容的创作 prompt 中注入风格约束：
- 使用用户的常用表达方式和句式
- 匹配对应渠道的风格差异（Twitter 犀利简洁 vs 博客结构深入）
- 参考代表性样本的语感
- 避免禁忌清单中的表达

### 创作顺序

1. **长文博客**（1 篇）— 耗时最长，优先处理
2. **中等内容**（3 个）— 逐个创作
3. **短内容**（6 个）— 可批量生成

### 4.1 长文博客创作流程

1. **素材深读**: 从工作区读取素材（优先缓存），如需深度分析调用 `deep-reading`，分析结果存入 `article-details/`
2. **综合多源信息**: 对聚合选题，整合多篇来源的不同角度
3. **大纲生成**: 生成博客大纲，⚠️ 等用户确认
4. **正文创作**: 基于风格画像 + 综合素材，调用 `content-synthesizer` 生成
5. **多渠道适配**: 从博客内容衍生公众号版本

详细写作规范见 `references/content-types.md`。

### 4.2 中等内容创作

每个中等内容一次创作，自动适配多渠道。从风格画像中读取对应渠道的表达方式：

```markdown
## 🟡 选题 05: [标题]

### 主版本 — 推文串 (5 条)
1/5 [Hook — 核心观点]
2/5 [论点 1]
3/5 [论点 2]
4/5 [论点 3 + 数据]
5/5 [总结 + 互动引导]

### 适配版本 — 小红书
[标题 + emoji]
[正文 300-800 字，列表化]
#标签 1 #标签 2 ...

### 适配版本 — 即刻
[200-500 字讨论体]
```

### 4.3 短内容创作

短内容可批量生成，每个内容自动适配多渠道：

```markdown
## 🟢 选题 15: [标题]

### 主版本 — 推文
[280 字符以内]

### 适配版本 — 即刻
[同内容，加互动提问]

### 适配版本 — 朋友圈
[同内容，口语化调整]
```

### 一鱼多吃规则

**先创作主版本，再适配其他渠道**，而非为每个渠道独立创作。

| 主版本 | 可适配渠道 | 适配方式 |
|--------|-----------|---------|
| 博客长文 | 公众号、知乎 | 段落重排 + 风格调整（知乎增加论证深度） |
| 推文串 | 小红书、即刻 | 合并为列表体/讨论体 |
| 单条推文 | 即刻、朋友圈 | 口语化 + 加互动 |
| 小红书 | 即刻 | 去标签 + 加讨论感 |

### 创作产出存入工作区

每个内容创作完成后，保存到 `contents/tmp/workspace/YYYY-MM-DD/outputs/{序号}-{slug}.md`，包含所有渠道版本。后续审阅和发布从此处读取。

---

## 阶段五：审阅确认

⚠️ **REQUIRED** — 每个内容创作完成后展示给用户审阅

逐个展示，用户确认一个后再展示下一个。用户也可选择「批量审阅」一次看所有。

```markdown
## ✅ 内容 1/10 — 🔴 长文：[标题]

### 📝 博客版本
[完整内容]

### 📱 公众号适配版
[完整内容]

---
你可以：✏️ 修改 | 🔄 重写 | ✅ 通过 | ⏭️ 跳过
```

---

## 阶段六：分发执行

⛔ **BLOCKING** — 所有发布操作必须用户明确确认

用户审阅完所有内容后，生成分发清单。发布执行规则：

1. **写操作安全**: 每批最多 5 个，逐批确认
2. **推文发布**: 调用 `post-to-x` skill
3. **公众号发布**: 调用 `post-to-wechat` skill
4. **博客保存**: 保存到 `contents/blog-posts/YYYY-MM-DD/{slug}.md`
5. **手动渠道**（小红书/即刻/朋友圈）: 输出格式化内容供复制
6. **单个失败不中断**: 记录 ❌ 和错误信息，继续下一个
7. **连续失败 3 次暂停**: 告知用户可能是系统性问题

---

## 阶段七：记录归档

优先更新 stable daily plan（`scripts/examples/daily_plan_state.py write ...`）；如需兼容工作区流程，再同步同日工作区 `plan.md` 副本（选题状态、产出统计、分发状态）。

同时将最终产出同步到标准 contents 目录：
- 博客 → `contents/blog-posts/YYYY-MM-DD/{slug}.md`
- 阅读笔记（如有）→ `contents/reading-notes/YYYY-MM-DD/`

---

## 参数调整

| 用户表述 | 调整 |
|---------|------|
| "今天少写点" / "轻松一天" | 缩减到 5 个内容（1 长 +1 中 +3 短） |
| "多写点" / "高产一天" | 扩展到 15 个内容 |
| "只写推文" | 仅生成 Twitter 内容 |
| "只写博客" | 仅走长文流程 |
| "跳过选题" / "我有选题" | 跳过阶段一二，用户直接提供选题 |
| "继续昨天的" | 读取昨天的 stable daily plan，处理未完成项 |
| "只看 AI 相关" | 选题聚焦 AI 领域 |
| "帮我安排" | AI 自动选择 10 个最佳选题（仍需确认） |
| "更新风格" | 重新生成 stable style-profile.md |

---

## 与其他 Skill 的协作

所有 skill 遵循统一的工作区读写协议，详见 `references/workspace-spec.md`。

**上游**: daily-content-curator → raw-articles/tweets.md | bestblogs-daily-digest, xgo-digest-tweets → 已有文件直接读取
**中游**: deep-reading → article-details/ | content-synthesizer → 读取 stable style-profile + 缓存 | image-gen → 按需
**下游**: post-to-x, post-to-wechat → 发布
**反馈**: content-analytics → content-strategy.md → 阶段二选题权重

---

## 快捷启动

| 指令 | 效果 |
|------|------|
| "今天的内容" / "开始" | 完整流程从阶段零开始 |
| "继续" | 从上次中断处继续（优先读取 stable daily plan 状态） |
| "看看选题" | 仅执行阶段零一二，生成选题 |
| "开始写 XX" | 直接进入阶段四，创作指定选题 |
| "发布" | 进入阶段六，发布已审阅内容 |
| "今天写了啥" | 显示当日 stable daily plan 状态 |
| "更新风格画像" | 重新分析并生成 stable style-profile.md |

---

## 错误处理

- **daily-content-curator 未执行**: 提示用户先执行，或询问是否现在运行
- **素材池为空**: 建议扩大时间范围，或使用用户自定义选题
- **风格画像不存在（冷启动）**: 首次运行时自动生成。若无历史博客和推文数据，从 `gino-bot/USER.md` 提取基础风格 + 用通用写作规范作为起点，标注"画像尚未完善，将随内容积累逐步学习"。发布 3-5 篇内容后重新生成
- **content-synthesizer 生成质量不够**: 保留草稿，让用户提供更多角度/观点后重写
- **发布 skill 失败**: 输出内容文本供手动复制，不中断其他发布
- **USER.md 不可访问**: 使用通用风格，告知用户"未加载个人画像"
- **中断恢复**: 每个阶段完成后自动保存进度到 stable daily plan；如启用 `--sync-workspace`，同日工作区 `plan.md` 会同步更新，中断后优先按 stable state 恢复
