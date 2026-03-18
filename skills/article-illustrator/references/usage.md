# 使用方式

## 命令语法

```bash
# 根据内容自动选择 type 和 style
/article-illustrator path/to/article.md

# 指定 type
/article-illustrator path/to/article.md --type infographic

# 指定 style
/article-illustrator path/to/article.md --style blueprint

# 同时指定 type 和 style
/article-illustrator path/to/article.md --type flowchart --style notion

# 指定配图密度
/article-illustrator path/to/article.md --density rich

# 直接粘贴内容（paste 模式）
/article-illustrator
[paste content]
```

## 可选项

| 选项 | 说明 |
|------|------|
| `--type <name>` | 插图类型（见 `SKILL.md` 中的 Type Gallery） |
| `--style <name>` | 视觉风格（见 `references/styles.md`） |
| `--density <level>` | 图片数量：`minimal` / `balanced` / `rich` |

## 输入模式

| 模式 | 触发条件 | 输出目录 |
|------|----------|----------|
| 文件路径 | 传入 `path/to/article.md` | 优先使用 config 中的 `default_output_dir`，未设置则询问 |
| 粘贴内容 | 不传路径参数 | `illustrations/{topic-slug}/` |

## 输出目录选项

| 值 | 路径 |
|----|------|
| `same-dir` | `{article-dir}/` |
| `illustrations-subdir` | `{article-dir}/illustrations/` |
| `independent` | `illustrations/{topic-slug}/` |

在 `config.json` 中配置示例：

```json
{
  "default_output_dir": "illustrations-subdir"
}
```

## 示例

**技术文章 + 数据图**：

```bash
/article-illustrator api-design.md --type infographic --style blueprint
```

**个人故事**：

```bash
/article-illustrator journey.md --type scene --style warm
```

**教程 / 步骤型内容**：

```bash
/article-illustrator how-to-deploy.md --type flowchart --density rich
```
