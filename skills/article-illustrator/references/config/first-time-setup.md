---
name: first-time-setup
description: article-illustrator 首次偏好设置流程
---

# 首次设置

## 概览

当找不到 `config.json` 时，先引导用户完成偏好设置。

**⛔ 阻塞操作**：在设置完成前，不要进入任何其他步骤。不要：

- 问参考图
- 问文章内容
- 问插图类型或风格偏好
- 直接开始内容分析

只执行本页里的设置流程，写入 `config.json` 后再继续。

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

**语言**：所有问题都使用用户当前语言或偏好语言，不要强制用英文。

使用一次 `AskUserQuestion` 提问，客户端会自动提供 “Other”。

### 问题 1：水印

```text
header: "Watermark"
question: "生成插图时默认加什么水印？可以直接输入名字、@handle 等内容"
options:
  - label: "No watermark (Recommended)"
    description: "默认不加水印，后续可在 config.json 中开启"
```

默认位置为右下角。

### 问题 2：偏好风格

```text
header: "Style"
question: "默认偏好的插图风格是什么？也可以直接输入其他风格名或自定义风格"
options:
  - label: "None (Recommended)"
    description: "每次根据内容自动选择"
  - label: "notion"
    description: "极简手绘线稿"
  - label: "warm"
    description: "友好、亲近、个人化"
```

### 问题 3：保存位置

```text
header: "Save"
question: "偏好保存到哪里？"
options:
  - label: "Project"
    description: ".gino-skills/（仅当前项目）"
  - label: "User"
    description: "~/.gino-skills/（当前用户所有项目）"
```

## 保存位置

| 选项 | 路径 | 作用范围 |
|------|------|----------|
| Project | `.gino-skills/article-illustrator/config.json` | 当前项目 |
| User | `~/.gino-skills/article-illustrator/config.json` | 当前用户所有项目 |

## 设置完成后

1. 如有需要先创建目录
2. 写入 `config.json`
3. 向用户确认：“偏好已保存到 [path]”
4. 继续 Step 1

## `config.json` 模板

```json
{
  "version": 1,
  "watermark": {
    "enabled": false,
    "content": "[user input or empty]",
    "position": "bottom-right",
    "opacity": 0.7
  },
  "preferred_style": {
    "name": "[selected style or null]",
    "description": ""
  },
  "language": null,
  "default_output_dir": null,
  "custom_styles": []
}
```

## 后续修改偏好

用户可以直接编辑 `config.json`，或删除后重新触发设置流程：

- 删除 `config.json` 以重新进入 setup
- 完整 schema 见 `config/preferences-schema.md`

## Legacy 兼容附录

迁移窗口内仍保留 legacy `EXTEND.md` fallback，但仅用于兼容，不应再出现在主流程。

- `.gino-skills/article-illustrator/EXTEND.md`
- `$HOME/.gino-skills/article-illustrator/EXTEND.md`

弃用时间线见 `docs/deprecation-roadmap.md`
