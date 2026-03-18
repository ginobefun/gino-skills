# 参考图处理

用于指导封面图生成时如何处理用户提供的参考图。

## 输入识别

| 输入类型 | 动作 |
|----------|------|
| 用户给了图片文件路径 | 复制到 `refs/`，后续可用 `--ref` |
| 对话里带了图片，但没有路径 | 用 `AskUserQuestion` 让用户补文件路径 |
| 用户无法提供路径 | 口头提炼 style / palette，追加进 prompt，不写 frontmatter references |

**关键规则**：只有当参考图文件真的保存进 `refs/` 目录时，才允许在 prompt frontmatter 中加入 `references`。

## 文件保存

**如果用户给了文件路径**：

1. 复制到 `refs/ref-NN-{slug}.{ext}`（NN 依次为 01、02...）
2. 创建说明文件：`refs/ref-NN-{slug}.md`
3. 继续前确认文件真实存在

**说明文件格式**：

```yaml
---
ref_id: NN
filename: ref-NN-{slug}.{ext}
usage: direct | style | palette
---
[用户描述或自动生成的描述]
```

| 用法 | 适用场景 |
|------|----------|
| `direct` | 参考图和目标输出非常接近 |
| `style` | 只借视觉风格 |
| `palette` | 只借配色 |

## 口头提炼（无文件）

如果用户无法提供文件路径：

1. 直接目视分析图片，提取颜色、风格和构图
2. 写入 `refs/extracted-style.md`
3. 不要在 prompt frontmatter 里写 `references`
4. 把提炼出的 style / colors 直接拼进 prompt 正文

## 深度分析 ⚠️ 关键

参考图是高优先级输入。提炼时要尽量**具体、明确、可复现**：

| 分析项 | 说明 | 好例子 vs 差例子 |
|--------|------|------------------|
| **品牌元素** | logo、字标、明确的字体特征 | 好："Logo uses vertical parallel lines for 'm'" / 差："Has a logo" |
| **标志性纹理/图案** | 独特装饰、纹理或图样 | 好："Woven intersecting curves forming diamond grid" / 差："Has patterns" |
| **颜色方案** | 关键颜色的准确 hex | 好："#2D4A3E dark teal, #F5F0E0 cream" / 差："Dark and light colors" |
| **布局结构** | 具体空间关系 | 好："Bottom 30% dark banner with branding" / 差："Has a banner" |
| **字体特征** | 字体风格、字重、间距、大小写 | 好："Uppercase, wide letter-spacing" / 差："Has text" |
| **内容主题** | 参考图到底画了什么 | 真实描述即可 |
| **推荐用法** | `direct` / `style` / `palette` | 基于分析给出 |

**输出要求**：尽量把每个结论写成可直接复制进 prompt 的明确指令。

## 校验输出

**如果文件已保存**：

```text
参考图已保存：
- ref-01-{slug}.png ✓（可用于 --ref）
- ref-02-{slug}.png ✓（可用于 --ref）
```

**如果只是提炼风格**：

```text
已提炼参考风格（无文件）：
- Colors: #E8756D coral, #7ECFC0 mint...
- Style: minimal flat vector, clean lines...
→ 会直接追加到 prompt 文本，不使用 --ref
```

## 优先级规则

用户一旦给了参考图，它们就是**高优先级约束**：

- **参考图优先于默认偏好**：如果参考图与默认 palette / rendering 冲突，以参考图为准
- **具体优先于抽象**：优先提炼明确元素，而不是泛泛写“clean style”
- **要用强约束语言**：在 prompt 中使用 `MUST`、`REQUIRED`
- **结果里必须看得出来**：如果生成结果没有体现参考特征，就继续加强 prompt
