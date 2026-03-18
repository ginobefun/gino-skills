---
name: preferences-schema
description: cover-image 的 config.json 偏好 schema
---

# 偏好 Schema

## 完整 Schema

```json
{
  "version": 3,
  "watermark": {
    "enabled": false,
    "content": "",
    "position": "bottom-right"
  },
  "preferred_type": null,
  "preferred_palette": null,
  "preferred_rendering": null,
  "preferred_text": "title-only",
  "preferred_mood": "balanced",
  "default_aspect": "2.35:1",
  "quick_mode": false,
  "language": null,
  "custom_palettes": []
}
```

## 字段说明

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `version` | int | 3 | schema 版本 |
| `watermark.enabled` | bool | false | 是否开启水印 |
| `watermark.content` | string | "" | 水印文字（@username 或自定义） |
| `watermark.position` | enum | bottom-right | 水印位置 |
| `preferred_type` | string | null | 默认 type，`null` 表示自动 |
| `preferred_palette` | string | null | 默认 palette，`null` 表示自动 |
| `preferred_rendering` | string | null | 默认 rendering，`null` 表示自动 |
| `preferred_text` | string | title-only | 文本密度等级 |
| `preferred_mood` | string | balanced | 情绪强度等级 |
| `default_aspect` | string | "2.35:1" | 默认宽高比 |
| `quick_mode` | bool | false | 是否跳过确认步骤 |
| `language` | string | null | 输出语言，`null` 表示自动识别 |
| `custom_palettes` | array | [] | 用户自定义 palette |

## Type 选项

| 值 | 说明 |
|----|------|
| `hero` | 强视觉冲击，标题覆盖型 |
| `conceptual` | 概念表达，适合抽象核心想法 |
| `typography` | 文字主导，标题更突出 |
| `metaphor` | 视觉隐喻，用具象表达抽象 |
| `scene` | 场景化、叙事感更强 |
| `minimal` | 极简构图，强调留白 |

## Palette 选项

| 值 | 说明 |
|----|------|
| `warm` | 友好、亲近：orange / golden yellow / terracotta |
| `elegant` | 克制、高级：soft coral / muted teal / dusty rose |
| `cool` | 技术、专业：engineering blue / navy / cyan |
| `dark` | 电影感、偏高级：electric purple / cyan / magenta |
| `earth` | 自然、有机：forest green / sage / earth brown |
| `vivid` | 鲜明、活跃：bright red / neon green / electric blue |
| `pastel` | 柔和、轻巧：soft pink / mint / lavender |
| `mono` | 干净、聚焦：black / near-black / white |
| `retro` | 怀旧、复古：muted orange / dusty pink / maroon |

## Rendering 选项

| 值 | 说明 |
|----|------|
| `flat-vector` | 干净描边、统一填充、几何图形 |
| `hand-drawn` | 更自由的手绘笔触、带纸感 |
| `painterly` | 柔和笔刷、晕染、水彩感 |
| `digital` | 更精致，边缘更准，渐变更细 |
| `pixel` | 像素网格、抖动感、8-bit 形态 |
| `chalk` | 粉笔笔触、粉尘效果、黑板质感 |

## Text 选项

| 值 | 说明 |
|----|------|
| `none` | 纯视觉，不放文字 |
| `title-only` | 只有主标题 |
| `title-subtitle` | 标题 + 副标题 |
| `text-rich` | 标题 + 副标题 + 2-4 个关键词 |

## Mood 选项

| 值 | 说明 |
|----|------|
| `subtle` | 低对比、低饱和、偏平静 |
| `balanced` | 中等对比、中等饱和、通用 |
| `bold` | 高对比、高饱和、冲击更强 |

## Position 选项

| 值 | 说明 |
|----|------|
| `bottom-right` | 右下角（默认、最常见） |
| `bottom-left` | 左下角 |
| `bottom-center` | 底部居中 |
| `top-right` | 右上角 |

## 宽高比选项

| 值 | 说明 | 适用 |
|----|------|------|
| `2.35:1` | 电影感超宽屏 | 文章头图、博客封面 |
| `16:9` | 标准横屏 | 演示文稿、视频缩略图 |
| `1:1` | 方图 | 社交媒体、头像类卡片 |

## 自定义 Palette 字段

| 字段 | 必填 | 说明 |
|------|------|------|
| `name` | 是 | 唯一 palette 标识（kebab-case） |
| `description` | 是 | 这套 palette 想表达什么 |
| `colors.primary` | 否 | 主色数组（hex） |
| `colors.background` | 否 | 背景色（hex） |
| `colors.accents` | 否 | 点缀色数组（hex） |
| `decorative_hints` | 否 | 装饰元素 / 图案提示 |
| `best_for` | 否 | 推荐适用的内容类型 |

## 最小配置示例

```json
{
  "version": 3,
  "watermark": {
    "enabled": true,
    "content": "@myhandle"
  },
  "preferred_type": null,
  "preferred_palette": "elegant",
  "preferred_rendering": "hand-drawn",
  "preferred_text": "title-only",
  "preferred_mood": "balanced",
  "quick_mode": false
}
```

## 完整配置示例

```json
{
  "version": 3,
  "watermark": {
    "enabled": true,
    "content": "myblog.com",
    "position": "bottom-right"
  },
  "preferred_type": "conceptual",
  "preferred_palette": "cool",
  "preferred_rendering": "digital",
  "preferred_text": "title-subtitle",
  "preferred_mood": "subtle",
  "default_aspect": "16:9",
  "quick_mode": true,
  "language": "en",
  "custom_palettes": [
    {
      "name": "corporate-tech",
      "description": "Professional B2B tech palette",
      "colors": {
        "primary": ["#1E3A5F", "#4A90D9"],
        "background": "#F5F7FA",
        "accents": ["#00B4D8", "#48CAE4"]
      },
      "decorative_hints": "Clean lines, subtle gradients, circuit patterns",
      "best_for": "SaaS, enterprise, technical"
    }
  ]
}
```

## 从 v2 迁移

加载 v2 schema 时，自动升级到 v3：

| v2 字段 | v3 字段 | 迁移动作 |
|---------|---------|----------|
| `version: 2` | `version: 3` | 更新 |
| `preferred_style` | `preferred_palette` + `preferred_rendering` | 按映射表拆分 |
| `custom_styles` | `custom_palettes` | 重命名并调整结构 |

**Style → Palette + Rendering 映射**：

| v2 `preferred_style` | v3 `preferred_palette` | v3 `preferred_rendering` |
|----------------------|------------------------|--------------------------|
| `elegant` | `elegant` | `hand-drawn` |
| `blueprint` | `cool` | `digital` |
| `chalkboard` | `dark` | `chalk` |
| `dark-atmospheric` | `dark` | `digital` |
| `editorial-infographic` | `cool` | `digital` |
| `fantasy-animation` | `pastel` | `painterly` |
| `flat-doodle` | `pastel` | `flat-vector` |
| `intuition-machine` | `retro` | `digital` |
| `minimal` | `mono` | `flat-vector` |
| `nature` | `earth` | `hand-drawn` |
| `notion` | `mono` | `digital` |
| `pixel-art` | `vivid` | `pixel` |
| `playful` | `pastel` | `hand-drawn` |
| `retro` | `retro` | `digital` |
| `sketch-notes` | `warm` | `hand-drawn` |
| `vector-illustration` | `retro` | `flat-vector` |
| `vintage` | `retro` | `hand-drawn` |
| `warm` | `warm` | `hand-drawn` |
| `watercolor` | `earth` | `painterly` |
| null（自动） | null | null |

**自定义 style 的迁移**：

| v2 字段 | v3 字段 |
|---------|---------|
| `custom_styles[].name` | `custom_palettes[].name` |
| `custom_styles[].description` | `custom_palettes[].description` |
| `custom_styles[].color_palette` | `custom_palettes[].colors` |
| `custom_styles[].visual_elements` | `custom_palettes[].decorative_hints` |
| `custom_styles[].typography` | 删除（由 rendering 决定） |
| `custom_styles[].best_for` | `custom_palettes[].best_for` |

## 从 v1 迁移

加载 v1 schema 时，自动升级到 v3：

| v1 字段 | v3 字段 | 默认值 |
|---------|---------|--------|
| （缺失） | `version` | 3 |
| （缺失） | `preferred_palette` | null |
| （缺失） | `preferred_rendering` | null |
| （缺失） | `preferred_text` | title-only |
| （缺失） | `preferred_mood` | balanced |
| （缺失） | `quick_mode` | false |
