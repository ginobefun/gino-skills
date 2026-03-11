---
name: bestblogs-content-reviewer
description: "BestBlogs 内容评分 Review 工作流。适用场景: (1) 每日内容 review, (2) 审核待评审文章, (3) 审核待评审推特, (4) 评估 AI 评分准确性, (5) 纠正内容评分, (6) 推荐重点阅读内容, (7) 内容质量审核, (8) 早晚 review, (9) 推荐今日阅读清单, (10) 从待审内容中筛选值得阅读的。触发短语: 'review 内容', '内容审核', '评分 review', 'content review', '审核文章', '审核推特', '每日 review', 'daily review', '评分纠正', 'score review', '内容评审', '评分审核', 'review articles', 'review tweets', '开始 review', 'start review', '看看待审内容', '检查评分', '今天有什么要 review 的', '推荐阅读', '有什么值得读的', 'recommend reading', 'review并推荐阅读', '今日推荐'"
---

# BestBlogs 内容评分 Review (Content Score Reviewer)

每日早晚 review BestBlogs 系统中已评分但未 review 的文章和推特，评估 AI 评分是否准确，纠正偏差，并推荐值得深度阅读的内容，为 deep-reading 和 bestblogs-article-recommender 工作流提供输入。

完整 API 参数详情见 `references/api_reference.md`。

## 认证

所有请求使用 Admin API 认证:

| 变量 | 用途 |
|------|------|
| `BESTBLOGS_ADMIN_USER_ID` | 管理员用户 ID |
| `BESTBLOGS_ADMIN_JWT_TOKEN` | 管理员 JWT Token |

```bash
-H "Authorization: Bearer $BESTBLOGS_ADMIN_JWT_TOKEN"
-H "User-Id: $BESTBLOGS_ADMIN_USER_ID"
-H "Content-Type: application/json"
```

若环境变量未设置，提示用户配置。

接口地址: `https://api.bestblogs.dev`

## 可用端点

| 端点 | 方法 | 类型 | 用途 |
|------|------|------|------|
| `/api/admin/article/list` | POST | 读取 | 查询文章/推特列表（支持 qualifiedFilter 过滤） |
| `/api/admin/article/markNotQualified` | POST | 写入 | 标记为非精选并调整评分 — 写操作，必须在用户明确确认后才能调用 |

## 工作流概览

```
- [ ] 阶段零（可选）: 学习评分偏好 — 用户要求"学习偏好"或"分析评分规律"时执行
- [ ] 阶段一: 拉取待 review 内容（文章 + 推特并行）
- [ ] 阶段二: AI 评审与分类
- [ ] 阶段三: 输出 review 表格 ⚠️ 等待用户确认调整
- [ ] 阶段四: 批量执行标记 ⛔ BLOCKING — 写操作
```

默认从阶段一开始执行。阶段零仅在用户明确要求时执行。

---

## 阶段零（可选）: 学习评分偏好

用户要求"学习偏好"、"分析评分规律"、"看看精选标准"时执行。通过分析历史精选/非精选内容，建立评分偏好模型。

**并行发起两个请求**:

```bash
# 过去一个月的精选文章（学习"好内容"的特征）
curl -s -X POST https://api.bestblogs.dev/api/admin/article/list \
  -H "Authorization: Bearer $BESTBLOGS_ADMIN_JWT_TOKEN" \
  -H "User-Id: $BESTBLOGS_ADMIN_USER_ID" \
  -H "Content-Type: application/json" \
  -d '{"currentPage":1,"pageSize":100,"keyword":"","category":"","language":"","priority":"","sourceId":"","type":"ARTICLE","qualifiedFilter":"true","stickTopFilter":"ALL","timeFilter":"1m","startDate":"","endDate":"","mainDomainFilter":"ALL","aiSubCategoryFilter":"","flowStatusFilter":"","sort":null,"sortOrder":null,"userLanguage":"zh"}'

# 过去三天的非精选文章（学习"被淘汰"的特征）
curl -s -X POST https://api.bestblogs.dev/api/admin/article/list \
  -H "Authorization: Bearer $BESTBLOGS_ADMIN_JWT_TOKEN" \
  -H "User-Id: $BESTBLOGS_ADMIN_USER_ID" \
  -H "Content-Type: application/json" \
  -d '{"currentPage":1,"pageSize":100,"keyword":"","category":"","language":"","priority":"","sourceId":"","type":"ARTICLE","qualifiedFilter":"false","stickTopFilter":"ALL","timeFilter":"3d","startDate":"","endDate":"","mainDomainFilter":"ALL","aiSubCategoryFilter":"","flowStatusFilter":"","sort":null,"sortOrder":null,"userLanguage":"zh"}'
```

**分析维度**:
- 精选内容的分数分布（最低分、平均分、中位数）
- 精选 vs 非精选的分数分界线
- 各领域（AI、编程、商业、产品）的精选比例
- 来源质量分布（哪些源的内容更容易被精选）
- 内容类型和深度偏好（字数、阅读时间分布）

**输出偏好摘要**给用户确认，例如:
```
📊 评分偏好分析:
- 精选文章分数范围: 85-98，中位数 90
- 非精选文章分数范围: 65-88，中位数 78
- AI 领域精选率较高，商业资讯精选率较低
- 偏好深度技术文章（>2000 字），短资讯类倾向非精选
```

---

## 阶段一: 拉取待 review 内容

**并行发起两个请求**（`qualifiedFilter: "unknown"` = 待 review）:

```bash
# 待 review 文章
curl -s -X POST https://api.bestblogs.dev/api/admin/article/list \
  -H "Authorization: Bearer $BESTBLOGS_ADMIN_JWT_TOKEN" \
  -H "User-Id: $BESTBLOGS_ADMIN_USER_ID" \
  -H "Content-Type: application/json" \
  -d '{"currentPage":1,"pageSize":200,"keyword":"","category":"","language":"","priority":"","sourceId":"","type":"ARTICLE","qualifiedFilter":"unknown","stickTopFilter":"ALL","timeFilter":"1w","startDate":"","endDate":"","mainDomainFilter":"","aiSubCategoryFilter":"","flowStatusFilter":"","sort":null,"sortOrder":null,"userLanguage":"zh"}'

# 待 review 推特
curl -s -X POST https://api.bestblogs.dev/api/admin/article/list \
  -H "Authorization: Bearer $BESTBLOGS_ADMIN_JWT_TOKEN" \
  -H "User-Id: $BESTBLOGS_ADMIN_USER_ID" \
  -H "Content-Type: application/json" \
  -d '{"currentPage":1,"pageSize":200,"keyword":"","category":"","language":"","priority":"","sourceId":"","type":"TWITTER","qualifiedFilter":"unknown","stickTopFilter":"ALL","timeFilter":"1w","startDate":"","endDate":"","mainDomainFilter":"","aiSubCategoryFilter":"","flowStatusFilter":"","sort":null,"sortOrder":null,"userLanguage":"zh"}'
```

**数据预处理**:
- 过滤掉 `processFlowStatus == "CANCELLED"` 的内容（已取消，跳过并计数）
- 按 `totalScore` 从高到低排序
- 统计: 总数、已过滤数、分数分布、领域分布
- 每次最多 review 200 条（取 `totalScore` 最高的前 200 条），超出部分下次 review

---

## 阶段二: AI 评审与分类

**读取用户画像**（按需）: 从 `/Users/gino/Documents/Github/gino-bot/USER.md` 获取用户关注领域和偏好，辅助判断"推荐阅读"的相关性。

基于内容元数据对每条内容进行评审分类。

### 评审维度

1. **内容质量**: 标题是否清晰、`description` 是否有实质内容、`wordCount` 是否足够
2. **分数合理性**: 当前 `totalScore` 是否与内容质量匹配
3. **领域价值**: 在其所属 `mainDomain` 中的价值（AI/编程/商业/产品）
4. **来源可信度**: `sourceName` 的历史质量
5. **时效性**: `publishDate` 与当前时间的关系
6. **深度指标**: `wordCount`、`readTime` 是否体现足够深度

### 分类标准

| 分类 | 含义 | 后续动作 |
|------|------|----------|
| 🌟 推荐阅读 | 高质量，值得深度阅读 | 不标记，进入 deep-reading 工作流 |
| ✅ 评分合理 | 分数准确，标记为非精选 | `markNotQualified` + `adjustScore=0` |
| ⬆️ 评分偏低 | 内容好于分数，建议上调 | `markNotQualified` + `adjustScore=正数` |
| ⬇️ 评分偏高 | 内容差于分数，建议下调 | `markNotQualified` + `adjustScore=负数` |

**分类指导原则**:
- 🌟 推荐阅读: 分数 ≥ 80 的内容都应纳入候选池，从中筛选 20-30 条值得阅读的内容。筛选维度: 内容深度、与用户关注领域的相关性、来源可信度、时效性、独特视角。文章推荐 15-20 篇，推特推荐 5-10 条
- ⬆️ 评分偏低: 优质来源的深度文章被低估，或热门话题的独特视角
- ⬇️ 评分偏高: 标题党、水文、纯资讯聚合、低深度营销内容
- ✅ 评分合理: 大多数内容应属于此类，分数与质量基本匹配

**评分调整幅度参考**:
- 微调: ±1~2（小偏差）
- 中等调整: ±3~5（明显偏差）
- 大幅调整: ±6~10（严重偏差，罕见）

---

## 阶段三: 输出 review 表格

分别输出文章和推特的 review 结果，按分类分组展示。

### 输出格式

```markdown
## 📋 文章 Review（共 X 篇，跳过 Y 篇已取消）

### 🌟 推荐阅读（N 篇）

| # | 标题 | 来源 | 评分 | 建议调整 | 理由 |
|---|------|------|------|----------|------|
| 1 | [标题](https://admin.bestblogs.dev/article/review/RAW_xxx) | 来源名 | 89 | +3 | 深度好文，值得精读 |

### ⬇️ 评分偏高（N 篇）

| # | 标题 | 来源 | 评分 | 建议调整 | 理由 |
|---|------|------|------|----------|------|
| 1 | [标题](https://admin.bestblogs.dev/article/review/RAW_xxx) | 来源名 | 85 | -5 | 标题党，实际内容空洞 |

### ⬆️ 评分偏低（N 篇）

| # | 标题 | 来源 | 评分 | 建议调整 | 理由 |
|---|------|------|------|----------|------|

### ✅ 评分合理（N 篇）

| # | 标题 | 来源 | 评分 | 建议调整 | 理由 |
|---|------|------|------|----------|------|
```

推特部分使用相同结构，标题列额外显示 `@作者名`。

```markdown
## 📋 推特 Review（共 X 条，跳过 Y 条已取消）

（同上表格结构，标题格式: [@作者](https://admin.bestblogs.dev/article/review/RAW_xxx): 标题）
```

```markdown
## 📚 推荐阅读清单（共 N 篇文章 + M 条推特）

以下内容建议进入 deep-reading 工作流，按推荐优先级排序:

### 🔥 必读（N 篇）— 强烈推荐深度阅读

| # | 标题 | 来源 | 评分 | 领域 | 字数/时长 | 推荐理由 |
|---|------|------|------|------|-----------|----------|
| 1 | [标题](原文URL) | 来源名 | 92 | AI | 5.2K 字 ~15min | 深度技术分析，提出独特框架... |
| 2 | [标题](原文URL) | 来源名 | 89 | 编程 | 3.8K 字 ~10min | 实战经验总结，可直接应用... |

### ⭐ 推荐（N 篇）— 值得阅读

| # | 标题 | 来源 | 评分 | 领域 | 字数/时长 | 推荐理由 |
|---|------|------|------|------|-----------|----------|
| 1 | [标题](原文URL) | 来源名 | 86 | 产品 | 2.1K 字 ~6min | 产品思维方法论，有借鉴价值... |

### 📌 可选（N 篇）— 时间充裕时阅读

| # | 标题 | 来源 | 评分 | 领域 | 字数/时长 | 推荐理由 |
|---|------|------|------|------|-----------|----------|

### 🐦 推荐推特（M 条）

| # | 作者 | 内容摘要 | 评分 | 互动 | 推荐理由 |
|---|------|----------|------|------|----------|
| 1 | [@作者](原文URL) | 推文内容前80字... | 94 | 💬120 🔁85 | 行业洞察，引发深度讨论 |
```

**推荐阅读分层标准**:
- 🔥 必读（3-5 篇）: 评分 ≥ 88 且与用户核心关注领域（AI/编程）高度相关的深度内容
- ⭐ 推荐（8-12 篇）: 评分 ≥ 83 的优质内容，或评分稍低但视角独特的内容
- 📌 可选（5-8 篇）: 评分 ≥ 80 的有价值内容，非核心领域但有启发
- 🐦 推特（5-10 条）: 评分 ≥ 85 的高质量推特，优先选择有深度讨论的

**推荐理由要求**: 每条理由 15-30 字，说明**为什么值得读**（独特视角/实用技巧/行业趋势/认知升级），不要泛泛而谈。

### 输出完整性规则

- `authors` 为 null/空时省略来源中的作者信息
- `description` 为 null/空时，理由中仅基于标题和元数据判断
- `tags` 为 null/空时不展示标签
- 大数字用 K/M 格式化（如 `12.9K 字`）
- 所有标题完整输出，不截断

### 📊 评分统计概览

Review 表格和推荐阅读清单之间，输出评分统计:

```markdown
## 📊 评分统计

| 指标 | 文章 | 推特 |
|------|------|------|
| 待 review 总数 | X | Y |
| 已过滤（取消） | X | Y |
| 分数范围 | 65-98 | 70-96 |
| 平均分 | 82.3 | 79.5 |
| ≥90 分 | X 篇 | Y 条 |
| 80-89 分 | X 篇 | Y 条 |
| <80 分 | X 篇 | Y 条 |

**领域分布**: AI X篇 | 编程 X篇 | 商业 X篇 | 产品 X篇 | 其他 X篇
**评分偏差发现**: ⬇️偏高 X篇（占比 X%） | ⬆️偏低 X篇（占比 X%）
```

⚠️ 输出后等待用户确认。用户可能会:
- 调整某些内容的分类（如把"评分合理"改为"推荐阅读"）
- 修改建议的调整分数
- 确认执行或取消

---

## 阶段四: 批量执行标记

⛔ **写操作 — 必须在用户明确确认后才能调用**

用户确认后，对所有非"推荐阅读"的内容调用 `markNotQualified` 接口:

```bash
# 标记为非精选并调整分数（adjustScore 为相对值）
curl -s -X POST "https://api.bestblogs.dev/api/admin/article/markNotQualified?id=RAW_xxx&adjustScore=-3" \
  -H "Authorization: Bearer $BESTBLOGS_ADMIN_JWT_TOKEN" \
  -H "User-Id: $BESTBLOGS_ADMIN_USER_ID" \
  -H "Content-Type: application/json"
```

接口返回 `data` 字段为调整后的新分数（int）。

**执行规则**:
- 每批最多 5 个请求，并行执行
- 逐批输出进度: `✅ [1/30] RAW_xxx — 标题 — adjustScore: -3 → 新分数: 82`
- 单个失败记录 ❌ 并继续，不中断整批
- 连续 3 次失败暂停，提示用户可能是系统性问题（Token 过期等）
- `adjustScore` 为 0 时也要调用（仅标记为已 review，不调整分数）

**推荐阅读项目处理**:
- 不调用 `markNotQualified`，保持 `qualified: null` 状态
- 输出干净的阅读清单，作为 deep-reading 工作流的输入
- 用户后续通过 deep-reading 阅读后，再通过 bestblogs-article-recommender 标记为精选

**执行完成后输出汇总**:
```
📊 Review 完成:
- 文章: 已标记 X 篇（⬇️ N 篇, ⬆️ N 篇, ✅ N 篇），🌟 推荐阅读 N 篇待处理
- 推特: 已标记 X 条（⬇️ N 条, ⬆️ N 条, ✅ N 条），🌟 推荐阅读 N 条待处理
- 失败: N 个（列出失败项）
```

## 错误处理

**重要**: 始终先检查 `response.success` 再处理 `response.data`。部分错误返回 HTTP 200 但 `success: false` — 不要仅依赖 HTTP 状态码。

| HTTP 状态 | 说明 | 处理 |
|-----------|------|------|
| 401/403 | Token 无效或过期 | 提示检查 `BESTBLOGS_ADMIN_JWT_TOKEN` 和 `BESTBLOGS_ADMIN_USER_ID` |
| 400 | 参数错误 | 检查请求参数格式 |
| 500 | 服务端错误 | 重试一次，仍失败告知用户 |
| 200 + `success: false` | 业务逻辑错误 | 展示 `message` 字段内容 |
