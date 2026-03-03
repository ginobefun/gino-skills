---
name: xgo-track-kol
description: "通过 XGo (xgo.ing) 开放接口深度分析 Twitter/X KOL。适用场景: (1) 分析某 KOL 的活跃度和影响力, (2) 查看 KOL 的内容分布和互动趋势, (3) 对比两个 KOL 的数据差异, (4) 发现 KOL 的高光推文, (5) 评估是否值得关注某博主。触发短语: '分析KOL', '追踪KOL', 'track KOL', 'KOL分析', 'KOL对比', 'compare KOL', '博主分析', '分析博主', 'analyze user', '用户深度分析', '对比用户', 'compare users', '这个人怎么样', '值得关注吗', 'worth following', 或任何与 KOL 追踪、用户深度分析、用户对比相关的表述。"
---

# KOL 追踪器 (KOL Tracker)

通过 XGo (xgo.ing) 开放接口深度分析 Twitter/X KOL — 画像、内容分布、互动趋势、影响力评估。支持单用户分析和双用户对比模式。

完整 API 参数详情见 `references/api_reference.md`。

## 认证

所有请求需要 `X-API-KEY` 请求头。从环境变量 `XGO_API_KEY` 读取密钥:

```bash
-H "X-API-KEY: $XGO_API_KEY"
```

若 `XGO_API_KEY` 未设置，提示用户配置。

接口地址: `https://api.xgo.ing`

## 工作流概览

### 单用户分析模式

4 个并行请求 → AI 分析 6 个维度 → 输出报告

### 双用户对比模式

每用户 4 个并行请求（共 8 个） → AI 分析 → 对比报告

## 第一步: 并行拉取数据

对每个目标用户，**并行执行** 4 个请求:

```bash
# 1. 用户画像
curl -s "https://api.xgo.ing/openapi/v1/user/info?userName=TARGET_USER" \
  -H "X-API-KEY: $XGO_API_KEY"

# 2. 近期推文（最新 50 条，全部类型）
curl -s -X POST https://api.xgo.ing/openapi/v1/tweet/list \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: $XGO_API_KEY" \
  -d '{"queryType":"user","userName":"TARGET_USER","sortType":"recent","tweetType":"ALL","currentPage":1,"pageSize":50}'

# 3. 高影响力推文（按影响力排序，全部类型，50 条）
curl -s -X POST https://api.xgo.ing/openapi/v1/tweet/list \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: $XGO_API_KEY" \
  -d '{"queryType":"user","userName":"TARGET_USER","sortType":"influence","tweetType":"ALL","currentPage":1,"pageSize":50}'

# 4. 关注状态
curl -s "https://api.xgo.ing/openapi/v1/following/status?targetUserName=TARGET_USER" \
  -H "X-API-KEY: $XGO_API_KEY"
```

**双用户对比模式**: 对第二个用户执行同样的 4 个请求（共 8 个请求并行）。

**速率说明**: 单用户 4 请求，双用户 8 请求，远低于 PLUS 200次/分限制。

## 第二步: AI 分析（6 个维度）

基于拉取的数据，对每个用户进行以下 6 个维度的分析:

### 维度 1: 活跃度

- 近期推文的时间分布（日均发推频率）
- 最近一条推文的时间（活跃/沉寂判断）
- 发推时间段偏好（如果能看出规律）

### 维度 2: 内容分布

从近期推文中统计:
- **原创推文**: `isReply == false` 且 `retweetedTweet == null` 且 `quotedTweet == null`
- **转推**: `retweetedTweet != null`
- **回复**: `isReply == true`
- **引用推文**: `quotedTweet != null` 且 `retweetedTweet == null`
- 输出各类型的数量和占比

### 维度 3: 互动指标

从近期推文中计算:
- 各互动指标（likeCount, retweetCount, replyCount, viewCount）的**均值**和**中位数**
- influenceScore 的均值和中位数
- 互动趋势判断（近期 vs 早期对比，若推文跨度足够长）

### 维度 4: 话题分析

- 从 `hashTags` 提取高频标签（Top 5）
- 从推文内容中提取主要话题/关键词
- 主要讨论领域总结

### 维度 5: 影响力评估

- influenceScore 分布（最高、最低、中位数）
- 影响力稳定性（标准差或离散程度描述）
- 影响力趋势（近期推文 vs 历史推文的 influenceScore 对比）

### 维度 6: 高光推文 Top 5

从高影响力推文结果中，取 influenceScore 最高的 5 条，输出:
- 推文内容（完整文本）
- 互动数据
- 发布时间
- 原文链接

## 第三步: 输出报告

### 单用户报告格式

```markdown
## KOL 分析报告: @username

### 用户画像
- **显示名**: DisplayName
- **简介**: 完整 bio...
- **位置**: Location
- **网站**: [example.com](https://example.com)
- **粉丝**: 180.2M | **关注**: 782
- **推文数**: 45.3K | **注册时间**: 2009-03-21
- **关注状态**: ✅ 已关注 / ❌ 未关注
- **标签**: AI, Tech, Startup

---

### 1. 活跃度
- **日均发推**: ~X 条/天（基于近 50 条推文时间跨度）
- **最近发推**: YYYY-MM-DD HH:MM
- **活跃时段**: 主要在 XX:00-XX:00 发推

### 2. 内容分布
| 类型 | 数量 | 占比 |
|------|------|------|
| 原创 | 25 | 50% |
| 转推 | 10 | 20% |
| 回复 | 10 | 20% |
| 引用 | 5 | 10% |

### 3. 互动指标
| 指标 | 均值 | 中位数 |
|------|------|--------|
| 👍 点赞 | 1.2K | 800 |
| 🔁 转推 | 350 | 200 |
| 💬 回复 | 120 | 80 |
| 👁 浏览 | 45K | 30K |
| 📊 影响力 | 75 | 68 |

**趋势**: 近期互动量呈上升/下降/稳定趋势...

### 4. 话题分析
- **高频标签**: #AI, #LLM, #Startup, #OpenSource, #Tech
- **主要话题**: 人工智能应用、创业经验分享、开源项目推荐...
- **讨论领域**: AI/ML, 创业, 技术

### 5. 影响力评估
- **influenceScore 范围**: 12 - 342
- **均值/中位数**: 75 / 68
- **稳定性**: 较稳定（离散程度低/中/高）
- **趋势**: 近期影响力呈上升趋势

### 6. 高光推文 Top 5

#### Top 1 (影响力: 342)
- **时间**: 2026-02-28 14:30
- **互动**: 👍 4.5K 🔁 1.3K 💬 360 👁 450K
- **内容**:
  推文完整文本...
- **链接**: [查看原文](https://x.com/username/status/id)

#### Top 2 (影响力: 285)
...
```

### 双用户对比报告格式

```markdown
## KOL 对比报告: @userA vs @userB

### 画像对比
| 维度 | @userA | @userB |
|------|--------|--------|
| 粉丝 | 180.2M | 2.5M |
| 关注 | 782 | 1.2K |
| 推文数 | 45.3K | 12.8K |
| 注册时间 | 2009-03-21 | 2015-06-15 |
| 关注状态 | ✅ 已关注 | ❌ 未关注 |

---

### 1. 活跃度对比
| 指标 | @userA | @userB |
|------|--------|--------|
| 日均发推 | ~5 条 | ~2 条 |
| 最近发推 | 2h 前 | 1d 前 |

### 2. 内容分布对比
| 类型 | @userA | @userB |
|------|--------|--------|
| 原创 | 50% | 70% |
| 转推 | 20% | 10% |
| 回复 | 20% | 15% |
| 引用 | 10% | 5% |

### 3. 互动指标对比
| 指标 | @userA 均值 | @userB 均值 |
|------|------------|------------|
| 👍 点赞 | 1.2K | 500 |
| 🔁 转推 | 350 | 150 |
| 💬 回复 | 120 | 60 |
| 👁 浏览 | 45K | 15K |
| 📊 影响力 | 75 | 45 |

### 4. 话题对比
| 维度 | @userA | @userB |
|------|--------|--------|
| 高频标签 | #AI, #LLM | #Web3, #DeFi |
| 主要领域 | AI/ML | Web3/Crypto |

### 5. 影响力对比
| 指标 | @userA | @userB |
|------|--------|--------|
| 影响力范围 | 12-342 | 5-180 |
| 均值/中位数 | 75/68 | 45/38 |
| 稳定性 | 较稳定 | 波动大 |

### 6. 各自高光推文 Top 3

**@userA 高光推文:**
...

**@userB 高光推文:**
...

---

### AI 综合评价

对两位 KOL 在各维度的对比总结、各自优势、适合关注的场景建议...
```

## 参数调整

根据用户输入选择模式:
- "分析 @elonmusk" → 单用户模式，`userName: "elonmusk"`
- "对比 @userA 和 @userB" → 双用户对比模式
- "这个博主值得关注吗 @xxx" → 单用户模式，重点关注影响力评估

## 输出完整性规则

- `description`（bio）: 完整输出，不得截断
- 高光推文 `text`: 完整输出，不得截断
- 大数字: 用 K（千）/ M（百万）格式化
- 百分比保留整数
- 资料字段为 null/空时省略该行
- `hashTags`、`userMentions`、`mediaList`、`quotedTweet` 为空/null 时省略
- 单用户模式: 高光 Top 5；双用户对比模式: 各自 Top 3

## 错误处理

**重要**: 始终先检查 `response.success` 再处理 `response.data`。部分错误返回 HTTP 200 但 `success: false` — 不要仅依赖 HTTP 状态码。

- `401`: 检查 `XGO_API_KEY` 是否已设置且有效
- `403`: 开放接口需要 Plus 或 Pro 会员
- `429`: 频率限制 — 等待 10 秒后重试一次。若仍为 429，告知用户: "频率限制，请稍后重试。"（PLUS 200次/分, PRO 600次/分）
- `xgo-0001`（用户不存在, HTTP 200）: 用户名可能不正确或账号已被封禁。务必检查 `success` 字段
- `xgo-0012`（需要会员, HTTP 200）: 部分功能需要更高等级会员。注意: 此错误以 HTTP 200 返回
- `success: false` 且 `code` 非零: 读取响应体中的 `code` 和 `message`，对照 api_reference 中的错误码处理
- 推文数据为空: 用户可能没有公开推文或账号已设为私密。仍基于 user/info 数据输出可用的画像信息
