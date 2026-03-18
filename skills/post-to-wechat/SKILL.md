---
name: post-to-wechat
description: "Use when 用户想通过 API 或浏览器自动化把内容发布到微信公众号，包括文章和图文消息。"
---

# 发布到微信公众号

把现成内容发布到微信公众号，支持 API 发文和浏览器自动化两种路径，也支持图文消息流程。

## 语言

**跟随用户语言**：用户用中文，就用中文回应；用户用英文，就用英文回应。

## When to Use

- 当用户想把内容发布到微信公众号时使用
- 当任务明确是文章草稿、图文消息或公众号发布设置时使用
- 当内容已经写好，剩余工作主要是发布时使用

## When Not to Use

- 微信群消息请使用 `send-wechat-group-message`，不要用这个 skill
- 如果文章还没写好，或者还要先改写成适合公众号的版本，先用 `synthesize-content`

## Gotchas

- API 发布和浏览器发布的前置条件不同，必须先选方法，再做元数据和配置
- API 文章发布通常必须有合法封面图，不要把这个检查拖到最后
- 如果流程要求输入原始 markdown，就不要在外部预先转成 HTML
- 评论开关和作者默认值很容易因为没先加载配置而漂移

## Related Skills

- `synthesize-content`：生成适合公众号的文章草稿
- `send-wechat-group-message`：用于微信群消息，而不是公众号
- `manage-daily-content`：负责写作到分发的整体编排

## 脚本目录

**Agent 执行方式**：将当前 `SKILL.md` 所在目录记为 `SKILL_DIR`，然后使用 `${SKILL_DIR}/scripts/<name>.ts`。解析 `${BUN_X}` 运行时：如果安装了 `bun` 就用 `bun`；否则如果有 `npx` 就用 `npx -y bun`；再不行就提示安装 bun。

| 脚本 | 用途 |
|--------|---------|
| `scripts/wechat-browser.ts` | 图文消息（贴图 / 图文） |
| `scripts/wechat-article.ts` | 浏览器方式发布文章 |
| `scripts/wechat-api.ts` | API 方式发布文章 |
| `scripts/md-to-wechat.ts` | Markdown → 适合微信的 HTML，带图片占位符 |
| `scripts/check-permissions.ts` | 检查环境与权限 |

## 运行时约定

本技能遵循 `docs/skill-runtime-conventions.md`。

- 首选配置：`.gino-skills/post-to-wechat/config.json`
- 用户级回退配置：`$HOME/.gino-skills/post-to-wechat/config.json`
- 兼容旧版：`.gino-skills/post-to-wechat/EXTEND.md` 和 `$HOME/.gino-skills/post-to-wechat/EXTEND.md`
- 持久状态与日志：`${CLAUDE_PLUGIN_DATA}/gino-skills/post-to-wechat/` 或 `.gino-skills/data/post-to-wechat/`
- 转换后的 HTML 和一次性发布输入都属于可丢弃产物，除非用户明确提升为长期保存

## 偏好 / 配置

优先检查 `config.json`：

```bash
test -f .gino-skills/post-to-wechat/config.json && echo "project-config"
test -f "$HOME/.gino-skills/post-to-wechat/config.json" && echo "user-config"
```

```powershell
if (Test-Path .gino-skills/post-to-wechat/config.json) { "project-config" }
if (Test-Path "$HOME/.gino-skills/post-to-wechat/config.json") { "user-config" }
```

┌────────────────────────────────────────────────────────┬────────────────────────┐
│                          路径                          │          位置          │
├────────────────────────────────────────────────────────┼────────────────────────┤
│ .gino-skills/post-to-wechat/config.json               │ 项目级首选配置         │
├────────────────────────────────────────────────────────┼────────────────────────┤
│ $HOME/.gino-skills/post-to-wechat/config.json         │ 用户级首选配置         │
└────────────────────────────────────────────────────────┴────────────────────────┘

┌───────────┬───────────────────────────────────────────────────────────────────────────┐
│   结果    │                                   动作                                    │
├───────────┼───────────────────────────────────────────────────────────────────────────┤
│ Found config.json | 读取、解析并应用设置                                              │
├───────────┼───────────────────────────────────────────────────────────────────────────┤
│ Not found │ 运行首次配置（[references/config/first-time-setup.md](references/config/first-time-setup.md)）→ 保存 `config.json` → 继续 │
└───────────┴───────────────────────────────────────────────────────────────────────────┘

**支持的配置项**：默认主题 | 默认颜色 | 默认发布方式（api/browser） | 默认作者 | 默认评论开关 | 默认仅粉丝评论开关 | Chrome profile 路径

首次配置文档： [references/config/first-time-setup.md](references/config/first-time-setup.md)

**最小支持配置项**（大小写不敏感，接受 `1/0` 或 `true/false`）：

| Key | Default | Mapping |
|-----|---------|---------|
| `default_author` | empty | 当 CLI/frontmatter 没传 `author` 时作为回退值 |
| `need_open_comment` | `1` | 对应 `draft/add` 请求里的 `articles[].need_open_comment` |
| `only_fans_can_comment` | `0` | 对应 `draft/add` 请求里的 `articles[].only_fans_can_comment` |

**推荐的 `config.json` 示例**：

```json
{
  "default_theme": "default",
  "default_color": "blue",
  "default_publish_method": "api",
  "default_author": "宝玉",
  "need_open_comment": true,
  "only_fans_can_comment": false,
  "chrome_profile_path": "/path/to/chrome/profile"
}
```

**主题选项**：default、grace、simple、modern  
**颜色预设**：blue、green、vermilion、yellow、purple、sky、rose、olive、black、gray、pink、red、orange（也支持 hex）

**值的优先级**：
1. CLI 参数
2. Frontmatter
3. `config.json`
4. Skill 默认值

## 预检查（可选）

首次使用前，建议先运行环境检查。用户如果明确跳过，也可以继续。

```bash
${BUN_X} ${SKILL_DIR}/scripts/check-permissions.ts
```

检查项包括：Chrome、profile 隔离、Bun、辅助功能权限、剪贴板、粘贴快捷键、API 凭证、Chrome 冲突。

**如果检查失败**，按项给出修复建议：

| 检查项 | 修复方式 |
|-------|-----|
| Chrome | 安装 Chrome，或设置 `WECHAT_BROWSER_CHROME_PATH` 环境变量 |
| Profile dir | 确保 `~/.local/share/wechat-browser-profile` 可写 |
| Bun runtime | `curl -fsSL https://bun.sh/install \| bash` |
| Accessibility (macOS) | 系统设置 → 隐私与安全性 → 辅助功能 → 打开终端权限 |
| Clipboard copy | 确保 Swift/AppKit 可用（macOS 安装 Xcode CLI 工具：`xcode-select --install`） |
| Paste keystroke (macOS) | 同上，先修复辅助功能权限 |
| Paste keystroke (Linux) | 安装 `xdotool`（X11）或 `ydotool`（Wayland） |
| API credentials | 按第 2 步完成引导式配置，或手动写入 `.gino-skills/.env` |

## 图文消息发布（贴图 / 图文）

适合短内容、多图场景（最多 9 张图）：

```bash
${BUN_X} ${SKILL_DIR}/scripts/wechat-browser.ts --markdown article.md --images ./images/
${BUN_X} ${SKILL_DIR}/scripts/wechat-browser.ts --title "标题" --content "内容" --image img.png --submit
```

详细说明见：[references/image-text-posting.md](references/image-text-posting.md)

## 文章发布工作流

请复制下面的清单，边做边勾：

```text
Publishing Progress:
- [ ] Step 0: 加载偏好 / 配置
- [ ] Step 1: 判断输入类型
- [ ] Step 2: 选择发布方式并配置凭证
- [ ] Step 3: 解析主题/颜色并校验元数据
- [ ] Step 4: 发布到微信
- [ ] Step 5: 输出完成报告
```

### 第 0 步：加载偏好

先检查并加载 `config.json`（见上面的 Preferences / Config）。

**关键要求**：如果配置不存在，必须先完成首次配置，再继续其他步骤或提问。

优先解析并保存这些默认值：
- `default_theme`（默认 `default`）
- `default_color`（如果没设置就不传，由主题默认值接管）
- `default_author`
- `need_open_comment`（默认 `1`）
- `only_fans_can_comment`（默认 `0`）

### 第 1 步：判断输入类型

| 输入类型 | 识别方式 | 动作 |
|------------|-----------|--------|
| HTML 文件 | 路径以 `.html` 结尾且文件存在 | 跳到 Step 3 |
| Markdown 文件 | 路径以 `.md` 结尾且文件存在 | 继续到 Step 2 |
| 纯文本 | 不是文件路径，或文件不存在 | 先保存为 markdown，再继续到 Step 2 |

**纯文本处理方式**：

1. 根据内容生成 slug（取前 2-4 个有意义的词，转成 kebab-case）
2. 创建目录并保存文件：

```bash
mkdir -p "$(pwd)/post-to-wechat/$(date +%Y-%m-%d)"
# 保存路径：post-to-wechat/yyyy-MM-dd/[slug].md
```

3. 后续都按 markdown 文件处理

**Slug 示例**：
- `Understanding AI Models` → `understanding-ai-models`
- `人工智能的未来` → `ai-future`（slug 统一转成英文）

### 第 2 步：选择发布方式并配置

**询问发布方式**（除非 CLI 或 `config.json` 已经明确指定）：

| 方式 | 速度 | 要求 |
|--------|-------|--------------|
| `api`（推荐） | 快 | 需要 API 凭证 |
| `browser` | 慢 | 需要 Chrome 和登录态 |

**如果选择 API，先检查凭证**：

```bash
test -f .gino-skills/.env && grep -q "WECHAT_APP_ID" .gino-skills/.env && echo "project"
test -f "$HOME/.gino-skills/.env" && grep -q "WECHAT_APP_ID" "$HOME/.gino-skills/.env" && echo "user"
```

```powershell
if ((Test-Path .gino-skills/.env) -and (Select-String -Quiet -Pattern "WECHAT_APP_ID" .gino-skills/.env)) { "project" }
if ((Test-Path "$HOME/.gino-skills/.env") -and (Select-String -Quiet -Pattern "WECHAT_APP_ID" "$HOME/.gino-skills/.env")) { "user" }
```

**如果缺少凭证，就进入引导式配置**：

```text
WeChat API credentials not found.

To obtain credentials:
1. Visit https://developers.weixin.qq.com/platform
2. Apply for AppID and AppSecret
3. Copy AppID and AppSecret

Where to save?
A) Project-level: .gino-skills/.env (this project only)
B) User-level: ~/.gino-skills/.env (all projects)
```

在用户选定保存位置后，把以下内容写入 `.env`：

```text
WECHAT_APP_ID=<user_input>
WECHAT_APP_SECRET=<user_input>
```

### 第 3 步：解析主题/颜色并校验元数据

1. **解析 theme**（按以下顺序命中，命中后不要再问用户）：
   - CLI `--theme`
   - `config.json` 中的 `default_theme`
   - 默认值：`default`

2. **解析 color**（命中顺序如下）：
   - CLI `--color`
   - `config.json` 中的 `default_color`
   - 如果没有，就不传，让主题默认值生效

3. **校验元数据**（markdown 取 frontmatter，HTML 取 meta 标签）：

| 字段 | 缺失时怎么处理 |
|-------|------------|
| Title | 提示：`请输入标题，或直接回车从正文自动生成` |
| Summary | 提示：`请输入摘要，或直接回车自动生成（推荐用于 SEO）` |
| Author | 回退顺序：CLI `--author` → frontmatter `author` → `config.json` 中的 `default_author` |

**自动生成逻辑**：
- **Title**：优先取第一个 H1/H2，否则取第一句
- **Summary**：取第一段，截断到 120 字

4. **封面图检查**（API 的 `article_type=news` 时必需）：
   1. 优先使用 CLI `--cover`
   2. 其次读取 frontmatter（`coverImage`、`featureImage`、`cover`、`image`）
   3. 再其次检查文章目录默认路径：`imgs/cover.png`
   4. 再不行就退回正文中的第一张内联图片
   5. 如果仍然没有，停止发布并要求先提供封面图

### 第 4 步：发布到微信

**关键要求**：发布脚本会自己处理 markdown 转换。不要在外部先把 markdown 转成 HTML，必须把原始 markdown 文件直接传给脚本。这样 API 路径才能正确把图片转成 `<img>` 标签，而浏览器路径也能继续使用占位符替换流程。

**API 方式**（接受 `.md` 或 `.html`）：

```bash
${BUN_X} ${SKILL_DIR}/scripts/wechat-api.ts <file> --theme <theme> [--color <color>] [--title <title>] [--summary <summary>] [--author <author>] [--cover <cover_path>]
```

**关键要求**：必须始终显式传入 `--theme`。即使使用 `default`，也不能省略。`--color` 只有在用户或配置明确给出时才传。

**`draft/add` 请求体规则**：
- 端点：`POST https://api.weixin.qq.com/cgi-bin/draft/add?access_token=ACCESS_TOKEN`
- `article_type`：默认 `news`，也可为 `newspic`
- 对 `news` 类型，必须有 `thumb_media_id`（也就是封面）
- 始终解析并传入：
  - `need_open_comment`（默认 `1`）
  - `only_fans_can_comment`（默认 `0`）
- `author` 的解析顺序：CLI `--author` → frontmatter `author` → `config.json` 中的 `default_author`

如果脚本参数层没有显式暴露评论字段，也要确保最终 API 请求体里包含解析后的值。

**浏览器方式**（接受 `--markdown` 或 `--html`）：

```bash
${BUN_X} ${SKILL_DIR}/scripts/wechat-article.ts --markdown <markdown_file> --theme <theme> [--color <color>]
${BUN_X} ${SKILL_DIR}/scripts/wechat-article.ts --html <html_file>
```

### 第 5 步：完成报告

输出发布结果摘要（输入、方式、主题、文章元数据、结果状态、生成文件列表）。API 方式需额外包含 `media_id` 和草稿管理入口链接。详细模板见 `references/completion-report.md`。

## 详细参考

| 主题 | 文档 |
|-------|-----------|
| 图文消息参数、自动压缩 | [references/image-text-posting.md](references/image-text-posting.md) |
| 文章主题、图片处理 | [references/article-posting.md](references/article-posting.md) |

## 功能对比

| 功能 | 图文消息 | 文章（API） | 文章（Browser） |
|---------|------------|---------------|-------------------|
| 纯文本输入 | ✗ | ✓ | ✓ |
| HTML 输入 | ✗ | ✓ | ✓ |
| Markdown 输入 | Title/content | ✓ | ✓ |
| 多图 | ✓（最多 9 张） | ✓（内联） | ✓（内联） |
| 主题 | ✗ | ✓ | ✓ |
| 自动生成元数据 | ✗ | ✓ | ✓ |
| 默认封面回退（`imgs/cover.png`） | ✗ | ✓ | ✗ |
| 评论控制（`need_open_comment`、`only_fans_can_comment`） | ✗ | ✓ | ✗ |
| 需要 Chrome | ✓ | ✗ | ✓ |
| 需要 API 凭证 | ✗ | ✓ | ✗ |
| 速度 | 中 | 快 | 慢 |

## 前置条件

**API 方式**：
- 微信公众号 API 凭证
- 按第 2 步进行引导式配置，或手动写入 `.gino-skills/.env`

**浏览器方式**：
- Google Chrome
- 首次运行时登录公众号后台（会话会保留）

**配置文件位置优先级**：
1. 环境变量
2. `<cwd>/.gino-skills/.env`
3. `~/.gino-skills/.env`

## 故障排查

| 问题 | 处理方式 |
|-------|----------|
| 缺少 API 凭证 | 按第 2 步完成配置 |
| access token 错误 | 检查 API 凭证是否有效、是否过期 |
| 浏览器未登录 | 首次运行会打开浏览器，扫码登录 |
| Chrome 未找到 | 设置 `WECHAT_BROWSER_CHROME_PATH` 环境变量 |
| 标题/摘要缺失 | 自动生成，或手动补充 |
| 没有封面图 | 在 frontmatter 里加封面，或在文章目录放置 `imgs/cover.png` |
| 评论默认值不对 | 检查 `config.json` 或 legacy `EXTEND.md` 中的 `need_open_comment` / `only_fans_can_comment` |
| 粘贴失败 | 检查系统剪贴板权限 |

## 扩展配置支持

自定义配置优先使用 `config.json`。支持项和路径见上面的 **偏好 / 配置**。

## Legacy 兼容附录

迁移期间仍保留 legacy `EXTEND.md` 回退路径，但它仅用于兼容，不应作为新的配置方式。详见 [docs/deprecation-roadmap.md](/Users/gino/Documents/Github/gino-skills/docs/deprecation-roadmap.md)。

Fallback paths:
- `.gino-skills/post-to-wechat/EXTEND.md`
- `$HOME/.gino-skills/post-to-wechat/EXTEND.md`
