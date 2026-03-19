# BestBlogs API 认证

## Admin API

管理操作（查询列表、保存分析/翻译结果、添加源）使用 Admin 认证：

| 变量 | 用途 |
|------|------|
| `BESTBLOGS_ADMIN_USER_ID` | 管理员用户 ID |
| `BESTBLOGS_ADMIN_JWT_TOKEN` | 管理员 JWT Token |

```bash
-H "Authorization: Bearer $BESTBLOGS_ADMIN_JWT_TOKEN"
-H "User-Id: $BESTBLOGS_ADMIN_USER_ID"
-H "Content-Type: application/json"
```

## OpenAPI

读取操作（获取文章正文、资源列表）使用 API Key 认证：

| 变量 | 用途 |
|------|------|
| `BESTBLOGS_API_KEY` | OpenAPI 密钥 |

```bash
-H "X-API-KEY: $BESTBLOGS_API_KEY"
```

若环境变量未设置，提示用户配置。

接口地址：`https://api.bestblogs.dev`
