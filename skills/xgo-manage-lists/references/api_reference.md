# XGo 列表管理 API 参考

接口地址: `https://api.xgo.ing`
认证方式: 请求头 `X-API-KEY`（环境变量 `XGO_API_KEY`）

## Worker-First 说明

默认执行路径优先使用：

```bash
python3 scripts/examples/xgo_list_overview.py
python3 scripts/examples/xgo_save_list.py --name "AI Builders"
python3 scripts/examples/xgo_list_member_action.py add --list-id LIST_ID --user-id USER_ID
```

本文件保留底层 `list/*` 端点说明，主要用于 debug 和扩展 worker。

## 目录

1. [获取所有列表](#获取所有列表)
2. [获取单个列表](#获取单个列表)
3. [创建或更新列表](#创建或更新列表)
4. [添加成员](#添加成员)
5. [移除成员](#移除成员)
6. [数据类型](#数据类型)
7. [错误码](#错误码)

---

## 获取所有列表

`GET /openapi/v1/list/all`

获取当前用户的所有列表。

### 请求参数

无（使用 API Key 对应用户）

### 响应

```json
{
  "success": true,
  "code": "0",
  "message": "success",
  "traceId": "xxx",
  "data": [ UserListDTO, ... ]
}
```

### 示例

```bash
curl "https://api.xgo.ing/openapi/v1/list/all" \
  -H "X-API-KEY: $XGO_API_KEY"
```

---

## 获取单个列表

`GET /openapi/v1/list/get`

按 ID 获取单个列表详情，包含成员列表。私密列表仅所有者可见。

### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| listId | String | 是 | 列表 ID |

### 响应

```json
{
  "success": true,
  "code": "0",
  "message": "success",
  "traceId": "xxx",
  "data": UserListDTO
}
```

### 示例

```bash
curl "https://api.xgo.ing/openapi/v1/list/get?listId=LIST_abc12345" \
  -H "X-API-KEY: $XGO_API_KEY"
```

---

## 创建或更新列表

`POST /openapi/v1/list/save`

创建新列表或更新已有列表。省略 `id` 为创建，提供 `id` 为更新。更新时会验证所有权。

### 请求体

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | String | 否 | 列表 ID。省略为创建，提供为更新 |
| name | String | 是 | 列表名称 |
| description | String | 否 | 列表描述 |
| privateList | Boolean | 否 | 是否为私密列表 |
| order | Integer | 否 | 显示排序 |

### 限制

| 会员等级 | 最大列表数 |
|---------|----------|
| PLUS | 20 |
| PRO | 100 |

### 响应

```json
{
  "success": true,
  "code": "0",
  "message": "success",
  "traceId": "xxx",
  "data": "LIST_abc12345"
}
```

返回列表 ID（字符串）。

### 示例

```bash
# 创建列表
curl -X POST https://api.xgo.ing/openapi/v1/list/save \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: $XGO_API_KEY" \
  -d '{"name":"AI Researchers","description":"AI 领域的研究者","privateList":false}'

# 更新列表
curl -X POST https://api.xgo.ing/openapi/v1/list/save \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: $XGO_API_KEY" \
  -d '{"id":"LIST_abc12345","name":"AI Researchers (Updated)"}'
```

---

## 添加成员

`POST /openapi/v1/list/addMember`

将用户添加到列表。

### 请求体

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| listId | String | 是 | 列表 ID |
| member | UserBrief | 是 | 要添加的成员 |
| member.id | String | 是 | 用户 ID（必填） |
| member.name | String | 否 | 显示名称 |
| member.userName | String | 否 | 用户名（@handle） |
| member.profileImageUrl | String | 否 | 头像 URL |

### 限制

| 会员等级 | 每个列表最大成员数 |
|---------|-----------------|
| PLUS | 200 |
| PRO | 1000 |

### 响应

```json
{
  "success": true,
  "code": "0",
  "message": "success",
  "traceId": "xxx",
  "data": "LIST_abc12345"
}
```

返回列表 ID。

### 示例

```bash
curl -X POST https://api.xgo.ing/openapi/v1/list/addMember \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: $XGO_API_KEY" \
  -d '{"listId":"LIST_abc12345","member":{"id":"44196397","name":"Elon Musk","userName":"elonmusk"}}'
```

---

## 移除成员

`POST /openapi/v1/list/removeMember`

从列表中移除用户。

### 请求体

与添加成员相同结构，仅需 `member.id`。

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| listId | String | 是 | 列表 ID |
| member | UserBrief | 是 | 要移除的成员 |
| member.id | String | 是 | 用户 ID（必填） |

### 响应

```json
{
  "success": true,
  "code": "0",
  "message": "success",
  "traceId": "xxx",
  "data": "LIST_abc12345"
}
```

### 示例

```bash
curl -X POST https://api.xgo.ing/openapi/v1/list/removeMember \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: $XGO_API_KEY" \
  -d '{"listId":"LIST_abc12345","member":{"id":"44196397"}}'
```

---

## 数据类型

### UserListDTO

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String | 列表 ID |
| userId | String | 所有者用户 ID |
| userName | String | 所有者用户名 |
| twitterListId | String | 同步的 X 列表 ID |
| ownerId | String | X 列表原始所有者 ID |
| name | String | 列表名称 |
| description | String | 列表描述 |
| privateList | Boolean | 是否私密 |
| memberCount | Integer | 成员数量 |
| members | List\<UserBrief\> | 成员列表 |
| order | Integer | 显示排序 |

### UserBrief

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String | 用户 ID |
| name | String | 显示名称 |
| userName | String | 用户名（@handle） |
| profileImageUrl | String | 头像 URL |

---

## 错误码

**重要**: 部分错误返回 HTTP 200 但响应体中 `success: false`。始终检查 `response.success` — 不要仅依赖 HTTP 状态码。

| 错误码 | HTTP 状态码 | 说明 |
|--------|------------|------|
| AUTH_001 | 401 | API Key 缺失 |
| AUTH_002 | 401 | API Key 无效 |
| AUTH_003 | 401 | 用户设置无效 |
| AUTH_004 | 403 | 需要 Plus 或 Pro 会员 |
| xgo-0002 | **200** | 列表不存在（注意: HTTP 200，需检查 `success` 字段） |
| xgo-0005 | **200** | 成员数超限（PLUS 200, PRO 1000） |
| xgo-0011 | **200** | 列表数超限（PLUS 20, PRO 100） |
| xgo-0010 | 429 | 频率限制（PLUS 200次/分, PRO 600次/分） |
| xgo-1001 | 400 | 参数错误 |
| xgo-9005 | **200** | 操作不允许（如修改非自己的列表） |
| xgo-9999 | 500 | 系统错误 |

## 统一响应格式

```json
{
  "success": true,
  "code": "0",
  "message": "success",
  "traceId": "xxx",
  "data": { ... }
}
```
