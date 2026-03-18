---
name: first-time-setup
description: image-gen 首次设置与默认模型选择流程
---

# 首次设置

## 概览

以下两种情况会触发本流程：

1. 找不到 `config.json` → 走完整设置（provider + model + preferences）
2. 已有 `config.json`，但 `default_model.[provider]` 为空 → 只补模型选择

## 设置流程

```text
未找到 config.json          已有 config，但 model 为空
        │                            │
        ▼                            ▼
┌─────────────────────┐    ┌──────────────────────┐
│ AskUserQuestion     │    │ AskUserQuestion      │
│ （完整设置）         │    │ （只问模型）          │
└─────────────────────┘    └──────────────────────┘
        │                            │
        ▼                            ▼
┌─────────────────────┐    ┌──────────────────────┐
│ 创建 config.json    │    │ 更新 config.json     │
└─────────────────────┘    └──────────────────────┘
        │                            │
        ▼                            ▼
       继续                         继续
```

## Flow 1：没有配置文件（完整设置）

**语言**：使用用户当前语言或已保存的语言偏好。

一次 `AskUserQuestion` 把所有问题问完：

### 问题 1：默认 Provider

```yaml
header: "Provider"
question: "默认图片生成 provider 选哪个？"
options:
  - label: "Google (Recommended)"
    description: "Gemini 多模态，质量高，支持参考图，尺寸灵活"
  - label: "OpenAI"
    description: "GPT Image，质量稳定，输出可靠"
  - label: "DashScope"
    description: "阿里云 z-image-turbo，对中文内容友好"
  - label: "Replicate"
    description: "社区模型丰富，模型选择更灵活"
```

### 问题 2：默认 Google 模型

只有在用户选择 Google，或未明确指定 provider 需要自动判定时才显示。

```yaml
header: "Google Model"
question: "默认使用哪个 Google 图像模型？"
options:
  - label: "gemini-3-pro-image-preview (Recommended)"
    description: "质量最高，适合正式产出"
  - label: "gemini-3.1-flash-image-preview"
    description: "更快，质量也不错，成本更低"
  - label: "gemini-3-flash-preview"
    description: "速度与质量更均衡"
```

### 问题 3：默认质量

```yaml
header: "Quality"
question: "默认图片质量是什么？"
options:
  - label: "2k (Recommended)"
    description: "2048px，适合封面、插图、信息图"
  - label: "normal"
    description: "1024px，适合快速预览与草稿"
```

### 问题 4：保存位置

```yaml
header: "Save"
question: "偏好保存到哪里？"
options:
  - label: "Project (Recommended)"
    description: ".gino-skills/（仅当前项目）"
  - label: "User"
    description: "~/.gino-skills/（当前用户所有项目）"
```

### 保存位置

| 选项 | 路径 | 作用范围 |
|------|------|----------|
| Project | `.gino-skills/image-gen/config.json` | 当前项目 |
| User | `$HOME/.gino-skills/image-gen/config.json` | 当前用户所有项目 |

### `config.json` 模板

```json
{
  "version": 1,
  "default_provider": "[selected provider or null]",
  "default_quality": "[selected quality]",
  "default_aspect_ratio": null,
  "default_image_size": null,
  "default_model": {
    "google": "[selected google model or null]",
    "openai": null,
    "dashscope": null,
    "replicate": null
  }
}
```

## Flow 2：已有配置，但当前 provider 的模型为空

当 `config.json` 已存在，但 `default_model.[current_provider]` 为空时，只询问当前 provider 对应的模型。

### Google 模型选择

```yaml
header: "Google Model"
question: "为 Google 选择一个默认图像模型？"
options:
  - label: "gemini-3-pro-image-preview (Recommended)"
    description: "质量最高，适合正式产出"
  - label: "gemini-3.1-flash-image-preview"
    description: "更快，质量不错，成本更低"
  - label: "gemini-3-flash-preview"
    description: "速度与质量更均衡"
```

### OpenAI 模型选择

```yaml
header: "OpenAI Model"
question: "为 OpenAI 选择一个默认图像模型？"
options:
  - label: "gpt-image-1.5 (Recommended)"
    description: "最新一代 GPT Image 模型，质量更高"
  - label: "gpt-image-1"
    description: "上一代 GPT Image 模型"
```

### DashScope 模型选择

```yaml
header: "DashScope Model"
question: "为 DashScope 选择一个默认图像模型？"
options:
  - label: "z-image-turbo (Recommended)"
    description: "速度快，质量稳定"
  - label: "z-image-ultra"
    description: "质量更高，但生成更慢"
```

### Replicate 模型选择

```yaml
header: "Replicate Model"
question: "为 Replicate 选择一个默认图像模型？"
options:
  - label: "google/nano-banana-pro (Recommended)"
    description: "Google 的高质量快速图像模型"
  - label: "google/nano-banana"
    description: "Google 的基础图像模型"
```

### 更新配置

用户选定模型后：

1. 读取已有 `config.json`
2. 如果已有 `default_model:` 区块，只更新当前 provider 对应的键
3. 如果没有 `default_model:`，则补上完整区块：

```json
{
  "default_model": {
    "google": "[value or null]",
    "openai": "[value or null]",
    "dashscope": "[value or null]",
    "replicate": "[value or null]"
  }
}
```

只更新当前 provider 的模型，其他 provider 保持原值或为 `null`。

## 设置完成后

1. 如有需要先创建目录
2. 写入或更新 `config.json`
3. 向用户确认：“偏好已保存到 [path]”
4. 回到图片生成主流程
