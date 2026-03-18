---
name: first-time-setup
description: cover-image 首次偏好设置流程
---

# 首次设置

## 概览

当找不到 `config.json` 时，必须先完成封面图偏好设置。

**⛔ 阻塞操作**：在设置完成前，不要：

- 询问参考图
- 询问文章或内容细节
- 询问维度细节（type、palette、rendering）
- 直接开始内容分析

只完成本页中的 setup，写入 `config.json` 后再继续。

## 设置流程

```text
未找到 config.json
        │
        ▼
┌─────────────────────┐
│ AskUserQuestion     │
│ （一次问完）         │
└─────────────────────┘
        │
        ▼
┌─────────────────────┐
│ 创建 config.json    │
└─────────────────────┘
        │
        ▼
继续 Step 1
```

## 问题清单

**语言**：使用用户当前语言或已保存的语言偏好。

一次 `AskUserQuestion` 把所有问题一起问完：

### 问题 1：水印

```yaml
header: "Watermark"
question: "生成封面图时默认加什么水印？"
options:
  - label: "No watermark (Recommended)"
    description: "默认无水印，后续可在 config.json 中再开启"
```

### 问题 2：偏好 Type

```yaml
header: "Type"
question: "默认偏好的封面类型是什么？"
options:
  - label: "Auto-select (Recommended)"
    description: "每次根据内容自动判断"
  - label: "hero"
    description: "强调视觉冲击，适合发布、公告、产品亮相"
  - label: "conceptual"
    description: "强调概念表达，适合技术、架构、抽象主题"
```

### 问题 3：偏好 Palette

```yaml
header: "Palette"
question: "默认偏好的颜色方案是什么？"
options:
  - label: "Auto-select (Recommended)"
    description: "每次根据内容自动判断"
  - label: "elegant"
    description: "更克制、更高级：soft coral / muted teal / dusty rose"
  - label: "warm"
    description: "更友好、更温暖：orange / golden yellow / terracotta"
  - label: "cool"
    description: "更技术感：engineering blue / navy / cyan"
```

### 问题 4：偏好 Rendering

```yaml
header: "Rendering"
question: "默认偏好的渲染风格是什么？"
options:
  - label: "Auto-select (Recommended)"
    description: "每次根据内容自动判断"
  - label: "hand-drawn"
    description: "带个人感的草图 / 手绘风"
  - label: "flat-vector"
    description: "干净现代的几何矢量风格"
  - label: "digital"
    description: "更精致、可控的数字插画风"
```

### 问题 5：默认宽高比

```yaml
header: "Aspect"
question: "封面图默认宽高比是什么？"
options:
  - label: "16:9 (Recommended)"
    description: "通用横版：YouTube、演示文稿、通用封面"
  - label: "2.35:1"
    description: "电影感超宽屏：文章头图、博客横幅"
  - label: "1:1"
    description: "方图：Instagram、微信、小卡片"
  - label: "3:4"
    description: "竖版：小红书、Pinterest、移动端内容"
```

说明：生成阶段仍可使用更多比例（如 4:3、3:2），这里仅设置默认推荐值。

### 问题 6：默认输出目录

```yaml
header: "Output"
question: "封面图默认输出到哪里？"
options:
  - label: "Independent (Recommended)"
    description: "cover-image/{topic-slug}/ - 独立目录"
  - label: "Same directory"
    description: "{article-dir}/ - 与文章文件同目录"
  - label: "imgs subdirectory"
    description: "{article-dir}/imgs/ - 文章旁边的图片目录"
```

### 问题 7：Quick Mode

```yaml
header: "Quick"
question: "是否默认开启 quick mode？"
options:
  - label: "No (Recommended)"
    description: "每次仍确认关键维度选择"
  - label: "Yes"
    description: "跳过确认，直接使用自动选择结果"
```

### 问题 8：保存位置

```yaml
header: "Save"
question: "偏好保存到哪里？"
options:
  - label: "Project (Recommended)"
    description: ".gino-skills/（仅当前项目）"
  - label: "User"
    description: "~/.gino-skills/（当前用户所有项目）"
```

## 保存位置

| 选项 | 路径 | 作用范围 |
|------|------|----------|
| Project | `.gino-skills/cover-image/config.json` | 当前项目 |
| User | `~/.gino-skills/cover-image/config.json` | 当前用户所有项目 |

## 设置完成后

1. 如有需要先创建目录
2. 写入 `config.json`
3. 向用户确认：“偏好已保存到 [path]”
4. 回到 Step 1

## `config.json` 模板

```json
{
  "version": 3,
  "watermark": {
    "enabled": false,
    "content": "[user input or empty]",
    "position": "bottom-right",
    "opacity": 0.7
  },
  "preferred_type": "[selected type or null]",
  "preferred_palette": "[selected palette or null]",
  "preferred_rendering": "[selected rendering or null]",
  "preferred_text": "title-only",
  "preferred_mood": "balanced",
  "default_aspect": "[16:9/2.35:1/1:1/3:4]",
  "default_output_dir": "[independent/same-dir/imgs-subdir]",
  "quick_mode": false,
  "language": null,
  "custom_palettes": []
}
```

## 后续修改偏好

用户可以直接编辑 `config.json`，也可以删除后重新走 setup：

- 删除 `config.json` 重新触发设置
- 完整 schema 见 `preferences-schema.md`

机器可读 schema 见：`skills/cover-image/config.schema.json`

## Legacy 兼容附录

迁移期间仍保留 legacy `EXTEND.md` fallback，但只作兼容，不应再出现在主流程。

- `.gino-skills/cover-image/EXTEND.md`
- `$HOME/.gino-skills/cover-image/EXTEND.md`

弃用时间线见 `docs/deprecation-roadmap.md`
