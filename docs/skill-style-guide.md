# Skill 编写规范

本仓库把 skill 同时视为“触发表面”和“执行指南”。`description` 的作用是帮助模型判断要不要先加载这个 skill；正文的作用是在 skill 被选中后指导实际执行。

## Frontmatter

每个 `SKILL.md` 都必须以 YAML frontmatter 开头。

必填字段：
- `name`
- `description`

可选字段：
- `hooks` — On Demand Hooks，仅在 skill 激活时生效
- `disable-model-invocation` — 禁止 Claude 自动触发（发布类 skill 必须设置为 `true`）
- `user-invocable` — 设为 `false` 时隐藏 `/` 菜单（背景知识类 skill）
- `allowed-tools` — 限制 skill 可用的工具集
- `context` — 设为 `fork` 在子代理中运行
- `agent` — 指定子代理类型（需配合 `context: fork`）
- `model` — 指定运行模型
- `argument-hint` — 自动补全时显示的参数提示

规则：
- `name` 只能使用小写字母、数字和连字符
- `description` 必须以 `Use when` 开头
- `description` 只描述触发条件
- `description` 长度控制在 500 字符以内
- frontmatter 总长度控制在 1024 字符以内

命名建议：
- 当生态前缀有助于分组和记忆时，应保留，例如 `bestblogs-*`、`xgo-*`
- 这些家族之外，优先使用容易记忆的动宾结构命名，例如 `post-to-x`、`send-wechat-group-message`、`synthesize-content`
- 只有当新名字更容易搜索、更容易记忆时，才为了清晰性重命名旧的名词短语

## Description 规则

`description` 是给模型做发现用的，不是给人快速扫功能列表用的。

编写时需要回答：
- 什么情况下应该加载这个 skill？
- 哪类问题形态会触发它？
- 在什么情况下应该改用 sibling skill？

不要把这些内容塞进 `description`：
- 工作流总结
- 编号式使用场景清单
- 触发短语大列表
- 能力清单
- 实现细节
- setup 指令

推荐结构：

```yaml
description: Use when the user wants X, or when the request mentions Y. Use sibling skill Z instead for A.
```

## Description 示例

不好的写法：

```yaml
description: 每日内容管理编排，从数据获取到选题规划、内容生成、多渠道分发的完整每日内容工作流。适用场景... 触发短语...
```

不好的写法：

```yaml
description: Posts content to X, supports text, images, videos, and long-form articles.
```

好的写法：

```yaml
description: Use when the user wants to publish content on X, including tweets, media posts, or X Articles.
```

好的写法：

```yaml
description: Use when the user wants a daily content plan that spans sourcing, topic selection, drafting, and publishing across multiple channels.
```

带 sibling 边界的好写法：

```yaml
description: Use when the user wants to search X for a topic or fetch the latest tweets from a specific account. Use xgo-fetch-tweets for timeline or feed retrieval.
```

## 正文结构

正文可以根据 skill 类型变化，但推荐包含以下章节：
- `Overview`
- `When to Use`
- `When Not to Use`
- `Setup`
- `Workflow`
- `Gotchas`
- `Related Skills`

当前仓库会先严格约束 frontmatter。正文结构现在是强烈建议，后续迭代会继续收紧。

在当前高频 skill 整治波次中，以下章节是必需的：
- `When to Use`
- `When Not to Use`
- `Gotchas`
- `Related Skills`

对于 orchestrator skill，还应增加一个简短的边界章节，说明 sourcing、analysis、drafting、publishing 分别归哪个 sibling skill 负责。

## Gotchas

每个 skill 都应该逐步积累 `Gotchas` 章节。这是 skill 中**信号密度最高**的内容。

**持续迭代原则**：
- Gotchas 不是一次性写完的，应在每次执行出错后追加新条目
- 新 gotcha 追加到列表末尾，保留历史条目
- 格式：`- 简短描述问题 + 后果/建议`（一行一条）
- 每条 gotcha 应来自真实踩坑经验，不要预测性地编造

**优先沉淀的 gotcha 类型**：
- known model failure modes（Claude 常犯的错误）
- API defaults that differ from repository expectations
- write-action guardrails（写操作安全边界）
- pagination, retry, or response-shape traps
- sibling-skill confusion（与相似 skill 的混淆场景）
- 数据格式 edge case（空值、类型不匹配、编码问题）

## 渐进披露

高信号指令保留在 `SKILL.md`，重细节内容下沉到：
- `references/`
- `scripts/`
- templates or assets

正文应该在合适时机指向正确文件，而不是把所有细节一次性内联展开。

## 共享模板引用

认证和错误处理已提取为跨 skill 共享模板，位于 `references/shared/`。各 skill 通过相对路径引用：

```markdown
## 认证

认证方式见 `../../references/shared/auth-xgo.md`。

## 错误处理

通用错误码见 `../../references/shared/error-handling-xgo.md`。本 skill 额外关注：

- [仅列出本 skill 特有的错误码和处理逻辑]
```

**规则**：
- XGo skill 引用 `auth-xgo.md` + `error-handling-xgo.md`
- BestBlogs skill 引用 `auth-bestblogs.md` + `error-handling-bestblogs.md`
- 通用错误码（401/403/429）不要在各 skill 中重复，只写在共享模板里
- 各 skill 只保留自己特有的错误码和业务异常处理

## 共享写入模板

对于重复出现的 API 写操作，不要在各个 skill 里不断复制长 `curl` 片段。

优先使用：
- shared clients in `scripts/shared/`
- runnable examples in `scripts/examples/`
- read-after-write verification when the API exposes a stable read path

当 orchestrator skill 调用一个可运行 example 时，应把它视作 worker entrypoint，而不是随手示例。
输出必须保持稳定且机器可读，这样 sibling skill 才能依赖它。

当前 example script 的输出契约：
- `ok`: overall success boolean
- `action`: stable action id such as `bestblogs.save_analysis`
- `items`: primary items or targets involved in the run
- `write`: raw write response when the script performs a write
- `verify`: read-after-write response or verification payload
- `note`: caveat for best-effort verification or fallback behavior
- `meta`: execution metadata such as pagination or batch info

失败与退出码契约：
- success path exits with code `0`
- handled runtime failure exits with code `1`
- failure output should still use the same JSON schema, with `ok: false`
- put structured error details under `meta.error`
- keep `action` stable on both success and failure so orchestrators can branch reliably

如果当前做不到强校验，就在 skill 里明确写出来，并保持 best-effort，而不是假装已经验证成功。

## 配置与记忆

如果 skill 需要 setup 或持久状态：
- prefer a documented schema over ad-hoc prose
- keep setup rules consistent across sibling skills
- separate stable memory from disposable workspace output
- point to the shared runtime rules in `docs/skill-runtime-conventions.md`

推荐的 runtime 模型：
- `config.json` for current config
- `EXTEND.md` only as legacy compatibility
- `${CLAUDE_PLUGIN_DATA}/gino-skills/<skill>/` for stable state when available
- `.gino-skills/data/<skill>/` as repo fallback
- `contents/tmp/workspace/YYYY-MM-DD/` only for disposable run artifacts

弃用收口建议：
- keep `EXTEND.md` and old runtime paths out of primary workflow steps when possible
- move legacy fallback details into `Compatibility`, `Appendix`, or similarly named sections
- use exact dates when documenting deprecation milestones; see `docs/deprecation-roadmap.md`

## Sibling 边界

如果两个 skill 很容易混淆，应在 description 或正文前部明确写清楚。

示例：
- search vs feed retrieval
- publish vs draft generation
- orchestrator vs worker skill
- fetch vs analyze vs translate

## Lint 范围

当前仓库 lint 会强制检查：
- frontmatter presence
- supported frontmatter keys
- `name` format
- `description` prefix and length
- obvious inventory phrases that should not live in descriptions

后续迭代还会继续把正文结构和更高级的启发式规则纳入检查。
