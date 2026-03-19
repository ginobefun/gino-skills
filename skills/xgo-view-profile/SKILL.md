---
name: xgo-view-profile
description: "Use when 用户只想查看某个 X 账号的资料页，包括简介、统计和近期推文，而不需要 xgo-track-kol 那种更深的分析报告。"
---

# 用户画像查看器 (Twitter User Profiler)

通过 XGo (xgo.ing) 开放接口查看 Twitter/X 用户资料及近期动态。支持 DB 缓存和实时查询两种方式。

完整 API 参数详情见 `references/api_reference.md`。

## When to Use

- 用户要快速查看某个 X 账号的资料、统计和最近推文
- 用户需要 profile view，而不是完整的 KOL 深度分析报告
- 请求是围绕单个账号展开的快速侦察或资料确认

## When Not to Use

- 想做更深的账号分析或双账号对比时，使用 `xgo-track-kol`
- 想搜索某个主题或关键词下的推文时，使用 `xgo-search-tweets`
- 想管理 follows、lists 或 bookmarks 时，使用对应的 `xgo-manage-*` skills

## Gotchas

- 有 `userName` 时优先走实时 `user/info`；只有 `userId` 或 `feedId` 时再退到 `user/details`
- 资料查询成功不代表推文一定可读，私密账号或无公开推文时 `tweet/latest` 可能为空
- `profileBio` 中的链接需要内联展示，不能把 bio 和 URL 实体拆丢
- 不能把这个轻量视图写成深度评估；需要更多分析时应路由到 `xgo-track-kol`

## Related Skills

- `xgo-track-kol`：深度画像和双账号对比
- `xgo-search-tweets`：按话题搜索推文
- `xgo-manage-follows`：查看 follow 状态和统计
- `xgo-fetch-tweets`：抓取不同 feed 或 list 的原始推文

## Shared Scripts

- `scripts/examples/xgo_view_profile.py`：统一抓取用户资料和最新推文
- `scripts/examples/xgo_following_status.py`：补充 follow 状态、标签和备注
- `scripts/shared/xgo_client.py`：统一处理认证、`success:false` 和结构化输出

## Worker Entrypoints

优先使用 worker，而不是直接拼接 `user/info` 和 `tweet/latest`：

```bash
python3 scripts/examples/xgo_view_profile.py elonmusk --max-pages 3
python3 scripts/examples/xgo_following_status.py elonmusk
```

只看资料时可以省略第二个 worker；需要 follow 状态或标签时再补。

## 认证

认证方式见 `../../references/shared/auth-xgo.md`。

## 默认查看策略

用户要求查看某用户时，优先运行以下 worker：

1. `xgo_view_profile.py`：获取最新资料和近期动态
2. `xgo_following_status.py`：按需补充 follow 状态与标签

```bash
python3 scripts/examples/xgo_view_profile.py elonmusk --max-pages 3
```

### 端点选择指南

| 场景 | 端点 | 原因 |
|------|------|------|
| 用户名查询（常用） | `user/info` | 实时从 Twitter 拉取最新数据 |
| 有 userId 或 feedId | `user/details` | 从 DB 缓存快速查询 |
| 只需基本信息 | `user/details` | 更快，不消耗 Twitter API 配额 |
| 需要最新粉丝数等 | `user/info` | 实时数据 |

### 参数调整

根据用户输入调整参数：
- "查看 @elonmusk" → `userName: "elonmusk"`（去掉 @ 前缀）
- "查看用户 12345" → 使用 `user/details?userId=12345`
- "看最近 5 页推文" → `maxPages: 5`（最大 5）
- "只看资料不要推文" → 仅调用 `user/info`，跳过 `tweet/latest`
- "只看最新推文" → 仅调用 `tweet/latest`，跳过用户资料

## 可用端点

| 端点 | 方法 | 类型 | 用途 |
|------|------|------|------|
| `/openapi/v1/user/info` | GET | 实时 | 实时获取用户资料（最常用） |
| `/openapi/v1/user/details` | GET | DB 缓存 | 从缓存查询用户详情 |
| `/openapi/v1/tweet/latest` | GET | 实时 | 获取用户最新推文 |

完整请求/响应字段详情见 `references/api_reference.md`。

## 核心工作流

### 第一步：获取资料 + 最新推文

默认入口：

```bash
python3 scripts/examples/xgo_view_profile.py TARGET_USER --max-pages 3
```

需要附带 follow 状态时，再补一条：

```bash
python3 scripts/examples/xgo_following_status.py TARGET_USER
```

若只有 `userId`/`feedId` 而无 `userName`，再回退到 `references/api_reference.md` 中的 `user/details` 端点。

### 第二步：输出资料 + 动态报告

将用户资料和推文动态组合为完整的用户报告。

## 输出格式

```markdown
## @username 的用户资料

### 基本信息
- **显示名**: DisplayName
- **用户名**: @username
- **简介**: 用户 bio 完整内容...
- **位置**: San Francisco, CA
- **网站**: [example.com](https://example.com)
- **注册时间**: 2009-03-21

### 数据概览
- **粉丝**: 180.2M | **关注**: 782
- **推文数**: 45.3K | **点赞数**: 52.1K | **媒体数**: 8.2K

### 标签
AI, Tech, Space, Startup

---

### 最新推文 (近 N 条)

#### 1. 2026-02-28 14:30
- **影响力**: 85 | **互动**: 👍 446 🔁 134 💬 36 🔄 12 📑 28 👁 45K
- **内容**:
  推文完整文本内容...
- **链接**: [查看原文](https://x.com/username/status/id)
- **标签**: #tag1, #tag2
- **提及**: @user1, @user2
- **媒体**: 📷 2 张图片 / 🎬 1 个视频
- **引用推文**: [@quoted_user: 引用推文内容摘要...]

#### 2. 2026-02-28 12:15
...
```

### 资料字段映射

| 输出字段 | API 字段 | 说明 |
|---------|---------|------|
| 显示名 | `name` | 用户显示名称 |
| 用户名 | `userName` | @handle |
| 简介 | `description` | 完整简介文本 |
| 位置 | `location` | 用户设置的位置 |
| 网站 | `url` | 用户网站链接 |
| 注册时间 | `createdAt` | 账号创建日期 |
| 粉丝 | `followers` | 粉丝数（大数字用 K/M 格式化） |
| 关注 | `following` | 关注数 |
| 推文数 | `statusesCount` | 总推文数 |
| 点赞数 | `favouritesCount` | 总点赞数 |
| 媒体数 | `mediaCount` | 总媒体数 |
| 标签 | `tags` | 用户标签 |
| 头像 | `profileImageUrl` | 头像 URL |
| 封面 | `coverPicture` | 封面图片 URL |

### 推文字段映射

| 输出字段 | API 字段 | 说明 |
|---------|---------|------|
| 时间 | `createdAt` | 格式化为本地时间 |
| 影响力 | `influenceScore` | 影响力评分 |
| 👍 | `likeCount` | 点赞数 |
| 🔁 | `retweetCount` | 转推数 |
| 💬 | `replyCount` | 回复数 |
| 🔄 | `quoteCount` | 引用数 |
| 📑 | `bookmarkCount` | 收藏数 |
| 👁 | `viewCount` | 浏览数（大数字用 K/M 格式化） |
| 内容 | `text` | 完整推文文本 |
| 链接 | `url` | 推文原文链接 |
| 标签 | `hashTags[].text` | 以 # 前缀输出 |
| 提及 | `userMentions[].userName` | 以 @ 前缀输出 |
| 媒体 | `mediaList` | 统计图片/视频数量 |
| 引用推文 | `quotedTweet` | 摘要引用推文内容 |

### 输出完整性规则

- `description`: 完整输出，不得截断
- `tags`: 输出全部标签
- `profileBio`: 若 `profileBio.descriptionUrls` 包含 URL 实体，在简介文本中内联展示。示例：`"查看 [example.com](https://example.com)"`
- 大数字：用 K（千）/ M（百万）格式化以提高可读性
- `**互动**` 行始终保留；其中单个指标为 null 或 0 时省略该指标
- 资料字段为 null/空时省略该行
- 推文 `text`: 完整输出，不得截断
- `hashTags`、`userMentions`、`mediaList`、`quotedTweet` 为空/null 时省略该行

## 错误处理

通用错误码见 `../../references/shared/error-handling-xgo.md`。本 skill 额外关注：

- `xgo-0001`（用户不存在，HTTP 200）: 用户名可能不正确或账号已被封禁
- 推文列表为空：用户可能没有公开推文或账号已设为私密
