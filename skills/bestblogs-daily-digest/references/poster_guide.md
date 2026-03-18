# 信息图海报生成指南

使用 `image-gen` skill 生成纵向信息图海报，仅包含 **Top 5** 内容。

## 海报视觉风格

整体气质：高端建筑事务所作品集或 Monocle 杂志信息页 — 瑞士国际主义的克制与精准，每个元素恰到好处。

- **色彩**: 墨蓝 `#1a365d` 为主调 + 琥珀 `#d97706` 仅 Top 1 点睛 + 米白 `#fefdfb` 纸张背景
- **质感**: 细腻纸质噪点纹理覆盖全图，营造手工印刷质感，而非光滑数码感
- **布局**: 纵向 9:16，上下留白充足（顶部至少 60px，底部至少 80px）
- **头部**: "BestBlogs 早报" 衬线体标题 + 日期 + 3 个关键词胶囊标签（墨蓝细边框）
- **主体**: 5 条内容，每条用序号 + 标题 + 一句话摘要 + 来源，条目间用极细分隔线
- **Top 1**: 左侧琥珀色竖线标记，标题加大，视觉权重最高
- **底部**: "BestBlogs.dev" 品牌标识 + 细线收尾
- **字体风格**: 标题用衬线体（有文化底蕴感），正文用无衬线体（清晰易读）
- **留白**: 大量留白让信息有呼吸感，条目间距 > 内容高度的 40%

## 海报设计禁忌

- 不要蓝紫渐变科技感、不要发光粒子效果
- 不要圆角气泡卡片堆叠 — 用平面排版 + 分隔线
- 不要用力过猛 — 克制即高级

## 调用方式

```bash
# 1. 定位 image-gen skill 目录（resolve symlink）
IMAGE_GEN_SKILL_DIR=$(readlink -f ~/.claude/skills/image-gen 2>/dev/null || readlink -f ~/.claude/skills/baoyu-image-gen 2>/dev/null)

# 2. 将海报内容描述写入 prompt 文件（保存在输出目录）
#    prompt 文件包含: 完整视觉风格描述 + 品牌色值 + 5 条内容的标题和摘要

# 3. 生成海报
bun run ${IMAGE_GEN_SKILL_DIR}/scripts/main.ts \
  --promptfiles <output-dir>/poster-prompt.md \
  --image <output-dir>/poster.png \
  --ar 9:16 \
  --quality 2k
```

## 生成策略

**默认生成海报**，无需询问用户。仅在以下情况跳过：
- 用户首次明确指定输出格式（如"只要文本"、"不需要海报"）
- image-gen skill 未安装（此时告知用户）
