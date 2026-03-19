---
name: bestblogs-analyze-content
description: "Use when 用户或 orchestrator 需要分析一条指定的 BestBlogs 待处理内容，生成结构化评分结果并保存分析，而不负责队列选择逻辑。"
---

# BestBlogs 内容分析器 (Analyze Content)

对单个 BestBlogs 待处理内容执行内容级分析工作，包括读取正文或转录、构造分析输入、生成结构化结果并保存。队列选择和批次排序由上游 orchestrator 负责。

## When to Use

- 已经确定了具体内容 ID，需要执行单条内容分析
- 上游 orchestrator 需要把某个文章、播客、视频或作者分组推文交给 worker 做分析
- 需要把结构化评分、摘要、标签和 remark 保存回 BestBlogs

## When Not to Use

- 还没决定要处理哪些内容时，先使用 `bestblogs-fetch-pending-content`
- 只想读取公开正文、元数据或期刊信息时，使用 `bestblogs-fetcher`
- 需要翻译已分析结果时，使用 `bestblogs-translate-analysis-result`

## Gotchas

- 这是单条内容 worker，不负责批量排序、阈值判定或用户确认策略
- 每次分析都必须锁定内容 ID 与输入正文的对应关系，避免串写
- 不同内容类型的正文来源不同：文章可能走 markdown，播客走 podcast content，视频可能依赖 transcript，本 skill 只能按类型分支处理
- 保存分析结果前要确认字段语言、分类枚举和评分 remark 都符合当前类型要求

## Related Skills

- `bestblogs-fetch-pending-content`：先提供待处理候选项
- `bestblogs-translate-analysis-result`：对分析后内容继续翻译
- `bestblogs-process-articles`、`bestblogs-process-podcasts`、`bestblogs-process-videos`、`bestblogs-process-tweets`：上游 orchestrators
- `bestblogs-transcribe-youtube`：视频分析前需要 transcript 时调用

## Shared Scripts

- 优先复用 `scripts/shared/bestblogs_client.py`
- 共享 client 负责统一请求、分页和 `success:false` 处理；本 skill 只保留内容类型分支和分析规则

## 认证

> 完整认证配置见 `../../references/shared/auth-bestblogs.md`。

本 skill 使用 Admin API（保存分析结果）+ OpenAPI（读取文章正文等）。

## 核心工作流

1. 接收明确的内容类型、ID 和当前状态
2. 按类型获取正文、转录或已准备好的 markdown 内容
3. 构造对应的分析输入，并加载该类型的 rubric
4. 生成结构化 JSON 结果，校验语言和枚举字段
5. 调用对应保存接口写回分析结果

## 类型边界

- `ARTICLE`：负责正文获取、必要的预处理兜底和 `saveAnalysisResult`
- `PODCAST`：负责转录审校后的分析和 `saveAnalysisResult`
- `VIDEO`：负责基于 transcript / markdown 的分析和 `saveAnalysisResult`
- `TWITTER`：负责按单作者分组的分析结果生成与保存

## 输出约定

- 输出中必须包含内容 ID、score、summary、tags、remark 等后续阶段必需字段
- 若分析失败，应说明失败发生在读取、构造输入还是保存阶段
- 不自行决定是否翻译；只把分析结果和必要元数据交回上游

## 错误处理

通用错误码见 `../../references/shared/error-handling-bestblogs.md`。本 skill 额外关注：

- markdown 正文为空：先调 `runPrepareFlow`，重试最多 3 次，仍失败则跳过
- 分析 JSON 格式错误：重试一次，仍失败则跳过并向 orchestrator 报告
- 保存失败：记录内容 ID 和失败阶段（读取/构造/保存），不静默丢弃
