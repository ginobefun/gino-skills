# CLAUDE.md

本项目是个人 Claude Code Skills 集合，通过 skills 扩展 Claude 的能力。

## 项目结构

```
skills/
  <skill-name>/
    SKILL.md                    # Skill 定义文件（YAML frontmatter + 工作流文档）
    references/                 # 按需加载的深度参考资料
      api_reference.md          # 自包含的 API 参考（端点、数据类型、错误码）
    scripts/                    # 可选：封装的工具脚本（黑箱调用）
docs/                           # 项目规划文档
```

### 三层加载架构

Skill 内容按需分层加载，避免占用上下文窗口：

| 层级 | 内容 | 加载时机 |
|------|------|----------|
| **Level 1 - 元数据** | frontmatter (name + description)，~100 words | 始终加载 |
| **Level 2 - SKILL.md 正文** | 主要指令和工作流，理想 **<500 行** | Skill 触发时加载 |
| **Level 3 - 捆绑资源** | references/, scripts/, assets/，无大小限制 | 按需加载，不预加载 |

**关键原则**: SKILL.md 只放概览和指向 references/ 的指针（如 `完整 API 参数详情见 references/api_reference.md`），不要把所有内容内联到 SKILL.md 中。

## Skill 分类

- **BestBlogs 工作流 Skills** (`bestblogs-fetcher`, `bestblogs-daily-digest` 等): BestBlogs.dev 内容获取、策展、生成、分发
- **XGo 基础 CRUD Skills** (`xgo-fetch-tweets`, `xgo-manage-lists` 等): 封装单组 API 端点的增删改查
- **XGo 组合型工作流 Skills** (`xgo-track-kol`, `xgo-digest-tweets`, `xgo-organize-follows`): 编排多个 API 调用 + AI 分析
- **内容创作与分发 Skills** (`image-gen`, `post-to-x`, `deep-reading` 等): 图像生成、内容发布、深度阅读

## 个人上下文

Skills 可能需要个人信息（如写作风格、项目背景、沟通偏好）。个人资料维护在 gino-bot 项目中：

- **个人画像**: `/Users/gino/Documents/Github/gino-bot/USER.md` — 基本信息、职业、项目、技术栈、性格、目标
- **核心价值观**: `/Users/gino/Documents/Github/gino-bot/SOUL.md` — 信念、框架（道法术器势）、工作哲学
- **Twitter 画像**: USER.md 中的 Twitter 部分 — 主题分布、社交网络、代表性观点

按需读取，不要预加载到 SKILL.md 中。

---

## Skill 开发方法论

### 开发流程

1. **明确意图**: 确定 skill 解决什么问题、谁会用、何时触发
2. **研究 API**: 阅读源 API 文档，确认端点、参数、响应格式、错误码
3. **设计工作流**: 画出请求编排（并行/串行）、数据流转、用户交互点
4. **编写 SKILL.md**: 按规范结构编写，先写核心工作流，再补充边界情况
5. **编写 api_reference.md**: 自包含，复制所需 DTO 定义
6. **创建 symlink 测试**: `ln -sf skills/<name> ~/.claude/skills/<name>`
7. **验证核心 API**: 用 curl 测试每个端点是否正常返回
8. **Review**: 对照源 API 文档检查字段完整性、错误码覆盖
9. **提交**: 确认无误后提交

### Description 编写（触发关键）

Description 是 skill 被触发的唯一依据。**必须"pushy"** — 宁可过度触发，不要漏触发。

**必须包含的内容**:
- 适用场景编号列表: `(1) xxx, (2) xxx, ...`
- 中英文触发短语: `'中文短语', 'english phrase', ...`
- 覆盖用户可能的各种表述方式

**示例**:
```yaml
description: "通过 XGo 开放接口管理关注列表。适用场景: (1) 查看关注列表, (2) 刷新关注列表, ...
触发短语: '关注列表', 'following list', '我关注了谁', '是否关注', 'do I follow', ..."
```

**禁止**:
- 不要用模糊的描述如 "管理 Twitter 数据"
- 不要遗漏常见的用户表述变体
- 不要只写英文或只写中文触发短语

---

## SKILL.md 编写规范

### 标准结构（9 个区块）

```yaml
---
name: skill-name
description: "中文描述。适用场景: (1)... (2)... 触发短语: '中文短语', 'english phrase', ..."
---
```

1. **YAML Frontmatter**: `name` + `description`（含适用场景和触发短语）
2. **标题**: `# 中文名 (English Name)`
3. **认证区块**: 统一模板（见下方）
4. **可用端点表格**: 方法、类型（DB/实时/写入）、用途
5. **核心工作流**: 按场景分节，每个场景含 curl 示例
6. **参数调整**: 用户意图 → API 参数映射表
7. **输出格式**: markdown 模板 + 字段映射表
8. **输出完整性规则**: 空值处理、格式化规则
9. **错误处理**: 统一错误处理模板

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

### api_reference.md 规范

- **自包含**: 每个 skill 复制所需的 DTO 定义，不引用其他 skill 的文件
- 包含: 端点文档、请求/响应示例、数据类型定义、枚举值、错误码表
- 错误码表必须包含 HTTP 200 但 `success: false` 的错误码，并加粗标注 **200**
- 与源 API 文档 (`openapi.md`) 核对字段完整性，不得遗漏字段

### curl 示例规范

- 使用 `$XGO_API_KEY` 变量，不硬编码
- GET: `curl -s "URL" -H "X-API-KEY: $XGO_API_KEY"`
- POST: `curl -s -X POST URL -H "Content-Type: application/json" -H "X-API-KEY: $XGO_API_KEY" -d '{...}'`
- 始终加 `-s` flag
- 所有参数显式传递，不依赖服务端默认值（尤其是 `sortType`）

---

## 多阶段工作流规范

组合型 skill 涉及多个阶段时，遵循以下规范：

### 进度清单

复杂工作流必须在 SKILL.md 中提供进度清单模板：

```markdown
- [ ] 阶段一: 准备（获取统计和列表信息）
- [ ] 阶段二: 获取数据
- [ ] 阶段三: 深度分析 ⚠️ 需用户确认分析范围
- [ ] 阶段四: AI 匹配
- [ ] 阶段五: 用户确认 ⛔ BLOCKING
- [ ] 阶段六: 执行
```

### 用户确认门控

在以下时机必须设置确认点：
- **写操作执行前**: ⛔ BLOCKING — 必须等待用户明确确认
- **分析范围选择**: ⚠️ REQUIRED — 让用户决定分析多少数据
- **AI 建议确认**: ⚠️ REQUIRED — 展示建议后等待用户调整

### 并行请求策略

- 无依赖的请求**并行执行**（如同时拉取 stats + list/all）
- 每用户多请求时**分组并行**（每组 5 用户，避免瞬时过多并发）
- 记录请求数量，确保在频率限制内（PLUS 200/分, PRO 600/分）

---

## 写操作安全规则

所有写操作（关注/取关/添加成员/创建列表/收藏等）**必须**:

1. 在 SKILL.md 中标注 **"写操作 — 必须在用户明确确认后才能调用"**
2. 先展示操作内容，等待用户确认
3. 批量执行时**每批最多 5 个**，逐批输出进度
4. 单个失败不中断整批，记录 ❌ 和错误信息并继续
5. 连续失败超过 3 次时暂停，告知用户可能是系统性问题
6. 空结果时给出友好提示（如 "暂无推荐关注的用户"）

---

## XGo API 要点

- 接口地址: `https://api.xgo.ing`
- 认证: `X-API-KEY` 请求头，环境变量 `XGO_API_KEY`
- 频率限制: PLUS 200次/分, PRO 600次/分
- `sortType` 服务端默认 `recent`，需要影响力排序时**必须显式传** `"influence"`
- 分页: `page`/`size` 或 `currentPage`/`pageSize`，最大 size 100
- 部分错误以 HTTP 200 返回但 `success: false`，**始终检查 `success` 字段**
- API 源文档: `/Users/gino/Documents/Github/XGo/xgo-service/documents/openapi.md`

---

## Contents 目录规范

Content OS 相关 skills 将数据持久化到项目根目录的 `contents/` 下，统一按日期组织：

```
contents/
  daily-curation/              # daily-content-curator 输出
    YYYY-MM-DD/
      curation.md              # 阅读清单（默认）
      curation-am.md           # 早间版本（一天两次时）
      curation-pm.md           # 晚间版本
  reading-notes/               # reading-workflow 输出
    YYYY-MM-DD/
      notes.md                 # 阅读笔记（含进度状态标记）
      materials.md             # 创作素材清单（结构化，供 content-synthesizer 解析）
  blog-posts/                  # content-synthesizer 输出
    YYYY-MM-DD-{slug}.md       # 博客文章 Markdown
  content-analytics/           # content-analytics 输出
    weekly-YYYY-MM-DD.md       # 周报
    monthly-YYYY-MM.md         # 月报
  content-strategy.md          # 内容策略画像（analytics→curator 反馈闭环）
  daily-digest/                # bestblogs-daily-digest 输出（已有）
    YYYY-MM-DD/
      digest.md
```

**命名约定**:
- 目录按日期: `YYYY-MM-DD` 格式
- 文件名小写，连字符分隔
- 所有 skill 写入前先 `mkdir -p` 确保目录存在

---

## 禁止事项

### SKILL.md 编写禁止

- **禁止** SKILL.md 超过 500 行 — 超出部分拆到 references/ 中
- **禁止** 在 api_reference.md 中引用其他 skill 的文件 — 必须自包含
- **禁止** 遗漏 HTTP 200 错误码（xgo-0001, xgo-0012, xgo-9005 等）
- **禁止** curl 示例中硬编码 API Key
- **禁止** 省略 `sortType` 等参数，依赖服务端默认值
- **禁止** description 中只写一种语言的触发短语
- **禁止** 未经对照 `openapi.md` 就认定 DTO 字段完整

### 工作流禁止

- **禁止** 未经用户确认就执行写操作（关注/取关/添加成员/收藏等）
- **禁止** 一次性执行超过 5 个写操作 — 必须分批
- **禁止** 单个失败就中断整批操作
- **禁止** 仅依赖 HTTP 状态码判断成功 — 必须检查 `response.success`
- **禁止** 截断推文文本、用户简介等内容字段

### 开发流程禁止

- **禁止** 跳过 API 测试直接提交
- **禁止** 跳过 Review（对照源文档检查字段和错误码完整性）直接提交
- **禁止** 提交后才创建 symlink — 应先创建 symlink 测试再提交

---

## 开发约定

- 语言: SKILL.md 和 api_reference.md 使用**中文**编写
- description 中的触发短语同时包含中文和英文
- 组合型 skill 的输出格式使用 emoji 指标标识: 👍 点赞、🔁 转推、💬 回复、🔄 引用、📑 收藏、👁 浏览、📊 影响力
- 大数字用 K/M 格式化，百分比保留一位小数
- 资料字段为 null/空时省略该行，不输出空值
- 数据按相关度/影响力倒序排列

## 安装与激活

```bash
# 单个安装
ln -sf /path/to/gino-skills/skills/<skill-name> ~/.claude/skills/<skill-name>

# 批量安装
for d in /path/to/gino-skills/skills/*/; do
  ln -sf "$d" ~/.claude/skills/$(basename "$d")
done
```

## 外部 Skills 生态

本项目与以下 skills 库协同使用：

- **baoyu-skills** (已安装): 内容创作与分发 — 图片生成、Markdown 格式化、微信/推特发布
- **skills-anthropics** (参考): Anthropic 官方 skills — skill-creator 开发框架、文档操作、前端设计
