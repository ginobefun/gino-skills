---
name: bestblogs-fetch-pending-content
description: "Use when 用户或 orchestrator 需要先查询 BestBlogs 的待处理队列，例如 WAIT_PREPARE、WAIT_ANALYSIS、WAIT_TRANSLATE，再决定后续动作。"
---

# BestBlogs 待处理队列读取器 (Fetch Pending Content)

读取 BestBlogs Admin 队列中的待处理内容，按类型和状态产出稳定的待处理列表，供 `bestblogs-process-*` orchestrator 或用户的手工批次决策继续使用。

## When to Use

- 需要先知道哪些文章、播客、视频或推文正在等待处理
- 需要按 `WAIT_PREPARE`、`WAIT_ANALYSIS`、`WAIT_TRANSLATE` 等状态切换工作模式
- 需要一个稳定的后台队列读取 worker，而不是公开内容抓取 skill

## When Not to Use

- 只想查看公开内容列表或正文时，使用 `bestblogs-fetcher`
- 已经明确要分析单条内容时，使用 `bestblogs-analyze-content`
- 已经明确要翻译已分析内容时，使用 `bestblogs-translate-analysis-result`

## Gotchas

- 这是后台队列读取 skill，必须始终检查 `success` 字段，不能只看 HTTP 状态码
- 状态切换顺序很重要，通常应优先尝试 `WAIT_PREPARE` / `WAIT_ANALYSIS`，为空后再回退到 `WAIT_TRANSLATE`
- 不同内容类型的分页上限和字段结构不同，输出时要保留原始 ID、类型、来源和语言
- 这个 worker 只负责列出候选项，不负责自动写回或跨阶段决定阈值

## Related Skills

- `bestblogs-process-articles`、`bestblogs-process-podcasts`、`bestblogs-process-videos`、`bestblogs-process-tweets`：上游 orchestrators
- `bestblogs-analyze-content`：对选中的队列项做结构化分析
- `bestblogs-translate-analysis-result`：对已分析的高分内容做翻译
- `bestblogs-fetcher`：读取公开内容池，而非后台工作队列

## Shared Scripts

- 优先复用 `scripts/shared/bestblogs_client.py`
- 使用其中的 Admin client 统一处理 `article/list` 分页、`success:false` 检查和队列读取

## 认证

> 完整认证配置见 `../../references/shared/auth-bestblogs.md`。

本 skill 仅使用 Admin API（队列查询）。

## 核心工作流

1. 根据用户或 orchestrator 指定的 `type` 和 `flowStatusFilter` 生成 `article/list` 请求
2. 分页拉取完整列表，并始终校验 `success`
3. 保留后续阶段必需字段：`id`、`type`、`title`、`sourceName`、`priority`、`language`、`publishDate`
4. 输出稳定表格或 JSON 片段，交还给上游 orchestrator 决定下一步

### Shared Client Template

```bash
python3 scripts/examples/bestblogs_fetch_pending.py \
  --type ARTICLE \
  --flow-status WAIT_ANALYSIS \
  --page-size 50 \
  --max-pages 4
```

对播客、视频或推文队列，只需要替换 `--type` 和 `--flow-status`。不要再重复手写 `article/list` 的 headers、分页和 `success:false` 检查。

## 可用端点

| 端点 | 方法 | 用途 |
|------|------|------|
| `/api/admin/article/list` | POST | 查询不同类型内容的待处理队列 |

## 输出约定

- 结果中必须保留原始内容 ID，供后续写回时复用
- 应同时输出总数、状态、类型和分页情况，方便 orchestrator 判断是否需要快捷模式
- 若队列为空，应明确说明哪个状态为空，而不是笼统返回“没数据”
