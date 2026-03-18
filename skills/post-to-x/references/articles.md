# X Articles 详细指南

把 Markdown 文章发布到 X Articles 编辑器，保留富文本格式与图片。

## 前置条件

- 已开通 X Premium（Articles 功能要求）
- 已安装 Google Chrome
- 已安装 `bun`

## 用法

```bash
# 发布 Markdown 文章（预览模式）
${BUN_X} ${SKILL_DIR}/scripts/x-article.ts article.md

# 指定封面图
${BUN_X} ${SKILL_DIR}/scripts/x-article.ts article.md --cover ./cover.jpg

# 真的提交发布
${BUN_X} ${SKILL_DIR}/scripts/x-article.ts article.md --submit
```

## Markdown 格式

```markdown
---
title: My Article Title
cover_image: /path/to/cover.jpg
---

# Title (becomes article title)

Regular paragraph text with **bold** and *italic*.

## Section Header

More content here.

![Image alt text](./image.png)

- List item 1
- List item 2

1. Numbered item
2. Another item

> Blockquote text

[Link text](https://example.com)

\`\`\`
Code blocks become blockquotes (X doesn't support code)
\`\`\`
```

## Frontmatter 字段

| 字段 | 说明 |
|------|------|
| `title` | 文章标题（若缺失，则使用第一个 H1） |
| `cover_image` | 封面图路径或 URL |
| `cover` | `cover_image` 的别名 |
| `image` | `cover_image` 的别名 |

## 图片处理

1. **封面图**：优先使用 frontmatter 中的 `cover_image`，否则用正文第一张图
2. **远程图片**：自动下载到临时目录
3. **占位符**：正文图片会转成 `XIMGPH_N`
4. **插入流程**：定位占位符，选中后再替换成真实图片

## Markdown 转 HTML 脚本

用于转换 Markdown 并检查结构：

```bash
# 输出完整 JSON（含元信息）
${BUN_X} ${SKILL_DIR}/scripts/md-to-html.ts article.md

# 只输出 HTML
${BUN_X} ${SKILL_DIR}/scripts/md-to-html.ts article.md --html-only

# 把 HTML 保存到文件
${BUN_X} ${SKILL_DIR}/scripts/md-to-html.ts article.md --save-html /tmp/article.html
```

JSON 输出示例：

```json
{
  "title": "Article Title",
  "coverImage": "/path/to/cover.jpg",
  "contentImages": [
    {
      "placeholder": "XIMGPH_1",
      "localPath": "/tmp/x-article-images/img.png",
      "blockIndex": 5
    }
  ],
  "html": "<p>Content...</p>",
  "totalBlocks": 20
}
```

## 支持的格式

| Markdown | HTML 输出 |
|----------|-----------|
| `# H1` | 仅作为标题，不进入正文 |
| `## H2` - `###### H6` | `<h2>` |
| `**bold**` | `<strong>` |
| `*italic*` | `<em>` |
| `[text](url)` | `<a href>` |
| `> quote` | `<blockquote>` |
| `` `code` `` | `<code>` |
| ```` ``` ```` | `<blockquote>`（X 的限制） |
| `- item` | `<ul><li>` |
| `1. item` | `<ol><li>` |
| `![](img)` | 图片占位符 |

## 工作流

1. **解析 Markdown**：提取标题、封面和正文图片，生成 HTML
2. **启动 Chrome**：真实浏览器 + CDP + 持久登录态
3. **打开页面**：访问 `x.com/compose/articles`
4. **创建文章**：如果当前在列表页，就先点击新建按钮
5. **上传封面**：通过 file input 上传封面图
6. **填写标题**：把标题写入标题输入框
7. **粘贴正文**：把 HTML 放到剪贴板后粘贴进编辑器
8. **插入图片**：对每个占位符倒序执行：
   - 找到占位符文本
   - 选中占位符
   - 把图片复制进剪贴板
   - 粘贴替换
9. **自动校验**：
   - 扫描编辑器里是否还有残留 `XIMGPH_`
   - 比较预期图片数量与实际插入数量
   - 如果异常，给出警告
10. **预览**：浏览器保留 60 秒供人工复核
11. **发布**：只有加了 `--submit` 才真正提交

## 示例会话

```text
用户：/post-to-x article ./blog/my-post.md --cover ./thumbnail.png

Claude：
1. 解析 Markdown：title="My Post"，正文中有 3 张图
2. 启动带 CDP 的 Chrome
3. 打开 x.com/compose/articles
4. 点击创建文章
5. 上传 thumbnail.png 作为封面
6. 填写标题 "My Post"
7. 粘贴 HTML 正文
8. 在 3 个占位符位置插入对应图片
9. 返回："Article composed. Review and use --submit to publish."
```

## 故障排查

- **没有 create 按钮**：确认 X Premium 已生效
- **封面上传失败**：检查路径和格式（PNG、JPEG）
- **图片插入失败**：确认正文里确实还存在占位符
- **正文粘贴失败**：先检查 HTML 剪贴板：`${BUN_X} ${SKILL_DIR}/scripts/copy-to-clipboard.ts html --file /tmp/test.html`

## 工作原理

1. `md-to-html.ts` 负责把 Markdown 转为 HTML：
   - 提取 frontmatter（标题、封面）
   - 转换正文为 HTML
   - 把图片替换成唯一占位符
   - 把远程图片下载到本地
   - 返回结构化 JSON

2. `x-article.ts` 负责通过 CDP 发布：
   - 启动真实 Chrome（规避自动化检测）
   - 使用持久 profile 复用登录态
   - 通过 DOM 操作进入编辑器并填充内容
   - 从系统剪贴板粘贴 HTML
   - 依次查找 / 选中 / 替换图片占位符
