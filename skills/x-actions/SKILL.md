---
name: x-actions
description: "Use when 用户想在浏览器里对 X 执行写操作，例如发帖、回复、引用、转推或点赞。"
disable-model-invocation: true
---

# X 操作器 (X Actions)

通过 Chrome CDP 在 Twitter/X 上执行写操作 — 发推文、回复、引用、转推、点赞。使用真实 Chrome 浏览器，绕过反自动化检测。

所有操作均为**写操作** — 默认预览模式，必须用户确认后才能添加 `--submit` 执行。

选择器参考见 `references/cdp-selectors.md`，故障排查见 `references/troubleshooting.md`。

## 脚本目录

确定 SKILL.md 所在目录以定位脚本：

```bash
SKILL_DIR="$(cd "$(dirname "$0")" && pwd)"
# 脚本位于 $SKILL_DIR/scripts/
```

| 脚本 | 用途 | 关键参数 |
|------|------|----------|
| `x-post.ts` | 发推文 | `--image`, `--submit` |
| `x-reply.ts` | 回复推文 | `<tweet-url>`, `--image`, `--submit` |
| `x-quote.ts` | 引用推文 | `<tweet-url>`, `--submit` |
| `x-retweet.ts` | 简单转推 | `<tweet-url>`, `--undo`, `--submit` |
| `x-like.ts` | 点赞/取消 | `<tweet-url>`, `--unlike`, `--submit` |

执行方式：`npx -y bun $SKILL_DIR/scripts/<script>.ts [args]`

## 前置条件

1. **Chrome 浏览器**: 需已安装 Google Chrome，或设置 `X_CHROME_PATH` 环境变量
2. **首次登录**: 首次使用时 Chrome 会打开 X 页面，需手动登录一次。登录态保存在 `~/.local/share/x-browser-profile`（与 baoyu-post-to-x 共享）
3. **macOS 辅助功能权限**: 图片粘贴需要终端应用的辅助功能权限（系统偏好设置 > 隐私与安全性 > 辅助功能）
4. **图片粘贴依赖**（可选）: macOS 需要 Swift 运行时（系统自带）; Linux 需要 `wl-clipboard` 或 `xclip`

## 安全模式

**所有操作默认为预览模式** — 仅打开浏览器准备操作，不实际执行。

- **预览模式**（默认）: 浏览器打开并准备好操作内容，等待 15-30 秒供预览，然后关闭
- **提交模式**（`--submit`）: 实际执行操作

⚠️ **写操作确认规则**: 调用任何脚本前，必须先向用户展示将要执行的操作内容，等待用户明确确认后才能添加 `--submit` 参数。禁止未经确认直接使用 `--submit`。

## 操作一：发推文

```bash
npx -y bun $SKILL_DIR/scripts/x-post.ts [--image <path>]... [--submit] <text>
```

**参数**:
- `<text>`: 推文文字内容（必需，除非有图片）
- `--image <path>`: 添加图片（可重复，最多 4 张）
- `--submit`: 实际发送

**示例**:

```bash
# 纯文字推文（预览）
npx -y bun $SKILL_DIR/scripts/x-post.ts "Hello World!"

# 带图片的推文（提交）
npx -y bun $SKILL_DIR/scripts/x-post.ts "Check this out" --image ./screenshot.png --submit

# 多图推文
npx -y bun $SKILL_DIR/scripts/x-post.ts "Thread pics" --image a.png --image b.png --submit
```

**图片处理**: 通过系统剪贴板 + 真实按键粘贴（macOS: `osascript` 发送 `Cmd+V`），绕过 X 的反自动化检测。支持 JPG、PNG、GIF、WebP。

## 操作二：回复推文

```bash
npx -y bun $SKILL_DIR/scripts/x-reply.ts <tweet-url> [--image <path>]... [--submit] <text>
```

**参数**:
- `<tweet-url>`: 要回复的推文 URL（必需）
- `<text>`: 回复文字（必需，除非有图片）
- `--image <path>`: 添加图片
- `--submit`: 实际发送

**示例**:

```bash
# 回复推文（预览）
npx -y bun $SKILL_DIR/scripts/x-reply.ts https://x.com/user/status/123 "Great post!"

# 带图片回复（提交）
npx -y bun $SKILL_DIR/scripts/x-reply.ts https://x.com/user/status/123 "Look at this" --image pic.png --submit
```

**URL 格式**: 支持 `x.com` 和 `twitter.com`，自动标准化为 `x.com`。

## 操作三：引用推文

```bash
npx -y bun $SKILL_DIR/scripts/x-quote.ts <tweet-url> [--submit] [comment]
```

**参数**:
- `<tweet-url>`: 要引用的推文 URL（必需）
- `[comment]`: 引用评论（可选，可不加评论直接引用）
- `--submit`: 实际发送

**示例**:

```bash
# 带评论引用（预览）
npx -y bun $SKILL_DIR/scripts/x-quote.ts https://x.com/user/status/123 "Great insight!"

# 引用并提交
npx -y bun $SKILL_DIR/scripts/x-quote.ts https://x.com/user/status/123 "I agree!" --submit
```

## 操作四：转推

```bash
npx -y bun $SKILL_DIR/scripts/x-retweet.ts <tweet-url> [--undo] [--submit]
```

**参数**:
- `<tweet-url>`: 推文 URL（必需）
- `--undo`: 取消转推
- `--submit`: 实际执行

**示例**:

```bash
# 转推（提交）
npx -y bun $SKILL_DIR/scripts/x-retweet.ts https://x.com/user/status/123 --submit

# 取消转推
npx -y bun $SKILL_DIR/scripts/x-retweet.ts https://x.com/user/status/123 --undo --submit
```

**状态检测**: 脚本自动检测当前状态 — 若推文已转推会提示，无需重复操作。

## 操作五：点赞

```bash
npx -y bun $SKILL_DIR/scripts/x-like.ts <tweet-url> [--unlike] [--submit]
```

**参数**:
- `<tweet-url>`: 推文 URL（必需）
- `--unlike`: 取消点赞
- `--submit`: 实际执行

**示例**:

```bash
# 点赞（提交）
npx -y bun $SKILL_DIR/scripts/x-like.ts https://x.com/user/status/123 --submit

# 取消点赞
npx -y bun $SKILL_DIR/scripts/x-like.ts https://x.com/user/status/123 --unlike --submit
```

**状态检测**: 自动检测当前点赞状态，已点赞时提示无需重复。

## 输出格式

### 成功

```markdown
✅ 操作成功

- **操作**: 发推文 / 回复 / 引用 / 转推 / 点赞
- **内容**: [推文文字摘要]
- **图片**: N 张
- **URL**: [推文链接（如可获取）]
```

### 失败

```markdown
❌ 操作失败

- **操作**: [操作类型]
- **错误**: [错误信息]
- **建议**: [排查建议，参考 references/troubleshooting.md]
```

### 预览模式

```markdown
👁 预览模式 — 操作未执行

- **操作**: [操作类型]
- **内容**: [将要发送的内容]
- **确认**: 是否执行？添加 `--submit` 提交
```

## 错误处理

| 错误 | 原因 | 处理 |
|------|------|------|
| Chrome not found | 未安装 Chrome | 提示安装或设置 `X_CHROME_PATH` |
| Editor not found | 未登录 X | 提示先手动登录 |
| Element not found | 页面结构变化 | 参考 `references/troubleshooting.md` 更新选择器 |
| Paste failed | 无辅助功能权限 | 提示开启终端辅助功能权限 |
| CDP connection timeout | Chrome 启动慢 | 重试，或检查是否有其他 Chrome 实例 |
| Image not found | 图片路径错误 | 检查路径，支持相对路径和绝对路径 |

**超时处理**: 所有等待操作有超时保护（默认 120 秒），超时后自动关闭浏览器并报错。

## 参考资料

- 选择器参考：`references/cdp-selectors.md` — Twitter/X 页面元素的 `data-testid` 选择器
- 故障排查：`references/troubleshooting.md` — 常见问题和解决方案
