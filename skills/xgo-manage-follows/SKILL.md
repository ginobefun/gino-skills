---
name: xgo-manage-follows
description: "通过 XGo (xgo.ing) 开放接口管理和分析 Twitter/X 关注列表。适用场景: (1) 查看关注列表, (2) 刷新关注列表, (3) 检查是否关注了某用户, (4) 查看关注统计数据, (5) 查看关注者标签分布, (6) 分析关注列表的分类情况。触发短语: '关注列表', '我关注了谁', 'following list', '关注统计', 'following stats', '是否关注', 'do I follow', '刷新关注', 'refresh following', '关注标签', 'following tags', '关注分析', '关注管理', 'manage follows', 或任何与 Twitter 关注管理和分析相关的表述。"
---

# 关注管理器 (XGo Manage Follows)

通过 XGo (xgo.ing) 开放接口管理和分析 Twitter/X 关注列表 — 查看关注、刷新数据、检查关注状态、统计分析。

完整 API 参数详情见 `references/api_reference.md`。

## 认证

所有请求需要 `X-API-KEY` 请求头。从环境变量 `XGO_API_KEY` 读取密钥:

```bash
-H "X-API-KEY: $XGO_API_KEY"
```

若 `XGO_API_KEY` 未设置，提示用户配置。

接口地址: `https://api.xgo.ing`

## 可用端点

| 端点 | 方法 | 类型 | 用途 |
|------|------|------|------|
| `/openapi/v1/following/list` | GET | DB | 分页查看关注列表 |
| `/openapi/v1/following/refresh` | POST | 实时 | 从 Twitter 刷新关注列表 |
| `/openapi/v1/following/status` | GET | DB | 检查是否关注某用户 |
| `/openapi/v1/following/stats` | GET | DB | 关注统计数据 |
| `/openapi/v1/following/tags` | GET | DB | 关注者标签及计数 |

## 核心工作流

### 场景 A: 查看关注列表

分页查看关注列表:

```bash
curl -s "https://api.xgo.ing/openapi/v1/following/list?page=1&size=50" \
  -H "X-API-KEY: $XGO_API_KEY"
```

- 默认: `page=1`, `size=20`
- 最大 `size=100`
- 响应为分页结构，包含 `totalPage` 和 `totalSize`
- 返回的 UserDTO 包含基本字段: id, name, userName, profileImageUrl, markTags, markNotes

**字段名说明**: `following/list` 返回的 UserDTO 中自定义标签字段为 `markTags`，自定义备注字段为 `markNotes`；而 `following/status` 返回的 FollowingStatusDTO 中对应字段名为 `tags` 和 `remark`。两者含义相同，但字段名不同。

### 场景 B: 刷新关注列表

从 Twitter API 异步刷新关注列表数据:

```bash
curl -s -X POST "https://api.xgo.ing/openapi/v1/following/refresh" \
  -H "X-API-KEY: $XGO_API_KEY"
```

**刷新间隔限制**:

| 会员等级 | 最小刷新间隔 |
|---------|------------|
| PLUS | 15 天 |
| PRO | 1 天 |

- 返回 `true` 表示刷新已启动（异步执行）
- 刷新完成前，`following/list` 仍返回旧数据
- 若距上次刷新未超过间隔限制，返回 HTTP 200 但 `success: false`，错误码为 `xgo-9005`。必须检查 `success` 字段，不要依赖 HTTP 状态码

### 场景 C: 检查是否关注某用户

```bash
curl -s "https://api.xgo.ing/openapi/v1/following/status?targetUserName=elonmusk" \
  -H "X-API-KEY: $XGO_API_KEY"
```

返回:
- `following`: 是否已关注（Boolean）
- `tags`: 为该关注用户设置的自定义标签
- `remark`: 自定义备注

### 场景 D: 查看关注统计

```bash
curl -s "https://api.xgo.ing/openapi/v1/following/stats" \
  -H "X-API-KEY: $XGO_API_KEY"
```

返回:
- `count`: 总关注数
- `listCount`: 列表数量
- `categorizedCount`: 已分类到列表的用户数
- `uncategorizedCount`: 未分类的用户数
- `distribution`: 每个列表的成员数分布

### 场景 E: 查看关注标签

```bash
curl -s "https://api.xgo.ing/openapi/v1/following/tags" \
  -H "X-API-KEY: $XGO_API_KEY"
```

返回按计数倒序排列的标签列表，每项包含 `tag`（标签名）和 `count`（使用该标签的关注用户数）。

### 场景 F: 关注分析报告

综合使用多个端点生成完整的关注分析报告。**并行执行**以下请求:

```bash
# 1. 关注统计
curl -s "https://api.xgo.ing/openapi/v1/following/stats" \
  -H "X-API-KEY: $XGO_API_KEY"

# 2. 关注标签分布
curl -s "https://api.xgo.ing/openapi/v1/following/tags" \
  -H "X-API-KEY: $XGO_API_KEY"

# 3. 关注列表（第一页）
curl -s "https://api.xgo.ing/openapi/v1/following/list?page=1&size=50" \
  -H "X-API-KEY: $XGO_API_KEY"
```

## 参数调整

根据用户输入调整参数:
- "查看我的关注" → `following/list?page=1&size=50`
- "我关注了 @elonmusk 吗" → `following/status?targetUserName=elonmusk`（去掉 @ 前缀）
- "关注统计" / "关注分析" → 并行调用 `following/stats` + `following/tags`
- "刷新关注列表" → `following/refresh`
- "查看第 3 页" → `following/list?page=3&size=50`
- "看所有标签" → `following/tags`

## 输出格式

### 关注列表

```markdown
## 我的关注列表 (共 N 人，第 M/P 页)

| # | 用户名 | 显示名 | 标签 | 备注 |
|---|--------|--------|------|------|
| 1 | @elonmusk | Elon Musk | AI, Tech | |
| 2 | @sama | Sam Altman | AI, Startup | OpenAI CEO |
| 3 | @naval | Naval | Startup, Investing | |
```

### 关注状态

```markdown
✅ 你已关注 @elonmusk
- **标签**: AI, Tech
- **备注**: Tesla & SpaceX CEO

❌ 你未关注 @unknown_user
```

### 关注统计

```markdown
## 关注统计

- **总关注数**: 356
- **列表数**: 8
- **已分类**: 280 (78.7%)
- **未分类**: 76 (21.3%)

### 列表分布

| 列表名称 | 成员数 |
|---------|--------|
| AI Researchers | 45 |
| Web3 Builders | 38 |
| Startup Founders | 32 |
| Tech News | 28 |
```

### 标签分布

```markdown
## 关注标签分布

| 标签 | 用户数 |
|------|--------|
| AI | 89 |
| Tech | 72 |
| Startup | 56 |
| Web3 | 34 |
| Investing | 28 |
```

### 刷新结果

```markdown
✅ 关注列表刷新已启动（异步执行，稍后生效）
⚠️ 距上次刷新不足 15 天（PLUS 会员），请稍后再试
```

### 输出完整性规则

- 当所有关注用户均无标签时，省略整个"标签"列；仅部分用户无标签时，对应单元格留空
- 当所有关注用户均无备注时，省略整个"备注"列；仅部分用户无备注时，对应单元格留空
- 统计中的百分比保留一位小数
- `distribution` 按成员数倒序排列
- 标签列表按 `count` 倒序排列

## 错误处理

**重要**: 始终先检查 `response.success` 再处理 `response.data`。部分错误返回 HTTP 200 但 `success: false` — 不要仅依赖 HTTP 状态码。

- `401`: 检查 `XGO_API_KEY` 是否已设置且有效
- `403`: 开放接口需要 Plus 或 Pro 会员
- `429`: 频率限制 — 等待 10 秒后重试一次。若仍为 429，告知用户: "频率限制，请稍后重试。"
- `xgo-0012`（需要会员, HTTP 200）: 部分功能需要更高等级会员。注意: 此错误以 HTTP 200 返回，必须检查 `success` 字段
- `xgo-9005`（操作不允许, HTTP 200）: 刷新间隔未到或其他限制。注意: 此错误以 HTTP 200 返回，必须检查 `success` 字段。告知用户当前会员等级的刷新间隔（PLUS 15天, PRO 1天），建议稍后重试
