# xiaohongshu-cli 写操作命令参考

## 安装

```bash
# 推荐方式
uv tool install xiaohongshu-cli

# 备选方式
pipx install xiaohongshu-cli
```

## 认证

### 登录方式

```bash
# 从浏览器提取 cookie（推荐）
xhs login

# QR码登录
xhs login --qrcode

# 检查登录状态
xhs status --yaml

# 查看账号信息
xhs whoami --yaml

# 登出
xhs logout
```

### Cookie 管理
- Cookie 默认有效期 7 天
- 过期后需重新 `xhs login`
- 自动从 Chrome, Firefox, Edge, Brave 提取

**注意**: 写操作命令要求已登录状态，使用前请确认 `xhs status` 返回已登录。Cookie 有效期约 7 天。

---

## 写操作命令

### xhs post — 发布笔记

```bash
xhs post --title "笔记标题" --body "笔记正文内容" --images image1.jpg image2.jpg --yaml
```

| 参数 | 说明 | 必填 |
|------|------|------|
| `--title` | 笔记标题 | 是 |
| `--body` | 笔记正文 | 是 |
| `--images` | 图片文件路径（可多个） | 是（至少1张） |

**注意**: 小红书笔记必须包含图片，纯文字笔记不支持。

### xhs delete — 删除笔记

```bash
# 需确认
xhs delete <note_id> --yaml

# 跳过确认
xhs delete <note_id> -y --yaml
```

**参数**:
- `note_id`: 笔记 ID（必填，可通过 `xhs my-notes` 获取）

### xhs like — 点赞/取消点赞

```bash
# 点赞（支持短索引或笔记 ID）
xhs like 1 --yaml
xhs like <note_id> --yaml

# 取消点赞
xhs like <note_id> --undo --yaml
```

### xhs favorite — 收藏笔记

```bash
xhs favorite <note_id> --yaml
xhs favorite 1 --yaml  # 短索引
```

### xhs unfavorite — 取消收藏

```bash
xhs unfavorite <note_id> --yaml
xhs unfavorite 1 --yaml  # 短索引
```

### xhs comment — 评论笔记

```bash
xhs comment <note_id> -c "评论内容" --yaml
xhs comment 1 -c "评论内容" --yaml  # 短索引
```

### xhs reply — 回复评论

```bash
xhs reply <note_id> --comment-id <comment_id> -c "回复内容" --yaml
```

| 参数 | 说明 | 必填 |
|------|------|------|
| `note_id` | 笔记 ID | 是 |
| `--comment-id` | 被回复的评论 ID | 是 |
| `-c` | 回复内容 | 是 |

### xhs delete-comment — 删除评论

```bash
xhs delete-comment <note_id> <comment_id> --yaml
```

只能删除自己的评论。

### xhs follow — 关注用户

```bash
xhs follow <user_id> --yaml
```

### xhs unfollow — 取关用户

```bash
xhs unfollow <user_id> --yaml
```

---

## 辅助读取命令

写操作前常用的读取命令：

### xhs my-notes — 查看自己的笔记

```bash
xhs my-notes --yaml
xhs my-notes --page 2 --yaml
```

用于获取笔记 ID 以便删除。

### xhs read — 确认笔记信息

```bash
xhs read <note_id> --yaml
```

在点赞/收藏/评论前确认笔记信息。

### xhs comments — 查看评论

```bash
xhs comments <note_id> --yaml
```

在回复评论前查看已有评论和评论 ID。

### xhs whoami — 确认登录账号

```bash
xhs whoami --yaml
```

---

## 短索引功能

xiaohongshu-cli 支持短索引导航：上次搜索或列表操作的结果会被编号，可通过序号快速引用。

```bash
# 搜索后
xhs search "AI" --yaml
# 对第1条结果操作
xhs like 1 --yaml
xhs read 1 --yaml
xhs comments 1 --yaml
```

---

## 输出格式

成功：
```yaml
ok: true
schema_version: "1.0"
data:
  message: "操作成功"
error: null
```

失败：
```yaml
ok: false
schema_version: "1.0"
data: null
error:
  code: "ERROR_CODE"
  message: "错误描述"
```

## 反爬注意

写操作会自动添加随机延迟。批量操作时不要手动加速，让工具控制节奏。

## 常见错误

| 场景 | 说明 | 处理方式 |
|------|------|---------|
| 未登录 | 需要登录 | `xhs login` |
| Cookie 过期 | 约 7 天过期 | 重新 `xhs login` |
| 频率限制 | 请求过快 | 自动退避重试 |
| 验证码 | 触发风控 | 自动冷却等待 |
| 笔记不存在 | ID 无效 | 确认 ID |
| 发布失败 | 图片或内容问题 | 检查图片路径和内容 |
| 已点赞 | 重复操作 | 跳过 |
