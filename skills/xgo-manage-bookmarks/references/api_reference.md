# XGo 收藏管理 API 参考

接口地址: `https://api.xgo.ing`
认证方式: 请求头 `X-API-KEY`（环境变量 `XGO_API_KEY`）

## 目录

1. [获取所有收藏夹](#获取所有收藏夹)
2. [创建或更新收藏夹](#创建或更新收藏夹)
3. [收藏推文](#收藏推文)
4. [移除收藏](#移除收藏)
5. [数据类型](#数据类型)
6. [错误码](#错误码)

---

## 获取所有收藏夹

`GET /openapi/v1/folder/all`

获取当前用户的所有收藏夹。

### 请求参数

无（使用 API Key 对应用户）

### 响应

```json
{
  "success": true,
  "code": "0",
  "message": "success",
  "traceId": "xxx",
  "data": [ UserBookmarkFolderDTO, ... ]
}
```

### 示例

```bash
curl "https://api.xgo.ing/openapi/v1/folder/all" \
  -H "X-API-KEY: $XGO_API_KEY"
```

---

## 创建或更新收藏夹

`POST /openapi/v1/folder/save`

创建新收藏夹或更新已有收藏夹。省略 `id` 为创建，提供 `id` 为更新。

### 请求体

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | String | 否 | 收藏夹 ID。省略为创建，提供为更新 |
| name | String | 是 | 收藏夹名称 |
| description | String | 否 | 收藏夹描述 |
| defaultFolder | Boolean | 否 | 是否设为默认收藏夹 |
| order | Integer | 否 | 显示排序 |

### 响应

```json
{
  "success": true,
  "code": "0",
  "message": "success",
  "traceId": "xxx",
  "data": "FOLDER_abc12345"
}
```

返回收藏夹 ID（字符串）。

### 示例

```bash
# 创建收藏夹
curl -X POST https://api.xgo.ing/openapi/v1/folder/save \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: $XGO_API_KEY" \
  -d '{"name":"AI Papers","description":"AI 领域的论文和研究"}'

# 更新收藏夹
curl -X POST https://api.xgo.ing/openapi/v1/folder/save \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: $XGO_API_KEY" \
  -d '{"id":"FOLDER_abc12345","name":"AI Papers (Updated)"}'
```

---

## 收藏推文

`POST /openapi/v1/folder/collect`

将推文收藏到指定收藏夹。若省略 `folderId`，收藏到默认收藏夹（不存在时自动创建）。

### 请求体

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| folderId | String | 否 | 目标收藏夹 ID。省略则使用默认收藏夹 |
| tweet | TweetBrief | 是 | 要收藏的推文 |
| tweet.tweetId | String | 是 | 推文 ID（必填） |
| tweet.authorId | String | 否 | 作者 ID |

### 响应

```json
{
  "success": true,
  "code": "0",
  "message": "success",
  "traceId": "xxx",
  "data": "FOLDER_abc12345"
}
```

返回收藏夹 ID。

### 示例

```bash
# 收藏到指定收藏夹
curl -X POST https://api.xgo.ing/openapi/v1/folder/collect \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: $XGO_API_KEY" \
  -d '{"folderId":"FOLDER_abc12345","tweet":{"tweetId":"1234567890","authorId":"44196397"}}'

# 收藏到默认收藏夹
curl -X POST https://api.xgo.ing/openapi/v1/folder/collect \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: $XGO_API_KEY" \
  -d '{"tweet":{"tweetId":"1234567890"}}'
```

---

## 移除收藏

`POST /openapi/v1/folder/remove`

从收藏夹中移除推文。

### 请求体

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| folderId | String | 否 | 收藏夹 ID。省略则从所有收藏夹移除 |
| tweetId | String | 是 | 要移除的推文 ID |

### 行为

- 提供 `folderId`: 仅从该收藏夹移除
- 省略 `folderId`: 从所有收藏夹移除该推文

**注意**: 若省略 `folderId`（从所有收藏夹移除），`data` 可能为 `null` 或空字符串，属正常行为，以 `success: true` 判断操作成功。

### 响应

```json
{
  "success": true,
  "code": "0",
  "message": "success",
  "traceId": "xxx",
  "data": "FOLDER_abc12345"
}
```

### 示例

```bash
# 从指定收藏夹移除
curl -X POST https://api.xgo.ing/openapi/v1/folder/remove \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: $XGO_API_KEY" \
  -d '{"folderId":"FOLDER_abc12345","tweetId":"1234567890"}'

# 从所有收藏夹移除
curl -X POST https://api.xgo.ing/openapi/v1/folder/remove \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: $XGO_API_KEY" \
  -d '{"tweetId":"1234567890"}'
```

---

## 数据类型

### UserBookmarkFolderDTO

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String | 收藏夹 ID |
| userId | String | 所有者用户 ID |
| userName | String | 所有者用户名 |
| name | String | 收藏夹名称 |
| description | String | 收藏夹描述 |
| defaultFolder | Boolean | 是否为默认收藏夹 |
| tweetCount | Integer | 收藏的推文数量 |
| tweets | List\<TweetBrief\> | 收藏的推文列表 |
| order | Integer | 显示排序 |

### TweetBrief

| 字段 | 类型 | 说明 |
|------|------|------|
| tweetId | String | 推文 ID |
| authorId | String | 作者 ID |
| tweetCreateTime | Date | 推文创建时间 |
| bookmarkTime | Date | 收藏时间 |

---

## 错误码

**重要**: 部分错误返回 HTTP 200 但响应体中 `success: false`。始终检查 `response.success` — 不要仅依赖 HTTP 状态码。

| 错误码 | HTTP 状态码 | 说明 |
|--------|------------|------|
| AUTH_001 | 401 | API Key 缺失 |
| AUTH_002 | 401 | API Key 无效 |
| AUTH_003 | 401 | 用户设置无效 |
| AUTH_004 | 403 | 需要 Plus 或 Pro 会员 |
| xgo-0003 | **200** | 收藏夹不存在（注意: HTTP 200，需检查 `success` 字段） |
| xgo-0010 | 429 | 频率限制（PLUS 200次/分, PRO 600次/分） |
| xgo-1001 | 400 | 参数错误 |
| xgo-9005 | **200** | 操作不允许 |
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
