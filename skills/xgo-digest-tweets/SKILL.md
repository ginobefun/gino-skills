---
name: xgo-digest-tweets
description: "通过 XGo (xgo.ing) 开放接口生成每日推文简报。适用场景: (1) 查看今日推文精华摘要, (2) 按列表分类浏览推文, (3) 获取关注者和推荐的每日精选, (4) 快速了解今天 Twitter 上发生了什么。触发短语: '每日简报', '推文简报', 'daily digest', 'tweet digest', '今日摘要', '今天推文总结', 'twitter summary', '推文精选', '每日精选', 'daily briefing', '推特日报', '今天的推特', '推文汇总', 'tweet roundup', 或任何与每日推文简报、推文摘要、推文精选相关的表述。"
---

# 每日推文简报 (Daily Tweet Digest)

通过 XGo (xgo.ing) 开放接口生成每日推文简报 — 按列表分类，去重排序，AI 摘要，一览今日精华。

完整 API 参数详情见 `references/api_reference.md`。

## 认证

所有请求需要 `X-API-KEY` 请求头。从环境变量 `XGO_API_KEY` 读取密钥:

```bash
-H "X-API-KEY: $XGO_API_KEY"
```

若 `XGO_API_KEY` 未设置，提示用户配置。

接口地址: `https://api.xgo.ing`

## 工作流概览

5 个并行请求 → 构建 author→list 映射 → 按 id 去重 → 分类到列表 → 每分类取 Top N → AI 生成摘要 → 输出简报

**速率说明**: 5 请求/次，远低于 PLUS 200次/分限制。

## 第一步: 并行拉取数据（5 个请求）

```bash
# 1. 获取所有列表（含成员信息，用于构建映射）
curl -s "https://api.xgo.ing/openapi/v1/list/all" \
  -H "X-API-KEY: $XGO_API_KEY"

# 2. 关注者推文 - 第1页（按影响力排序，排除纯转推，近24小时）
curl -s -X POST https://api.xgo.ing/openapi/v1/tweet/list \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: $XGO_API_KEY" \
  -d '{"queryType":"following","timeRange":"LAST_24H","sortType":"influence","tweetType":"NO_RETWEET","currentPage":1,"pageSize":50}'

# 3. 关注者推文 - 第2页
curl -s -X POST https://api.xgo.ing/openapi/v1/tweet/list \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: $XGO_API_KEY" \
  -d '{"queryType":"following","timeRange":"LAST_24H","sortType":"influence","tweetType":"NO_RETWEET","currentPage":2,"pageSize":50}'

# 4. 推荐推文 - 第1页
curl -s -X POST https://api.xgo.ing/openapi/v1/tweet/list \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: $XGO_API_KEY" \
  -d '{"queryType":"recommendation","timeRange":"LAST_24H","sortType":"influence","tweetType":"NO_RETWEET","currentPage":1,"pageSize":50}'

# 5. 推荐推文 - 第2页
curl -s -X POST https://api.xgo.ing/openapi/v1/tweet/list \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: $XGO_API_KEY" \
  -d '{"queryType":"recommendation","timeRange":"LAST_24H","sortType":"influence","tweetType":"NO_RETWEET","currentPage":2,"pageSize":50}'
```

**并行执行所有 5 个请求。** 必须显式传递 `sortType: "influence"` — 服务端默认值为 `recent`。

## 第二步: 构建 author→list 映射

从 `list/all` 响应中构建映射表:

```
对每个 UserListDTO:
  对每个 member (UserBrief):
    mapping[member.userName] = listName
```

**注意**: 一个用户可能属于多个列表。若属于多个列表，取第一个匹配的列表名（按列表 order 排序）。

## 第三步: 去重与分类

### 去重

合并所有推文（请求 2-5 的结果），按推文 `id` 去重。同一推文出现在多个查询中时仅保留一条。

### 分类规则

对每条推文，根据 `author.userName` 查映射表:

1. **在映射表中找到** → 归入对应列表分类（如 "AI"、"Programming"、"中文极客"）
2. **不在映射表中，来自 `following` 查询** → 归入 **"其他"** 分类
3. **不在映射表中，来自 `recommendation` 查询** → 归入 **"其他 (推荐)"** 分类

为实现第 2/3 条规则，需在合并时记录每条推文的来源（`following` 或 `recommendation`）。若同一推文同时出现在两个来源中，优先标记为 `following`。

### 排序与截取

每个分类内:
- 按 `influenceScore` 降序排列
- 默认取 **Top 5**（可根据用户要求调整数量）

## 第四步: AI 生成摘要

对每个分类中的 Top N 推文:
- 生成 **1-2 句话**的分类摘要，概括该分类中的热点话题和关键信息
- 摘要应捕捉核心内容，不要罗列每条推文

## 第五步: 输出简报

### 输出格式

```markdown
## 每日推文简报 (YYYY-MM-DD, 共 N 条)

来源: 关注者推文 X 条 + 推荐推文 Y 条，去重后 Z 条，分为 M 个分类。

---

### AI (12 条中取 Top 5)

> **摘要**: 今日 AI 领域热议 Claude 4 发布和 GPT-5 传闻，多位研究者讨论了多模态模型的新突破。

#### 1. @username - DisplayName
- **影响力**: 85 | **互动**: 👍 446 🔁 134 💬 36 🔄 12 📑 8 👁 45K
- **内容**:
  推文完整文本...
- **链接**: [查看原文](https://x.com/username/status/id)

#### 2. @username - DisplayName
...

---

### Programming (8 条中取 Top 5)

> **摘要**: Rust 1.80 发布引发讨论，多个开源项目发布重大更新。

#### 1. @username - DisplayName
...

---

### 中文极客 (6 条中取 Top 5)

> **摘要**: ...

---

### 其他 (15 条中取 Top 5)

> **摘要**: ...

---

### 其他 (推荐) (10 条中取 Top 5)

> **摘要**: ...
```

### 输出字段映射

| 输出字段 | API 字段 | 说明 |
|---------|---------|------|
| @username | `author.userName` | 用户名 |
| DisplayName | `author.name` | 显示名称 |
| 影响力 | `influenceScore` | 影响力评分 |
| 👍 | `likeCount` | 点赞数 |
| 🔁 | `retweetCount` | 转推数 |
| 💬 | `replyCount` | 回复数 |
| 🔄 | `quoteCount` | 引用数 |
| 📑 | `bookmarkCount` | 收藏数 |
| 👁 | `viewCount` | 浏览数（大数字用 K/M 格式化） |
| 内容 | `text` | 完整推文文本 |
| 链接 | `url` | 推文原文链接 |

### 输出完整性规则

- `text`: 完整输出，不得截断
- `**互动**` 行始终保留；其中单个指标为 null 或 0 时省略该指标
- `hashTags`、`userMentions`、`mediaList`、`quotedTweet` 有值时追加输出，为空/null 时省略
- 大数字用 K/M 格式化
- 分类按推文总数降序排列（推文多的分类排在前面）
- 空分类（0 条推文）不输出

## 参数调整

根据用户输入调整:
- "今日简报" → 默认参数（LAST_24H）
- "本周简报" → `timeRange: "WEEK"`，所有推文请求改用 WEEK
- "每个分类多给些" / "Top 10" → 每分类取 Top 10
- "只看 AI 分类" → 仅输出 AI 分类的推文
- "包括转推" → `tweetType: "ALL"`

## 错误处理

**重要**: 始终先检查 `response.success` 再处理 `response.data`。部分错误返回 HTTP 200 但 `success: false` — 不要仅依赖 HTTP 状态码。

- `401`: 检查 `XGO_API_KEY` 是否已设置且有效
- `403`: 开放接口需要 Plus 或 Pro 会员
- `429`: 频率限制 — 等待 10 秒后重试一次。若仍为 429，告知用户: "频率限制，请稍后重试。"（PLUS 200次/分, PRO 600次/分）
- `success: false` 且 `code` 非零: 读取响应体中的 `code` 和 `message`，对照 api_reference 中的错误码处理
- `data` 为空或 `totalSize: 0`: 该时间范围内无推文，建议扩大 `timeRange`
- `list/all` 返回空列表: 用户没有创建列表，所有推文归入 "其他" / "其他 (推荐)" 两个分类
