# 故障排查指南

## 常见问题

### 1. Chrome not found

**症状**: `Error: Chrome not found. Install Google Chrome or set X_CHROME_PATH environment variable.`

**解决**:
- 确认 Google Chrome 已安装
- 或设置环境变量指向 Chrome 路径:
  ```bash
  export X_CHROME_PATH="/path/to/chrome"
  ```
- macOS 默认路径: `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`

### 2. 未登录 / Editor not found

**症状**: `Editor not found. Please log in to X in the browser window.`

**解决**:
1. 首次使用时，脚本会打开 Chrome 浏览器
2. 在浏览器中手动登录 X (twitter.com)
3. 登录态保存在 `~/.local/share/x-browser-profile`，后续无需重复登录
4. 若登录态过期，删除 profile 目录后重新登录:
   ```bash
   rm -rf ~/.local/share/x-browser-profile
   ```

### 3. 图片粘贴失败

**症状**: `[paste] osascript error: ...` 或图片未出现在编辑器中

**macOS 解决**:
1. 系统偏好设置 → 隐私与安全性 → 辅助功能
2. 添加你的终端应用（Terminal / iTerm2 / VS Code / Warp 等）
3. 确认已勾选启用

**Linux 解决**:
- X11: 安装 `xdotool` 和 `xclip`
- Wayland: 安装 `ydotool` 和 `wl-clipboard`

### 4. CDP 连接超时

**症状**: `Chrome debug port not ready after 30000ms`

**解决**:
1. 检查是否有其他 Chrome 实例占用调试端口
2. 关闭所有 Chrome 窗口后重试
3. 检查防火墙是否阻止了本地端口连接
4. 增加等待时间（脚本会自动重试）

### 5. 选择器未找到

**症状**: `Element not found: [data-testid="xxx"]`

**可能原因**:
- Twitter/X 更新了页面结构
- 页面加载未完成
- 网络连接慢

**解决**:
1. 在 Chrome DevTools 中检查元素是否存在
2. 查看 `references/cdp-selectors.md` 中的选择器是否过时
3. 使用 DevTools 找到新的 `data-testid` 值并更新脚本

### 6. 推文已执行过

**症状**: `Tweet is already liked.` / `Tweet is already retweeted.`

**说明**: 脚本会自动检测当前状态。如需取消操作，使用 `--unlike` 或 `--undo` 参数。

### 7. Profile 目录冲突

**症状**: Chrome 启动但行为异常

**解决**:
- 确保没有其他进程使用同一个 profile 目录
- 该 profile 与 `baoyu-post-to-x` 共享，同一时间只能有一个脚本使用

## 环境变量

| 变量 | 用途 | 默认值 |
|------|------|--------|
| `X_CHROME_PATH` | Chrome 可执行文件路径 | 自动检测 |
| `XDG_DATA_HOME` | Profile 目录基础路径 | `~/.local/share` |

## 日志标识

所有脚本输出带有前缀标识:

- `[x-actions]` — Chrome 启动和 CDP 连接
- `[x-post]` — 发推文操作
- `[x-reply]` — 回复操作
- `[x-quote]` — 引用操作
- `[x-retweet]` — 转推操作
- `[x-like]` — 点赞操作
- `[paste]` — 剪贴板粘贴操作
