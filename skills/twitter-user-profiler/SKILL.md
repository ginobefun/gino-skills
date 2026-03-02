---
name: twitter-user-profiler
description: "Look up Twitter/X user profiles and their recent activity via XGo (xgo.ing) OpenAPI. Use when user wants to: (1) look up a Twitter user's profile or bio, (2) check someone's follower/following count, (3) get real-time user info from Twitter, (4) see a user's latest tweets and activity, (5) research a KOL or influencer, (6) find user details by userId or feedId. Triggered by phrases like '查看用户', '用户资料', 'user profile', 'who is @xxx', '看看这个人', 'KOL信息', '查一下xxx', 'profile of', '用户详情', '这个博主', 'twitter user', '推特用户', or any mention of looking up Twitter user information."
---

# Twitter User Profiler

Look up Twitter/X user profiles and their recent activity via XGo (xgo.ing) OpenAPI. Supports both DB-cached and real-time queries.

For full API parameter details, read `references/api_reference.md`.

## Auth

All requests require header `X-API-KEY`. Read the key from environment variable `XGO_API_KEY`:

```bash
-H "X-API-KEY: $XGO_API_KEY"
```

If `XGO_API_KEY` is not set, prompt the user to configure it.

API Base URL: `https://api.xgo.ing`

## Default Profiling Strategy

When user asks to look up a user, run **both requests in parallel**:

1. **Real-time info**: Call `user/info` to get fresh profile data
2. **Latest tweets**: Call `tweet/latest` to see recent activity

```bash
# 1. Real-time user info
curl -s "https://api.xgo.ing/openapi/v1/user/info?userName=elonmusk" \
  -H "X-API-KEY: $XGO_API_KEY"

# 2. Latest tweets (3 pages ≈ 60 tweets)
curl -s "https://api.xgo.ing/openapi/v1/tweet/latest?userName=elonmusk&maxPages=3" \
  -H "X-API-KEY: $XGO_API_KEY"
```

### When to Use Which Endpoint

| Scenario | Endpoint | Reason |
|----------|----------|--------|
| 用户名查询（常用） | `user/info` | 实时从 Twitter 拉取最新数据 |
| 有 userId 或 feedId | `user/details` | 从 DB 缓存快速查询 |
| 只需基本信息 | `user/details` | 更快，不消耗 Twitter API 配额 |
| 需要最新粉丝数等 | `user/info` | 实时数据 |

### Adjusting Parameters

Adjust based on user input:
- "查看 @elonmusk" → `userName: "elonmusk"` (remove @ prefix)
- "查看用户 12345" → use `user/details?userId=12345`
- "看最近 5 页推文" → `maxPages: 5` (max 5)
- "只看资料不要推文" → only call `user/info`, skip `tweet/latest`
- "只看最新推文" → only call `tweet/latest`, skip user info

## Available Endpoints

| Endpoint | Method | Type | Use Case |
|----------|--------|------|----------|
| `/openapi/v1/user/info` | GET | Real-time | 实时获取用户资料（最常用） |
| `/openapi/v1/user/details` | GET | DB | 从缓存查询用户详情 |
| `/openapi/v1/tweet/latest` | GET | Real-time | 获取用户最新推文 |

For complete request/response field details, see `references/api_reference.md`.

## Core Workflow

### Step 1: Fetch Profile + Latest Tweets (in parallel)

Run both requests simultaneously:
- **Profile**: Call `user/info?userName=xxx` (real-time). If only `userId` or `feedId` is available and no `userName`, call `user/details` instead.
- **Latest tweets**: Call `tweet/latest?userName=xxx&maxPages=3` (~60 tweets)

If only `userId`/`feedId` is available without `userName`: call `user/details` first to obtain `userName`, then call `tweet/latest` with it.

### Step 2: Output Profile + Activity

Combine profile data with tweet activity into a comprehensive user report.

## Output Format

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
- **互动**: 👍 446 🔁 134 💬 36 📑 28 👁 45K
- **内容**:
  推文完整文本内容...
- **链接**: [查看原文](https://x.com/username/status/id)

#### 2. 2026-02-28 12:15
...
```

### Profile Field Mapping

| 输出字段 | API 字段 | 说明 |
|---------|---------|------|
| 显示名 | `name` | 用户显示名称 |
| 用户名 | `userName` | @handle |
| 简介 | `description` | 完整 bio 文本 |
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

### Tweet Field Mapping

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

### Output Completeness Rules

- `description`: Output in full, never truncate
- `tags`: Output ALL tags
- `profileBio`: If `profileBio.descriptionUrls` contains URL entities, resolve and display them inline in the bio text. Example: `"Check out [example.com](https://example.com)"`
- Large numbers: Format as K (thousands) / M (millions) for readability
- The `**互动**` line is always included; individual emoji-metric pairs are omitted only if their value is null or zero
- If a profile field is null/empty, omit that line
- Tweet `text`: Output in full, never truncate
- If `hashTags`, `userMentions`, `mediaList`, or `quotedTweet` is empty/null, omit that line

## Error Handling

**Important**: Always check `response.success` before processing `response.data`. Some errors return HTTP 200 with `success: false` (e.g., `xgo-0001` user not found) — do not rely on HTTP status alone.

- `401`: Check if `XGO_API_KEY` is set and valid
- `403`: OpenAPI access requires Plus or Pro membership
- `429`: Rate limit exceeded — wait 10 seconds, retry once. If still 429, report to user: "频率限制，请稍后重试。" (PLUS 200 req/min, PRO 600 req/min)
- `success: false` with non-zero `code`: Read `code` and `message` from response body, match against error codes in api_reference
- `xgo-0001` (User not found, HTTP 200): The username may be incorrect or the account may be suspended. Check `success` field — do not assume HTTP 200 means success.
- Empty tweet list: User may have no public tweets or account is protected
