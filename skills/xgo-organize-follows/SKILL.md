---
name: xgo-organize-follows
description: "Use when 用户想把未分类的 X 关注账号整理进列表，并在批量更新前先经过分析和分阶段确认。"
hooks:
  PreToolUse:
    - matcher: "Bash"
      hooks:
        - type: command
          command: "bash scripts/hooks/write-guard.sh"
          timeout: 5
---

# 关注整理助手 (Follow Organizer)

通过 XGo (xgo.ing) 开放接口整理 Twitter/X 关注用户 — 发现未分类用户、AI 分析推荐列表归属、批量执行分类。多阶段交互式工作流。

完整 API 参数详情见 `references/api_reference.md`。

## When to Use

- 用户要把未分类的 follows 批量整理进已有列表或新列表
- 用户接受先分析、再确认、最后分批执行写操作的 staged workflow
- 任务目标是“组织关注结构”，不是单纯查看关注统计

## When Not to Use

- 只想查看 follows、refresh 或 follow/unfollow 时，使用 `xgo-manage-follows`
- 想直接手动维护某个列表成员时，使用 `xgo-manage-lists`
- 想分析某个用户值不值得关注时，使用 `xgo-track-kol` 或 `xgo-view-profile`

## Gotchas

- 这是多阶段交互 skill，阶段五必须等用户确认，不能自动进入批量写入
- 未分类判断依赖 `list/all` 和 `following/list` 的交叉比对，不能只看某一个接口
- 新建列表和 addMember 都是写操作，执行时要保留映射关系和进度输出
- 分析建议只是建议，不应假装成确定分类结果

## Related Skills

- `xgo-manage-follows`：查看 follows、follow/unfollow 和基础统计
- `xgo-manage-lists`：直接管理 lists 和成员
- `xgo-track-kol`：先判断账号主题和价值，再决定归类
- `xgo-view-profile`：快速补看单个账号资料

## Shared Scripts

- 优先复用 `scripts/shared/xgo_client.py`
- 未分类判断优先走 `scripts/examples/xgo_uncategorized_follows.py`
- 单用户画像采样优先走 `scripts/examples/xgo_user_activity.py`
- 最终写操作优先走 `scripts/examples/xgo_save_list.py` 和 `scripts/examples/xgo_list_member_action.py`

## Worker Entrypoints

优先把以下入口当成稳定 worker，而不是在 skill 里重新拼装多段 `curl`：

```bash
python3 scripts/examples/xgo_following_stats.py
python3 scripts/examples/xgo_list_overview.py
python3 scripts/examples/xgo_uncategorized_follows.py --page-size 100 --max-pages 10
python3 scripts/examples/xgo_user_activity.py TARGET_USER --recent-size 5 --top-size 5
python3 scripts/examples/xgo_save_list.py --name "Crypto"
python3 scripts/examples/xgo_list_member_action.py --action add --list-id LIST_xxx --member-id USER_ID --user-name username
```

这些 worker 统一输出 JSON 契约，至少包含 `ok`、`action`、`items`、`write`、`verify`、`note`、`meta`。
本 skill 应根据这些字段做阶段推进、人工确认和失败重试，而不是依赖临时文本格式。

## 认证

认证方式见 `../../references/shared/auth-xgo.md`。

## 工作流概览（6 个阶段）

```
阶段一（准备）→ 阶段二（获取未分类用户）→ 阶段三（深度分析）→ 阶段四（AI 匹配）→ 阶段五（确认）→ 阶段六（执行）
```

**重要**: 这是一个交互式多阶段工作流。阶段五需要等待用户确认后才能进入阶段六。阶段六包含**写操作**（addMember），执行前必须获得用户明确确认。

---

## 阶段一：准备（2 个 worker）

获取关注统计和列表信息，了解整体情况。

```bash
python3 scripts/examples/xgo_following_stats.py
python3 scripts/examples/xgo_list_overview.py
```

可以并行执行。输出准备报告时：
- 从 `xgo_following_stats.py` 的 `verify.data` 读取统计字段
- 从 `xgo_list_overview.py` 的 `items` 读取列表信息

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

## 阶段二：获取未分类用户

通过共享 worker 获取所有关注用户并过滤出未分类用户。

```bash
python3 scripts/examples/xgo_uncategorized_follows.py \
  --page-size 100 \
  --max-pages 10
```

### 客户端过滤逻辑

1. worker 从 `list/all` 收集所有列表成员的 `userName` 到 `categorizedSet`
2. worker 遍历 `following/list` 返回的每个用户
3. 若 `userName` 不在 `categorizedSet` 中 → 标记为未分类用户
4. worker 将未分类用户作为 `items` 返回，并在 `meta` 中返回统计摘要

**速率说明**: 若关注 500 人，需 5 页请求（size=100）。并行请求或顺序请求均可，远低于速率限制。

输出未分类用户概览后，询问用户要分析多少人（默认 20 人/批）。

---

## 阶段三：深度分析（每用户 1 个画像 worker）

对每个未分类用户获取详细信息，用于 AI 匹配。

```bash
python3 scripts/examples/xgo_user_activity.py TARGET_USER \
  --recent-size 5 \
  --top-size 5
```

### 速率管理

- 每用户 1 个画像 worker，但内部仍会触发 3 次 API 调用
- **建议分组并行**: 每组 5 用户，分 4 组顺序执行
- 每组间无需等待（PLUS 200 次/分限额充裕），但分组可避免同一时刻过多并发
- 若触发 429: 等待 10 秒后重试该组

---

## 阶段四：AI 匹配

基于阶段三 worker 返回的 `verify.profile.data.description`（个人简介）和 `verify.profile.data.tags`（系统标签），以及 `items` / `verify.topTweets` 中的推文内容，与现有列表进行匹配。

### 匹配逻辑

对每个未分类用户：
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

请确认、调整或跳过上述建议。输入方式：
- "确认全部" — 按建议执行
- "跳过 4, 7" — 跳过第 4、7 位用户
- "3 改为 Programming" — 将第 3 位用户改为 Programming 列表
- "调整后确认" — 修改后执行
```

---

## 阶段五：用户确认

**必须等待用户明确确认后才能进入阶段六。** 不得自动执行写操作。

用户可以：
- 确认全部建议
- 跳过部分用户
- 修改部分用户的目标列表
- 同意或拒绝创建新列表
- 取消整个操作

---

## 阶段六：执行分类

根据确认后的建议，执行以下操作：

### 6.1 创建新列表（如有需要）

```bash
python3 scripts/examples/xgo_save_list.py \
  --name "Crypto" \
  --description "加密货币和 Web3 相关"
```

记录返回的 `listId`。

### 6.2 批量添加成员

对每个确认的 用户→列表 映射：

```bash
python3 scripts/examples/xgo_list_member_action.py \
  --action add \
  --list-id LIST_xxx \
  --member-id USER_ID \
  --user-name username \
  --name "Display Name"
```

**`member.id` 为必填字段**（来自阶段三 worker `verify.profile.data.id` 字段）。

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
- ❌ @user5 → AI（失败：成员数超限）
- ... (共 N 个操作)

### 统计
- 成功：16
- 跳过：2
- 失败：2
- 未分类用户剩余：56 → 40
```

---

## 参数调整

根据用户输入调整：
- "整理关注" → 完整 6 阶段工作流
- "查看未分类用户" → 仅执行阶段一 + 阶段二
- "分析前 10 个" → 阶段三每批分析 10 人
- "分析 50 个" → 每批 20 人，分 3 批
- "只分析不执行" → 执行到阶段四后停止

## 错误处理

通用错误码见 `../../references/shared/error-handling-xgo.md`。本 skill 额外关注：

- `xgo-0001`（用户不存在，HTTP 200）: 某些关注用户可能已注销或被封禁，跳过该用户并继续
- `xgo-0005`（成员数超限，HTTP 200）: 目标列表成员数已达上限。告知用户，建议创建新列表或升级会员
- `xgo-0011`（列表数超限，HTTP 200）: 列表数量已达上限，无法创建新列表
- `xgo-9005`（操作不允许，HTTP 200）: 可能尝试操作非自己的列表
- 部分失败不影响整体：单个用户分析或添加失败时，记录错误并继续处理其他用户
