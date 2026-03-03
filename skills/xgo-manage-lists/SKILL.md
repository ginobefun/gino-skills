---
name: xgo-manage-lists
description: "通过 XGo (xgo.ing) 开放接口管理 Twitter/X 列表。适用场景: (1) 查看所有列表, (2) 创建新列表, (3) 编辑列表名称或描述, (4) 往列表添加成员, (5) 从列表移除成员, (6) 查看列表详情和成员。触发短语: '管理列表', '创建列表', 'create list', '添加到列表', 'add to list', '列表成员', 'list members', '我的列表', 'my lists', '编辑列表', '新建列表', '移除成员', 'remove from list', 或任何与 Twitter 列表管理相关的表述。注意: 查看列表中成员的推文请使用 xgo-fetch-tweets（传入 listId 参数）。"
---

# 列表管理器 (XGo Manage Lists)

通过 XGo (xgo.ing) 开放接口管理 Twitter/X 列表 — 查看、创建、编辑列表及管理成员。

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
| `/openapi/v1/list/all` | GET | DB | 获取所有列表 |
| `/openapi/v1/list/get` | GET | DB | 获取单个列表详情 |
| `/openapi/v1/list/save` | POST | 写入 | 创建或更新列表 |
| `/openapi/v1/list/addMember` | POST | 写入 | 添加成员到列表 |
| `/openapi/v1/list/removeMember` | POST | 写入 | 从列表移除成员 |

## 核心工作流

### 场景 A: 查看所有列表

```bash
curl -s "https://api.xgo.ing/openapi/v1/list/all" \
  -H "X-API-KEY: $XGO_API_KEY"
```

### 场景 B: 创建新列表

```bash
curl -s -X POST https://api.xgo.ing/openapi/v1/list/save \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: $XGO_API_KEY" \
  -d '{"name":"AI Researchers","description":"AI 领域的研究者","privateList":false}'
```

- 返回新创建的列表 ID
- 列表数量限制: PLUS 最多 20 个，PRO 最多 100 个

### 场景 C: 编辑已有列表

提供 `id` 字段即为更新操作:

```bash
curl -s -X POST https://api.xgo.ing/openapi/v1/list/save \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: $XGO_API_KEY" \
  -d '{"id":"LIST_abc12345","name":"AI Researchers (Updated)","description":"更新后的描述"}'
```

### 场景 D: 添加成员到列表

**前置条件**: 需要目标用户的 `id`（Twitter 用户 ID）。若用户只提供了用户名，先获取用户 ID:

```bash
curl -s "https://api.xgo.ing/openapi/v1/user/info?userName=elonmusk" \
  -H "X-API-KEY: $XGO_API_KEY"
```

从响应的 `data.id` 字段获取用户 ID，然后再调用 `addMember`。

```bash
curl -s -X POST https://api.xgo.ing/openapi/v1/list/addMember \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: $XGO_API_KEY" \
  -d '{"listId":"LIST_abc12345","member":{"id":"44196397","name":"Elon Musk","userName":"elonmusk"}}'
```

- `member.id` 为必填字段
- `member.name`、`member.userName`、`member.profileImageUrl` 为可选字段，建议尽量填写
- 成员数量限制: PLUS 每个列表最多 200 人，PRO 最多 1000 人

### 场景 E: 从列表移除成员

```bash
curl -s -X POST https://api.xgo.ing/openapi/v1/list/removeMember \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: $XGO_API_KEY" \
  -d '{"listId":"LIST_abc12345","member":{"id":"44196397"}}'
```

### 场景 F: 查看列表详情（含成员列表）

```bash
curl -s "https://api.xgo.ing/openapi/v1/list/get?listId=LIST_abc12345" \
  -H "X-API-KEY: $XGO_API_KEY"
```

## 参数调整

根据用户输入调整参数:
- "创建一个 AI 列表" → `list/save`，`name: "AI"`
- "把 @elonmusk 添加到 AI 列表" → 先 `list/all` 找到列表 ID，再 `list/addMember`
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
## 列表: AI Researchers

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

**重要**: 始终先检查 `response.success` 再处理 `response.data`。部分错误返回 HTTP 200 但 `success: false` — 不要仅依赖 HTTP 状态码。

- `401`: 检查 `XGO_API_KEY` 是否已设置且有效
- `403`: 开放接口需要 Plus 或 Pro 会员
- `429`: 频率限制 — 等待 10 秒后重试一次。若仍为 429，告知用户: "频率限制，请稍后重试。"
- `xgo-0002`（列表不存在）: 列表 ID 可能不正确，建议用户先 `list/all` 查看可用列表
- `xgo-0005`（成员数超限）: 告知用户当前会员等级的成员数上限（PLUS 200, PRO 1000）
- `xgo-0011`（列表数超限）: 告知用户当前会员等级的列表数上限（PLUS 20, PRO 100）
- `xgo-1001`（参数错误, HTTP 400）: 请求体字段缺失或格式不正确。检查 `member.id` 是否为字符串类型、`listId` 是否正确
- `xgo-9005`（操作不允许, HTTP 200）: 可能尝试修改非自己拥有的列表。注意: 此错误以 HTTP 200 返回，必须检查 `success` 字段
