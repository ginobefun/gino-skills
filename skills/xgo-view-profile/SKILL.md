---
name: xgo-view-profile
description: "通过 XGo (xgo.ing) 开放接口查看 Twitter/X 用户资料及近期动态。适用场景：(1) 查看某用户的资料或简介，(2) 查看粉丝/关注数，(3) 实时获取用户信息，(4) 查看用户最新推文和动态，(5) 调研 KOL 或博主，(6) 通过 userId 或 feedId 查找用户。触发短语：'查看用户', '用户资料', 'user profile', 'who is @xxx', '看看这个人', 'KOL 信息', '查一下 xxx', 'profile of', '用户详情', '这个博主', 'twitter user', '推特用户', 或任何与查看 Twitter 用户信息相关的表述。"
---

# 用户画像查看器 (Twitter User Profiler)

通过 XGo (xgo.ing) 开放接口查看 Twitter/X 用户资料及近期动态。支持 DB 缓存和实时查询两种方式。

完整 API 参数详情见 `references/api_reference.md`。

## 认证

所有请求需要 `X-API-KEY` 请求头。从环境变量 `XGO_API_KEY` 读取密钥：

```bash
-H "X-API-KEY: $XGO_API_KEY"
```

若 `XGO_API_KEY` 未设置，提示用户配置。

接口地址：`https://api.xgo.ing`

## 默认查看策略

用户要求查看某用户时，**并行执行**以下两个请求：

1. **实时资料**: 调用 `user/info` 获取最新用户数据
2. **最新推文**: 调用 `tweet/latest` 查看近期动态

```bash
# 1. 实时获取用户资料
curl -s "https://api.xgo.ing/openapi/v1/user/info?userName=elonmusk" \
  -H "X-API-KEY: $XGO_API_KEY"

# 2. 最新推文（3页 ≈ 60条）
curl -s "https://api.xgo.ing/openapi/v1/tweet/latest?userName=elonmusk&maxPages=3" \
  -H "X-API-KEY: $XGO_API_KEY"
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

### 第一步：并行获取资料 + 最新推文

同时执行两个请求：
- **资料**: 调用 `user/info?userName=xxx`（实时）。若只有 `userId` 或 `feedId` 而无 `userName`，改用 `user/details`。
- **最新推文**: 调用 `tweet/latest?userName=xxx&maxPages=3`（约 60 条）

若只有 `userId`/`feedId` 而无 `userName`: 先调用 `user/details` 获取 `userName`，再调用 `tweet/latest`。

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

**重要**: 始终先检查 `response.success` 再处理 `response.data`。部分错误返回 HTTP 200 但 `success: false`（如 `xgo-0001` 用户不存在）— 不要仅依赖 HTTP 状态码。

- `401`: 检查 `XGO_API_KEY` 是否已设置且有效
- `403`: 开放接口需要 Plus 或 Pro 会员
- `429`: 频率限制 — 等待 10 秒后重试一次。若仍为 429，告知用户："频率限制，请稍后重试。"（PLUS 200 次/分，PRO 600 次/分）
- `success: false` 且 `code` 非零：读取响应体中的 `code` 和 `message`，对照 api_reference 中的错误码处理
- `xgo-0001`（用户不存在，HTTP 200）: 用户名可能不正确或账号已被封禁。务必检查 `success` 字段 — 不要认为 HTTP 200 就是成功。
- 推文列表为空：用户可能没有公开推文或账号已设为私密
