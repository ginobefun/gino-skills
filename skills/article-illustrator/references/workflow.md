# 详细工作流流程

## Step 1：预检查

### 1.0 检测并保存参考图 ⚠️ 如用户提供图片则必须执行

先判断用户是否提供了参考图，并按输入类型处理：

| 输入类型 | 动作 |
|----------|------|
| 明确给出图片文件路径 | 复制到 `references/` 子目录，可用于 `--ref` |
| 对话里带了图片，但没有文件路径 | 用 `AskUserQuestion` 请用户提供文件路径 |
| 用户无法提供路径 | 口头提炼风格 / 配色信息，追加进 prompt（不要写进 frontmatter 的 references） |

**关键规则**：只有参考图文件真的保存到了 `references/` 目录，才能在 prompt frontmatter 里写 `references`。

**如果用户提供的是文件路径**：

1. 复制到 `references/NN-ref-{slug}.png`
2. 创建说明文件：`references/NN-ref-{slug}.md`
3. 继续前先确认这两个文件都存在

**如果用户无法提供路径，只能口头描述**：

1. 视觉分析图片，提取：配色、风格、构图
2. 写入 `references/extracted-style.md`
3. 不要把 `references` 写到 prompt frontmatter
4. 把提炼出的风格 / 颜色直接拼到 prompt 文本里

**说明文件格式**（仅在图片文件已保存时使用）：

```yaml
---
ref_id: NN
filename: NN-ref-{slug}.png
---
[用户描述或自动生成的描述]
```

**校验输出**（文件已保存时）：

```text
参考图已保存：
- 01-ref-{slug}.png ✓（可用于 --ref）
- 02-ref-{slug}.png ✓（可用于 --ref）
```

**如果只是提炼风格**：

```text
已提炼参考风格（无文件）：
- Colors: #E8756D coral, #7ECFC0 mint...
- Style: minimal flat vector, clean lines...
→ 将直接追加到 prompt 文本，不使用 --ref
```

---

### 1.1 判断输入类型

| 输入 | 输出目录 | 下一步 |
|------|----------|--------|
| 文件路径 | 询问用户（1.2） | → 1.2 |
| 粘贴内容 | `illustrations/{topic-slug}/` | → 1.4 |

**粘贴内容的备份规则**：如果目标目录下已经有 `source.md`，先改名为 `source-backup-YYYYMMDD-HHMMSS.md` 再写新文件。

### 1.2-1.4 配置与路径决策（仅文件路径输入）

先读取偏好和现有状态，然后在一次 `AskUserQuestion` 中问完所有必要问题（最多 4 个）。

**需要问的问题**（如果已有偏好或当前不适用，可以跳过）：

| 问题 | 何时询问 | 选项 |
|------|----------|------|
| 输出目录 | `config` 中没有 `default_output_dir` | `{article-dir}/`、`{article-dir}/imgs/`（推荐）、`{article-dir}/illustrations/`、`illustrations/{topic-slug}/` |
| 已有图片如何处理 | 目标目录中存在 `.png/.jpg/.webp` | `supplement`、`overwrite`、`regenerate` |
| 是否更新原文 | 只要是文件路径输入都问 | `update`、`copy` |

**`default_output_dir` 的值与路径映射**：

| 配置值 | 路径 |
|--------|------|
| `same-dir` | `{article-dir}/` |
| `imgs-subdir` | `{article-dir}/imgs/` |
| `illustrations-subdir` | `{article-dir}/illustrations/` |
| `independent` | `illustrations/{topic-slug}/` |

### 1.5 加载偏好 / 配置 ⛔ 阻塞

**关键规则**：如果缺少 `config.json`，必须先完成首次设置，才能进入后续任何步骤。不要提前问参考图，不要问内容，不要问 type/style。

优先用共享 loader：

```bash
bun scripts/examples/article_illustrator_config_state.ts read
```

只有在排查路径问题时，才手动检查文件是否存在：

```bash
# macOS / Linux / WSL / Git Bash
test -f .gino-skills/article-illustrator/config.json && echo "project-config"
test -f "$HOME/.gino-skills/article-illustrator/config.json" && echo "user-config"
```

```powershell
# PowerShell (Windows)
if (Test-Path .gino-skills/article-illustrator/config.json) { "project-config" }
if (Test-Path "$HOME/.gino-skills/article-illustrator/config.json") { "user-config" }
```

| 结果 | 动作 |
|------|------|
| 找到 `config.json` | 读取、解析、展示摘要 → 继续 |
| 未找到 | ⛔ 仅执行首次设置（见 `config/first-time-setup.md`）→ 保存 `config.json` → 再继续 |

支持的偏好包括：水印、偏好 type/style、自定义风格、语言、输出目录。

Legacy `EXTEND.md` fallback 只保留在 `config/first-time-setup.md` 的附录中，本主流程不再展开。

---

## Step 2：准备与分析

### 2.1 内容分析

| 分析项 | 说明 |
|--------|------|
| 内容类型 | Technical / Tutorial / Methodology / Narrative |
| 插图目的 | information / visualization / imagination |
| 核心论点 | 需要可视化的 2-5 个重点 |
| 视觉机会点 | 哪些位置加图才真正有价值 |
| 推荐类型 | 根据内容信号和目的得出 |
| 推荐密度 | 根据篇幅和复杂度得出 |

### 2.2 提取核心论点

- 主论点
- 读者必须理解的关键概念
- 对比 / 差异点
- 文中提出的框架或模型

**关键提醒**：如果文章用了隐喻（如“电锯切西瓜”），不要照字面画。要画的是**底层概念**。

### 2.3 识别插图位置

**应该配图**：

- 核心论点（必做）
- 抽象概念
- 数据对比
- 流程 / 工作流

**不应该配图**：

- 按字面画隐喻
- 纯装饰场景
- 泛泛的通用插图

### 2.4 分析参考图（如果 1.0 有参考图）

对每张参考图判断：

| 分析项 | 说明 |
|--------|------|
| 视觉特征 | 风格、颜色、构图 |
| 内容 / 主题 | 参考图画了什么 |
| 适用位置 | 更适合文章的哪些段落 |
| 风格匹配 | 适合哪些插图 type/style |
| 使用建议 | `direct` / `style` / `palette` |

| 使用方式 | 适用场景 |
|----------|----------|
| `direct` | 参考图和目标输出已经很接近 |
| `style` | 只借用视觉风格 |
| `palette` | 只借用颜色方案 |

---

## Step 3：确认设置 ⚠️

**不要跳过。** 一次 `AskUserQuestion` 最多 4 个问题。**Q1、Q2、Q3 都必须问。**

### Q1：插图类型 ⚠️ 必问

- [根据分析给出的推荐项]（推荐）
- `infographic` / `scene` / `flowchart` / `comparison` / `framework` / `timeline` / `mixed`

### Q2：插图密度 ⚠️ 必问

- `minimal`（1-2 张）- 只覆盖核心概念
- `balanced`（3-5 张）- 覆盖主要段落
- `per-section` - 每一节至少 1 张（推荐）
- `rich`（6+）- 尽可能全面

### Q3：风格 ⚠️ 必问

即使 config 里已有 `preferred_style`，这一题也仍然要问。

如果已有 `preferred_style`：

- [自定义风格名 + 简介]（推荐）
- [最兼容的核心风格 1]
- [最兼容的核心风格 2]
- 其他（查看完整 Style Gallery）

如果没有 `preferred_style`：

- [最匹配的核心风格]（推荐）
- [其他兼容核心风格 1]
- [其他兼容核心风格 2]
- 其他（查看完整 Style Gallery）

**核心风格**（简化选择）：

| 核心风格 | 最适合 |
|----------|--------|
| `minimal-flat` | 通用知识分享、SaaS、教程 |
| `sci-fi` | AI、前沿技术、系统设计 |
| `hand-drawn` | 轻松、反思、随笔 |
| `editorial` | 流程、数据、新闻感 |
| `scene` | 叙事、情绪、生活方式 |

完整规范见 `styles.md` 与 `styles/<style>.md`。

### Q4：图片文字语言 ⚠️ 条件必问

当检测到文章语言和 config 中的 `language` 不一致时，必须询问：

- 使用文章语言（推荐）
- 使用 config 里的默认语言

**只有在以下情况可以跳过**：

- 文章语言与 config `language` 一致
- config 没有设置 `language`

### 如果存在参考图，在给用户展示 outline 预览时附带说明

```text
参考图使用建议：
| Ref | 文件名 | 推荐用法 |
|-----|--------|----------|
| 01  | 01-ref-diagram.png | direct → Illustration 1, 3 |
| 02  | 02-ref-chart.png   | palette → Illustration 2 |
```

---

## Step 4：生成大纲

保存为 `outline.md`。
