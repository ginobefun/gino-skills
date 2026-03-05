---
name: bestblogs-process-videos
description: "BestBlogs 视频批量转录与内容更新复合工作流。适用场景：(1) 查询等待预处理的视频列表，(2) 批量转录 YouTube 视频并更新到 BestBlogs, (3) 自动根据优先级选择转录质量，(4) 视频内容预处理工作流。触发短语：'处理视频', '视频预处理', 'process videos', '转录并更新', 'transcribe and update', '预处理视频', '批量转录', 'batch transcribe', '视频工作流', 'video workflow', 'bestblogs 视频', 'bestblogs video', '等待预处理', 'wait prepare', '视频转文字并更新', '处理待转录视频', 'process pending videos'。"
---

# 视频批量转录与更新 (Process Videos)

查询 BestBlogs 中等待预处理的视频 → 用户选择 → 逐个转录并更新到 BestBlogs → 触发内容分析。

## 认证

需要两个环境变量：

| 变量 | 用途 |
|------|------|
| `BESTBLOGS_ADMIN_USER_ID` | 管理员用户 ID |
| `BESTBLOGS_ADMIN_JWT_TOKEN` | 管理员 JWT Token |

所有请求需携带：

```bash
-H "Authorization: Bearer $BESTBLOGS_ADMIN_JWT_TOKEN"
-H "User-Id: $BESTBLOGS_ADMIN_USER_ID"
-H "Content-Type: application/json"
```

若环境变量未设置，提示用户配置。

接口地址：`https://api.bestblogs.dev`

## 转录脚本

本 skill 依赖 `bestblogs-transcribe-youtube` skill 的脚本，按以下顺序查找：

1. 项目内：`skills/bestblogs-transcribe-youtube/scripts/transcribe.ts`（相对于本 skill 的父目录）
2. 已安装：`~/.claude/skills/bestblogs-transcribe-youtube/scripts/transcribe.ts`

## 工作流概览（4 个阶段）

```
阶段一（查询视频列表）→ 阶段二（用户选择）→ 阶段三（逐个处理）→ 阶段四（输出结果）
```

- [ ] 阶段一：查询等待预处理的视频列表
- [ ] 阶段二：展示列表，用户选择 ⚠️ REQUIRED
- [ ] 阶段三：逐个处理（转录 → 保存 → 更新内容 → 触发分析）
- [ ] 阶段四：输出最终结果

---

## 阶段一：查询等待预处理的视频

```bash
curl -s -X POST https://api.bestblogs.dev/api/admin/article/list \
  -H "Authorization: Bearer $BESTBLOGS_ADMIN_JWT_TOKEN" \
  -H "User-Id: $BESTBLOGS_ADMIN_USER_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPage": 1,
    "pageSize": 20,
    "type": "VIDEO",
    "flowStatusFilter": "WAIT_PREPARE"
  }'
```

响应结构：

```json
{
  "success": true,
  "data": {
    "currentPage": 1,
    "pageSize": 50,
    "totalPage": 1,
    "totalCount": 5,
    "list": [
      {
        "id": "RR_xxx",
        "title": "视频标题",
        "url": "https://www.youtube.com/watch?v=xxx",
        "sourceName": "来源名",
        "priority": "HIGH",
        "priorityDesc": "高",
        "publishDate": "2025-03-01T00:00:00.000+00:00",
        "publishDateStr": "2025-03-01"
      }
    ]
  }
}
```

**始终检查 `success` 字段。** 若列表为空，提示"暂无等待预处理的视频"并结束。

---

## 阶段二：用户选择

展示视频列表：

```markdown
## 等待预处理的视频（共 N 个）

| # | ID | 标题 | 来源 | 优先级 | 发布日期 |
|---|-----|------|------|--------|---------|
| 1 | RR_xxx | 视频标题 1 | 来源 A | HIGH | 2025-03-01 |
| 2 | RR_yyy | 视频标题 2 | 来源 B | MEDIUM | 2025-02-28 |

请选择要处理的视频：
- "全部" — 处理所有视频
- "1, 3, 5" — 处理指定编号的视频
```

等待用户选择后继续。

---

## 阶段三：逐个处理

**严格串行处理。** 每个视频必须完成以下 4 步后，再处理下一个视频：

```
步骤 A: 转录视频 → 步骤 B: 保存文件 → 步骤 C: 更新内容 → 步骤 D: 触发分析
```

### ID-内容关联安全

1. 处理每个视频时，锁定当前 `{id}` 和 `{url}` 的对应关系
2. 文件名包含 `{id}`，作为关联凭证
3. `updateContent` 和 `runAnalysisFlow` 必须使用同一个 `{id}`
4. **禁止**将一个视频的转录结果更新到另一个视频的 ID 上
5. **禁止**并行处理多个视频

### 步骤 A+B: 转录并保存

根据优先级选择思考级别：

| 优先级 | 思考级别 |
|--------|---------|
| `HIGH` | `pro` |
| 其他 (`MEDIUM`, `LOW`, `NONE`) | `think` |

```bash
npx -y bun <TRANSCRIBE_SCRIPT> --thinking <level> -o ./contents/transcribe-<id>-<yyyyMMddHHmmss>.md <video-url>
```

文件保存到当前工作目录的 `./contents/` 下，文件名：`transcribe-{id}-{yyyyMMddHHmmss}.md`。

### 步骤 C: 更新内容

读取步骤 B 保存的文件内容，**去除第一行的 H1 标题**（以 `# ` 开头的行）后，调用 API 更新。`id` 必须与文件名中的 `{id}` 一致。

> 原因：页面已有标题展示元素，内容中若包含标题会导致重复。本地保存的文件保留标题，仅在上传时去除。

去除标题的处理逻辑（python3）:
```python
lines = content.split('\n')
# 跳过开头的空行和第一个 H1 标题行
start = 0
for i, line in enumerate(lines):
    if line.startswith('# '):
        start = i + 1
        break
content_without_title = '\n'.join(lines[start:]).lstrip('\n')
```

```bash
curl -s -X POST https://api.bestblogs.dev/api/admin/article/updateContent \
  -H "Authorization: Bearer $BESTBLOGS_ADMIN_JWT_TOKEN" \
  -H "User-Id: $BESTBLOGS_ADMIN_USER_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "RR_xxx",
    "markdownContent": "转录的 Markdown 内容..."
  }'
```

只传 `markdownContent`，服务端会自动转换为 `displayDocument` (HTML)。

### 步骤 D: 触发内容分析

updateContent 成功后，使用**同一个 `{id}`** 触发分析：

```bash
curl -s -X POST "https://api.bestblogs.dev/api/admin/article/runAnalysisFlow?id=RR_xxx" \
  -H "Authorization: Bearer $BESTBLOGS_ADMIN_JWT_TOKEN" \
  -H "User-Id: $BESTBLOGS_ADMIN_USER_ID"
```

### 输出进度

每处理完一个视频，更新进度：

```markdown
- [1/3] ✅ RR_xxx — 视频标题 1 (pro, 12345 字，已更新，已触发分析)
- [2/3] 🔄 RR_yyy — 视频标题 2 (think) 处理中...
- [3/3] ⏳ RR_zzz — 视频标题 3 (think)
```

单个视频任一步骤失败时，记录错误并继续处理下一个视频。

---

## 阶段四：输出最终结果

```markdown
## 处理结果

| # | ID | 标题 | 转录 | 更新 | 分析 | 文件 |
|---|-----|------|------|------|------|------|
| 1 | RR_xxx | 标题 1 | ✅ 12345 字 | ✅ | ✅ | ./contents/transcribe-RR_xxx-20250305143022.md |
| 2 | RR_yyy | 标题 2 | ✅ 8901 字 | ✅ | ✅ | ./contents/transcribe-RR_yyy-20250305143522.md |
| 3 | RR_zzz | 标题 3 | ❌ 转录失败 | - | - | - |

### 统计
- 成功：2
- 失败：1
```

---

## 错误处理

| 错误 | 原因 | 处理 |
|------|------|------|
| `success: false` | API 返回错误 | 读取 `code` 和 `message`，告知用户 |
| `401` / `403` | Token 过期或无权限 | 提示用户更新 `BESTBLOGS_ADMIN_JWT_TOKEN` |
| 转录失败 | Gemini 无法处理 / Chrome 未登录 | 记录失败，跳过该视频的后续步骤，继续下一个 |
| updateContent 失败 | 内容过大或 ID 不存在 | 记录失败，跳过 runAnalysisFlow，文件已保存可手动重试 |
| runAnalysisFlow 失败 | 服务端异常 | 记录失败，不影响其他视频，可手动重触发 |
| 环境变量未设置 | 缺少认证信息 | 提示配置 `BESTBLOGS_ADMIN_USER_ID` 和 `BESTBLOGS_ADMIN_JWT_TOKEN` |
