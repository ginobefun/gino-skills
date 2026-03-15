# xiaohongshu-cli 命令参考

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

## 全局选项

| 选项 | 说明 |
|------|------|
| `--yaml` | YAML 格式输出 |
| `--json` | JSON 格式输出 |

非 TTY 环境自动使用 YAML 输出。

---

## 搜索命令

### xhs search — 搜索笔记

```bash
xhs search "关键词" --yaml
```

| 参数 | 说明 | 可选值 |
|------|------|--------|
| `--sort` | 排序方式 | `general`（默认）, `popular`, `latest` |
| `--type` | 内容类型 | `all`（默认）, `video`, `image` |
| `--page` | 页码 | 正整数 |

### xhs search-user — 搜索用户

```bash
xhs search-user "用户名" --yaml
```

### xhs topics — 搜索话题/标签

```bash
xhs topics "话题名" --yaml
```

---

## 内容阅读命令

### xhs read — 笔记详情

```bash
# 通过短索引（上次搜索结果的序号）
xhs read 1 --yaml

# 通过笔记 ID
xhs read <note_id> --yaml

# 通过 URL
xhs read "https://www.xiaohongshu.com/explore/..." --yaml
```

**返回字段**:
- `note_id`: 笔记 ID
- `title`: 标题
- `desc`: 正文内容
- `type`: 类型（normal/video）
- `user`: 作者信息
  - `user_id`: 用户 ID
  - `nickname`: 昵称
  - `avatar`: 头像
- `interact_info`: 互动数据
  - `liked_count`: 点赞数
  - `collected_count`: 收藏数
  - `comment_count`: 评论数
  - `share_count`: 分享数
- `tag_list`: 标签列表
- `image_list`: 图片列表
- `video`: 视频信息（视频笔记）
- `time`: 发布时间
- `last_update_time`: 最后更新时间

### xhs comments — 评论列表

```bash
# 热门评论
xhs comments <note_id> --yaml

# 通过短索引
xhs comments 1 --yaml

# 获取所有评论（分页）
xhs comments <note_id> --all --yaml

# 通过 URL（需 xsec-token）
xhs comments <url> --yaml
```

### xhs sub-comments — 评论回复

```bash
xhs sub-comments <note_id> <comment_id> --yaml
```

---

## 用户命令

### xhs user — 用户信息

```bash
xhs user <user_id> --yaml
```

**返回字段**:
- `user_id`: 用户 ID
- `nickname`: 昵称
- `desc`: 简介
- `gender`: 性别
- `ip_location`: IP 属地
- `follows`: 关注数
- `fans`: 粉丝数
- `interaction`: 获赞与收藏数
- `tag_list`: 标签

### xhs user-posts — 用户笔记列表

```bash
xhs user-posts <user_id> --yaml

# 翻页
xhs user-posts <user_id> --cursor <cursor> --yaml
```

---

## Feed 和发现命令

### xhs feed — 推荐 Feed

```bash
xhs feed --yaml
```

### xhs hot — 热门笔记

```bash
# 全部分类
xhs hot --yaml

# 按分类
xhs hot -c tech --yaml
```

---

## 个人账号命令

### xhs favorites — 收藏列表

```bash
xhs favorites --yaml

# 指定用户
xhs favorites <user_id> --yaml
```

### xhs my-notes — 我的笔记

```bash
xhs my-notes --yaml

# 翻页
xhs my-notes --page 2 --yaml
```

### xhs unread — 未读通知数

```bash
xhs unread --yaml
```

### xhs notifications — 通知详情

```bash
xhs notifications --yaml

# 按类型筛选
xhs notifications --type likes --yaml
xhs notifications --type connections --yaml
```

---

## 写操作命令

### xhs post — 发布笔记

```bash
xhs post --title "标题" --body "正文内容" --images image1.jpg image2.jpg --yaml
```

| 参数 | 说明 | 必填 |
|------|------|------|
| `--title` | 笔记标题 | 是 |
| `--body` | 笔记正文 | 是 |
| `--images` | 图片文件路径（可多个） | 是 |

### xhs delete — 删除笔记

```bash
xhs delete <note_id> --yaml

# 跳过确认
xhs delete <note_id> -y --yaml
```

### xhs like — 点赞/取消点赞

```bash
# 点赞
xhs like <note_id> --yaml
xhs like 1 --yaml  # 短索引

# 取消点赞
xhs like <note_id> --undo --yaml
```

### xhs favorite / unfavorite — 收藏/取消收藏

```bash
xhs favorite <note_id> --yaml
xhs unfavorite <note_id> --yaml
```

### xhs comment — 评论

```bash
xhs comment <note_id> -c "评论内容" --yaml
```

### xhs reply — 回复评论

```bash
xhs reply <note_id> --comment-id <comment_id> -c "回复内容" --yaml
```

### xhs delete-comment — 删除评论

```bash
xhs delete-comment <note_id> <comment_id> --yaml
```

### xhs follow / unfollow — 关注/取关

```bash
xhs follow <user_id> --yaml
xhs unfollow <user_id> --yaml
```

---

## 输出格式

所有命令使用统一的结构化输出信封：

```yaml
ok: true
schema_version: "1.0"
data:
  # 具体数据
error: null
```

错误时：

```yaml
ok: false
schema_version: "1.0"
data: null
error:
  code: "ERROR_CODE"
  message: "错误描述"
```

## 反爬机制说明

xiaohongshu-cli 内置以下反爬策略：
- **高斯分布随机延迟**: 模拟自然浏览行为
- **Session 稳定指纹**: macOS Chrome 浏览器指纹
- **频率限制自动退避**: 指数退避重试
- **验证码渐进冷却**: 自适应延迟等待
- **加密签名请求**: API 请求加密签名

## 常见错误

| 场景 | 说明 |
|------|------|
| 未登录 | 提示运行 `xhs login` |
| Cookie 过期 | 约 7 天过期，重新 `xhs login` |
| 频率限制 | 自动指数退避重试 |
| 验证码拦截 | 自动渐进冷却等待 |
| 笔记不存在 | ID 错误或已删除 |
| 发布失败 | 检查图片路径和内容合规 |
