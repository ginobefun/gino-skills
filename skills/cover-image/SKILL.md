---
name: cover-image
description: "Use when 用户想为文章、帖子或文档生成一张封面图，并希望控制风格维度，或可选提供参考图片。"
---

# 封面图生成器

为文章生成有明确风格控制的封面图，支持 5 个核心维度和参考图输入。

## 用法

```bash
# 根据内容自动选择维度
/cover-image path/to/article.md

# 快速模式：跳过确认
/cover-image article.md --quick

# 指定维度
/cover-image article.md --type conceptual --palette warm --rendering flat-vector

# 风格预设（palette + rendering 的简写）
/cover-image article.md --style blueprint

# 搭配参考图
/cover-image article.md --ref style-ref.png

# 直接输入内容
/cover-image --palette mono --aspect 1:1 --quick
[paste content]
```

## 参数

| 参数 | 说明 |
|--------|-------------|
| `--type <name>` | hero、conceptual、typography、metaphor、scene、minimal |
| `--palette <name>` | warm、elegant、cool、dark、earth、vivid、pastel、mono、retro |
| `--rendering <name>` | flat-vector、hand-drawn、painterly、digital、pixel、chalk |
| `--style <name>` | 预设简写（见 [Style Presets](references/style-presets.md)） |
| `--text <level>` | none、title-only、title-subtitle、text-rich |
| `--mood <level>` | subtle、balanced、bold |
| `--font <name>` | clean、handwritten、serif、display |
| `--aspect <ratio>` | 16:9（默认）、2.35:1、4:3、3:2、1:1、3:4 |
| `--lang <code>` | 标题语言（en、zh、ja 等） |
| `--no-title` | `--text none` 的别名 |
| `--quick` | 跳过确认，直接使用自动选择 |
| `--ref <files...>` | 用于风格或构图参考的参考图 |

## 五个维度

| 维度 | 可选值 | 默认 |
|-----------|--------|---------|
| **Type** | hero、conceptual、typography、metaphor、scene、minimal | auto |
| **Palette** | warm、elegant、cool、dark、earth、vivid、pastel、mono、retro | auto |
| **Rendering** | flat-vector、hand-drawn、painterly、digital、pixel、chalk | auto |
| **Text** | none、title-only、title-subtitle、text-rich | title-only |
| **Mood** | subtle、balanced、bold | balanced |
| **Font** | clean、handwritten、serif、display | clean |

自动选择规则见：[references/auto-selection.md](references/auto-selection.md)

## 图库

**Types**：hero、conceptual、typography、metaphor、scene、minimal  
→ 详见：[references/types.md](references/types.md)

**Palettes**：warm、elegant、cool、dark、earth、vivid、pastel、mono、retro  
→ 详见：[references/palettes/](references/palettes/)

**Renderings**：flat-vector、hand-drawn、painterly、digital、pixel、chalk  
→ 详见：[references/renderings/](references/renderings/)

**Text Levels**：none（纯视觉）| title-only（默认）| title-subtitle | text-rich（包含标签）  
→ 详见：[references/dimensions/text.md](references/dimensions/text.md)

**Mood Levels**：subtle（低对比）| balanced（默认）| bold（高对比）  
→ 详见：[references/dimensions/mood.md](references/dimensions/mood.md)

**Fonts**：clean（无衬线）| handwritten | serif | display（装饰性强）  
→ 详见：[references/dimensions/font.md](references/dimensions/font.md)

## 文件结构

输出目录由 `default_output_dir` 决定：
- `same-dir`：`{article-dir}/`
- `imgs-subdir`：`{article-dir}/imgs/`
- `independent`（默认）：`cover-image/{topic-slug}/`

```text
<output-dir>/
├── source-{slug}.{ext}    # 源文件
├── refs/                  # 参考图（如果有）
│   ├── ref-01-{slug}.{ext}
│   └── ref-01-{slug}.md   # 描述文件
├── prompts/cover.md       # 生成 prompt
└── cover.png              # 输出图片
```

**Slug**：2-4 个词，kebab-case。冲突时追加 `-YYYYMMDD-HHMMSS`

## 工作流

### 进度清单

```text
Cover Image Progress:
- [ ] Step 0: 检查偏好 / 配置 ⛔ BLOCKING
- [ ] Step 1: 分析内容 + 保存 refs + 确定输出目录
- [ ] Step 2: 确认选项（6 个维度）⚠️ 除非 --quick
- [ ] Step 3: 创建 prompt
- [ ] Step 4: 生成图片
- [ ] Step 5: 完成报告
```

### 流程图

```text
Input → [Step 0: Preferences] ─┬─ Found → Continue
                               └─ Not found → First-Time Setup ⛔ BLOCKING → Save config.json → Continue
        ↓
Analyze + Save Refs → [Output Dir] → [Confirm: 6 Dimensions] → Prompt → Generate → Complete
                                              ↓
                                     (skip if --quick or all specified)
```

### 第 0 步：加载偏好 ⛔ 阻塞步骤

优先走共享 loader：

```bash
bun scripts/examples/cover_image_config_state.ts read
```

只有在排查路径解析问题时，才手动检查文件：

```bash
test -f .gino-skills/cover-image/config.json && echo "project-config"
test -f "$HOME/.gino-skills/cover-image/config.json" && echo "user-config"
test -f .gino-skills/cover-image/EXTEND.md && echo "project-extend"
test -f "$HOME/.gino-skills/cover-image/EXTEND.md" && echo "user-extend"
```

```powershell
if (Test-Path .gino-skills/cover-image/config.json) { "project-config" }
if (Test-Path "$HOME/.gino-skills/cover-image/config.json") { "user-config" }
if (Test-Path .gino-skills/cover-image/EXTEND.md) { "project-extend" }
if (Test-Path "$HOME/.gino-skills/cover-image/EXTEND.md") { "user-extend" }
```

| 结果 | 动作 |
|--------|--------|
| Found `config.json` | 加载并展示摘要 → 继续 |
| Not found | ⛔ 运行首次配置（[references/config/first-time-setup.md](references/config/first-time-setup.md)）→ 保存 `config.json` → 继续 |

**关键要求**：如果没找到配置，必须先完成 setup，再继续后续任何步骤或问题。

### 第 1 步：分析内容

1. **保存参考图**（如果有）→ [references/workflow/reference-images.md](references/workflow/reference-images.md)
2. **保存源内容**（如果是粘贴输入，就保存为 `source.md`）
3. **分析内容**：主题、语气、关键词、视觉隐喻
4. **深度分析参考图** ⚠️：提炼具体、可操作的风格元素
5. **识别语言**：结合源内容、用户输入和配置偏好判断
6. **确定输出目录**：按上面的文件结构规则落盘

### 第 2 步：确认选项 ⚠️

完整确认流程见：[references/workflow/confirm-options.md](references/workflow/confirm-options.md)

| 条件 | 可跳过内容 | 仍需确认 |
|-----------|---------|-------------|
| `--quick` 或配置中 `quick_mode: true` | 6 个维度 | 宽高比（除非传了 `--aspect`） |
| 6 个维度和 `--aspect` 都已显式给出 | 全部 | 无 |

### 第 3 步：创建 Prompt

保存到 `prompts/cover.md`。模板见：[references/workflow/prompt-template.md](references/workflow/prompt-template.md)

**关键要求：Frontmatter 中 references 的处理方式**
- 如果文件已保存到 `refs/` → 加入 frontmatter 的 `references` 列表
- 如果只是从参考图中抽取了风格描述，没有直接引用文件 → 不要写 `references`，而是在正文里描述
- 写入前必须验证：`test -f refs/ref-NN-{slug}.{ext}`

正文里引用参考图时，必须写得具体、明确，并用 `MUST` / `REQUIRED` 这种强约束词说明如何整合。

### 第 4 步：生成图片

1. 如果要重生成，先备份已有的 `cover.png`
2. 检查可用的图片生成 skill；如果有多个，询问用户偏好
3. 处理 prompt frontmatter 里的 references：
   - `direct` → 通过 `--ref` 传给支持参考图的后端
   - `style` / `palette` → 提炼风格特征后拼接进 prompt 正文
4. 调用图片生成 skill，传入 prompt 文件、输出路径和宽高比
5. 失败时自动重试一次

### 第 5 步：完成报告

```text
Cover Generated!

Topic: [topic]
Type: [type] | Palette: [palette] | Rendering: [rendering]
Text: [text] | Mood: [mood] | Font: [font] | Aspect: [ratio]
Title: [title or "visual only"]
Language: [lang] | Watermark: [enabled/disabled]
References: [N images or "extracted style" or "none"]
Location: [directory path]

Files:
✓ source-{slug}.{ext}
✓ prompts/cover.md
✓ cover.png
```

## 图片修改

| 动作 | 步骤 |
|--------|-------|
| **Regenerate** | 备份 → 先更新 prompt 文件 → 再重新生成 |
| **Change dimension** | 备份 → 确认新值 → 更新 prompt → 重新生成 |

## 构图原则

- **留白**：保留 40-60% 的呼吸空间
- **视觉锚点**：主元素居中或偏左
- **人物**：使用简化剪影；不要生成写实人像
- **标题**：必须使用用户或源文中的真实标题，不能凭空编造

## 运行时约定

本技能遵循 `docs/skill-runtime-conventions.md`。

- 首选配置：`.gino-skills/cover-image/config.json`
- 用户级回退配置：`$HOME/.gino-skills/cover-image/config.json`
- 兼容旧版：`.gino-skills/cover-image/EXTEND.md` 和 `$HOME/.gino-skills/cover-image/EXTEND.md`

## 共享脚本

- `scripts/shared/cover_image_config.ts`：统一解析 `config.json`，并兼容 legacy `EXTEND.md`
- `scripts/examples/cover_image_config_state.ts`：输出当前命中的配置来源、路径和摘要

## Worker 入口

优先使用统一 loader，而不是手写文件探测：

```bash
bun scripts/examples/cover_image_config_state.ts paths
bun scripts/examples/cover_image_config_state.ts read
```

## 扩展配置支持

自定义配置优先使用 `config.json`；legacy `EXTEND.md` 仅保留兼容用途。主入口和回退路径见 **Step 0**。

## Legacy 兼容附录

迁移期内仍保留 legacy `EXTEND.md` 回退路径，但它仅用于兼容，不应出现在主流程中。详见 [docs/deprecation-roadmap.md](/Users/gino/Documents/Github/gino-skills/docs/deprecation-roadmap.md)。

Fallback paths:
- `.gino-skills/cover-image/EXTEND.md`
- `$HOME/.gino-skills/cover-image/EXTEND.md`

支持项：Watermark | Preferred dimensions | Default aspect/output | Quick mode | Custom palettes | Language

Schema: [references/config/preferences-schema.md](references/config/preferences-schema.md)

## 参考资料

**Dimensions**： [text.md](references/dimensions/text.md) | [mood.md](references/dimensions/mood.md) | [font.md](references/dimensions/font.md)  
**Palettes**： [references/palettes/](references/palettes/)  
**Renderings**： [references/renderings/](references/renderings/)  
**Types**： [references/types.md](references/types.md)  
**Auto-Selection**： [references/auto-selection.md](references/auto-selection.md)  
**Style Presets**： [references/style-presets.md](references/style-presets.md)  
**Compatibility**： [references/compatibility.md](references/compatibility.md)  
**Visual Elements**： [references/visual-elements.md](references/visual-elements.md)  
**Workflow**： [confirm-options.md](references/workflow/confirm-options.md) | [prompt-template.md](references/workflow/prompt-template.md) | [reference-images.md](references/workflow/reference-images.md)  
**Config**： [preferences-schema.md](references/config/preferences-schema.md) | [first-time-setup.md](references/config/first-time-setup.md) | [watermark-guide.md](references/config/watermark-guide.md)
