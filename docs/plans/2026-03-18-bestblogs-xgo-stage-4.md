# BestBlogs 与 XGo 第 4 阶段设计

## 目标

把以导航为核心的 skill 正文结构扩展到整个 `bestblogs-*` family 和第二波 `xgo-*` skills，同时开始对最臃肿的 BestBlogs 处理类 skill 做真实的 worker 拆分。

## 范围

### 为所有 `bestblogs-*` skills 增加必需正文段落

- `bestblogs-add-source`
- `bestblogs-article-recommender`
- `bestblogs-content-reviewer`
- `bestblogs-daily-digest`
- `bestblogs-fetcher`
- `bestblogs-process-articles`
- `bestblogs-process-podcasts`
- `bestblogs-process-tweets`
- `bestblogs-process-videos`
- `bestblogs-transcribe-youtube`
- `bestblogs-weekly-blogger`
- `bestblogs-weekly-curator`

### 为剩余 `xgo-*` skills 增加必需正文段落

- `xgo-digest-tweets`
- `xgo-manage-bookmarks`
- `xgo-manage-follows`
- `xgo-manage-lists`
- `xgo-organize-follows`
- `xgo-track-kol`
- `xgo-view-profile`

### 引入 worker skills

- `bestblogs-fetch-pending-content`
- `bestblogs-analyze-content`
- `bestblogs-translate-analysis-result`

## 设计原则

### 1. 保留 family 前缀

继续保留 `bestblogs-*` 和 `xgo-*` 命名。这些前缀承载了重要的来源与工具语义，也是仓库里最清晰的分组方式。

### 2. 优先补扫描期路由层

每个目标 skill 都暴露：
- `## When to Use`
- `## When Not to Use`
- `## Gotchas`
- `## Related Skills`

这些段落应尽量简短、以路由为核心，放在长工作流之前，减少必须整篇扫描才能判断用途的情况。

### 3. 先做 worker 拆分，不做破坏性重写

暂时不要删除现有 `bestblogs-process-*` skills。相反，应当：
- 将它们重构为按内容类型组织的薄 orchestrator
- 让它们显式路由到 3 个新 worker skill
- 保留内容类型特有的细节
- 把跨类型共享职责抽到 worker skills

### 4. 按工作流角色拆，而不是按内容类型拆

worker 拆分应按稳定生命周期阶段进行：
- `bestblogs-fetch-pending-content`：查询待处理队列、获取原始内容、执行 fetch/prepare 回退
- `bestblogs-analyze-content`：生成并保存结构化分析
- `bestblogs-translate-analysis-result`：翻译已保存的分析结果并持久化

`bestblogs-process-*` orchestrator 仍然有价值，因为它们继续负责：
- 内容类型专属的队列过滤
- 内容类型专属的评分规则
- 内容类型专属的前置条件，例如 transcript review 或转录

### 5. 为 family 收紧 lint

lint 现在应强制以下文件具备导航段落：
- 所有 `skills/bestblogs-*/SKILL.md`
- 所有 `skills/xgo-*/SKILL.md`
- 之前阶段已迁移的高频非 family skills

## 预期终态

- `bestblogs-*` 和 `xgo-*` 文件更易于路由，也更安全
- 最重的 BestBlogs 处理 skill 不再伪装成自己拥有所有阶段
- 后续可以继续把真实实现细节从 orchestrator 下沉到 worker，而不用再重做命名和分层
