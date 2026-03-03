# CLAUDE.md

本项目是个人 Claude Code Skills 集合，通过 skills 扩展 Claude 的能力。

## 项目结构

```
skills/
  <skill-name>/
    SKILL.md                    # Skill 定义文件（YAML frontmatter + 工作流文档）
    references/
      api_reference.md          # 自包含的 API 参考（该 skill 用到的端点和数据类型）
docs/                           # 项目规划文档
```

## Skill 分类

- **基础 CRUD Skills** (`xgo-fetch-tweets`, `xgo-manage-lists` 等): 封装单组 API 端点的增删改查
- **组合型工作流 Skills** (`xgo-track-kol`, `xgo-digest-tweets`, `xgo-organize-follows`): 编排多个 API 调用 + AI 分析

## Skill 编写规范

### SKILL.md 结构

```yaml
---
name: skill-name
description: "中文描述。适用场景: (1)... (2)... 触发短语: '中文短语', 'english phrase', ..."
---
```

1. **YAML Frontmatter**: `name` + `description`（含适用场景编号列表和触发短语）
2. **标题**: `# 中文名 (English Name)`
3. **认证区块**: 统一格式，使用 `$XGO_API_KEY` 环境变量
4. **可用端点表格**: 列出 方法、类型（DB/实时/写入）、用途
5. **核心工作流**: 按场景分节，每个场景含 curl 示例
6. **参数调整**: 用户意图 → API 参数映射表
7. **输出格式**: 含 markdown 模板和字段映射表
8. **输出完整性规则**: 空值处理、格式化规则
9. **错误处理**: 统一错误处理模板

### api_reference.md 规范

- **自包含**: 每个 skill 复制所需的 DTO 定义，不引用其他 skill 的文件
- 包含: 端点文档、请求/响应示例、数据类型定义、枚举值、错误码表
- 错误码表必须包含 HTTP 200 但 `success: false` 的错误码，并加粗标注 **200**

### 认证区块（统一模板）

```markdown
## 认证

所有请求需要 `X-API-KEY` 请求头。从环境变量 `XGO_API_KEY` 读取密钥:

\```bash
-H "X-API-KEY: $XGO_API_KEY"
\```

若 `XGO_API_KEY` 未设置，提示用户配置。

接口地址: `https://api.xgo.ing`
```

### 错误处理（统一模板）

```markdown
**重要**: 始终先检查 `response.success` 再处理 `response.data`。
部分错误返回 HTTP 200 但 `success: false` — 不要仅依赖 HTTP 状态码。
```

必须覆盖的错误码:
- `401` (AUTH_001/002/003): API Key 问题
- `403` (AUTH_004): 会员等级不足
- `429` (xgo-0010): 频率限制，等待 10 秒重试一次
- `xgo-0012` (HTTP 200): 功能级会员限制
- `xgo-9005` (HTTP 200): 操作不允许

### curl 示例规范

- 使用 `$XGO_API_KEY` 变量，不硬编码
- GET 请求: `curl -s "URL" -H "X-API-KEY: $XGO_API_KEY"`
- POST 请求: `curl -s -X POST URL -H "Content-Type: application/json" -H "X-API-KEY: $XGO_API_KEY" -d '{...}'`
- 始终加 `-s` flag

## 写操作安全规则

所有写操作（关注/取关/添加成员/创建列表/收藏等）必须:
1. 在 SKILL.md 中标注 **写操作 — 必须在用户明确确认后才能调用**
2. 先展示操作内容，等待用户确认
3. 批量执行时每批最多 5 个，逐批输出进度
4. 单个失败不中断整批，记录错误并继续

## XGo API 要点

- 接口地址: `https://api.xgo.ing`
- 认证: `X-API-KEY` 请求头，环境变量 `XGO_API_KEY`
- 频率限制: PLUS 200次/分, PRO 600次/分
- `sortType` 服务端默认 `recent`，需要影响力排序时必须显式传 `"influence"`
- 分页: `page`/`size` 或 `currentPage`/`pageSize`，最大 size 100
- 部分错误以 HTTP 200 返回但 `success: false`，始终检查 `success` 字段

## 安装与激活

创建 symlink 激活 skill:

```bash
ln -sf /path/to/gino-skills/skills/<skill-name> ~/.claude/skills/<skill-name>
```

## 开发约定

- 语言: SKILL.md 和 api_reference.md 使用**中文**编写
- description 中的触发短语同时包含中文和英文
- 组合型 skill 的输出格式使用 emoji 作为指标标识（👍 点赞、🔁 转推、💬 回复、🔄 引用、📑 收藏、👁 浏览、📊 影响力）
- 大数字用 K/M 格式化
- API 源文档: `/Users/gino/Documents/Github/XGo/xgo-service/documents/openapi.md`
