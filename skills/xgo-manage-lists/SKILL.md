---
name: xgo-manage-lists
description: "Use when 用户想通过 XGo 查看或修改 X 列表，包括创建列表、添加成员和移除成员。"
hooks:
  PreToolUse:
    - matcher: "Bash"
      hooks:
        - type: command
          command: "bash scripts/hooks/write-guard.sh"
          timeout: 5
---

# 列表管理器 (XGo Manage Lists)

通过 XGo (xgo.ing) 开放接口管理 Twitter/X 列表 — 查看、创建、编辑列表及管理成员。

完整 API 参数详情见 `references/api_reference.md`。

## When to Use

- 用户要查看、创建或编辑 X Lists
- 用户要把某个账号加入列表，或从列表中移除
- 任务核心是 list 和 list member 管理，而不是 follow graph 分析

## When Not to Use

- 想让模型根据账号画像自动建议列表归属时，使用 `xgo-organize-follows`
- 想管理 bookmarks 时，使用 `xgo-manage-bookmarks`
- 想抓取某个列表里的推文时，使用 `xgo-fetch-tweets`

## Gotchas

- `addMember` 需要用户 ID，不是只有用户名就能直接写入
- 写操作前要先确认 listId，避免误改错误列表
- 列表和成员数量都有会员等级上限，失败时要把上限原因说清楚
- 不能只看 HTTP 状态码；HTTP 200 的 `success: false` 也常见于权限或对象归属问题

## Related Skills

- `xgo-organize-follows`：自动分析未分类关注并给出列表归属建议
- `xgo-manage-follows`：管理 follows，而不是 lists
- `xgo-fetch-tweets`：查看 list timeline
- `xgo-view-profile`：先查用户资料，再决定是否加进列表

## Shared Scripts

- 优先复用 `scripts/shared/xgo_client.py`
- 列表读取、列表保存和 member 写后校验优先走 `scripts/examples/`

## Worker Entrypoints

优先把以下 `scripts/examples/` 当成稳定 worker 入口：

```bash
python3 scripts/examples/xgo_list_overview.py
python3 scripts/examples/xgo_list_detail.py --list-id LIST_abc12345
python3 scripts/examples/xgo_lookup_user.py elonmusk
python3 scripts/examples/xgo_save_list.py --name "AI Researchers"
python3 scripts/examples/xgo_list_member_action.py --action add --list-id LIST_abc12345 --member-id 44196397 --user-name elonmusk
python3 scripts/examples/xgo_list_member_action.py --action remove --list-id LIST_abc12345 --member-id 44196397 --user-name elonmusk
```

这些脚本统一输出 JSON 契约，至少包含 `ok`、`action`、`items`、`write`、`verify`、`note`、`meta`。
本 skill 应根据这些字段判断列表是否存在、写入是否完成，以及成员校验是否通过。

## 认证

认证方式见 `../../references/shared/auth-xgo.md`。

## 可用端点

| 端点 | 方法 | 类型 | 用途 |
|------|------|------|------|
| `/openapi/v1/list/all` | GET | DB | 获取所有列表 |
| `/openapi/v1/list/get` | GET | DB | 获取单个列表详情 |
| `/openapi/v1/list/save` | POST | 写入 | 创建或更新列表 |
| `/openapi/v1/list/addMember` | POST | 写入 | 添加成员到列表 |
| `/openapi/v1/list/removeMember` | POST | 写入 | 从列表移除成员 |

## 核心工作流

### 场景 A: 查看所有列表

```bash
python3 scripts/examples/xgo_list_overview.py
```

### 场景 B: 创建新列表

```bash
python3 scripts/examples/xgo_save_list.py \
  --name "AI Researchers" \
  --description "AI 领域的研究者"
```

- 返回新创建的列表 ID
- 列表数量限制：PLUS 最多 20 个，PRO 最多 100 个

### 场景 C: 编辑已有列表

提供 `id` 字段即为更新操作：

```bash
python3 scripts/examples/xgo_save_list.py \
  --list-id LIST_abc12345 \
  --name "AI Researchers (Updated)" \
  --description "更新后的描述"
```

### 场景 D: 添加成员到列表

**前置条件**: 需要目标用户的 `id`（Twitter 用户 ID）。若用户只提供了用户名，先获取用户 ID:

```bash
python3 scripts/examples/xgo_lookup_user.py elonmusk
```

从 worker JSON 的 `items[0].id` 字段获取用户 ID，然后再调用 `addMember`。

```bash
python3 scripts/examples/xgo_list_member_action.py \
  --action add \
  --list-id LIST_abc12345 \
  --member-id 44196397 \
  --user-name elonmusk \
  --name "Elon Musk"
```

- `member.id` 为必填字段
- `member.name`、`member.userName`、`member.profileImageUrl` 为可选字段，建议尽量填写
- 成员数量限制：PLUS 每个列表最多 200 人，PRO 最多 1000 人

### 场景 E: 从列表移除成员

```bash
python3 scripts/examples/xgo_list_member_action.py \
  --action remove \
  --list-id LIST_abc12345 \
  --member-id 44196397 \
  --user-name elonmusk
```

### 场景 F: 查看列表详情（含成员列表）

```bash
python3 scripts/examples/xgo_list_detail.py --list-id LIST_abc12345
```

## 参数调整

根据用户输入调整参数：
- "创建一个 AI 列表" → `list/save`，`name: "AI"`
- "把 @elonmusk 添加到 AI 列表" → 先运行 `xgo_list_overview.py` 找到列表 ID，再运行 `xgo_lookup_user.py` 和 `xgo_list_member_action.py`
- "从列表移除 xxx" → `list/removeMember`
- "把列表设为私密" → `list/save`，`privateList: true`
- "查看 AI 列表的成员" → `list/get?listId=xxx`
- "查看列表中的推文" → 提示用户使用 xgo-fetch-tweets 并传入 `listId` 参数

## 输出格式

### 列表概览

```markdown
## 我的列表 (共 N 个)

### 1. AI Researchers
- **ID**: LIST_abc12345
- **描述**: AI 领域的研究者
- **成员数**: 15
- **私密**: 否

### 2. Web3 Builders
- **ID**: LIST_def67890
- **描述**: Web3 建设者们
- **成员数**: 8
- **私密**: 是
```

### 列表详情（含成员）

```markdown
## 列表：AI Researchers

- **ID**: LIST_abc12345
- **描述**: AI 领域的研究者
- **成员数**: 15
- **私密**: 否

### 成员列表

| # | 用户名 | 显示名 | 用户 ID |
|---|--------|--------|---------|
| 1 | @elonmusk | Elon Musk | 44196397 |
| 2 | @sama | Sam Altman | 3513041 |
```

### 操作结果

```markdown
✅ 已创建列表 "AI Researchers" (ID: LIST_abc12345)
✅ 已将 @elonmusk 添加到列表 "AI Researchers"
✅ 已从列表 "AI Researchers" 移除 @elonmusk
✅ 已更新列表 "AI Researchers" 的描述
```

### 输出完整性规则

- 列表 `description` 为空时省略该行
- `privateList` 显示为"是/否"
- `members` 为空列表时显示"暂无成员"
- 操作成功时输出确认信息，包含列表名称和操作内容

## 错误处理

通用错误码见 `../../references/shared/error-handling-xgo.md`。本 skill 额外关注：

- `xgo-0002`（列表不存在）: 列表 ID 可能不正确，建议用户先运行 `xgo_list_overview.py` 查看可用列表
- `xgo-0005`（成员数超限）: 告知用户当前会员等级的成员数上限（PLUS 200, PRO 1000）
- `xgo-0011`（列表数超限）: 告知用户当前会员等级的列表数上限（PLUS 20, PRO 100）
- `xgo-1001`（参数错误，HTTP 400）: 请求体字段缺失或格式不正确。检查 `member.id` 是否为字符串类型、`listId` 是否正确
- `xgo-9005`（操作不允许，HTTP 200）: 可能尝试修改非自己拥有的列表。注意：此错误以 HTTP 200 返回，必须检查 `success` 字段
