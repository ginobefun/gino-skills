---
name: bestblogs-transcribe-youtube
description: "Use when 用户只想通过 Gemini Gem 浏览器流程转写单个 YouTube 视频，而不是走完整的 BestBlogs 视频处理流水线。"
---

# YouTube 视频转写 (Transcribe YouTube)

通过 Chrome AppleScript 在用户已登录的 Gemini 页面中执行 XHR 请求，调用预配置的 Gem（`8c99566ee291`）转写 YouTube 视频。浏览器自动携带 HttpOnly cookies，无需单独管理认证。

## When to Use

- 用户要转写单个 YouTube 视频，并接受通过 Gemini 网页已有登录态完成
- 用户需要一个可复用的本地 transcript 文件，供后续分析或人工阅读
- 用户的问题是“先拿到文字稿”，而不是整条 BestBlogs 视频处理流水线

## When Not to Use

- 要批量处理 BestBlogs 待分析视频时，使用 `bestblogs-process-videos`
- 要对已拿到文字稿的视频做分析或翻译时，使用 `bestblogs-analyze-content` 或 `bestblogs-translate-analysis-result`
- 非 macOS 或未登录 Gemini 的环境下，不要优先走这个 skill

## Gotchas

- 依赖 macOS AppleScript 和 Chrome 登录态，少任何一项都会失败
- 如果 Chrome 没开启 Apple 事件中的 JavaScript，脚本会报错，不是转写逻辑坏了
- 这是单视频 worker，不负责把结果回写 BestBlogs；需要回写时交给 orchestrator
- `pro` 模式更慢，只有在确实需要更细 transcript 时再用

## Related Skills

- `bestblogs-process-videos`：BestBlogs 视频批处理 orchestrator
- `bestblogs-fetch-pending-content`：先找出有哪些视频在等待处理
- `bestblogs-analyze-content`：基于现有 transcript 做结构化分析
- `bestblogs-translate-analysis-result`：翻译已分析的高分视频

## 脚本目录

确定 SKILL.md 所在目录以定位脚本：

```bash
SKILL_DIR="$(cd "$(dirname "$0")" && pwd)"
```

| 脚本 | 用途 | 关键参数 |
|------|------|----------|
| `scripts/transcribe.ts` | 转写 YouTube 视频 | `--thinking`, `-o` |

执行方式：`npx -y bun $SKILL_DIR/scripts/transcribe.ts [options] <youtube-url>`

## 前置条件

1. **macOS**: 依赖 AppleScript，仅支持 macOS
2. **Chrome 已登录 Gemini**: 需在 Chrome 中已登录 `gemini.google.com`
3. **允许 AppleScript JavaScript**: Chrome → 查看 → 开发者 → 允许 Apple 事件中的 JavaScript

如果用户未开启第 3 项，脚本会报错并提示操作步骤。

## 使用方法

```bash
# 基本转写（默认使用 think 级别）
npx -y bun $SKILL_DIR/scripts/transcribe.ts <youtube-url>

# 指定思考级别
npx -y bun $SKILL_DIR/scripts/transcribe.ts --thinking pro <youtube-url>

# 保存到文件
npx -y bun $SKILL_DIR/scripts/transcribe.ts -o transcript.md <youtube-url>
```

## 参数说明

| 参数 | 说明 | 默认值 |
|------|------|--------|
| `<youtube-url>` | YouTube 视频链接（必需） | - |
| `--thinking <level>` | 思考级别（见下表） | `think` |
| `-o, --output <path>` | 输出文件路径 | stdout |

## 思考级别

| 级别 | 模型 | 说明 |
|------|------|------|
| `fast` | Gemini Flash | 最快，细节较少 |
| `think` | Gemini Flash Thinking | 默认，平衡速度和质量 |
| `pro` | Gemini Pro | 最详细，速度较慢 |

## 工作原理

1. 通过 AppleScript 找到 Chrome 中已打开的 `gemini.google.com` 标签页
2. 从页面源码中提取 `SNlM0e` access token
3. 构造包含 Gem ID 和 YouTube URL 的 API 请求
4. 通过同步 XHR 发送请求（浏览器自动携带 HttpOnly cookies）
5. 解析流式响应，提取生成的文字稿
6. 输出到 stdout 或保存到指定文件

## 输出处理

- **无 `-o`**: 文字稿输出到 stdout（日志输出到 stderr）
- **有 `-o`**: 写入指定文件，告知用户文件路径

## 错误处理

| 错误 | 原因 | 处理 |
|------|------|------|
| AppleScript JavaScript 未开启 | Chrome 设置未开启 | 提示：查看 → 开发者 → 允许 Apple 事件中的 JavaScript |
| no_token | Token 提取失败 | 刷新 gemini.google.com 页面后重试 |
| status_4xx/5xx | API 请求失败 | 检查登录状态，重试 |
| missing value | 无响应 | 确认 Chrome 已登录 gemini.google.com |
| parse_failed | 响应解析失败 | 可能是视频不可用或 Gem 无法处理 |
