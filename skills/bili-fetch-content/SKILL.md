---
name: bili-fetch-content
description: "Use when 用户想读取或搜索 Bilibili 内容，包括热门视频、排行榜、搜索结果、字幕、评论、动态流或 UP 主资料。"
---

# B站内容获取器 (Bilibili Content Fetcher)

通过 bilibili-cli 命令行工具获取B站内容。支持热门/排行/搜索/视频详情/字幕/AI摘要/评论/用户分析等。

完整命令参数详情见 `references/api_reference.md`。

## Worker Entrypoints

- `python3 scripts/examples/bili_fetch_worker.py --subcommand hot`
- `python3 scripts/examples/bili_fetch_worker.py --subcommand search AI`
- `python3 scripts/examples/bili_fetch_worker.py --subcommand video BV1xxxxxxxxx --subtitle`

这些入口会统一输出 worker JSON 契约，便于上游编排 skill 复用。

## Shared Runtime

- 读取类命令优先走 `scripts/examples/bili_fetch_worker.py`
- 如果需要跨 skill 复用结果，优先由 orchestrator 写入 stable state 或 workspace 缓存
- 原始 `bili ... --yaml` 示例保留用于人工调试，不再作为主路径

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

优先使用 worker：

```bash
python3 scripts/examples/bili_fetch_worker.py --subcommand hot
python3 scripts/examples/bili_fetch_worker.py --subcommand rank
```

调试 CLI 时可直接运行原始命令：

```bash
# 热门视频
bili hot --yaml

# 全站排行榜
bili rank --yaml
```

### 场景二：搜索内容

```bash
python3 scripts/examples/bili_fetch_worker.py --subcommand search "关键词"
python3 scripts/examples/bili_fetch_worker.py --subcommand search "用户名"
```

仅在排查 CLI 参数时再直接执行：

```bash
# 搜索视频
bili search "关键词" --yaml

# 搜索用户
bili search "用户名" --yaml
```

### 场景三：视频详情分析

```bash
python3 scripts/examples/bili_fetch_worker.py --subcommand video BV1xxxxxxxxx
python3 scripts/examples/bili_fetch_worker.py --subcommand video BV1xxxxxxxxx --subtitle
python3 scripts/examples/bili_fetch_worker.py --subcommand video BV1xxxxxxxxx --comments
```

原始命令保留如下：

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
python3 scripts/examples/bili_fetch_worker.py --subcommand user <UID或用户名>
python3 scripts/examples/bili_fetch_worker.py --subcommand user-videos <UID>
```

原始命令：

```bash
# UP主个人信息
bili user <UID或用户名> --yaml

# UP主视频列表
bili user-videos <UID> --yaml
```

### 场景五：个人内容浏览

```bash
python3 scripts/examples/bili_fetch_worker.py --subcommand feed
python3 scripts/examples/bili_fetch_worker.py --subcommand favorites
python3 scripts/examples/bili_fetch_worker.py --subcommand watch-later
python3 scripts/examples/bili_fetch_worker.py --subcommand history
```

原始命令：

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

这条链路仍直接走 `bili audio`，因为它本质上是本地产物生成，不是结构化 API 读取。若后续需要纳入统一 worker 契约，可再包一层音频产物 worker。

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
