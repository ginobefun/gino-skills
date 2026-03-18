---
name: first-time-setup
description: post-to-wechat 首次偏好设置流程
---

# 首次设置

## 概览

当找不到 `config.json` 时，必须先引导用户完成偏好设置。

**阻塞操作**：在设置完成前，禁止进入任何其他流程。不要：

- 询问要发布什么内容或文件
- 询问主题、样式或发布方式细节
- 继续进行转换或发布步骤

只执行本页中的设置流程，写入 `config.json`，然后再继续主工作流。

## 设置流程

```text
未找到 config.json
        |
        v
+---------------------+
| AskUserQuestion     |
| （一次问完）         |
+---------------------+
        |
        v
+---------------------+
| 创建 config.json    |
+---------------------+
        |
        v
继续 Step 1
```

## 问题清单

**语言**：使用用户当前输入语言，或已保存的语言偏好。

用一次 `AskUserQuestion` 把所有问题一起问完：

### 问题 1：默认主题

```yaml
header: "Theme"
question: "文章转换默认使用哪个主题？"
options:
  - label: "default (Recommended)"
    description: "经典布局：标题居中，H2 使用有底色的白字（默认蓝色）"
  - label: "grace"
    description: "更优雅：文字阴影、圆角卡片、更精致的引用块（默认紫色）"
  - label: "simple"
    description: "极简现代：不对称圆角、留白干净（默认绿色）"
  - label: "modern"
    description: "大圆角、胶囊标题、排版更宽松（默认橙色）"
```

### 问题 2：默认颜色

```yaml
header: "Color"
question: "默认颜色预设是什么？（不设则使用主题默认值）"
options:
  - label: "Theme default (Recommended)"
    description: "直接使用主题内置默认颜色"
  - label: "blue"
    description: "#0F4C81 经典蓝"
  - label: "red"
    description: "#A93226 中国红"
  - label: "green"
    description: "#009874 翡翠绿"
```

说明：如果用户选择 “Other”，可以输入其他预设名（如 `vermilion`、`yellow`、`purple`、`sky`、`rose`、`olive`、`black`、`gray`、`pink`、`orange`）或任意十六进制颜色。

### 问题 3：默认发布方式

```yaml
header: "Method"
question: "默认使用哪种发布方式？"
options:
  - label: "api (Recommended)"
    description: "速度快，但需要 API 凭据（AppID + AppSecret）"
  - label: "browser"
    description: "速度慢，但只需要 Chrome 与登录态"
```

### 问题 4：默认作者名

```yaml
header: "Author"
question: "文章默认作者名是什么？"
options:
  - label: "No default"
    description: "留空，每篇文章单独指定"
```

说明：用户大概率会通过 “Other” 输入自己的作者名。

### 问题 5：默认开启评论

```yaml
header: "Comments"
question: "文章默认是否开启评论？"
options:
  - label: "Yes (Recommended)"
    description: "允许读者评论"
  - label: "No"
    description: "默认关闭评论"
```

### 问题 6：仅粉丝可评论

```yaml
header: "Fans only"
question: "是否默认只允许粉丝评论？"
options:
  - label: "No (Recommended)"
    description: "所有读者都可以评论"
  - label: "Yes"
    description: "只有粉丝可以评论"
```

### 问题 7：保存位置

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
| Project | `.gino-skills/post-to-wechat/config.json` | 当前项目 |
| User | `~/.gino-skills/post-to-wechat/config.json` | 当前用户所有项目 |

## 设置完成后

1. 如有需要先创建目录
2. 写入 `config.json`
3. 向用户确认：“偏好已保存到 [path]”
4. 返回 Step 0，重新加载保存后的偏好

## `config.json` 模板

```json
{
  "default_theme": "[default/grace/simple/modern]",
  "default_color": "[preset name, hex, or null for theme default]",
  "default_publish_method": "[api/browser]",
  "default_author": "[author name or null]",
  "need_open_comment": true,
  "only_fans_can_comment": false,
  "chrome_profile_path": null
}
```

## 后续修改偏好

用户可以直接编辑 `config.json`，也可以删除后重新触发设置流程。Legacy `EXTEND.md` 仅保留兼容用途。
