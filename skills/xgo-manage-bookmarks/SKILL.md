---
name: xgo-manage-bookmarks
description: "通过 XGo (xgo.ing) 开放接口管理 Twitter/X 收藏。适用场景：(1) 查看所有收藏夹，(2) 创建收藏夹，(3) 收藏推文到指定文件夹，(4) 取消收藏/移除推文，(5) 编辑收藏夹信息。触发短语：'管理收藏', '收藏推文', 'bookmark tweet', '添加收藏', 'add bookmark', '收藏夹', 'bookmark folder', '我的收藏', 'my bookmarks', '新建收藏夹', '取消收藏', 'remove bookmark', '收藏到', 'save to folder', 或任何与 Twitter 收藏管理相关的表述。注意：浏览收藏夹中的推文内容请使用 xgo-fetch-tweets（传入 folderId 参数并设置 queryType 为 bookmark）。"
---

# 收藏管理器 (XGo Manage Bookmarks)

通过 XGo (xgo.ing) 开放接口管理 Twitter/X 收藏 — 查看、创建、编辑收藏夹，收藏和移除推文。

完整 API 参数详情见 `references/api_reference.md`。

## 认证

所有请求需要 `X-API-KEY` 请求头。从环境变量 `XGO_API_KEY` 读取密钥：

```bash
-H "X-API-KEY: $XGO_API_KEY"
```

若 `XGO_API_KEY` 未设置，提示用户配置。

接口地址：`https://api.xgo.ing`

## 可用端点

| 端点 | 方法 | 类型 | 用途 |
|------|------|------|------|
| `/openapi/v1/folder/all` | GET | DB | 获取所有收藏夹 |
| `/openapi/v1/folder/save` | POST | 写入 | 创建或更新收藏夹 |
| `/openapi/v1/folder/collect` | POST | 写入 | 收藏推文到收藏夹 |
| `/openapi/v1/folder/remove` | POST | 写入 | 从收藏夹移除推文 |

## 核心工作流

### 场景 A: 查看所有收藏夹

```bash
curl -s "https://api.xgo.ing/openapi/v1/folder/all" \
  -H "X-API-KEY: $XGO_API_KEY"
```

### 场景 B: 创建新收藏夹

```bash
curl -s -X POST https://api.xgo.ing/openapi/v1/folder/save \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: $XGO_API_KEY" \
  -d '{"name":"AI Papers","description":"AI 领域的论文和研究"}'
```

- 返回新创建的收藏夹 ID
- 可设置 `defaultFolder: true` 将其设为默认收藏夹

### 场景 C: 编辑收藏夹

提供 `id` 字段即为更新操作：

```bash
curl -s -X POST https://api.xgo.ing/openapi/v1/folder/save \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: $XGO_API_KEY" \
  -d '{"id":"FOLDER_abc12345","name":"AI Papers (Updated)","description":"更新后的描述"}'
```

### 场景 D: 收藏推文

```bash
curl -s -X POST https://api.xgo.ing/openapi/v1/folder/collect \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: $XGO_API_KEY" \
  -d '{"folderId":"FOLDER_abc12345","tweet":{"tweetId":"1234567890","authorId":"44196397"}}'
```

- `tweet.tweetId` 为必填字段
- `tweet.authorId` 为可选字段，建议填写
- 若省略 `folderId`，推文将收藏到默认收藏夹（不存在时自动创建）

### 场景 E: 移除收藏

```bash
# 从指定收藏夹移除
curl -s -X POST https://api.xgo.ing/openapi/v1/folder/remove \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: $XGO_API_KEY" \
  -d '{"folderId":"FOLDER_abc12345","tweetId":"1234567890"}'

# 从所有收藏夹移除（省略 folderId）
curl -s -X POST https://api.xgo.ing/openapi/v1/folder/remove \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: $XGO_API_KEY" \
  -d '{"tweetId":"1234567890"}'
```

- 提供 `folderId`: 仅从该收藏夹移除
- 省略 `folderId`: 从所有收藏夹移除该推文

## 参数调整

根据用户输入调整参数：
- "创建一个 AI 收藏夹" → `folder/save`，`name: "AI"`
- "收藏这条推文" → `folder/collect`（需要推文 ID）
- "收藏到 AI 文件夹" → 先 `folder/all` 找到收藏夹 ID，再 `folder/collect` 指定 `folderId`
- "取消收藏" → `folder/remove`
- "从所有收藏夹移除" → `folder/remove`，省略 `folderId`
- "设为默认收藏夹" → `folder/save`，`defaultFolder: true`
- "查看收藏夹里的推文" → 告知用户："浏览收藏夹推文内容请使用 xgo-fetch-tweets skill（传入 `folderId` 参数和 `queryType: \"bookmark\"`）"

### 获取推文 ID

收藏操作需要推文 ID。推文 ID 的来源：
- 用户提供的推文链接：`https://x.com/username/status/1234567890` → 提取 `1234567890`
- 之前通过 xgo-fetch-tweets 或 xgo-search-tweets 拉取的推文数据中的 `id` 字段
- 用户直接提供的 ID

## 输出格式

### 收藏夹概览

```markdown
## 我的收藏夹 (共 N 个)

### 1. AI Papers ⭐默认
- **ID**: FOLDER_abc12345
- **描述**: AI 领域的论文和研究
- **推文数**: 42

### 2. Web3 资讯
- **ID**: FOLDER_def67890
- **描述**: Web3 相关的重要资讯
- **推文数**: 15
```

### 操作结果

```markdown
✅ 已创建收藏夹 "AI Papers" (ID: FOLDER_abc12345)
✅ 已将推文 1234567890 收藏到 "AI Papers"
✅ 已从 "AI Papers" 移除推文 1234567890
✅ 已从所有收藏夹移除推文 1234567890
✅ 已更新收藏夹 "AI Papers" 的描述
```

### 输出完整性规则

- 收藏夹 `description` 为空时省略该行
- `defaultFolder` 为 `true` 时在名称后添加"⭐默认"标记
- 操作成功时输出确认信息，包含收藏夹名称和推文 ID

## 错误处理

**重要**: 始终先检查 `response.success` 再处理 `response.data`。部分错误返回 HTTP 200 但 `success: false` — 不要仅依赖 HTTP 状态码。

- `401`: 检查 `XGO_API_KEY` 是否已设置且有效
- `403`: 开放接口需要 Plus 或 Pro 会员
- `429`: 频率限制 — 等待 10 秒后重试一次。若仍为 429，告知用户："频率限制，请稍后重试。"
- `xgo-0003`（收藏夹不存在）: 收藏夹 ID 可能不正确，建议用户先 `folder/all` 查看可用收藏夹
- `xgo-1001`（参数错误，HTTP 400）: 请求体字段缺失或格式不正确。最常见原因：`folder/collect` 缺少 `tweet.tweetId`，或 `folder/remove` 缺少 `tweetId`
- `xgo-9005`（操作不允许，HTTP 200）: 可能尝试操作非自己的收藏夹。注意：此错误以 HTTP 200 返回，必须检查 `success` 字段
