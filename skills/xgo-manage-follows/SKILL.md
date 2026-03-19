---
name: xgo-manage-follows
description: "Use when 用户想查看或分析自己在 X 上关注的账号，包括关注状态、统计、刷新，以及关注或取关建议。"
hooks:
  PreToolUse:
    - matcher: "Bash"
      hooks:
        - type: command
          command: "bash scripts/hooks/write-guard.sh"
          timeout: 5
---

# 关注管理器 (XGo Manage Follows)

通过 XGo (xgo.ing) 开放接口管理和分析 Twitter/X 关注列表 — 查看关注、刷新数据、检查关注状态、统计分析、推荐关注/取消关注。

完整 API 参数详情见 `references/api_reference.md`。

## When to Use

- 用户要查看 follow 状态、follow 统计或 refresh 自己的关注列表
- 用户要执行 follow / unfollow，或获取推荐关注 / 推荐取关名单
- 任务是围绕 follow graph 管理，而不是列表分组或推文搜索

## When Not to Use

- 想把已关注的人整理进 X Lists 时，使用 `xgo-organize-follows` 或 `xgo-manage-lists`
- 想分析某个账号本身时，使用 `xgo-view-profile` 或 `xgo-track-kol`
- 想抓取关注流里的推文时，使用 `xgo-fetch-tweets`

## Gotchas

- `following/refresh` 受会员等级刷新间隔限制，HTTP 200 也可能是 `success: false`
- follow 和 unfollow 都是写操作，推荐名单出来后必须等待用户确认
- `following/list` 和 `following/status` 的标签字段名不同，不能直接混用
- 分批执行 follow / unfollow 更安全，避免一次性大批写操作失败后难回滚

## Related Skills

- `xgo-organize-follows`：给未分类关注用户批量归类到列表
- `xgo-manage-lists`：直接管理 X Lists 及成员
- `xgo-view-profile`：查看单个账号资料
- `xgo-fetch-tweets`：读取关注流而不是关注关系

## Shared Scripts

- 优先复用 `scripts/shared/xgo_client.py`
- 共享 client 统一处理 `following/list` 分页、写操作后的基础校验和 `success:false` 响应

## Worker Entrypoints

优先把以下 `scripts/examples/` 当成稳定 worker 入口：

```bash
python3 scripts/examples/xgo_following_overview.py
python3 scripts/examples/xgo_following_stats.py
python3 scripts/examples/xgo_following_tags.py
python3 scripts/examples/xgo_following_refresh.py
python3 scripts/examples/xgo_following_suggestions.py --action follow
python3 scripts/examples/xgo_following_suggestions.py --action unfollow
python3 scripts/examples/xgo_follow_action.py --action follow --user-name TARGET_USER
python3 scripts/examples/xgo_follow_action.py --action unfollow --user-name TARGET_USER
```

这些脚本统一输出 JSON 契约，至少包含 `ok`、`action`、`items`、`write`、`verify`、`note`、`meta`。
本 skill 应根据这些字段判断是否继续下一批、是否展示校验结果，以及是否需要提示用户重试。

## 认证

认证方式见 `../../references/shared/auth-xgo.md`。

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
python3 scripts/examples/xgo_following_overview.py
```

- 默认：`page=1`, `size=20`
- 最大 `size=100`
- 响应为分页结构，包含 `totalPage` 和 `totalSize`
- worker JSON 的 `items` 为当前页面数据，`meta` 提供统计和分页摘要
- 返回的 UserDTO 包含基本字段：id, name, userName, profileImageUrl, markTags, markNotes

**字段名说明**: `following/list` 返回的 UserDTO 中自定义标签字段为 `markTags`，自定义备注字段为 `markNotes`；而 `following/status` 返回的 FollowingStatusDTO 中对应字段名为 `tags` 和 `remark`。两者含义相同，但字段名不同。

### 场景 B: 刷新关注列表

从 Twitter API 异步刷新关注列表数据：

```bash
python3 scripts/examples/xgo_following_refresh.py
```

**刷新间隔限制**:

| 会员等级 | 最小刷新间隔 |
|---------|------------|
| PLUS | 15 天 |
| PRO | 1 天 |

- 返回 `true` 表示刷新已启动（异步执行）
- 刷新完成前，`following/list` 仍返回旧数据
- 若距上次刷新未超过间隔限制，返回 HTTP 200 但 `success: false`，错误码为 `xgo-9005`。必须检查 `success` 字段，不要依赖 HTTP 状态码

如果要把刷新纳入自动化工作流，先用共享 client 包一层稳定 worker，再让 orchestrator 消费统一 JSON，而不是直接依赖裸 `curl` 输出。

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
python3 scripts/examples/xgo_following_stats.py
```

返回：
- `count`: 总关注数
- `listCount`: 列表数量
- `categorizedCount`: 已分类到列表的用户数
- `uncategorizedCount`: 未分类的用户数
- `distribution`: 每个列表的成员数分布

### 场景 E: 查看关注标签

```bash
python3 scripts/examples/xgo_following_tags.py
```

返回按计数倒序排列的标签列表，每项包含 `tag`（标签名）和 `count`（使用该标签的关注用户数）。

### 场景 F: 关注分析报告

综合使用多个端点生成完整的关注分析报告。**并行执行**以下请求：

```bash
python3 scripts/examples/xgo_following_stats.py
python3 scripts/examples/xgo_following_tags.py

# 需要更多分页时，直接在 Python 里调用共享 client：
python3 - <<'PY'
from scripts.shared.xgo_client import XGoClient

client = XGoClient()
stats = client.get_following_stats()
follows = client.list_followings(page_size=100, max_pages=5)
print({"stats": stats, "count": len(follows)})
PY
```

### 场景 G: 推荐关注

获取系统推荐的值得关注的用户（最近活跃、尚未关注的热门用户，按粉丝数升序，最多 20 人）:

```bash
python3 scripts/examples/xgo_following_suggestions.py --action follow
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
python3 scripts/examples/xgo_follow_action.py \
  --action follow \
  --user-name TARGET_USER
```

worker JSON 中：
- `write` 保存 follow 写入响应
- `verify` 保存 `following/status` 的读回结果
- `ok` 只有在写入与读回都通过时才为 `true`

### 场景 H: 推荐取消关注

获取系统推荐取消关注的用户（粉丝 ≤100 或 60 天无推文的不活跃用户，按粉丝数升序，最多 50 人）:

```bash
python3 scripts/examples/xgo_following_suggestions.py --action unfollow
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
python3 scripts/examples/xgo_follow_action.py \
  --action unfollow \
  --user-name TARGET_USER
```

worker JSON 中：
- `write` 保存 unfollow 写入响应
- `verify` 保存 `following/status` 的读回结果
- `ok` 只有在写入与读回都通过时才为 `true`

## 参数调整

根据用户输入调整参数：
- "查看我的关注" → `following/list?page=1&size=50`
- "我关注了 @elonmusk 吗" → `following/status?targetUserName=elonmusk`（去掉 @ 前缀）
- "关注统计" / "关注分析" → 优先运行 `xgo_following_stats.py` + `xgo_following_tags.py`
- "刷新关注列表" → `xgo_following_refresh.py`
- "查看第 3 页" → `following/list?page=3&size=50`
- "看所有标签" → `xgo_following_tags.py`
- "推荐关注" / "该关注谁" → `xgo_following_suggestions.py --action follow`
- "推荐取关" / "清理关注" → `xgo_following_suggestions.py --action unfollow`
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

通用错误码见 `../../references/shared/error-handling-xgo.md`。本 skill 额外关注：

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
