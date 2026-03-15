---
name: xhs-fetch-content
description: "通过 xiaohongshu-cli 获取小红书内容 — 搜索笔记、热门推荐、笔记详情、评论、用户分析、话题。适用场景：(1) 搜索小红书笔记，(2) 浏览小红书热门和推荐，(3) 查看笔记详情和评论，(4) 分析小红书用户/博主，(5) 查看话题/标签下的内容，(6) 查看收藏和通知。触发短语：'小红书', 'xiaohongshu', 'xhs', '红书搜索', '小红书热门', '小红书笔记', '看看小红书', 'xhs search', 'xhs hot', '小红书博主', '红书内容', '小红书话题', '小红书评论', '小红书推荐', 'read xiaohongshu', '小红书feed'。"
---

# 小红书内容获取器 (Xiaohongshu Content Fetcher)

通过 xiaohongshu-cli 命令行工具获取小红书内容。支持搜索/热门/笔记详情/评论/用户分析/话题等。

完整命令参数详情见 `references/api_reference.md`。

## 前置条件

需要安装 xiaohongshu-cli：

```bash
uv tool install xiaohongshu-cli
```

认证：通过 `xhs login` 提取浏览器 cookie 或 `xhs login --qrcode` 扫码登录。

检查登录状态：
```bash
xhs status --yaml
```

**注意**: Cookie 有效期约 7 天，过期需重新登录。小红书有反爬机制，请求间自动添加随机延迟。

## 可用命令

| 命令 | 类型 | 用途 |
|------|------|------|
| `xhs search` | 读取 | 搜索笔记 |
| `xhs search-user` | 读取 | 搜索用户 |
| `xhs topics` | 读取 | 搜索话题/标签 |
| `xhs hot` | 读取 | 热门笔记（可按分类） |
| `xhs feed` | 读取 | 推荐 Feed |
| `xhs read` | 读取 | 笔记详情 |
| `xhs comments` | 读取 | 笔记评论 |
| `xhs sub-comments` | 读取 | 评论回复 |
| `xhs user` | 读取 | 用户个人信息 |
| `xhs user-posts` | 读取 | 用户发布的笔记 |
| `xhs favorites` | 读取 | 收藏列表 |
| `xhs unread` | 读取 | 未读通知数 |
| `xhs notifications` | 读取 | 通知详情 |

## 核心工作流

### 场景一：搜索笔记

```bash
# 按关键词搜索（默认综合排序）
xhs search "关键词" --yaml

# 按热度排序
xhs search "关键词" --sort popular --yaml

# 按最新排序
xhs search "关键词" --sort latest --yaml

# 筛选内容类型
xhs search "关键词" --type video --yaml
xhs search "关键词" --type image --yaml

# 翻页
xhs search "关键词" --page 2 --yaml
```

### 场景二：浏览热门/推荐

```bash
# 热门笔记（全部分类）
xhs hot --yaml

# 按分类浏览热门
xhs hot -c tech --yaml

# 推荐 Feed
xhs feed --yaml
```

### 场景三：笔记详情分析

```bash
# 通过搜索结果的短索引读取
xhs read 1 --yaml

# 通过笔记 ID 读取
xhs read <note_id> --yaml

# 通过 URL 读取
xhs read "https://www.xiaohongshu.com/explore/..." --yaml

# 查看评论
xhs comments <note_id> --yaml

# 查看所有评论（分页获取）
xhs comments <note_id> --all --yaml

# 查看评论回复
xhs sub-comments <note_id> <comment_id> --yaml
```

**深度分析建议**: 并行获取笔记详情和评论以全面了解内容：
```bash
# 并行执行
xhs read <note_id> --yaml
xhs comments <note_id> --all --yaml
```

### 场景四：用户/博主分析

```bash
# 用户个人信息
xhs user <user_id> --yaml

# 用户发布的笔记
xhs user-posts <user_id> --yaml

# 翻页查看更多
xhs user-posts <user_id> --cursor <cursor> --yaml
```

### 场景五：话题探索

```bash
# 搜索话题/标签
xhs topics "AI" --yaml

# 搜索用户
xhs search-user "用户名" --yaml
```

### 场景六：个人账号

```bash
# 收藏列表
xhs favorites --yaml

# 未读通知数
xhs unread --yaml

# 通知详情
xhs notifications --yaml
xhs notifications --type likes --yaml
xhs notifications --type connections --yaml
```

## 参数调整

| 用户意图 | 命令 |
|---------|------|
| "搜索小红书 AI 内容" | `xhs search "AI" --yaml` |
| "小红书热门" | `xhs hot --yaml` |
| "最火的笔记" | `xhs search "关键词" --sort popular --yaml` |
| "最新笔记" | `xhs search "关键词" --sort latest --yaml` |
| "只看视频" | `xhs search "关键词" --type video --yaml` |
| "看看这篇笔记" | `xhs read <note_id> --yaml` |
| "评论区怎么说" | `xhs comments <note_id> --all --yaml` |
| "这个博主" | `xhs user <user_id> --yaml` |
| "博主的作品" | `xhs user-posts <user_id> --yaml` |
| "话题 xxx" | `xhs topics "xxx" --yaml` |
| "我的收藏" | `xhs favorites --yaml` |

## 输出格式

所有命令支持 `--yaml` 和 `--json` 格式化输出。非 TTY 环境自动使用 YAML。

```markdown
## 小红书内容 (YYYY-MM-DD)

### 1. 笔记标题
- **作者**: username (user_id)
- **类型**: 图文 / 视频
- **点赞**: 1.2K | **收藏**: 345 | **评论**: 56 | **分享**: 23
- **发布时间**: 2026-03-15
- **内容**:
  笔记正文内容...
- **标签**: #标签1 #标签2
- **链接**: https://www.xiaohongshu.com/explore/...

---
```

### 输出字段映射

| 输出字段 | CLI 字段 | 说明 |
|---------|---------|------|
| 笔记标题 | `title` | 完整标题，不截断 |
| 作者 | `user.nickname` (`user.user_id`) | 作者昵称和 ID |
| 类型 | `type` | `normal` → 图文，`video` → 视频 |
| 点赞 | `interact_info.liked_count` | 大数字用 K/M 格式化 |
| 收藏 | `interact_info.collected_count` | 大数字用 K/M 格式化 |
| 评论 | `interact_info.comment_count` | 评论数 |
| 分享 | `interact_info.share_count` | 分享数 |
| 发布时间 | `time` | 格式化为本地日期 |
| 内容 | `desc` | 笔记正文，完整输出不截断 |
| 标签 | `tag_list[].name` | 以 # 前缀输出所有标签 |
| 图片 | `image_list` | 图片数量提示 |
| 链接 | — | 拼接自 `https://www.xiaohongshu.com/explore/{note_id}` |

### 输出完整性规则

- 笔记标题和正文：完整输出，不截断
- 作者简介：完整输出
- 标签：输出全部标签
- 大数字用 K/M 格式化
- 空值字段省略该行

## 与其他 Skills 联动

- **daily-content-curator**: 小红书热门内容作为内容灵感源
- **content-synthesizer**: 分析小红书风格，优化内容输出
- **content-analytics**: 分析小红书发布效果和互动数据
- **deep-reading**: 小红书长文/专业笔记可作为阅读素材

## 错误处理

- 命令未找到：提示安装 `uv tool install xiaohongshu-cli`
- 未登录：提示运行 `xhs login` 登录
- Cookie 过期：提示重新运行 `xhs login`
- 频率限制（429）：工具自动进行指数退避重试
- 验证码拦截：工具自动进行渐进式冷却等待
- 笔记不存在：ID 错误或已被删除
- 网络错误：检查网络连接，重试一次
