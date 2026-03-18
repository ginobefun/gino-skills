# Prompt 构造规范

## Prompt 文件格式

每个 prompt 文件由 YAML frontmatter + 正文内容组成：

```yaml
---
illustration_id: 01
type: infographic
style: blueprint
references:                    # ⚠️ 只有 references/ 目录里真的有文件时才写
  - ref_id: 01
    filename: 01-ref-diagram.png
    usage: direct              # direct | style | palette
---

[下面接 type-specific template content...]
```

**⚠️ 何时可以包含 `references` 字段**：

| 情况 | 动作 |
|------|------|
| 参考图文件已保存到 `references/` | 可以写入 frontmatter ✓ |
| 只是口头提炼风格（没有文件） | 不要写入 frontmatter，改为追加到 prompt 正文 |
| frontmatter 里写了文件路径，但文件并不存在 | 视为错误，必须移除 `references` 字段 |

**Reference Usage Types**（仅在文件真实存在时使用）：

| 用法 | 含义 | 生成动作 |
|------|------|----------|
| `direct` | 作为主要视觉参考 | 传给 `--ref` |
| `style` | 只借风格特征 | 在 prompt 文本里描述风格 |
| `palette` | 只借颜色方案 | 在 prompt 中显式写颜色 |

**如果没有参考图文件，只是口头提炼了 style / palette**，直接追加到 prompt 正文：

```text
COLORS (from reference):
- Primary: #E8756D coral
- Secondary: #7ECFC0 mint
...

STYLE (from reference):
- Clean lines, minimal shadows
- Gradient backgrounds
...
```

---

## 默认构图要求

**所有 prompt 默认都要满足**：

| 要求 | 说明 |
|------|------|
| **干净构图** | 布局简洁，不要视觉噪音 |
| **足够留白** | 元素四周保留呼吸空间 |
| **避免复杂背景** | 只用纯色或轻微渐变，不要杂乱纹理 |
| **主元素居中或按内容需要布局** | 不要无意义地塞满画面 |
| **图形元素与内容主题匹配** | 不是随便加装饰 |
| **核心信息优先突出** | 用留白和层级把注意力拉到重点 |

默认追加到所有 prompt：

> Clean composition with generous white space. Simple or no background. Main elements centered or positioned by content needs.

---

## 人物表现

当需要画人时：

| 规则 | 说明 |
|------|------|
| **风格** | 用简化卡通剪影或符号化表达 |
| **避免** | 逼真的真人肖像、细致五官 |
| **多样性** | 多人场景时注意身形差异 |
| **情绪** | 通过姿态和简单动作表达 |

凡是 prompt 中出现人物，都追加：

> Human figures: simplified stylized silhouettes or symbolic representations, not photorealistic.

---

## 插图中的文字

| 元素 | 规则 |
|------|------|
| **字号** | 大、醒目、第一眼能读到 |
| **风格** | 优先偏手写感，增强温度 |
| **内容** | 只保留关键词和核心概念，避免长句 |
| **语言** | 与文章语言保持一致 |

凡是需要文字的 prompt，都追加：

> Text should be large and prominent with handwritten-style fonts. Keep minimal, focus on keywords.

---

## 原则

好的 prompt 至少包含：

1. **先描述布局结构**：构图、区域划分、信息流向
2. **明确数据与标签**：尽量用文章里的真实数字和术语
3. **说明视觉关系**：元素之间如何连接
4. **用语义颜色**：如 red=warning，green=efficient
5. **说明风格特征**：线条、质感、氛围
6. **以比例和复杂度收尾**

## Type-Specific Templates

### Infographic

```text
[Title] - Data Visualization

Layout: [grid/radial/hierarchical]

ZONES:
- Zone 1: [data point with specific values]
- Zone 2: [comparison with metrics]
- Zone 3: [summary/conclusion]

LABELS: [specific numbers, percentages, terms from article]
COLORS: [semantic color mapping]
STYLE: [style characteristics]
ASPECT: 16:9
```

**Infographic + vector-illustration**：

```text
Flat vector illustration infographic. Clean black outlines on all elements.
COLORS: Cream background (#F5F0E6), Coral Red (#E07A5F), Mint Green (#81B29A), Mustard Yellow (#F2CC8F)
ELEMENTS: Geometric simplified icons, no gradients, playful decorative elements (dots, stars)
```

### Scene

```text
[Title] - Atmospheric Scene

FOCAL POINT: [main subject]
ATMOSPHERE: [lighting, mood, environment]
MOOD: [emotion to convey]
COLOR TEMPERATURE: [warm/cool/neutral]
STYLE: [style characteristics]
ASPECT: 16:9
```

### Flowchart

```text
[Title] - Process Flow

Layout: [left-right/top-down/circular]

STEPS:
1. [Step name] - [brief description]
2. [Step name] - [brief description]
...

CONNECTIONS: [arrow types, decision points]
STYLE: [style characteristics]
ASPECT: 16:9
```

**Flowchart + vector-illustration**：

```text
Flat vector flowchart with bold arrows and geometric step containers.
COLORS: Cream background (#F5F0E6), steps in Coral/Mint/Mustard, black outlines
ELEMENTS: Rounded rectangles, thick arrows, simple icons per step
```

### Comparison

```text
[Title] - Comparison View

LEFT SIDE - [Option A]:
- [Point 1]
- [Point 2]

RIGHT SIDE - [Option B]:
- [Point 1]
- [Point 2]

DIVIDER: [visual separator]
STYLE: [style characteristics]
ASPECT: 16:9
```

**Comparison + vector-illustration**：

```text
Flat vector comparison with split layout. Clear visual separation.
COLORS: Left side Coral (#E07A5F), Right side Mint (#81B29A), cream background
ELEMENTS: Bold icons, black outlines, centered divider line
```

### Framework

```text
[Title] - Conceptual Framework

STRUCTURE: [hierarchical/network/matrix]

NODES:
- [Concept 1] - [role]
- [Concept 2] - [role]

RELATIONSHIPS: [how nodes connect]
STYLE: [style characteristics]
ASPECT: 16:9
```

**Framework + vector-illustration**：

```text
Flat vector framework diagram with geometric nodes and bold connectors.
COLORS: Cream background (#F5F0E6), nodes in Coral/Mint/Mustard/Blue, black outlines
ELEMENTS: Rounded rectangles or circles for nodes, thick connecting lines
```

### Timeline

```text
[Title] - Chronological View

DIRECTION: [horizontal/vertical]

EVENTS:
- [Date/Period 1]: [milestone]
- [Date/Period 2]: [milestone]

MARKERS: [visual indicators]
STYLE: [style characteristics]
ASPECT: 16:9
```

## 应避免的写法

- 模糊描述（如 “a nice image”）
- 按字面画隐喻
- 缺少具体标签、数字或注释
- 无关的泛装饰元素

## 水印集成

如果偏好里开启了水印，就在 prompt 末尾追加：

```text
Include a subtle watermark "[content]" positioned at [position] with approximately [opacity*100]% visibility.
```
