# Step 2：确认选项

## 目标

确认 6 个维度 + 宽高比。

## 跳过条件

| 条件 | 可跳过的问题 | 仍需询问 |
|------|--------------|----------|
| 传入 `--quick` | Type、Palette、Rendering、Text、Mood、Font | **Aspect Ratio**（除非显式指定 `--aspect`） |
| 6 个维度和 `--aspect` 都已显式传入 | 全部 | 无 |
| `config.json` 中 `quick_mode: true` | Type、Palette、Rendering、Text、Mood、Font | **Aspect Ratio**（除非显式指定 `--aspect`） |
| 其他情况 | 无 | 全部 7 个问题 |

**重要**：除非 CLI 明确传了 `--aspect`，否则永远都要确认宽高比。`config.json` 里的预设只能作为推荐值展示，不能直接跳过。

## Quick Mode 输出

当跳过前 6 个维度时，输出类似：

```text
Quick Mode：自动选择的维度
• Type: [type] ([reason])
• Palette: [palette] ([reason])
• Rendering: [rendering] ([reason])
• Text: [text] ([reason])
• Mood: [mood] ([reason])
• Font: [font] ([reason])

[然后继续问 Question 7: Aspect Ratio]
```

## 确认流程

**语言**：自动决定（用户输入语言 > 已保存偏好 > 来源语言），不需要额外询问。

把所有问题放进一次 `AskUserQuestion` 调用中（最多 4 个）。

对于已经通过 CLI 指定，或已由 `--style` 预设覆盖的维度，可以跳过对应问题。

### Q1：Type（若已传 `--type` 则跳过）

```yaml
header: "Type"
question: "封面图用哪种 type？"
multiSelect: false
options:
  - label: "[auto-recommended type] (Recommended)"
    description: "[基于内容信号给出的理由]"
  - label: "hero"
    description: "强视觉冲击 + 标题覆盖，适合发布、公告"
  - label: "conceptual"
    description: "概念表达，适合技术、架构、抽象主题"
  - label: "typography"
    description: "文字优先，适合观点、引语、短标题"
```

### Q2：Palette（若已传 `--palette` 或 `--style` 则跳过）

```yaml
header: "Palette"
question: "颜色方案选哪种？"
multiSelect: false
options:
  - label: "[auto-recommended palette] (Recommended)"
    description: "[基于内容信号给出的理由]"
  - label: "warm"
    description: "友好、温暖：orange / golden yellow / terracotta"
  - label: "elegant"
    description: "克制、高级：soft coral / muted teal / dusty rose"
  - label: "cool"
    description: "技术感：engineering blue / navy / cyan"
```

### Q3：Rendering（若已传 `--rendering` 或 `--style` 则跳过）

优先展示兼容度最高的 rendering：

```yaml
header: "Rendering"
question: "渲染风格选哪种？"
multiSelect: false
options:
  - label: "[best compatible rendering] (Recommended)"
    description: "[基于 palette + type + content 的理由]"
  - label: "flat-vector"
    description: "干净描边、纯色填充、几何图形"
  - label: "hand-drawn"
    description: "更有手感，线条更自由"
  - label: "digital"
    description: "更精致、边缘更准、渐变更细"
```

### Q4：Font（若已传 `--font` 则跳过）

```yaml
header: "Font"
question: "字体风格选哪种？"
multiSelect: false
options:
  - label: "[auto-recommended font] (Recommended)"
    description: "[基于内容信号给出的理由]"
  - label: "clean"
    description: "现代几何无衬线，偏技术、专业"
  - label: "handwritten"
    description: "更温暖，像手写"
  - label: "serif"
    description: "经典、优雅、偏 editorial"
  - label: "display"
    description: "更夸张、更装饰化，适合公告或娱乐内容"
```

### Q5：其他设置（若剩余维度都已明确则跳过）

把剩余项合并成一个问题。可能包括：输出目录（如果 file path 模式且没有默认偏好）、Text、Mood、Aspect。自动推荐值作为第一项，用户也可以通过 “Other” 自定义。

**当输出目录仍需询问时**：

```yaml
header: "Settings"
question: "输出目录 / Text / Mood / Aspect 怎么选？"
multiSelect: false
options:
  - label: "imgs/ / [auto-text] / [auto-mood] / [preset-aspect] (Recommended)"
    description: "{article-dir}/imgs/, [text reason], [mood reason], [aspect source]"
  - label: "same-dir / [auto-text] / [auto-mood] / [preset-aspect]"
    description: "{article-dir}/，与文章同目录"
  - label: "independent / [auto-text] / [auto-mood] / [preset-aspect]"
    description: "cover-image/{topic-slug}/，使用独立目录"
```

**如果输出目录已固定**（已有偏好，或当前是 paste 模式）：

```yaml
header: "Settings"
question: "Text / Mood / Aspect 怎么选？"
multiSelect: false
options:
  - label: "[auto-text] / [auto-mood] / [preset-aspect] (Recommended)"
    description: "自动选择：[text reason], [mood reason], [aspect source]"
  - label: "[auto-text] / bold / [preset-aspect]"
    description: "高对比、更鲜明，适合 [content signal]"
  - label: "[auto-text] / subtle / [preset-aspect]"
    description: "低对比、更克制，适合平静、专业内容"
```

说明：“Other” 会自动出现，可让用户输入自定义组合。解析时按 `/` 分隔并匹配问题顺序。

## 回答后

进入 Step 3，并使用确认后的维度继续生成。
