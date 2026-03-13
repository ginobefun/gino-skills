---
name: xgo-manage-follows
description: "通过 XGo (xgo.ing) 开放接口管理和分析 Twitter/X 关注列表。适用场景：(1) 查看关注列表，(2) 刷新关注列表，(3) 检查是否关注了某用户，(4) 查看关注统计数据，(5) 查看关注者标签分布，(6) 分析关注列表的分类情况，(7) 获取推荐关注的用户，(8) 获取推荐取消关注的用户。触发短语：'关注列表', '我关注了谁', 'following list', '关注统计', 'following stats', '是否关注', 'do I follow', '刷新关注', 'refresh following', '关注标签', 'following tags', '关注分析', '关注管理', 'manage follows', '推荐关注', 'suggest follow', '该关注谁', 'who to follow', '推荐取关', 'suggest unfollow', '清理关注', 'cleanup follows', 或任何与 Twitter 关注管理、分析、推荐关注/取关相关的表述。"
---

# 关注管理器 (XGo Manage Follows)

通过 XGo (xgo.ing) 开放接口管理和分析 Twitter/X 关注列表 — 查看关注、刷新数据、检查关注状态、统计分析、推荐关注/取消关注。

完整 API 参数详情见 `references/api_reference.md`。

## 认证

所有请求需要 `X-API-KEY` 请求头。从环境变量 `XGO_API_KEY` 读取密钥：

```bash
-H "X-API-KEY: $XGO_API_KEY"
```

若 `XGO_API_KEY` 未设置，提示用户配置。

接口地址：`https://api.xgo.ing`

## 可用端点

| 端点 | 方法 | 类型 | 用途 |
|------|------|------|------|
| `/openapi/v1/following/list` | GET | DB | 分页查看关注列表 |
| `/openapi/v1/following/refresh` | POST | 实时 | 从 Twitter 刷新关注列表 |
| `/openapi/v1/following/status` | GET | DB | 检查是否关注某用户 |
| `/openapi/v1/following/stats` | GET | DB | 关注统计数据 |
| `/openapi/v1/following/tags` | GET | DB | 关注者标签及计数 |
| `/openapi/v1/following/suggest-follow` | GET | DB | 推荐关注的用户 |
| `/openapi/v1/following/suggest-unfollow` | GET | DB | 推荐取消关注的用户 |
| `/openapi/v1/following/follow` | POST | 写入 | 关注用户 |
| `/openapi/v1/following/unfollow` | POST | 写入 | 取消关注用户 |

## 核心工作流

### 场景 A: 查看关注列表

分页查看关注列表：

```bash
curl -s "https://api.xgo.ing/openapi/v1/following/list?page=1&size=50" \
  -H "X-API-KEY: $XGO_API_KEY"
```

- 默认：`page=1`, `size=20`
- 最大 `size=100`
- 响应为分页结构，包含 `totalPage` 和 `totalSize`
- 返回的 UserDTO 包含基本字段：id, name, userName, profileImageUrl, markTags, markNotes

**字段名说明**: `following/list` 返回的 UserDTO 中自定义标签字段为 `markTags`，自定义备注字段为 `markNotes`；而 `following/status` 返回的 FollowingStatusDTO 中对应字段名为 `tags` 和 `remark`。两者含义相同，但字段名不同。

### 场景 B: 刷新关注列表

从 Twitter API 异步刷新关注列表数据：

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

返回：
- `following`: 是否已关注（Boolean）
- `tags`: 为该关注用户设置的自定义标签
- `remark`: 自定义备注

### 场景 D: 查看关注统计

```bash
curl -s "https://api.xgo.ing/openapi/v1/following/stats" \
  -H "X-API-KEY: $XGO_API_KEY"
```

返回：
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

综合使用多个端点生成完整的关注分析报告。**并行执行**以下请求：

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

### 场景 G: 推荐关注

获取系统推荐的值得关注的用户（最近活跃、尚未关注的热门用户，按粉丝数升序，最多 20 人）:

```bash
curl -s "https://api.xgo.ing/openapi/v1/following/suggest-follow" \
  -H "X-API-KEY: $XGO_API_KEY"
```

返回 `List<UserDTO>`（完整用户资料），最多 20 人。

**交互流程**:

1. **展示推荐列表**: 将推荐用户以表格形式输出（见输出格式）
2. **询问用户确认**: **必须等待用户明确确认后才能执行关注操作。** 用户可选择：
   - 关注全部推荐用户
   - 关注指定用户（如"关注第 1、3、5 个"）
   - 跳过（不关注任何人）
3. **分批执行**: 用户确认后，**每批最多 5 人**调用 `following/follow` 端点，避免一次性过多写操作。每批执行后输出进度。

```bash
# 关注单个用户
curl -s -X POST "https://api.xgo.ing/openapi/v1/following/follow?targetUserName=TARGET_USER" \
  -H "X-API-KEY: $XGO_API_KEY"
```

返回 `true` 表示关注成功。

### 场景 H: 推荐取消关注

获取系统推荐取消关注的用户（粉丝 ≤100 或 60 天无推文的不活跃用户，按粉丝数升序，最多 50 人）:

```bash
curl -s "https://api.xgo.ing/openapi/v1/following/suggest-unfollow" \
  -H "X-API-KEY: $XGO_API_KEY"
```

返回 `List<UserDTO>`（完整用户资料），最多 50 人。

**交互流程**:

1. **展示推荐列表**: 将推荐取关用户以表格形式输出（见输出格式）
2. **询问用户确认**: **必须等待用户明确确认后才能执行取关操作。** 用户可选择：
   - 取关全部推荐用户
   - 取关指定用户（如"取关第 2、4、6 个"）
   - 跳过（不取关任何人）
3. **分批执行**: 用户确认后，**每批最多 5 人**调用 `following/unfollow` 端点，避免一次性过多写操作。每批执行后输出进度。

```bash
# 取消关注单个用户
curl -s -X POST "https://api.xgo.ing/openapi/v1/following/unfollow?targetUserName=TARGET_USER" \
  -H "X-API-KEY: $XGO_API_KEY"
```

返回 `true` 表示取关成功。

## 参数调整

根据用户输入调整参数：
- "查看我的关注" → `following/list?page=1&size=50`
- "我关注了 @elonmusk 吗" → `following/status?targetUserName=elonmusk`（去掉 @ 前缀）
- "关注统计" / "关注分析" → 并行调用 `following/stats` + `following/tags`
- "刷新关注列表" → `following/refresh`
- "查看第 3 页" → `following/list?page=3&size=50`
- "看所有标签" → `following/tags`
- "推荐关注" / "该关注谁" → `following/suggest-follow`
- "推荐取关" / "清理关注" → `following/suggest-unfollow`
- "关注 @xxx" / "follow @xxx" → 直接调用 `following/follow?targetUserName=xxx`（需用户确认）
- "取关 @xxx" / "unfollow @xxx" → 直接调用 `following/unfollow?targetUserName=xxx`（需用户确认）

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

### 推荐关注

```markdown
## 推荐关注 (共 N 人)

| # | 用户名 | 显示名 | 简介 | 粉丝 | 系统标签 |
|---|--------|--------|------|------|----------|
| 1 | @user1 | User One | AI researcher... | 12.5K | AI, ML |
| 2 | @user2 | User Two | Full-stack dev... | 8.3K | Dev, Web |
| ... | ... | ... | ... | ... | ... |

是否要关注其中的某些用户？请指定编号（如"关注 1, 3, 5"），或输入"全部"/"跳过"。
```

### 推荐取消关注

```markdown
## 推荐取消关注 (共 N 人)

| # | 用户名 | 显示名 | 粉丝 | 最近推文 | 原因 |
|---|--------|--------|------|---------|------|
| 1 | @user1 | User One | 15 | 无推文 | 粉丝过少 |
| 2 | @user2 | User Two | 82 | 65 天前 | 长期不活跃 |
| ... | ... | ... | ... | ... | ... |

是否要取消关注其中的某些用户？请指定编号（如"取关 1, 2, 4"），或输入"全部"/"跳过"。
```

### 关注/取关执行结果

```markdown
## 批量关注执行结果

### 第 1 批 (1-5)
- ✅ @user1 — 关注成功
- ✅ @user2 — 关注成功
- ❌ @user3 — 失败：用户不存在
- ✅ @user4 — 关注成功
- ✅ @user5 — 关注成功

### 第 2 批 (6-8)
- ✅ @user6 — 关注成功
- ✅ @user7 — 关注成功
- ✅ @user8 — 关注成功

**统计**: 成功 7 / 失败 1 / 共 8 人
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
- `429`: 频率限制 — 等待 10 秒后重试一次。若仍为 429，告知用户："频率限制，请稍后重试。"
- `xgo-0012`（需要会员，HTTP 200）: 部分功能需要更高等级会员。注意：此错误以 HTTP 200 返回，必须检查 `success` 字段
- `xgo-9005`（操作不允许，HTTP 200）: 刷新间隔未到或其他限制。注意：此错误以 HTTP 200 返回，必须检查 `success` 字段。告知用户当前会员等级的刷新间隔（PLUS 15 天，PRO 1 天），建议稍后重试

### 批量操作错误处理

关注/取关批量操作中，每次调用 `following/follow` 或 `following/unfollow` 后必须检查 `response.success`:
- `success: true` → 操作成功，记录 ✅
- `success: false` → 操作失败，记录 ❌ 和 `message`，**继续处理下一个用户**（单个失败不中断整批）
- 若一批中连续失败超过 3 次，暂停并告知用户，可能是系统性问题（如频率限制或权限问题）

### 空结果处理

- `suggest-follow` 返回空列表：告知用户 "暂无推荐关注的用户"
- `suggest-unfollow` 返回空列表：告知用户 "暂无推荐取消关注的用户，你的关注列表状态良好"
