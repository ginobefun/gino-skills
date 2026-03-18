# 常规帖子详细指南

用于向 X 发布普通文本帖子与图片帖子。

## 手动工作流

如果你希望更细地控制每一步，可以按下面流程执行：

### Step 1：把图片复制到剪贴板

```bash
${BUN_X} ${SKILL_DIR}/scripts/copy-to-clipboard.ts image /path/to/image.png
```

### Step 2：从剪贴板粘贴

```bash
# 粘贴到当前前台应用
${BUN_X} ${SKILL_DIR}/scripts/paste-from-clipboard.ts

# 粘贴到 Chrome，并带重试
${BUN_X} ${SKILL_DIR}/scripts/paste-from-clipboard.ts --app "Google Chrome" --retries 5

# 用更短延迟快速粘贴
${BUN_X} ${SKILL_DIR}/scripts/paste-from-clipboard.ts --delay 200
```

### Step 3：使用 Playwright MCP（如果当前已有 Chrome 会话）

```bash
# 打开页面
mcp__playwright__browser_navigate url="https://x.com/compose/post"

# 获取元素引用
mcp__playwright__browser_snapshot

# 输入文字
mcp__playwright__browser_click element="editor" ref="<ref>"
mcp__playwright__browser_type element="editor" ref="<ref>" text="Your content"

# 粘贴图片（前提是图片已经进了系统剪贴板）
mcp__playwright__browser_press_key key="Meta+v"  # macOS
# 或
mcp__playwright__browser_press_key key="Control+v"  # Windows/Linux

# 截图确认
mcp__playwright__browser_take_screenshot filename="preview.png"
```

## 图片支持

- 支持格式：PNG、JPEG、GIF、WebP
- 每条帖子最多 4 张图
- 图片通过系统剪贴板进入浏览器，再用键盘快捷键粘贴

## 示例会话

```text
用户：/post-to-x "Hello from Claude!" --image ./screenshot.png

Claude：
1. 执行：${BUN_X} ${SKILL_DIR}/scripts/x-browser.ts "Hello from Claude!" --image ./screenshot.png
2. 打开 Chrome，并进入 X 发帖页
3. 将文字输入编辑器
4. 把图片复制到剪贴板并粘贴
5. 浏览器保留 30 秒供预览
6. 返回："Post composed. Use --submit to post."
```

## 故障排查

- **找不到 Chrome**：设置环境变量 `X_BROWSER_CHROME_PATH`
- **未登录**：首次运行会打开 Chrome，请手动登录；cookie 会保存
- **图片粘贴失败**：
  - 先验证剪贴板脚本：`${BUN_X} ${SKILL_DIR}/scripts/copy-to-clipboard.ts image <path>`
  - 在 macOS 上，为 Terminal/iTerm 开启“辅助功能”权限
  - 粘贴时确保 Chrome 窗口可见且处于前台
- **`osascript permission denied`**：给终端授予系统辅助功能权限
- **被限流**：等待几分钟后重试

## 工作原理

`x-browser.ts` 使用 Chrome DevTools Protocol（CDP）执行以下步骤：

1. 启动真实 Chrome（不是 Playwright），并带上 `--disable-blink-features=AutomationControlled`
2. 使用持久化 profile 目录，复用登录态
3. 通过 CDP 命令（如 `Runtime.evaluate`、`Input.dispatchKeyEvent`）操作 X
4. **在 macOS 上用 `osascript` 粘贴图片**：发送真实的 `Cmd+V`，绕过 X 对合成粘贴事件的检测

这样可以规避 X 对 Playwright / Puppeteer 等自动化痕迹的拦截。

### 图片粘贴机制（macOS）

CDP 的 `Input.dispatchKeyEvent` 发出的属于“合成键盘事件”，网站可以检测到。X 会忽略这类合成粘贴事件，所以需要走真实系统粘贴：

1. 通过 Swift / AppKit（`copy-to-clipboard.ts`）把图片复制到系统剪贴板
2. 用 `osascript` 把 Chrome 提到前台
3. 再用 `osascript` + System Events 发送真实 `Cmd+V`
4. 等待上传完成

因此，Terminal 需要在系统设置里拥有“辅助功能”权限。
