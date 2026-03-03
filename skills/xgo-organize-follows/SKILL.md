---
name: xgo-organize-follows
description: "通过 XGo (xgo.ing) 开放接口整理和分类 Twitter/X 关注用户。适用场景: (1) 查看未分类的关注用户, (2) 自动分析用户并推荐列表归属, (3) 批量将用户分类到列表, (4) 整理关注列表，减少未分类用户。触发短语: '整理关注', '分类关注', 'organize follows', '关注分类', '未分类用户', 'uncategorized', '整理我的关注', '自动分类', 'auto categorize', '关注整理', '分类到列表', 'categorize follows', '清理关注', 或任何与关注用户整理、分类、批量归档相关的表述。"
---

# 关注整理助手 (Follow Organizer)

通过 XGo (xgo.ing) 开放接口整理 Twitter/X 关注用户 — 发现未分类用户、AI 分析推荐列表归属、批量执行分类。多阶段交互式工作流。

完整 API 参数详情见 `references/api_reference.md`。

## 认证

所有请求需要 `X-API-KEY` 请求头。从环境变量 `XGO_API_KEY` 读取密钥:

```bash
-H "X-API-KEY: $XGO_API_KEY"
```

若 `XGO_API_KEY` 未设置，提示用户配置。

接口地址: `https://api.xgo.ing`

## 工作流概览（6 个阶段）

```
阶段一（准备）→ 阶段二（获取未分类用户）→ 阶段三（深度分析）→ 阶段四（AI 匹配）→ 阶段五（确认）→ 阶段六（执行）
```

**重要**: 这是一个交互式多阶段工作流。阶段五需要等待用户确认后才能进入阶段六。阶段六包含**写操作**（addMember），执行前必须获得用户明确确认。

---

## 阶段一: 准备（2 个并行请求）

获取关注统计和列表信息，了解整体情况。

```bash
# 1. 关注统计
curl -s "https://api.xgo.ing/openapi/v1/following/stats" \
  -H "X-API-KEY: $XGO_API_KEY"

# 2. 获取所有列表（含成员）
curl -s "https://api.xgo.ing/openapi/v1/list/all" \
  -H "X-API-KEY: $XGO_API_KEY"
```

**并行执行。** 输出准备报告:

```markdown
## 关注整理 - 准备报告

- **总关注数**: 356
- **已分类**: 280 (78.7%)
- **未分类**: 76 (21.3%)
- **列表数**: 8

### 现有列表
| 列表名称 | 成员数 | 描述 |
|---------|--------|------|
| AI | 45 | AI 领域研究者 |
| Programming | 38 | 编程与开发 |
| 中文极客 | 32 | 中文科技博主 |
| ... | ... | ... |

准备分析未分类用户，是否继续？
```

等待用户确认后进入阶段二。

---

## 阶段二: 获取未分类用户

从 `following/list` 分页获取所有关注用户，客户端过滤出未分类用户。

```bash
# 分页获取关注列表（每次 100 人，遍历所有页）
curl -s "https://api.xgo.ing/openapi/v1/following/list?page=1&size=100" \
  -H "X-API-KEY: $XGO_API_KEY"

# 若 totalPage > 1，继续拉取后续页
curl -s "https://api.xgo.ing/openapi/v1/following/list?page=2&size=100" \
  -H "X-API-KEY: $XGO_API_KEY"
# ... 以此类推
```

### 客户端过滤逻辑

1. 从阶段一的 `list/all` 响应中，收集所有列表成员的 `userName` 到 `categorizedSet`
2. 遍历 `following/list` 返回的每个用户:
   - 若 `userName` 不在 `categorizedSet` 中 → 标记为未分类用户
3. 收集所有未分类用户列表

**速率说明**: 若关注 500 人，需 5 页请求（size=100）。并行请求或顺序请求均可，远低于速率限制。

输出未分类用户概览后，询问用户要分析多少人（默认 20 人/批）。

---

## 阶段三: 深度分析（每用户 3 个并行请求）

对每个未分类用户获取详细信息，用于 AI 匹配。

```bash
# 对每个用户并行执行 3 个请求:

# 1. 用户详情（简介、标签）
curl -s "https://api.xgo.ing/openapi/v1/user/info?userName=TARGET_USER" \
  -H "X-API-KEY: $XGO_API_KEY"

# 2. 最新原创推文（5条）
curl -s -X POST https://api.xgo.ing/openapi/v1/tweet/list \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: $XGO_API_KEY" \
  -d '{"queryType":"user","userName":"TARGET_USER","sortType":"recent","tweetType":"ORIGINAL","currentPage":1,"pageSize":5}'

# 3. 最热原创推文（5条）
curl -s -X POST https://api.xgo.ing/openapi/v1/tweet/list \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: $XGO_API_KEY" \
  -d '{"queryType":"user","userName":"TARGET_USER","sortType":"influence","tweetType":"ORIGINAL","currentPage":1,"pageSize":5}'
```

### 速率管理

- 每用户 3 请求 → 20 用户 = 60 请求
- **建议分组并行**: 每组 5 用户（15 请求），分 4 组顺序执行
- 每组间无需等待（PLUS 200次/分限额充裕），但分组可避免同一时刻过多并发
- 若触发 429: 等待 10 秒后重试该组

---

## 阶段四: AI 匹配

基于阶段三 `user/info` 返回的 `description`（个人简介）和 `tags`（系统标签），以及推文内容，与现有列表进行匹配。

### 匹配逻辑

对每个未分类用户:
1. 分析用户简介关键词、标签、推文主题
2. 与每个现有列表的名称、描述、已有成员特征进行语义匹配
3. 输出推荐列表 + 置信度 + 理由

### 输出建议表

```markdown
## 分类建议（共 20 人）

| # | 用户 | 简介摘要 | 推荐列表 | 置信度 | 理由 |
|---|------|---------|---------|--------|------|
| 1 | @user1 | AI researcher at... | AI | 高 | 简介含 AI/ML 关键词，推文讨论 LLM |
| 2 | @user2 | Full-stack dev... | Programming | 高 | 推文以编程技术为主 |
| 3 | @user3 | Crypto trader... | - (建议新建 "Crypto") | 中 | 现有列表无匹配，内容为加密货币 |
| 4 | @user4 | Random thoughts... | 跳过 | 低 | 内容过于杂乱，无明确主题 |
| ... | ... | ... | ... | ... | ... |

### 建议新建列表
- **Crypto** — 3 位用户匹配此类别

请确认、调整或跳过上述建议。输入方式:
- "确认全部" — 按建议执行
- "跳过 4, 7" — 跳过第 4、7 位用户
- "3 改为 Programming" — 将第 3 位用户改为 Programming 列表
- "调整后确认" — 修改后执行
```

---

## 阶段五: 用户确认

**必须等待用户明确确认后才能进入阶段六。** 不得自动执行写操作。

用户可以:
- 确认全部建议
- 跳过部分用户
- 修改部分用户的目标列表
- 同意或拒绝创建新列表
- 取消整个操作

---

## 阶段六: 执行分类

根据确认后的建议，执行以下操作:

### 6.1 创建新列表（如有需要）

```bash
curl -s -X POST https://api.xgo.ing/openapi/v1/list/save \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: $XGO_API_KEY" \
  -d '{"name":"Crypto","description":"加密货币和 Web3 相关","privateList":false}'
```

记录返回的 `listId`。

### 6.2 批量添加成员

对每个确认的 用户→列表 映射:

```bash
curl -s -X POST https://api.xgo.ing/openapi/v1/list/addMember \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: $XGO_API_KEY" \
  -d '{"listId":"LIST_xxx","member":{"id":"USER_ID","name":"Display Name","userName":"username"}}'
```

**`member.id` 为必填字段**（来自阶段三 user/info 响应的 `id` 字段）。

### 执行策略

- 按列表分组执行，同一列表的成员可并行添加
- 每组最多 5 个并行请求
- 执行过程中输出进度

### 输出执行结果

```markdown
## 分类执行结果

### 新建列表
- ✅ 已创建 "Crypto" (ID: LIST_xxx)

### 添加成员
- ✅ @user1 → AI
- ✅ @user2 → Programming
- ✅ @user3 → Crypto
- ⏭️ @user4 → 跳过
- ❌ @user5 → AI（失败: 成员数超限）
- ... (共 N 个操作)

### 统计
- 成功: 16
- 跳过: 2
- 失败: 2
- 未分类用户剩余: 56 → 40
```

---

## 参数调整

根据用户输入调整:
- "整理关注" → 完整 6 阶段工作流
- "查看未分类用户" → 仅执行阶段一 + 阶段二
- "分析前 10 个" → 阶段三每批分析 10 人
- "分析 50 个" → 每批 20 人，分 3 批
- "只分析不执行" → 执行到阶段四后停止

## 错误处理

**重要**: 始终先检查 `response.success` 再处理 `response.data`。部分错误返回 HTTP 200 但 `success: false` — 不要仅依赖 HTTP 状态码。

- `401`: 检查 `XGO_API_KEY` 是否已设置且有效
- `403`: 开放接口需要 Plus 或 Pro 会员
- `429`: 频率限制 — 等待 10 秒后重试该组。若仍为 429，告知用户并暂停。阶段三分组策略可有效避免触发限制
- `xgo-0001`（用户不存在, HTTP 200）: 某些关注用户可能已注销或被封禁，跳过该用户并继续
- `xgo-0005`（成员数超限, HTTP 200）: 目标列表成员数已达上限。告知用户，建议创建新列表或升级会员
- `xgo-0011`（列表数超限, HTTP 200）: 列表数量已达上限，无法创建新列表
- `xgo-9005`（操作不允许, HTTP 200）: 可能尝试操作非自己的列表
- `success: false` 且 `code` 非零: 读取 `code` 和 `message`，记录失败并继续处理下一个用户
- 部分失败不影响整体: 单个用户分析或添加失败时，记录错误并继续处理其他用户
