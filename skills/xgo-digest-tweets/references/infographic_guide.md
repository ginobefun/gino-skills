# 信息图生成指南

生成 `digest-YYYY-MM-DD.png` 时参考此文档构建 image-gen 提示词。

## 设计理念

与杂志风 HTML 同源的视觉语言 — 成熟内敛的现代主义美学：

- **克制配色**: 深墨蓝 (#1a2332) 为主调，金铜琥珀 (#c8956c) 作为唯一点睛色，暖纸张白 (#f8f5f0) 为底色
- **瑞士国际主义排版**: 网格对齐、层次分明、字体克制，像 Monocle 杂志的信息页
- **手工质感**: 纸质噪点纹理、微妙的阴影层次，避免塑料感的纯色平面
- **呼吸留白**: 信息之间有充足间距，不拥挤，不塞满
- **低调专业**: 经得起反复观看，不因"用力过猛"而显得廉价

## 提示词模板

根据 Top 10 推文数据，按以下模板构建提示词:

```
Create a sophisticated editorial infographic for a daily Twitter digest, inspired by Monocle magazine and Swiss International Style.

Date: {YYYY-MM-DD}

Visual direction:
- Color palette: deep charcoal navy (#1a2332) as primary, warm copper-gold (#c8956c) as the ONLY accent color, cream paper (#f8f5f0) as background
- Subtle paper grain texture across the background for handcrafted warmth
- Clean grid-based layout with generous whitespace between elements
- Typography: serif for headlines (slightly tilted -0.5deg for subtle dynamism), clean sans-serif for body text
- No decorative illustrations, icons, or gradients — every visual element carries information
- Thin hairline rules (1px, very light) to separate sections
- Overall aesthetic: high-end architecture portfolio or design journal

Layout (vertical 9:16 ratio):

TOP BANNER:
- Dateline in tiny uppercase tracking: "{YYYY-MM-DD} · TWITTER DAILY DIGEST"
- Main title in elegant serif, slightly tilted

MAIN BODY - 10 numbered entries on clean grid:
- Rank numbers in copper-gold, serif font, aligned left
- Author name in bold dark, @handle in muted gray
- One-line summary in body text color
- Thin separator line between entries
- Generous vertical spacing — each entry breathes

BOTTOM:
- Keyword tags in rounded pills: copper-tinted background for AI/tech keywords, light warm gray for others
- Minimal footer line

Content:
01. {Author1} (@{handle1}): "{summary1}" — Influence: {score1}
02. {Author2} (@{handle2}): "{summary2}" — Influence: {score2}
...
10. {Author10} (@{handle10}): "{summary10}" — Influence: {score10}

Keywords: {keyword1}, {keyword2}, {keyword3}, ...

Critical requirements:
- All text must be clearly readable with sufficient contrast and font size
- Do NOT use blue-purple tech gradients, neon colors, or flashy sci-fi aesthetics
- The mood should feel like a curated reading list from a design-conscious editor
- Whitespace is a feature, not wasted space
```

## 生成命令

```bash
SKILL_DIR=~/.claude/skills/image-gen
bun run ${SKILL_DIR}/scripts/main.ts \
  --prompt "{填充后的提示词}" \
  --image contents/twitter-digest/digest-YYYY-MM-DD.png \
  --provider google \
  --model gemini-2.0-flash-preview-image-generation \
  --ar 9:16 \
  --quality 2k
```

## 内容准备

- 每条推文概括控制在 15-25 字（中文）或 10-18 words（英文），适合单行展示
- 概括使用用户习惯的语言，专有名词保留原文
- 关键词 8-12 个，优先包含头部厂商名称和 AI Coding 工具名
- 从 Top 10 推文中提取关键词，不要编造

## 注意事项

- 如果 image-gen 不可用或 `GOOGLE_API_KEY` 未设置，跳过此步骤并告知用户
- 生成失败时重试一次，仍失败则跳过并告知用户手动处理
- 生成后用 Read 工具确认图片存在
