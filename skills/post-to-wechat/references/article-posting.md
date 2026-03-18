# 文章发布（Article Posting）

把 Markdown 文章发布到微信公众号，并保留完整排版。

## 用法

```bash
# 发布 Markdown 文章
${BUN_X} ./scripts/wechat-article.ts --markdown article.md

# 指定主题
${BUN_X} ./scripts/wechat-article.ts --markdown article.md --theme grace

# 显式指定参数
${BUN_X} ./scripts/wechat-article.ts --markdown article.md --author "作者名" --summary "摘要"
```

## 参数

| 参数 | 说明 |
|------|------|
| `--markdown <path>` | 要转换并发布的 Markdown 文件 |
| `--theme <name>` | 主题：`default`、`grace`、`simple`、`modern` |
| `--title <text>` | 覆盖标题（默认从 Markdown 自动提取） |
| `--author <name>` | 作者名 |
| `--summary <text>` | 摘要 |
| `--html <path>` | 直接使用预渲染好的 HTML |
| `--profile <dir>` | Chrome profile 目录 |

## Markdown 格式

```markdown
---
title: Article Title
author: Author Name
---

# Title (becomes article title)

Regular paragraph with **bold** and *italic*.

## Section Header

![Image description](./image.png)

- List item 1
- List item 2

> Blockquote text

[Link text](https://example.com)
```

## 图片处理

1. **解析**：把 Markdown 里的图片替换成 `WECHATIMGPH_N`
2. **渲染**：生成带占位符的 HTML
3. **粘贴**：把 HTML 内容粘贴到微信公众号编辑器
4. **替换**：对每个占位符执行：
   - 找到并选中占位符文本
   - 滚动到可见区域
   - 用 Backspace 删除占位符
   - 再从剪贴板粘贴图片

## 相关脚本

| 脚本 | 用途 |
|------|------|
| `wechat-article.ts` | 主发布脚本 |
| `md-to-wechat.ts` | Markdown 转 HTML，并处理图片占位符 |
| `md/render.ts` | 带主题的 Markdown 渲染 |

## 示例会话

```text
用户：/post-to-wechat --markdown ./article.md

Claude：
1. 解析 Markdown，发现 5 张图片
2. 生成带占位符的 HTML
3. 打开 Chrome，进入公众号编辑器
4. 粘贴 HTML 内容
5. 对每张图依次：
   - 选中 WECHATIMGPH_1
   - 滚动到可见位置
   - 按 Backspace 删除
   - 粘贴图片
6. 返回："Article composed with 5 images."
```
