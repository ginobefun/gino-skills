---
name: preferences-schema
description: config.json schema for article-illustrator user preferences
---

# Preferences Schema

## Full Schema

```json
{
  "version": 1,
  "watermark": {
    "enabled": false,
    "content": "",
    "position": "bottom-right"
  },
  "preferred_style": {
    "name": null,
    "description": ""
  },
  "language": null,
  "default_output_dir": null,
  "custom_styles": []
}
```

## Field Reference

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `version` | int | 1 | Schema version |
| `watermark.enabled` | bool | false | Enable watermark |
| `watermark.content` | string | "" | Watermark text (@username or custom) |
| `watermark.position` | enum | bottom-right | Position on image |
| `preferred_style.name` | string | null | Style name or null |
| `preferred_style.description` | string | "" | Custom notes/override |
| `language` | string | null | Output language (null = auto-detect) |
| `default_output_dir` | enum | null | Output directory preference (null = ask each time) |
| `custom_styles` | array | [] | User-defined styles |

## Position Options

| Value | Description |
|-------|-------------|
| `bottom-right` | Lower right corner (default, most common) |
| `bottom-left` | Lower left corner |
| `bottom-center` | Bottom center |
| `top-right` | Upper right corner |

## Output Directory Options

| Value | Description |
|-------|-------------|
| `same-dir` | Same directory as article |
| `illustrations-subdir` | `{article-dir}/illustrations/` subdirectory |
| `independent` | `illustrations/{topic-slug}/` in working directory |

## Custom Style Fields

| Field | Required | Description |
|-------|----------|-------------|
| `name` | Yes | Unique style identifier (kebab-case) |
| `description` | Yes | What the style conveys |
| `color_palette.primary` | No | Main colors (array) |
| `color_palette.background` | No | Background color |
| `color_palette.accents` | No | Accent colors (array) |
| `visual_elements` | No | Decorative elements |
| `typography` | No | Font/lettering style |
| `best_for` | No | Recommended content types |

## Example: Minimal Preferences

```json
{
  "version": 1,
  "watermark": {
    "enabled": true,
    "content": "@myusername"
  },
  "preferred_style": {
    "name": "notion"
  }
}
```

## Example: Full Preferences

```json
{
  "version": 1,
  "watermark": {
    "enabled": true,
    "content": "@myaccount",
    "position": "bottom-right"
  },
  "preferred_style": {
    "name": "notion",
    "description": "Clean illustrations for tech articles"
  },
  "language": "zh",
  "custom_styles": [
    {
      "name": "corporate",
      "description": "Professional B2B style",
      "color_palette": {
        "primary": ["#1E3A5F", "#4A90D9"],
        "background": "#F5F7FA",
        "accents": ["#00B4D8", "#48CAE4"]
      },
      "visual_elements": "Clean lines, subtle gradients, geometric shapes",
      "typography": "Modern sans-serif, professional",
      "best_for": "Business, SaaS, enterprise"
    }
  ]
}
```
