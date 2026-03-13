---
name: bestblogs-transcribe-youtube
description: "通过 Chrome AppleScript 调用 Gemini Gem 转写 YouTube 视频文字稿。适用场景：(1) 将 YouTube 视频转为文字稿，(2) 提取 YouTube 视频内容，(3) 获取视频字幕/文本，(4) 视频内容转 Markdown。触发短语：'转写视频', '视频文字稿', 'transcribe youtube', 'youtube transcript', '提取视频内容', 'extract video', '视频转文字', 'video to text', 'youtube to markdown', '视频字幕', 'video subtitle', '转录视频', '转写 YouTube', 'transcribe video', '获取视频文字', 'get video text'。"
---

# YouTube 视频转写 (Transcribe YouTube)

通过 Chrome AppleScript 在用户已登录的 Gemini 页面中执行 XHR 请求，调用预配置的 Gem（`8c99566ee291`）转写 YouTube 视频。浏览器自动携带 HttpOnly cookies，无需单独管理认证。

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
