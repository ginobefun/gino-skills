---
name: bestblogs-add-source
description: "添加 RSS 订阅源到 BestBlogs。适用场景: (1) 从文本中提取 RSS 链接并添加, (2) 解析 OPML 文件批量导入订阅源, (3) 添加单个或多个 RSS feed 到 BestBlogs, (4) 导入订阅源列表。触发短语: '添加订阅源', '导入订阅', '添加 RSS', 'add source', 'add RSS', 'import OPML', '导入 OPML', 'add feed', '添加 feed', '批量添加订阅', 'import feeds', '订阅源导入', 'add subscription', '新增订阅源', 'import subscription', '导入 RSS', 'import RSS'"
---

# BestBlogs 添加订阅源 (Add RSS Source)

从用户提供的文本、文件或 OPML 中提取 RSS 地址，调用 BestBlogs Admin API 逐个添加为订阅源。

完整 API 参数详情见 `references/api_reference.md`。

## 认证

所有请求使用 Admin API 认证:

| 变量 | 用途 |
|------|------|
| `BESTBLOGS_ADMIN_USER_ID` | 管理员用户 ID |
| `BESTBLOGS_ADMIN_JWT_TOKEN` | 管理员 JWT Token |

```bash
-H "Authorization: Bearer $BESTBLOGS_ADMIN_JWT_TOKEN"
-H "User-Id: $BESTBLOGS_ADMIN_USER_ID"
-H "Content-Type: application/json"
```

若环境变量未设置，提示用户配置。

接口地址: `https://api.bestblogs.dev`

## 可用端点

| 端点 | 方法 | 类型 | 用途 |
|------|------|------|------|
| `/api/admin/source/addRssUrl` | POST | 写入 | 添加 RSS 订阅源 — 写操作，必须在用户明确确认后才能调用 |

## 进度清单

```
- [ ] 阶段一: 解析输入，提取 RSS URL
- [ ] 阶段二: 展示列表，等待用户确认 ⛔ BLOCKING
- [ ] 阶段三: 串行执行添加
- [ ] 阶段四: 输出汇总报告
```

## 核心工作流

### 阶段一：解析输入，提取 RSS URL

根据用户输入类型提取 RSS 地址：

**纯文本输入** — 从文本中识别所有 RSS/Atom feed URL：
- 识别常见 RSS URL 模式：包含 `/feed`, `/rss`, `/atom`, `.xml`, `/feeds/` 等路径的 URL
- 识别标准 URL 格式（`http://` 或 `https://` 开头）
- 去重，去除明显无效的 URL（空值、格式错误）
- 如果解析结果为空（未找到任何有效 RSS URL），输出 "未找到有效的 RSS 地址，请检查输入内容" 并停止

**OPML 文件输入** — 解析 OPML XML 结构：
- 读取用户提供的 `.opml` 或 `.xml` 文件
- 提取所有 `<outline>` 元素中的 `xmlUrl` 属性值
- 忽略没有 `xmlUrl` 的分类节点（仅有 `text`/`title` 的父节点）
- 可选提取 `text` 或 `title` 属性作为来源名称辅助展示

### 阶段二：展示解析结果，等待用户确认

将提取到的 RSS URL 列表展示给用户：

```markdown
从输入中解析到 **N** 个 RSS 订阅源：

| # | RSS URL | 来源名称（如有） |
|---|---------|-----------------|
| 1 | https://example.com/feed | Example Blog |
| 2 | https://another.com/rss | - |
| ... | ... | ... |

确认添加以上订阅源？(y/n)
```

⛔ **BLOCKING** — 必须等待用户明确确认后才能执行添加操作。用户可以要求移除某些条目后再确认。

### 阶段三：串行执行添加

用户确认后，逐个调用 API 添加订阅源。**必须串行执行**，不要并行，以减轻系统压力。

```bash
curl -s -X POST "https://api.bestblogs.dev/api/admin/source/addRssUrl" \
  -H "Authorization: Bearer $BESTBLOGS_ADMIN_JWT_TOKEN" \
  -H "User-Id: $BESTBLOGS_ADMIN_USER_ID" \
  -H "Content-Type: application/json" \
  -d '{"rssUrl":"https://example.com/feed"}'
```

**执行规则：**
- 逐个串行执行，每个请求完成后再发起下一个
- 每个请求后输出实时进度：`[3/10] ✅ https://example.com/feed → SOURCE_f1142f`
- 单个失败记录 ❌ 并继续下一个，不中断
- **连续失败 10 次**时暂停，告知用户可能是系统性问题（认证失效、服务不可用等），等待用户决定是否继续

**错误处理：**
- 始终先检查 `response.success` 再处理 `response.data`
- 部分错误返回 HTTP 200 但 `success: false` — 不要仅依赖 HTTP 状态码
- `400`: 请求参数错误，记录错误信息，继续下一个
- `401`: 认证失败，立即停止并提示检查 `BESTBLOGS_ADMIN_JWT_TOKEN`
- `403`: 权限不足，立即停止并提示检查 `BESTBLOGS_ADMIN_USER_ID` 是否正确
- `429`: 频率限制，等待 10 秒后重试一次
- HTTP 200 但 `success: false`: 业务错误（如 URL 已存在、格式无效等），记录 `message` 字段内容，继续下一个

### 阶段四：输出汇总报告

全部执行完成后，输出汇总：

```markdown
## 添加订阅源完成

✅ 成功: M 个 | ❌ 失败: N 个 | 共计: T 个

### 成功列表
| # | RSS URL | Source ID |
|---|---------|-----------|
| 1 | https://example.com/feed | SOURCE_f1142f |
| ... | ... | ... |

### 失败列表（如有）
| # | RSS URL | 错误原因 |
|---|---------|---------|
| 1 | https://bad.com/rss | URL 格式无效 |
| ... | ... | ... |
```
