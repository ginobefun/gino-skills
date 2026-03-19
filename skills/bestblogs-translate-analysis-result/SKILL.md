---
name: bestblogs-translate-analysis-result
description: "Use when 用户或 orchestrator 需要翻译某条 BestBlogs 已保存的分析结果，并持久化翻译内容，此时队列选择和评分判断已经完成。"
---

# BestBlogs 分析结果翻译器 (Translate Analysis Result)

对已完成分析的 BestBlogs 内容执行翻译阶段工作，读取现有分析结果，生成目标语言版本并保存。何时翻译、翻译哪一批，由上游 orchestrator 决定。

## When to Use

- 某条内容已经完成分析，接下来只需要翻译阶段
- 上游 orchestrator 已经决定“达到阈值后翻译”或用户明确要求只处理待翻译队列
- 需要把翻译后的结构化结果保存回 BestBlogs

## When Not to Use

- 还没确定哪些内容待翻译时，先使用 `bestblogs-fetch-pending-content`
- 还没完成分析时，先使用 `bestblogs-analyze-content`
- 只想读取公开正文或做外部翻译草稿时，使用 `bestblogs-fetcher` 或通用写作 skill

## Gotchas

- 这个 worker 默认建立在“已有分析结果”上，不应在翻译阶段重新评分或重做 analysis
- 翻译时要保持结构化字段完整一致，不能只翻 `summary` 而漏掉 `tags`、`mainPoints` 等
- 保存翻译结果前要确认使用的是正确内容 ID，且原分析结果读取成功
- 自动翻译阈值属于 orchestrator 策略，不应该在这里重新判断业务规则

## Related Skills

- `bestblogs-fetch-pending-content`：先找出待翻译队列
- `bestblogs-analyze-content`：先生成可翻译的结构化分析结果
- `bestblogs-process-articles`、`bestblogs-process-podcasts`、`bestblogs-process-videos`：上游 orchestrators
- `bestblogs-transcribe-youtube`：视频场景在翻译前可能已经由其他 worker 产出 transcript

## Shared Scripts

- 优先复用 `scripts/shared/bestblogs_client.py`
- 共享 client 统一处理翻译前后的读取、`success:false` 检查和写后校验入口

## 认证

> 完整认证配置见 `../../references/shared/auth-bestblogs.md`。

本 skill 仅使用 Admin API（读取和保存翻译结果）。

## 核心工作流

1. 读取指定内容 ID 的已分析结果或 markdown 结果
2. 基于现有结构化字段生成翻译版本
3. 校验翻译后的字段完整性和语言一致性
4. 调用对应保存接口写回翻译结果

## 类型边界

- `ARTICLE`、`PODCAST`、`VIDEO`：使用各自已有的结构化分析结果作为翻译输入
- `TWITTER`：通常不在这个 worker 中处理，推文翻译应由专用流程决定

## 输出约定

- 输出中应明确标记翻译目标语言、保存结果和失败项
- 若因原分析结果缺失而无法翻译，要返回可执行原因，而不是笼统失败
- 翻译后的字段结构必须和原分析结果保持一一对应
