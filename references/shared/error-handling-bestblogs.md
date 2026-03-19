# BestBlogs API 错误处理

**重要**: 始终先检查 `response.success` 再处理 `response.data`。注意 `/dify/resource/markdown` 的 `success` 为**字符串**类型。

## 通用错误码

| 错误 | HTTP | 处理 |
|------|------|------|
| `401` | 401 | 认证失败，立即停止并提示检查 `BESTBLOGS_ADMIN_JWT_TOKEN` |
| `403` | 403 | 权限不足，立即停止并提示检查 `BESTBLOGS_ADMIN_USER_ID` 是否正确 |
| `400` | 400 | 请求参数错误，记录错误信息，继续下一个 |
| `429` | 429 | 频率限制，等待 10 秒后重试一次 |
| HTTP 200 但 `success: false` | **200** | 业务错误，读取 `message` 字段内容 |

## 批量处理错误策略

- 单篇/单条失败：记录错误，继续下一篇
- markdown 返回空：先调 `runPrepareFlow`，重试最多 3 次，仍失败再跳过
- 分析/翻译 JSON 格式错误：重试一次，仍失败则跳过
- 连续失败超过 10 次：暂停并告知用户
