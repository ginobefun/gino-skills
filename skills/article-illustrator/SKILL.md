---
name: article-illustrator
description: "Use when 用户想为文章、指南或长文添加内嵌插图，并希望根据文章结构自动决定配图位置，而不只是生成一张封面图。"
---

# 文章插图生成器

分析文章结构，识别适合插图的位置，并用一致的 Type × Style 体系生成配图。

## 两个维度

| 维度 | 控制内容 | 示例 |
|-----------|----------|----------|
| **Type** | 信息结构 | infographic、scene、flowchart、comparison、framework、timeline |
| **Style** | 视觉审美 | notion、warm、minimal、blueprint、watercolor、elegant |

可以自由组合：`--type infographic --style blueprint`

## 类型

| 类型 | 最适合的内容 |
|------|----------|
| `infographic` | 数据、指标、技术内容 |
| `scene` | 叙事性、情绪型内容 |
| `flowchart` | 流程、工作流 |
| `comparison` | 并列对比、方案比较 |
| `framework` | 模型、架构、方法论 |
| `timeline` | 历史、演进、阶段变化 |

## 风格

详见 [references/styles.md](references/styles.md)，其中包含核心风格、完整风格库，以及 Type × Style 的兼容关系。

## 工作流

```
- [ ] Step 1: 预检查（配置、参考图）
- [ ] Step 2: 分析内容
- [ ] Step 3: 确认设置（AskUserQuestion）
- [ ] Step 4: 生成大纲
- [ ] Step 5: 生成图片
- [ ] Step 6: 收尾
```

### 第 1 步：预检查

**1.5 加载偏好 / 配置 ⛔ 阻塞步骤**

优先使用共享 loader：

```bash
bun scripts/examples/article_illustrator_config_state.ts read
```

只有在排查路径解析问题时，才手动检查文件：

```bash
# macOS、Linux、WSL、Git Bash
test -f .gino-skills/article-illustrator/config.json && echo "project-config"
test -f "$HOME/.gino-skills/article-illustrator/config.json" && echo "user-config"
test -f .gino-skills/article-illustrator/EXTEND.md && echo "project-extend"
test -f "$HOME/.gino-skills/article-illustrator/EXTEND.md" && echo "user-extend"
```

```powershell
# PowerShell（Windows）
if (Test-Path .gino-skills/article-illustrator/config.json) { "project-config" }
if (Test-Path "$HOME/.gino-skills/article-illustrator/config.json") { "user-config" }
if (Test-Path .gino-skills/article-illustrator/EXTEND.md) { "project-extend" }
if (Test-Path "$HOME/.gino-skills/article-illustrator/EXTEND.md") { "user-extend" }
```

| 结果 | 动作 |
|--------|--------|
| Found `config.json` | 读取、解析并展示配置摘要 |
| Not found | ⛔ 运行 [first-time-setup](references/config/first-time-setup.md) |

完整流程详见：[references/workflow.md](references/workflow.md#step-1-pre-check)

### 第 2 步：分析

| 分析项 | 输出 |
|----------|--------|
| 内容类型 | Technical / Tutorial / Methodology / Narrative |
| 目的 | information / visualization / imagination |
| 核心观点 | 2-5 个主要观点 |
| 插图位置 | 哪些位置适合插图、为什么 |

**关键要求**：遇到隐喻时，要把隐喻背后的概念可视化，而不是画字面意思。

完整流程详见：[references/workflow.md](references/workflow.md#step-2-setup--analyze)

### 第 3 步：确认设置 ⚠️

**只允许一次 AskUserQuestion，最多 4 个问题。Q1-Q3 必填。**

| 问题 | 可选项 |
|---|---------|
| **Q1: Type** | [Recommended]、infographic、scene、flowchart、comparison、framework、timeline、mixed |
| **Q2: Density** | minimal（1-2）、balanced（3-5）、per-section（Recommended）、rich（6+） |
| **Q3: Style** | [Recommended]、minimal-flat、sci-fi、hand-drawn、editorial、scene、Other |
| Q4: Language | 当文章语言与配置默认语言不一致时才问 |

完整流程详见：[references/workflow.md](references/workflow.md#step-3-confirm-settings-)

### 第 4 步：生成大纲

保存 `outline.md`，frontmatter 里写入 `type`、`density`、`style`、`image_count`，正文条目形如：

```yaml
## Illustration 1
**Position**: [section/paragraph]
**Purpose**: [why]
**Visual Content**: [what]
**Filename**: 01-infographic-concept-name.png
```

完整模板详见：[references/workflow.md](references/workflow.md#step-4-generate-outline)

### 第 5 步：生成图片

⛔ **阻塞要求：在开始任何图片生成前，prompt 文件必须先落盘。**

1. 为每张插图创建 prompt 文件，规则见 [references/prompt-construction.md](references/prompt-construction.md)
2. 保存到 `prompts/NN-{type}-{slug}.md`，包含 YAML frontmatter
3. Prompt **必须**使用 type 对应的模板，并带有结构化段落（ZONES / LABELS / COLORS / STYLE / ASPECT）
4. LABELS **必须**写入文章里的真实数据：数字、术语、指标、引文
5. **不要**直接把临时拼的 inline prompt 通过 `--prompt` 传进去，必须先保存 prompt 文件
6. 选择图片生成 skill，处理 references（`direct` / `style` / `palette`）
7. 如果配置开启 watermark，就应用 watermark
8. 从已保存的 prompt 文件生成；失败时自动重试一次

完整流程详见：[references/workflow.md](references/workflow.md#step-5-generate-images)

### 第 6 步：收尾

在对应段落后插入：

```markdown
![description](path/NN-{type}-{slug}.png)
```

```
文章插图完成！
Article: [path] | Type: [type] | Density: [level] | Style: [style]
Images: X/N generated
```

## 输出目录

```text
illustrations/{topic-slug}/
├── source-{slug}.{ext}
├── references/           # 如有参考图
├── outline.md
├── prompts/
└── NN-{type}-{slug}.png
```

**Slug**：2-4 个词，kebab-case。**冲突处理**：追加 `-YYYYMMDD-HHMMSS`。

## 运行时约定

本技能遵循 `docs/skill-runtime-conventions.md`。

- 首选配置：`.gino-skills/article-illustrator/config.json`
- 用户级回退配置：`$HOME/.gino-skills/article-illustrator/config.json`
- 兼容旧版：`.gino-skills/article-illustrator/EXTEND.md` 和 `$HOME/.gino-skills/article-illustrator/EXTEND.md`

## 共享脚本

- `scripts/shared/article_illustrator_config.ts`：统一解析 `config.json`，并兼容 legacy `EXTEND.md`
- `scripts/examples/article_illustrator_config_state.ts`：输出当前命中的配置来源、路径和摘要

## Worker 入口

优先使用统一 loader，而不是手写文件探测：

```bash
bun scripts/examples/article_illustrator_config_state.ts paths
bun scripts/examples/article_illustrator_config_state.ts read
```

## Legacy 兼容附录

迁移期内仍保留 legacy `EXTEND.md` 回退路径，但它仅用于兼容，不应出现在主流程中。详见 [docs/deprecation-roadmap.md](/Users/gino/Documents/Github/gino-skills/docs/deprecation-roadmap.md)。

Fallback paths:
- `.gino-skills/article-illustrator/EXTEND.md`
- `$HOME/.gino-skills/article-illustrator/EXTEND.md`

## 修改操作

| 动作 | 步骤 |
|--------|-------|
| Edit | 更新 prompt → 重新生成 → 更新引用 |
| Add | 选位置 → 写 prompt → 生成 → 更新 outline → 插入正文 |
| Delete | 删除文件 → 移除引用 → 更新 outline |

## 参考资料

| 文件 | 内容 |
|------|---------|
| [references/workflow.md](references/workflow.md) | 详细流程 |
| [references/usage.md](references/usage.md) | 命令语法 |
| [references/styles.md](references/styles.md) | 风格图库 |
| [references/prompt-construction.md](references/prompt-construction.md) | Prompt 模板 |
| [references/config/first-time-setup.md](references/config/first-time-setup.md) | 首次配置 |
