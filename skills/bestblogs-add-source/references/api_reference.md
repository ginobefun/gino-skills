# BestBlogs 添加订阅源 API 参考

## 认证

所有请求需要以下请求头：

```bash
-H "Authorization: Bearer $BESTBLOGS_ADMIN_JWT_TOKEN"
-H "User-Id: $BESTBLOGS_ADMIN_USER_ID"
-H "Content-Type: application/json"
```

| 环境变量 | 用途 |
|----------|------|
| `BESTBLOGS_ADMIN_JWT_TOKEN` | 管理员 JWT Token |
| `BESTBLOGS_ADMIN_USER_ID` | 管理员用户 ID |

接口地址: `https://api.bestblogs.dev`

---

## 端点: 添加 RSS 订阅源

### POST `/api/admin/source/addRssUrl`

添加一个 RSS 订阅源到 BestBlogs 系统。

### 请求

```bash
curl -s -X POST "https://api.bestblogs.dev/api/admin/source/addRssUrl" \
  -H "Authorization: Bearer $BESTBLOGS_ADMIN_JWT_TOKEN" \
  -H "User-Id: $BESTBLOGS_ADMIN_USER_ID" \
  -H "Content-Type: application/json" \
  -d '{"rssUrl":"https://medium.com/feed/airbnb-engineering"}'
```

### 请求参数

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `rssUrl` | string | 是 | RSS/Atom feed 的完整 URL |

### 成功响应

```json
{
  "success": true,
  "code": null,
  "message": null,
  "requestId": "T7ef81db15d3241c490d1c13d3e7be914",
  "data": "SOURCE_f1142f"
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `success` | boolean | 是否成功 |
| `code` | string\|null | 错误码（成功时为 null） |
| `message` | string\|null | 错误信息（成功时为 null） |
| `requestId` | string | 请求追踪 ID |
| `data` | string | 新创建的订阅源 ID（格式: `SOURCE_xxxxxx`） |

### 错误响应

**重要**: 始终先检查 `response.success` 再处理 `response.data`。部分错误返回 HTTP 200 但 `success: false`。

| HTTP 状态码 | 错误码 | 说明 | 处理方式 |
|-------------|--------|------|---------|
| 400 | - | 请求参数错误（如缺少 `rssUrl` 字段） | 记录错误信息，继续下一个 |
| 401 | - | 认证失败（Token 无效或过期） | 立即停止，提示用户检查 `BESTBLOGS_ADMIN_JWT_TOKEN` |
| 403 | - | 权限不足（User-Id 无管理员权限） | 立即停止，提示用户检查 `BESTBLOGS_ADMIN_USER_ID` |
| 429 | - | 频率限制 | 等待 10 秒后重试一次 |
| **200** | `success: false` | 业务逻辑错误（URL 已存在、URL 格式无效、RSS 无法解析等） | 记录 `message` 字段内容，继续下一个 |
| 500 | - | 服务端错误 | 记录错误，继续下一个 |

---

## OPML 格式参考

OPML 是订阅源交换的标准格式，结构如下：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <head>
    <title>My Subscriptions</title>
  </head>
  <body>
    <outline text="Tech" title="Tech">
      <outline text="Airbnb Engineering" title="Airbnb Engineering"
        type="rss" xmlUrl="https://medium.com/feed/airbnb-engineering"
        htmlUrl="https://medium.com/airbnb-engineering" />
      <outline text="Netflix Tech Blog" title="Netflix Tech Blog"
        type="rss" xmlUrl="https://netflixtechblog.com/feed"
        htmlUrl="https://netflixtechblog.com" />
    </outline>
    <outline text="Design" title="Design">
      <outline text="Smashing Magazine" title="Smashing Magazine"
        type="rss" xmlUrl="https://www.smashingmagazine.com/feed/"
        htmlUrl="https://www.smashingmagazine.com" />
    </outline>
  </body>
</opml>
```

**提取规则：**
- 目标属性: `xmlUrl` — 这是 RSS feed 地址
- 忽略: 仅有 `text`/`title` 但无 `xmlUrl` 的节点（这些是分类文件夹）
- 可选提取: `text` 或 `title` 属性作为来源名称
- `htmlUrl` 是网站主页地址，不是 feed 地址，不要混淆
