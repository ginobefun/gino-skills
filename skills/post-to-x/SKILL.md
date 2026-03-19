---
name: post-to-x
description: "Use when 用户想通过浏览器发布流程在 X 上发布推文、媒体帖子或 X Article 长文。"
disable-model-invocation: true
---

# 发布到 X（Twitter）

通过真实 Chrome 浏览器把文本、图片、视频和长文发布到 X，并绕过常见的反机器人检测。

## When to Use

- 当用户要发布推文、媒体帖子或 X Article 时使用
- 当内容已经基本定稿，剩余工作主要是借助浏览器完成发布时使用
- 当需求是发布长文 X Article，而不是做点赞、转发、回复等互动操作时使用

## When Not to Use

- 对现有推文做点赞、转发、引用、快速回复等互动写操作时，使用 `x-actions`
- 如果内容还没写好，或者还需要改写成适合 X 的版本，先用 `synthesize-content`

## Gotchas

- 这个 skill 只负责发布，不负责选题或创作；上游草稿质量差，发布阶段不会自动补救
- 脚本只会把内容填入浏览器，最终提交前仍应让用户检查
- X Article 流程比普通推文多了图片和占位符检查，不能按普通发帖流程对待
- 如果 Chrome CDP 卡住，先清理已有的 remote debugging 会话再重试

## Related Skills

- `synthesize-content`：生成适合平台发布的草稿
- `x-actions`：对现有推文执行互动操作
- `manage-daily-content`：负责创作与分发的上层编排

## 脚本目录

**重要**：所有脚本都位于本 skill 的 `scripts/` 子目录下。

**Agent 执行说明**：
1. 将当前 `SKILL.md` 所在目录记为 `SKILL_DIR`
2. 脚本路径写成 `${SKILL_DIR}/scripts/<script-name>.ts`
3. 本文档中的 `${SKILL_DIR}` 在执行时都要替换成真实路径
4. 解析 `${BUN_X}` 运行时：如果安装了 `bun` 就用 `bun`；否则如果有 `npx` 就用 `npx -y bun`；再不行就提示安装 bun

**脚本一览**：
| 脚本 | 用途 |
|--------|---------|
| `scripts/x-browser.ts` | 普通帖子（文本 + 图片） |
| `scripts/x-video.ts` | 视频帖子（文本 + 视频） |
| `scripts/x-quote.ts` | 带评论的引用推文 |
| `scripts/x-article.ts` | 长文 X Article 发布（Markdown） |
| `scripts/md-to-html.ts` | Markdown → HTML 转换 |
| `scripts/copy-to-clipboard.ts` | 复制内容到剪贴板 |
| `scripts/paste-from-clipboard.ts` | 发送真实粘贴快捷键 |
| `scripts/check-paste-permissions.ts` | 检查环境与权限 |

## 运行时约定

本技能遵循 `docs/skill-runtime-conventions.md`。

- 首选配置：`.gino-skills/post-to-x/config.json`
- 用户级回退配置：`$HOME/.gino-skills/post-to-x/config.json`
- 兼容旧版：`.gino-skills/post-to-x/EXTEND.md` 和 `$HOME/.gino-skills/post-to-x/EXTEND.md`
- 持久状态与日志：`${CLAUDE_PLUGIN_DATA}/gino-skills/post-to-x/` 或 `.gino-skills/data/post-to-x/`
- 浏览器中填充出的草稿属于一次性运行产物，不应视为持久记忆

## 偏好 / 配置

优先检查 `config.json`：

```bash
test -f .gino-skills/post-to-x/config.json && echo "project-config"
test -f "$HOME/.gino-skills/post-to-x/config.json" && echo "user-config"
```

```powershell
if (Test-Path .gino-skills/post-to-x/config.json) { "project-config" }
if (Test-Path "$HOME/.gino-skills/post-to-x/config.json") { "user-config" }
```

┌──────────────────────────────────────────────────┬───────────────────┐
│                       路径                       │       位置        │
├──────────────────────────────────────────────────┼───────────────────┤
│ .gino-skills/post-to-x/config.json              │ 项目级首选配置    │
├──────────────────────────────────────────────────┼───────────────────┤
│ $HOME/.gino-skills/post-to-x/config.json        │ 用户级首选配置    │
└──────────────────────────────────────────────────┴───────────────────┘

┌───────────┬───────────────────────────────────────────────────────────────────────────┐
│   结果    │                                   动作                                    │
├───────────┼───────────────────────────────────────────────────────────────────────────┤
│ Found config.json | 读取、解析并应用设置                                              │
├───────────┼───────────────────────────────────────────────────────────────────────────┤
│ Not found │ 使用默认值                                                               │
└───────────┴───────────────────────────────────────────────────────────────────────────┘

**支持的配置项**：默认 Chrome profile。新的配置流程应写入 `config.json`。

## 前置条件

- Google Chrome 或 Chromium
- `bun` 运行时
- 首次运行时需要手动登录 X（会话会保留）

## 预检查（可选）

首次使用前，建议先跑一次环境检查。用户如果明确跳过，也可以直接继续。

```bash
${BUN_X} ${SKILL_DIR}/scripts/check-paste-permissions.ts
```

检查项包括：Chrome、profile 隔离、Bun、辅助功能权限、剪贴板、粘贴快捷键、Chrome 冲突。

**如果有检查失败**，按项提供修复建议：

| 检查项 | 修复方式 |
|-------|-----|
| Chrome | 安装 Chrome，或设置 `X_BROWSER_CHROME_PATH` 环境变量 |
| Profile dir | 确保 `~/.local/share/x-browser-profile` 可写 |
| Bun runtime | `curl -fsSL https://bun.sh/install \| bash` |
| Accessibility (macOS) | 系统设置 → 隐私与安全性 → 辅助功能 → 打开终端权限 |
| Clipboard copy | 确保 Swift/AppKit 可用（macOS 安装 Xcode CLI 工具：`xcode-select --install`） |
| Paste keystroke (macOS) | 同上，先修复辅助功能权限 |
| Paste keystroke (Linux) | 安装 `xdotool`（X11）或 `ydotool`（Wayland） |

## 参考资料

- **普通帖子**：详见 `references/regular-posts.md`，包含手工流程、排障和技术细节
- **X Articles**：详见 `references/articles.md`，包含长文发布指引

---

## 普通帖子

文本 + 最多 4 张图片。

```bash
${BUN_X} ${SKILL_DIR}/scripts/x-browser.ts "Hello!" --image ./photo.png
```

**参数**：
| 参数 | 说明 |
|-----------|-------------|
| `<text>` | 帖子正文（位置参数） |
| `--image <path>` | 图片文件（可重复，最多 4 张） |
| `--profile <dir>` | 自定义 Chrome profile |

**说明**：脚本会打开浏览器并填入内容，最终仍由用户检查并手动发布。

---

## 视频帖子

文本 + 视频文件。

```bash
${BUN_X} ${SKILL_DIR}/scripts/x-video.ts "Check this out!" --video ./clip.mp4
```

**参数**：
| 参数 | 说明 |
|-----------|-------------|
| `<text>` | 帖子正文（位置参数） |
| `--video <path>` | 视频文件（MP4、MOV、WebM） |
| `--profile <dir>` | 自定义 Chrome profile |

**说明**：脚本会打开浏览器并填入内容，最终仍由用户检查并手动发布。

**时长限制**：普通账号最长 140 秒，Premium 最长 60 分钟。处理时间通常为 30-60 秒。

---

## 引用推文

对现有推文添加评论后再引用发布。

```bash
${BUN_X} ${SKILL_DIR}/scripts/x-quote.ts https://x.com/user/status/123 "Great insight!"
```

**参数**：
| 参数 | 说明 |
|-----------|-------------|
| `<tweet-url>` | 要引用的推文 URL（位置参数） |
| `<comment>` | 评论文本（位置参数，可选） |
| `--profile <dir>` | 自定义 Chrome profile |

**说明**：脚本会打开浏览器并填入内容，最终仍由用户检查并手动发布。

---

## X 长文

Markdown 长文发布（需要 X Premium）。

```bash
${BUN_X} ${SKILL_DIR}/scripts/x-article.ts article.md
${BUN_X} ${SKILL_DIR}/scripts/x-article.ts article.md --cover ./cover.jpg
```

**参数**：
| 参数 | 说明 |
|-----------|-------------|
| `<markdown>` | Markdown 文件（位置参数） |
| `--cover <path>` | 封面图 |
| `--title <text>` | 覆盖默认标题 |

**Frontmatter**：支持 YAML front matter 中的 `title`、`cover_image`。

**说明**：脚本会打开浏览器并填入文章内容，最终仍由用户检查并手动发布。

**内容填充后的检查**：脚本会在所有图片插入完成后自动校验：
- 编辑器内容里是否还残留 `XIMGPH_` 占位符
- 实际图片数量是否和预期一致

如果检查失败（输出中会有 warning），必须在用户发布前把具体问题告诉用户。

---

## 故障排查

### Chrome 调试端口未就绪

如果脚本报错 `Chrome debug port not ready` 或 `Unable to connect`，先清理已有的 Chrome CDP 实例，再重试：

```bash
pkill -f "Chrome.*remote-debugging-port" 2>/dev/null; pkill -f "Chromium.*remote-debugging-port" 2>/dev/null; sleep 2
```

**重要**：这一步应自动完成。遇到这个错误时，直接清理 Chrome CDP 实例并重试，不需要先问用户。

## 说明

- 首次运行需要手动登录（会话会保留）
- 所有脚本都只负责把内容填入浏览器，最终仍由用户手动检查并发布
- 支持跨平台：macOS、Linux、Windows

## 扩展配置支持

自定义配置优先使用 `config.json`。详见上面的 **偏好 / 配置**。

## Legacy 兼容附录

迁移期间仍保留 legacy `EXTEND.md` 回退路径，但它仅用于兼容，不应作为新的配置方式。详见 [docs/deprecation-roadmap.md](/Users/gino/Documents/Github/gino-skills/docs/deprecation-roadmap.md)。

Fallback paths:
- `.gino-skills/post-to-x/EXTEND.md`
- `$HOME/.gino-skills/post-to-x/EXTEND.md`
