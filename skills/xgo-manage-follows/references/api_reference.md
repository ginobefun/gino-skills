# XGo 关注管理 API 参考

接口地址: `https://api.xgo.ing`
认证方式: 请求头 `X-API-KEY`（环境变量 `XGO_API_KEY`）

## 目录

1. [关注列表](#关注列表)
2. [刷新关注列表](#刷新关注列表)
3. [关注状态](#关注状态)
4. [关注统计](#关注统计)
5. [关注标签](#关注标签)
6. [推荐关注](#推荐关注)
7. [推荐取消关注](#推荐取消关注)
8. [关注用户](#关注用户)
9. [取消关注用户](#取消关注用户)
10. [数据类型](#数据类型)
11. [错误码](#错误码)

---

## 关注列表

`GET /openapi/v1/following/list`

分页获取当前用户的关注列表（从 DB 缓存查询）。

### 请求参数

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| page | Integer | 否 | 1 | 页码（最小 1） |
| size | Integer | 否 | 20 | 每页数量（最大 100） |

### 响应

```json
{
  "success": true,
  "code": "0",
  "message": "success",
  "traceId": "xxx",
  "data": {
    "currentPage": 1,
    "pageSize": 50,
    "totalPage": 8,
    "totalSize": 356,
    "data": [ UserDTO, ... ]
  }
}
```

**注意**: 此端点返回的 UserDTO 仅包含基本字段: id, name, userName, profileImageUrl, markTags, markNotes。不包含 followers、following 等详细字段。

### 示例

```bash
curl "https://api.xgo.ing/openapi/v1/following/list?page=1&size=50" \
  -H "X-API-KEY: $XGO_API_KEY"
```

---

## 刷新关注列表

`POST /openapi/v1/following/refresh`

触发从 Twitter API 异步刷新关注列表。

### 请求参数

无（使用 API Key 对应用户）

### 刷新间隔限制

| 会员等级 | 最小刷新间隔 |
|---------|------------|
| PLUS | 15 天 |
| PRO | 1 天 |

### 响应

```json
{
  "success": true,
  "code": "0",
  "message": "success",
  "traceId": "xxx",
  "data": true
}
```

返回 `true` 表示刷新已启动。刷新为异步操作，完成前 `following/list` 仍返回旧数据。

### 示例

```bash
curl -X POST "https://api.xgo.ing/openapi/v1/following/refresh" \
  -H "X-API-KEY: $XGO_API_KEY"
```

---

## 关注状态

`GET /openapi/v1/following/status`

检查当前用户是否关注了目标用户。

### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| targetUserName | String | 是 | 目标用户名（不含 @） |

### 响应

```json
{
  "success": true,
  "code": "0",
  "message": "success",
  "traceId": "xxx",
  "data": {
    "following": true,
    "tags": ["AI", "Tech"],
    "remark": "Tesla & SpaceX CEO"
  }
}
```

### FollowingStatusDTO 字段

| 字段 | 类型 | 说明 |
|------|------|------|
| following | Boolean | 是否已关注 |
| tags | List\<String\> | 为该用户设置的自定义标签 |
| remark | String | 自定义备注 |

### 示例

```bash
curl "https://api.xgo.ing/openapi/v1/following/status?targetUserName=elonmusk" \
  -H "X-API-KEY: $XGO_API_KEY"
```

---

## 关注统计

`GET /openapi/v1/following/stats`

获取关注统计数据，包含分类信息。

### 请求参数

无（使用 API Key 对应用户）

### 响应

```json
{
  "success": true,
  "code": "0",
  "message": "success",
  "traceId": "xxx",
  "data": {
    "count": 356,
    "listCount": 8,
    "categorizedCount": 280,
    "uncategorizedCount": 76,
    "distribution": {
      "AI Researchers": 45,
      "Web3 Builders": 38,
      "Startup Founders": 32
    }
  }
}
```

### FollowingStatsResult 字段

| 字段 | 类型 | 说明 |
|------|------|------|
| count | Integer | 总关注数 |
| listCount | Integer | 列表数量 |
| categorizedCount | Integer | 已分类到列表的用户数 |
| uncategorizedCount | Integer | 未分类的用户数 |
| distribution | Map\<String, Integer\> | 每个列表名称对应的成员数 |

### 示例

```bash
curl "https://api.xgo.ing/openapi/v1/following/stats" \
  -H "X-API-KEY: $XGO_API_KEY"
```

---

## 关注标签

`GET /openapi/v1/following/tags`

获取所有关注用户的标签及计数，按计数倒序排列。

### 请求参数

无（使用 API Key 对应用户）

### 响应

```json
{
  "success": true,
  "code": "0",
  "message": "success",
  "traceId": "xxx",
  "data": [
    { "tag": "AI", "count": 89 },
    { "tag": "Tech", "count": 72 },
    { "tag": "Startup", "count": 56 }
  ]
}
```

### TagCountDTO 字段

| 字段 | 类型 | 说明 |
|------|------|------|
| tag | String | 标签名称 |
| count | Integer | 使用该标签的关注用户数 |

### 示例

```bash
curl "https://api.xgo.ing/openapi/v1/following/tags" \
  -H "X-API-KEY: $XGO_API_KEY"
```

---

## 推荐关注

`GET /openapi/v1/following/suggest-follow`

获取推荐关注的用户。返回近期活跃、尚未关注的热门用户，按粉丝数升序排列，最多 20 人。

### 请求参数

无（使用 API Key 对应用户）

### 响应

```json
{
  "success": true,
  "code": "0",
  "message": "success",
  "traceId": "xxx",
  "data": [ UserDTO, ... ]
}
```

返回完整的 UserDTO 列表（最多 20 人），包含 id, name, userName, description, followers, following, tags 等全部字段。

### 示例

```bash
curl "https://api.xgo.ing/openapi/v1/following/suggest-follow" \
  -H "X-API-KEY: $XGO_API_KEY"
```

---

## 推荐取消关注

`GET /openapi/v1/following/suggest-unfollow`

获取推荐取消关注的用户。返回粉丝 ≤100 或 60 天内无推文的不活跃用户，按粉丝数升序排列，最多 50 人。

### 请求参数

无（使用 API Key 对应用户）

### 响应

```json
{
  "success": true,
  "code": "0",
  "message": "success",
  "traceId": "xxx",
  "data": [ UserDTO, ... ]
}
```

返回完整的 UserDTO 列表（最多 50 人），包含 id, name, userName, description, followers, following, tags 等全部字段。

### 示例

```bash
curl "https://api.xgo.ing/openapi/v1/following/suggest-unfollow" \
  -H "X-API-KEY: $XGO_API_KEY"
```

---

## 关注用户

`POST /openapi/v1/following/follow`

关注目标用户。**写操作 — 必须在用户明确确认后才能调用。**

### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| targetUserName | String (query) | 是 | 要关注的用户名（不含 @） |

### 响应

```json
{
  "success": true,
  "code": "0",
  "message": "success",
  "traceId": "xxx",
  "data": true
}
```

返回 `true` 表示关注成功。若 `success: false`，检查 `code` 和 `message` 确定失败原因。

### 示例

```bash
curl -X POST "https://api.xgo.ing/openapi/v1/following/follow?targetUserName=elonmusk" \
  -H "X-API-KEY: $XGO_API_KEY"
```

---

## 取消关注用户

`POST /openapi/v1/following/unfollow`

取消关注目标用户。**写操作 — 必须在用户明确确认后才能调用。**

### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| targetUserName | String (query) | 是 | 要取消关注的用户名（不含 @） |

### 响应

```json
{
  "success": true,
  "code": "0",
  "message": "success",
  "traceId": "xxx",
  "data": true
}
```

返回 `true` 表示取关成功。若 `success: false`，检查 `code` 和 `message` 确定失败原因。

### 示例

```bash
curl -X POST "https://api.xgo.ing/openapi/v1/following/unfollow?targetUserName=elonmusk" \
  -H "X-API-KEY: $XGO_API_KEY"
```

---

## 数据类型

### UserDTO（完整版 — suggest-follow/suggest-unfollow 返回）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String | Twitter 用户 ID |
| name | String | 显示名称 |
| userName | String | Twitter handle（@用户名） |
| profileImageUrl | String | 头像 URL |
| url | String | 用户网站 URL |
| location | String | 位置 |
| description | String | 个人简介 |
| followers | Integer | 粉丝数 |
| following | Integer | 关注数 |
| favouritesCount | Integer | 点赞数 |
| statusesCount | Integer | 推文数 |
| mediaCount | Integer | 媒体数 |
| createdAt | Date | 账号创建日期 |
| coverPicture | String | 封面图片 URL |
| profileBio | ProfileBioDTO | 结构化简介（含 URL 链接） |
| tags | List\<String\> | 用户标签 |
| feedId | String | RSS Feed ID |
| latestTweetTime | Date | 最近推文时间 |
| latestFetchTime | Date | 最近数据拉取时间 |

### UserDTO（关注列表版本）

此端点返回的 UserDTO 仅包含基本字段:

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String | Twitter 用户 ID |
| name | String | 显示名称 |
| userName | String | 用户名（@handle） |
| profileImageUrl | String | 头像 URL |
| markTags | List\<String\> | 自定义标签 |
| markNotes | String | 自定义备注 |

**注意**: 不包含 followers、following、description 等完整用户资料字段。如需完整资料，请使用 xgo-view-profile 的 `user/info` 端点。

---

## 错误码

**重要**: 部分错误返回 HTTP 200 但响应体中 `success: false`。始终检查 `response.success` — 不要仅依赖 HTTP 状态码。

| 错误码 | HTTP 状态码 | 说明 |
|--------|------------|------|
| AUTH_001 | 401 | API Key 缺失 |
| AUTH_002 | 401 | API Key 无效 |
| AUTH_003 | 401 | 用户设置无效 |
| AUTH_004 | 403 | 需要 Plus 或 Pro 会员 |
| xgo-0010 | 429 | 频率限制（PLUS 200次/分, PRO 600次/分） |
| xgo-0012 | **200** | 需要 Plus 或 Pro 会员（功能级限制） |
| xgo-1001 | 400 | 参数错误 |
| xgo-9005 | **200** | 操作不允许（如刷新间隔未到） |
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
