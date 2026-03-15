# bilibili-cli 命令参考

## 安装

```bash
# 推荐方式
uv tool install bilibili-cli

# 带音频提取功能
uv tool install "bilibili-cli[audio]"

# 备选方式
pipx install bilibili-cli
```

## 认证

### 登录方式

```bash
# QR码登录（推荐）
bili login

# 检查登录状态
bili status --yaml

# 查看账号信息
bili whoami --yaml
```

### 认证优先级
1. 自动从浏览器提取 cookie（Chrome, Firefox, Edge, Brave）
2. QR 码登录（生成登录二维码）

## 全局选项

| 选项 | 说明 |
|------|------|
| `--yaml` | YAML 格式输出 |
| `--json` | JSON 格式输出 |

非 TTY 环境自动使用 YAML 输出。

---

## 读取命令

### bili hot — 热门视频

```bash
bili hot --yaml
```

返回当前热门视频列表。

### bili rank — 全站排行榜

```bash
bili rank --yaml
```

返回全站排行榜视频。

### bili search — 搜索

```bash
bili search "关键词" --yaml
```

搜索视频和用户。

### bili video — 视频详情

```bash
# 基本信息
bili video <BV_ID> --yaml

# 字幕
bili video <BV_ID> --subtitle --yaml
bili video <BV_ID> -st --yaml

# 带时间轴的字幕
bili video <BV_ID> --subtitle-timeline --yaml

# SRT 格式字幕
bili video <BV_ID> -st --subtitle-format srt

# AI 摘要
bili video <BV_ID> --ai --yaml

# 热门评论
bili video <BV_ID> --comments --yaml

# 相关推荐
bili video <BV_ID> --related --yaml
```

**视频详情返回字段**:
- `bvid`: BV号
- `title`: 标题
- `desc`: 描述
- `owner`: UP主信息（name, mid, face）
- `stat`: 统计数据
  - `view`: 播放量
  - `danmaku`: 弹幕数
  - `reply`: 评论数
  - `favorite`: 收藏数
  - `coin`: 投币数
  - `share`: 分享数
  - `like`: 点赞数
- `duration`: 时长
- `pubdate`: 发布时间
- `tname`: 分区
- `pic`: 封面图

### bili user — UP主信息

```bash
bili user <UID或用户名> --yaml
```

**返回字段**:
- `name`: 用户名
- `mid`: UID
- `sign`: 签名
- `level`: 等级
- `follower`: 粉丝数
- `following`: 关注数
- `video_count`: 视频数

### bili user-videos — UP主视频列表

```bash
bili user-videos <UID> --yaml
```

返回UP主发布的视频列表。

### bili feed — 动态时间线

```bash
bili feed --yaml
```

返回关注用户的动态。

### bili my-dynamics — 我的动态

```bash
bili my-dynamics --yaml
```

返回自己发布的动态。

### bili favorites — 收藏夹

```bash
bili favorites --yaml
```

返回收藏夹列表。

### bili following — 关注列表

```bash
bili following --yaml
```

返回关注的UP主列表。

### bili watch-later — 稍后再看

```bash
bili watch-later --yaml
```

### bili history — 观看历史

```bash
bili history --yaml
```

---

## 音频提取命令

需要安装音频扩展：`uv tool install "bilibili-cli[audio]"`

### bili audio — 提取视频音频

```bash
# 默认分段（25秒）
bili audio <BV_ID>

# 自定义分段长度（秒）
bili audio <BV_ID> --segment 60

# 不分段，完整音频
bili audio <BV_ID> --no-split

# 指定输出目录
bili audio <BV_ID> -o ~/output/
```

输出格式：m4a 音频文件。

---

## 写操作命令

### bili like — 点赞

```bash
bili like <BV_ID> --yaml
```

### bili coin — 投币

```bash
bili coin <BV_ID> --yaml
```

### bili triple — 一键三连

```bash
bili triple <BV_ID> --yaml
```

点赞 + 投币 + 收藏。

### bili dynamic-post — 发布动态

```bash
bili dynamic-post "动态文本" --yaml
```

### bili dynamic-delete — 删除动态

```bash
bili dynamic-delete <dynamic_id> --yaml
```

### bili unfollow — 取关

```bash
bili unfollow <UID> --yaml
```

---

## 输出格式

所有命令使用统一的结构化输出：

```yaml
ok: true
data:
  # 具体数据
error: null
```

错误时：

```yaml
ok: false
data: null
error:
  code: "ERROR_CODE"
  message: "错误描述"
```

## 常见错误

| 场景 | 说明 |
|------|------|
| 未登录 | 提示运行 `bili login` |
| BV号无效 | 视频不存在或已删除 |
| 字幕不可用 | 部分视频无字幕 |
| AI摘要不可用 | 部分视频不支持 |
| 币不足 | 投币时余额不足 |
| 已操作过 | 如已点赞，不重复操作 |
