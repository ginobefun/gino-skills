# Skill 正文结构阶段 3 设计

## 目标

通过增加可快速扫描的正文段落、澄清 sibling 边界、并对最臃肿的 orchestrator 做软拆分，改善最高频的 skill。范围要受控：不要完全重写长工作流，也不要在这一轮引入大规模的新 taxonomy。

## 范围

目标 skill：
- `skills/daily-content-management/SKILL.md`
- `skills/daily-content-curator/SKILL.md`
- `skills/content-synthesizer/SKILL.md`
- `skills/reading-workflow/SKILL.md`
- `skills/deep-reading/SKILL.md`
- `skills/post-to-x/SKILL.md`
- `skills/post-to-wechat/SKILL.md`
- `skills/xgo-fetch-tweets/SKILL.md`
- `skills/xgo-search-tweets/SKILL.md`

需要改动 frontmatter `name` 的非 `bestblogs-*` / 非 `xgo-*` skill：
- `daily-content-management` → `manage-daily-content`
- `daily-content-curator` → `curate-daily-content`
- `content-synthesizer` → `synthesize-content`
- `reading-workflow` → `guide-reading`
- `deep-reading` → `read-deeply`

## 约束

- 本轮不改目录名
- 除非和新边界直接冲突，否则保留现有详细工作流内容
- 在每个 skill 顶部增加高信号导航段落，支持渐进披露
- 这一轮只对目标文件扩展 lint 规则

## 设计

### 1. 增加导航段落

每个目标 skill 在文档顶部附近加入以下段落：
- `## When to Use`
- `## When Not to Use`
- `## Gotchas`
- `## Related Skills`

目的：
- 降低路由成本
- 提前暴露最高价值的坑点
- 减少必须通读整份 skill 才能理解用途的情况

### 2. 软拆分 orchestrator

`daily-content-management` 需要被明确收窄为 orchestration-only：
- 负责编排端到端流程
- 把 sourcing 委托给 `daily-content-curator`
- 把 guided reading 委托给 `guide-reading`
- 把深度分析委托给 `read-deeply`
- 把起草委托给 `synthesize-content`
- 把发布委托给 `post-to-x`、`post-to-wechat` 以及消息 / action 类 skills

它仍然可以描述整体流程，但不应再表现得像评分、起草、发布规则的唯一权威来源。

### 3. 明确 worker 边界

- `curate-daily-content` 负责排序、聚类和轻量级起草建议
- `synthesize-content` 负责把素材转成平台化草稿
- `guide-reading` 负责阅读 session 流程、进度和反思提示
- `read-deeply` 负责深度分析框架，而不是阅读 session 编排
- `xgo-fetch-tweets` 负责 feed、timeline、list、tag、bookmark
- `xgo-search-tweets` 负责 search、account-latest、refresh-by-id
- `post-to-x` 负责 X 发布
- `post-to-wechat` 负责公众号发布

### 4. 为第一波收紧 lint

仓库 lint 只对这一轮目标文件要求四个新增段落。这样约束范围和迁移范围保持一致。

## 风险

- frontmatter 名称变化但目录不变，可能带来文档漂移
- 新增段落但不删旧内容，可能造成局部重复
- 边界表述如果太重，可能让本来合法的工作流看起来像被禁止

## 缓解方式

- 新段落尽量短，只承担路由职责
- `Related Skills` 用来解释 handoff，而不是默认阻断
- worker 细节先留在现有正文里，后续再逐步抽出
