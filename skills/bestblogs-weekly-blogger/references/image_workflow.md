# 配图与上传工作流

## 阶段六：生成配图与封面

使用 `image-gen` 技能的 CLI 脚本为博客生成配图和封面。如需更精细的维度定制，可参考 `cover-image` 和 `article-illustrator` 的提示词模板。

### 6.1 环境检查

确认 `GOOGLE_API_KEY` 环境变量已设置（默认使用 Google Gemini 生成图片）。

### 6.2 生成文章配图

创建工作目录存放图片：

```bash
mkdir -p /tmp/bestblogs-issue-{N}/
```

为博客中的每张配图生成提示词并调用 `image-gen` 生成。每张图的提示词应基于：
- 对应章节的主题和核心内容
- 图片 alt 文本描述
- 整体视觉风格保持一致（同一期使用相同风格）

使用 `image-gen` 的 CLI 生成图片：

```bash
SKILL_DIR=~/.claude/skills/image-gen
bun run ${SKILL_DIR}/scripts/main.ts \
  --prompt "{图片提示词}" \
  --image /tmp/bestblogs-issue-{N}/bestblogs-issue-{N}-{seq}.png \
  --provider google \
  --model gemini-3-pro-image-preview \
  --ar 16:9 \
  --quality 2k
```

每张图片依次生成，生成后确认图片文件存在。如果生成失败，重试一次。

### 6.3 生成封面图

封面图使用不同的宽高比和风格：

```bash
bun run ${SKILL_DIR}/scripts/main.ts \
  --prompt "{封面提示词，包含标题关键词和期数}" \
  --image /tmp/bestblogs-issue-{N}/cover_bestblogs_{N}.png \
  --provider google \
  --model gemini-3-pro-image-preview \
  --ar 16:9 \
  --quality 2k
```

### 6.4 确认图片

生成完成后列出所有图片，告知用户：
- 图片数量和路径
- 询问是否需要重新生成某张图片

## 阶段七：上传图片到 R2 并替换链接

### 7.1 环境检查

确认以下环境变量已设置：
- `CLOUDFLARE_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`
- `R2_PUBLIC_URL`

### 7.2 上传配图

使用 `image-gen` 中的 R2 上传脚本批量上传：

```bash
SKILL_DIR=~/.claude/skills/image-gen
bun run ${SKILL_DIR}/scripts/upload-r2.ts \
  --batch /tmp/bestblogs-issue-{N}/ \
  Banana/
```

脚本会输出每个文件的公开 URL（格式：`{R2_PUBLIC_URL}/Banana/{filename}`）。

### 7.3 上传封面图

封面图上传到单独路径：

```bash
bun run ${SKILL_DIR}/scripts/upload-r2.ts \
  /tmp/bestblogs-issue-{N}/cover_bestblogs_{N}.png \
  covers/cover_bestblogs_{N}.png
```

### 7.4 替换博客中的链接

用上传后的实际 URL 替换博客文件中的占位路径：
- 配图：`bestblogs-issue-{N}-{seq}.png` → `{R2_PUBLIC_URL}/Banana/bestblogs-issue-{N}-{seq}.png`
- 封面：frontmatter 中 `cover` 字段的 `cover_bestblogs_{N}.png` → `{R2_PUBLIC_URL}/covers/cover_bestblogs_{N}.png`

使用 Edit 工具逐个替换。

### 7.5 完成

告知用户：
- 所有图片已上传到 R2
- 博客文件中的链接已替换为实际 URL
- 博客文件最终路径
