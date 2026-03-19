# XGo API 错误处理

**重要**: 始终先检查 `response.success` 再处理 `response.data`。部分错误返回 HTTP 200 但 `success: false` — 不要仅依赖 HTTP 状态码。

## 通用错误码

| 错误 | HTTP | 处理 |
|------|------|------|
| `401` | 401 | 检查 `XGO_API_KEY` 是否已设置且有效 |
| `403` | 403 | 开放接口需要 Plus 或 Pro 会员 |
| `429` | 429 | 频率限制 — 等待 10 秒后重试一次。若仍为 429，告知用户："频率限制，请稍后重试。"（PLUS 200 次/分，PRO 600 次/分） |
| `xgo-0012` | **200** | 部分功能需要更高等级会员。注意：此错误以 HTTP 200 返回，必须检查 `success` 字段 |
| `xgo-9005` | **200** | 操作不允许。注意：此错误以 HTTP 200 返回，必须检查 `success` 字段 |
| `xgo-1001` | 400 | 请求体字段缺失或格式不正确 |

## 通用兜底

- `success: false` 且 `code` 非零：读取响应体中的 `code` 和 `message`，对照各 skill 的 `references/api_reference.md` 中的错误码处理
- `data` 为空或 `totalSize: 0`：提示用户调整查询条件

## 批量写操作错误处理

写操作（follow/unfollow、add/remove member、collect/remove bookmark）逐条检查 `response.success`：
- `success: true` → 记录 ✅
- `success: false` → 记录 ❌ 和 `message`，**继续处理下一个**（单个失败不中断整批）
- 连续失败超过 3 次 → 暂停并告知用户，可能是系统性问题
