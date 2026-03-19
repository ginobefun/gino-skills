---
name: xgo-manage-bookmarks
description: "Use when 用户想通过 XGo 查看或修改 X 的书签及书签文件夹。"
hooks:
  PreToolUse:
    - matcher: "Bash"
      hooks:
        - type: command
          command: "bash scripts/hooks/write-guard.sh"
          timeout: 5
---

# 收藏管理器 (XGo Manage Bookmarks)

通过 XGo (xgo.ing) 开放接口管理 Twitter/X 收藏 — 查看、创建、编辑收藏夹，收藏和移除推文。

完整 API 参数详情见 `references/api_reference.md`。

## When to Use

- 用户要查看、创建或更新 X 收藏夹
- 用户要把某条推文加入收藏夹，或从收藏夹中移除
- 任务核心是 bookmark/folder 管理，而不是读取推文本身

## When Not to Use

- 想读取收藏夹里的推文内容时，使用 `xgo-fetch-tweets`
- 想搜索推文后再决定是否收藏时，先用 `xgo-search-tweets`
- 想管理关注列表或 X Lists 时，使用 `xgo-manage-follows` 或 `xgo-manage-lists`

## Gotchas

- 写操作前要先确认目标 folder 或 tweet ID，避免误收藏到默认文件夹
- 不能只看 HTTP 状态码；`success: false` 的 HTTP 200 也算失败
- 收藏推文时 `tweet.tweetId` 是必填项，缺它最容易触发参数错误
- “查看收藏夹里的推文”不是本 skill 的职责，应显式路由到 `xgo-fetch-tweets`

## Related Skills

- `xgo-fetch-tweets`：读取某个 bookmark folder 里的推文
- `xgo-search-tweets`：先找推文，再执行收藏动作
- `xgo-manage-lists`：管理 X Lists，而非 bookmarks
- `xgo-manage-follows`：管理 follows，而非 bookmarks

## Shared Scripts

- 优先复用 `scripts/shared/xgo_client.py`
- 收藏夹读取、保存和 bookmark 写后校验优先走 `scripts/examples/`

## Worker Entrypoints

优先把以下 `scripts/examples/` 当成稳定 worker 入口：

```bash
python3 scripts/examples/xgo_folder_overview.py
python3 scripts/examples/xgo_save_folder.py --name "AI Papers"
python3 scripts/examples/xgo_bookmark_action.py --action collect --folder-id FOLDER_abc12345 --tweet-id 1234567890
python3 scripts/examples/xgo_bookmark_action.py --action remove --folder-id FOLDER_abc12345 --tweet-id 1234567890
```

这些脚本统一输出 JSON 契约，至少包含 `ok`、`action`、`items`、`write`、`verify`、`note`、`meta`。
本 skill 应根据这些字段判断收藏夹是否存在、写入是否完成，以及推文是否确实进入或离开目标文件夹。

## 认证

认证方式见 `../../references/shared/auth-xgo.md`。

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
python3 scripts/examples/xgo_folder_overview.py
```

### 场景 B: 创建新收藏夹

```bash
python3 scripts/examples/xgo_save_folder.py \
  --name "AI Papers" \
  --description "AI 领域的论文和研究"
```

- 返回新创建的收藏夹 ID
- 可设置 `defaultFolder: true` 将其设为默认收藏夹

### 场景 C: 编辑收藏夹

提供 `id` 字段即为更新操作：

```bash
python3 scripts/examples/xgo_save_folder.py \
  --folder-id FOLDER_abc12345 \
  --name "AI Papers (Updated)" \
  --description "更新后的描述"
```

### 场景 D: 收藏推文

```bash
python3 scripts/examples/xgo_bookmark_action.py \
  --action collect \
  --folder-id FOLDER_abc12345 \
  --tweet-id 1234567890 \
  --author-id 44196397
```

- `tweet.tweetId` 为必填字段
- `tweet.authorId` 为可选字段，建议填写
- 若省略 `folderId`，推文将收藏到默认收藏夹（不存在时自动创建）

### 场景 E: 移除收藏

```bash
# 从指定收藏夹移除
python3 scripts/examples/xgo_bookmark_action.py \
  --action remove \
  --folder-id FOLDER_abc12345 \
  --tweet-id 1234567890

# 从所有收藏夹移除（省略 folderId）
python3 scripts/examples/xgo_bookmark_action.py \
  --action remove \
  --tweet-id 1234567890
```

- 提供 `folderId`: 仅从该收藏夹移除
- 省略 `folderId`: 从所有收藏夹移除该推文

## 参数调整

根据用户输入调整参数：
- "创建一个 AI 收藏夹" → `folder/save`，`name: "AI"`
- "收藏这条推文" → `folder/collect`（需要推文 ID）
- "收藏到 AI 文件夹" → 先运行 `xgo_folder_overview.py` 找到收藏夹 ID，再执行 `xgo_bookmark_action.py --action collect`
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

通用错误码见 `../../references/shared/error-handling-xgo.md`。本 skill 额外关注：

- `xgo-0003`（收藏夹不存在）: 收藏夹 ID 可能不正确，建议用户先运行 `xgo_folder_overview.py` 查看可用收藏夹
- `xgo-1001`（参数错误，HTTP 400）: 请求体字段缺失或格式不正确。最常见原因：`folder/collect` 缺少 `tweet.tweetId`，或 `folder/remove` 缺少 `tweetId`
- `xgo-9005`（操作不允许，HTTP 200）: 可能尝试操作非自己的收藏夹。注意：此错误以 HTTP 200 返回，必须检查 `success` 字段
