---
name: preferences-schema
description: config.json schema for image-gen user preferences
---

# Preferences Schema

## Full Schema

```json
{
  "version": 1,
  "default_provider": null,
  "default_quality": null,
  "default_aspect_ratio": null,
  "default_image_size": null,
  "default_model": {
    "google": null,
    "openai": null,
    "dashscope": null,
    "replicate": null
  }
}
```

## Field Reference

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `version` | int | 1 | Schema version |
| `default_provider` | string\|null | null | Default provider (null = auto-detect) |
| `default_quality` | string\|null | null | Default quality (null = 2k) |
| `default_aspect_ratio` | string\|null | null | Default aspect ratio |
| `default_image_size` | string\|null | null | Google image size (overrides quality) |
| `default_model.google` | string\|null | null | Google default model |
| `default_model.openai` | string\|null | null | OpenAI default model |
| `default_model.dashscope` | string\|null | null | DashScope default model |
| `default_model.replicate` | string\|null | null | Replicate default model |

## Examples

**Minimal**:
```json
{
  "version": 1,
  "default_provider": "google",
  "default_quality": "2k"
}
```

**Full**:
```json
{
  "version": 1,
  "default_provider": "google",
  "default_quality": "2k",
  "default_aspect_ratio": "16:9",
  "default_image_size": "2K",
  "default_model": {
    "google": "gemini-3-pro-image-preview",
    "openai": "gpt-image-1.5",
    "dashscope": "z-image-turbo",
    "replicate": "google/nano-banana-pro"
  }
}
```

Canonical machine-readable schema: `skills/image-gen/config.schema.json`
