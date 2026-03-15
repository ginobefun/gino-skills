---
name: bili-fetch-content
description: "通过 bilibili-cli 获取B站内容 — 热门视频、排行榜、搜索、视频详情、字幕、AI摘要、评论、用户信息。适用场景：(1) 浏览B站热门和排行榜视频，(2) 搜索B站视频或用户，(3) 获取视频详情、字幕和AI摘要，(4) 查看视频评论，(5) 查看UP主主页和视频列表，(6) 浏览动态和Feed，(7) 查看收藏/稍后再看/历史记录。触发短语：'B站', 'bilibili', '哔哩哔哩', 'B站热门', 'B站搜索', '视频字幕', 'AI摘要', 'B站排行', '看看B站', 'bilibili trending', 'bili search', 'bili video', '获取B站视频', 'B站UP主', '哔哩哔哩视频', 'B站动态', '稍后再看', '观看历史'。"
---

# B站内容获取器 (Bilibili Content Fetcher)

通过 bilibili-cli 命令行工具获取B站内容。支持热门/排行/搜索/视频详情/字幕/AI摘要/评论/用户分析等。

完整命令参数详情见 `references/api_reference.md`。

## 前置条件

需要安装 bilibili-cli：

```bash
uv tool install bilibili-cli
```

认证：通过 `bili login` 扫码登录（部分功能如收藏、历史需要登录）。

检查登录状态：
```bash
bili status --yaml
```

## 可用命令

| 命令 | 类型 | 用途 |
|------|------|------|
| `bili hot` | 读取 | 热门视频列表 |
| `bili rank` | 读取 | 全站排行榜 |
| `bili search` | 读取 | 搜索视频/用户 |
| `bili video` | 读取 | 视频详情/字幕/AI摘要/评论 |
| `bili user` | 读取 | UP主个人信息 |
| `bili user-videos` | 读取 | UP主视频列表 |
| `bili feed` | 读取 | 动态时间线 |
| `bili favorites` | 读取 | 收藏夹列表 |
| `bili following` | 读取 | 关注列表 |
| `bili watch-later` | 读取 | 稍后再看 |
| `bili history` | 读取 | 观看历史 |
| `bili audio` | 读取 | 提取视频音频并分段 |

## 核心工作流

### 场景一：浏览热门/排行

```bash
# 热门视频
bili hot --yaml

# 全站排行榜
bili rank --yaml
```

### 场景二：搜索内容

```bash
# 搜索视频
bili search "关键词" --yaml

# 搜索用户
bili search "用户名" --yaml
```

### 场景三：视频详情分析

```bash
# 视频基本信息
bili video BV1xxxxxxxxx --yaml

# 获取字幕（可供 deep-reading 分析）
bili video BV1xxxxxxxxx --subtitle --yaml

# 带时间轴的字幕
bili video BV1xxxxxxxxx --subtitle-timeline --yaml

# 导出 SRT 格式字幕
bili video BV1xxxxxxxxx -st --subtitle-format srt

# AI 摘要
bili video BV1xxxxxxxxx --ai --yaml

# 热门评论
bili video BV1xxxxxxxxx --comments --yaml

# 相关推荐视频
bili video BV1xxxxxxxxx --related --yaml

# 完整分析（并行获取多维信息）
# 并行执行以下命令获取全面视频信息：
bili video BV1xxxxxxxxx --subtitle --ai --yaml
bili video BV1xxxxxxxxx --comments --yaml
bili video BV1xxxxxxxxx --related --yaml
```

### 场景四：UP主分析

```bash
# UP主个人信息
bili user <UID或用户名> --yaml

# UP主视频列表
bili user-videos <UID> --yaml
```

### 场景五：个人内容浏览

```bash
# 动态时间线
bili feed --yaml

# 收藏夹
bili favorites --yaml

# 稍后再看
bili watch-later --yaml

# 观看历史
bili history --yaml
```

### 场景六：音频提取（供 create-podcast 使用）

```bash
# 提取音频并分段（默认 25 秒片段）
bili audio BV1xxxxxxxxx

# 自定义分段长度
bili audio BV1xxxxxxxxx --segment 60

# 完整音频不分段
bili audio BV1xxxxxxxxx --no-split

# 指定输出目录
bili audio BV1xxxxxxxxx -o ~/output/
```

需安装音频扩展：`uv tool install "bilibili-cli[audio]"`

## 参数调整

| 用户意图 | 命令 |
|---------|------|
| "B站热门" | `bili hot --yaml` |
| "B站排行" | `bili rank --yaml` |
| "搜索 AI 视频" | `bili search "AI" --yaml` |
| "这个视频的字幕" | `bili video <BV_ID> --subtitle --yaml` |
| "AI总结这个视频" | `bili video <BV_ID> --ai --yaml` |
| "看看评论" | `bili video <BV_ID> --comments --yaml` |
| "这个UP主的视频" | `bili user-videos <UID> --yaml` |
| "我的收藏" | `bili favorites --yaml` |
| "稍后再看" | `bili watch-later --yaml` |
| "提取音频" | `bili audio <BV_ID>` |

## 输出格式

所有命令支持 `--yaml` 和 `--json` 格式化输出。非 TTY 环境自动使用 YAML。

```markdown
## B站内容 (YYYY-MM-DD)

### 1. 视频标题
- **UP主**: username (UID)
- **播放**: 12.5K | **弹幕**: 234 | **评论**: 56
- **点赞**: 1.2K | **投币**: 345 | **收藏**: 678 | **分享**: 89
- **发布时间**: 2026-03-15
- **简介**: 视频描述...
- **BV号**: BV1xxxxxxxxx
- **链接**: https://www.bilibili.com/video/BV1xxxxxxxxx

---
```

### 输出字段映射

| 输出字段 | CLI 字段 | 说明 |
|---------|---------|------|
| 视频标题 | `title` | 完整标题，不截断 |
| UP主 | `owner.name` (`owner.mid`) | UP主名称和 UID |
| 播放 | `stat.view` | 播放量（大数字用 K/M 格式化） |
| 弹幕 | `stat.danmaku` | 弹幕数 |
| 评论 | `stat.reply` | 评论数 |
| 点赞 | `stat.like` | 点赞数 |
| 投币 | `stat.coin` | 投币数 |
| 收藏 | `stat.favorite` | 收藏数 |
| 分享 | `stat.share` | 分享数 |
| 发布时间 | `pubdate` | 格式化为本地日期 |
| 简介 | `desc` | 视频描述，完整输出 |
| BV号 | `bvid` | 视频唯一标识 |
| 分区 | `tname` | 视频分区，空值省略 |
| 时长 | `duration` | 视频时长 |
| 链接 | — | 拼接自 `https://www.bilibili.com/video/{bvid}` |

### 输出完整性规则

- 视频标题：完整输出，不截断
- UP主简介：完整输出
- 字幕内容：完整输出
- 大数字用 K/M 格式化
- 空值字段省略该行

## 与其他 Skills 联动

- **deep-reading**: 通过字幕 + AI 摘要提供视频阅读素材
- **daily-content-curator**: B站热门/排行可作为内容灵感源
- **create-podcast**: `bili audio` 提取的音频片段可作为播客素材
- **content-synthesizer**: 视频内容可转化为文字内容在多平台分发

## 错误处理

- 命令未找到：提示安装 `uv tool install bilibili-cli`
- 未登录：提示运行 `bili login` 扫码登录
- 视频不存在：BV 号错误或视频已删除
- 字幕不可用：部分视频无字幕
- AI 摘要不可用：部分视频不支持 AI 摘要
- 网络错误：检查网络连接，重试一次
