---
name: create-video
description: "将任意内容生成短视频。适用场景：(1) 将每日早报制作成视频，(2) 将每周周刊制作成视频，(3) 将文章/博客做成讲解视频，(4) 提供音频文件同步生成视频，(5) 将内容做成带配音的短视频，(6) 发布到 B站/YouTube。触发短语：'生成视频', 'create video', '做成视频', '制作视频', '短视频', '文章转视频', 'article to video', '早报视频', '视频版', '讲解视频', 'explainer video', '周报视频', 'weekly video', '内容转视频', '视频', '发B站', 'bilibili', '发YouTube', 'youtube', '视频号'"
---

# 视频生成器 (Create Video)

将任意内容源（每日早报、每周周刊、单篇文章、任意 Markdown）转化为**短视频（MP4）**。内置四套内容模板，根据输入自动匹配最佳视频结构。

- 视频配音脚本指南见 `references/script_templates.md`
- 视觉设计指南见 `references/video_design_guide.md`
- Fish.audio TTS API 和 Remotion 详情见 `references/api_reference.md`

## 认证与环境变量

### Fish.audio TTS

```bash
-H "Authorization: Bearer $FISH_AUDIO_API_KEY"
```

需要的环境变量：
- `FISH_AUDIO_API_KEY`: Fish.audio API 密钥
- `FISH_AUDIO_VOICE_ID`: 克隆后的声音 ID

### BestBlogs API（早报/周刊输入时使用）

```bash
-H "X-API-KEY: $BESTBLOGS_API_KEY"
```

接口地址：`https://api.bestblogs.dev`

### R2 存储

复用 `image-gen` 已有的 R2 配置：
- `CLOUDFLARE_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`, `R2_PUBLIC_URL`

若任一环境变量未设置，提示用户配置。

---

## 视频模板体系

根据输入内容自动选择模板。每套模板定义了场景结构、节奏策略和 slides 编排。

### 模板总览

| 模板 | 识别方式 | 时长 | 精讲数 | 速览数 | 节奏特点 |
|------|---------|------|--------|--------|---------|
| **daily** | "早报/daily" 或日期 | 8-12 分钟 | 2-3 条 | 5-7 条 | 信息密集，快节奏切换 |
| **weekly** | "周刊/weekly/newsletter" | 12-18 分钟 | 3-5 条（按主题组织） | 3-5 条 | 主题串联，有叙事线 |
| **article** | URL/文件/粘贴内容 | 5-8 分钟 | 1 条（全篇深度） | 无 | 单点深入，视觉丰富 |
| **freeform** | 任意文本 | 视内容而定 | 自适应 | 自适应 | 根据内容特点调整 |

### Daily 模板 — 场景结构

```
[品牌开场]     3s    标题 + 日期，快速进入
[关键词]       3s    今日 4-6 个关键词标签
[精讲 1]       2-4min  cover→problem→points→quote→takeaway
[精讲 2]       2-4min  cover→points→takeaway（可精简）
[精讲 3]       1.5-3min  可选，有好内容才加
[速览引导]     2s    "快速速览" 过渡
[速览卡片]     2-3min  每条 15-20s，快节奏
[品牌结尾]     3s    品牌名 + 标语
```

**节奏要点**:
- 开场 10 秒内必须出现今日最值得聊的信息钩子
- 精讲间用 1 秒呼吸过渡，不机械
- 速览节奏紧凑，每条卡片 15-20 秒不拖沓
- 总时长控制在 12 分钟内，宁短勿长

**Slides 编排**（每条精讲 6-10 张）:

| 顺序 | Slide 类型 | 时长占比 | 配音配合 |
|------|-----------|---------|---------|
| 1 | `cover` | 12-15% | 引入话题，说为什么值得聊 |
| 2 | `source-card` | 8-10% | 简述来源和作者 |
| 3 | `problem` | 10-12% | 抛出核心问题 |
| 4-6 | `point` ×2-3 | 35-45% | 展开核心观点，每张配不同图 |
| 7 | `quote` | 8-10% | 停顿让观众读金句，再加评论 |
| 8-9 | `takeaway` ×1-2 | 12-18% | 你的判断和思考 |

### Weekly 模板 — 场景结构

```
[品牌开场]     4s    标题 + "本周精选" + 日期范围
[关键词]       4s    本周主题关键词
[主题段 1]     3-5min  围绕一个主题串联 1-2 条内容
[主题段 2]     3-5min  第二个主题
[主题段 3]     3-5min  可选第三主题
[速览引导]     2s    "更多值得关注"
[速览卡片]     2-3min  本周其余亮点
[品牌结尾]     4s    本周关键词回顾 + 品牌
```

**与 Daily 的关键区别**:
- 不按 Top N 排列，按**主题聚类**组织
- 开场要有"这一周的叙事线"（如"这周主线是 Agent 落地加速"）
- 主题段内多条内容有对比、递进关系
- Slides 编排更注重主题间的视觉区分

**主题段 Slides 编排**（每段 8-12 张）:

| 顺序 | Slide 类型 | 说明 |
|------|-----------|------|
| 1 | `cover` | 主题封面，用主题关键词而非文章标题 |
| 2-4 | `point` | 第一条内容的核心观点 |
| 5 | `quote` 或 `problem` | 过渡到第二条 |
| 6-8 | `point` | 第二条内容 + 与第一条的关联 |
| 9-10 | `takeaway` | 这个主题的整体判断 |

### Article 模板 — 场景结构

```
[品牌开场]     3s    文章标题 + 来源
[问题引入]     10-15s  为什么聊这篇，problem slide
[深度分析]     3-5min  8-15 张 slides 深入讲解
[个人思考]     1-2min  takeaway slides
[品牌结尾]     3s    推荐原文 + 品牌
```

**节奏要点**:
- 无速览段，所有时间给深度
- Slides 数量最多（12-15 张），视觉叙事最丰富
- 可使用更多 `point` slides，每个观点配专属图片
- quote 可以出现多次（文章金句通常更多）

**Slides 编排**（12-15 张）:

| 顺序 | Slide 类型 | 时长占比 | 说明 |
|------|-----------|---------|------|
| 1 | `cover` | 8-10% | 文章封面 + 标题 |
| 2 | `source-card` | 6-8% | 来源、作者、评分 |
| 3 | `problem` | 8-10% | 核心问题 |
| 4-9 | `point` ×4-6 | 45-55% | 逐层展开，每张独立配图 |
| 10 | `quote` | 6-8% | 最佳金句 |
| 11-12 | `point` ×1-2 | 10-15% | 补充观点或延伸 |
| 13-14 | `takeaway` ×2 | 12-15% | 个人思考 + 行动建议 |

### Freeform 模板

根据内容特点自适应：
- **列表类**: 套用 Daily 模板
- **教程类**: 按步骤编排 slides，point slides 为主，配合截图
- **观点类**: 套用 Article 模板
- **新闻类**: 缩减版 Daily，1-2 条精讲 + 快速影响分析

---

## 工作流概览

```
- [ ] 阶段一: 内容准备（识别模板 + 图片素材抓取与质量审核）
- [ ] 阶段二: 配音脚本生成 ⚠️ 用户确认脚本
- [ ] 阶段三: 音频合成（Fish.audio TTS）
- [ ] 阶段四: 视频数据编排 + Remotion 渲染 ⚠️ 用户审核 slides 方案
- [ ] 阶段五: 上传 & 分发 ⛔ 需用户确认
```

---

## 阶段一：内容准备

### 1.1 识别输入源与模板

根据用户输入自动匹配模板（见上方模板总览表）。如果用户明确指定模板，以用户选择为准。

**每日早报输入**:

```bash
# 读取早报文件
contents/bestblogs-digest/YYYY-MM-DD/digest.txt

# 获取精讲项详情（并行）
curl -s "https://api.bestblogs.dev/openapi/v1/resource/meta?id={ID}" -H "X-API-KEY: $BESTBLOGS_API_KEY"
curl -s "https://api.bestblogs.dev/openapi/v1/resource/markdown?id={ID}" -H "X-API-KEY: $BESTBLOGS_API_KEY"
```

**每周周刊/单篇文章/任意内容**: 同 create-podcast 的内容获取方式。

### 1.2 抓取配图素材

视频需要大量图片。精讲项需要 5-8 张图，速览项至少 1 张封面。

```bash
mkdir -p contents/tmp/video/YYYY-MM-DD/assets
```

**各类型配图来源**（按优先级）:

| resourceType | 优先级 1 | 优先级 2 | 优先级 3 | 优先级 4 |
|-------------|---------|---------|---------|---------|
| ARTICLE | 元数据 `cover` | Markdown 文内所有图片 | `sourceImage` | `image-gen` 生成 |
| VIDEO | 元数据 `cover` | yt-dlp 截帧 | 描述内图片 | `image-gen` 生成 |
| PODCAST | 元数据 `cover` | showNotes 图片 | `sourceImage` | `image-gen` 生成 |
| TWITTER | `mediaList[].mediaUrlHttps` | 元数据 `cover` | 引用推文 OG 图 | `image-gen` 生成 |

**命名规范**: `article-{rank}-{type}-{n}.{ext}`（type: `cover`, `fig`, `frame`, `media`, `gen`）

### 1.3 配图质量审核（必须执行）

**淘汰条件**（符合任一则丢弃）:
- 文件大小低于 10KB
- 分辨率低于 800px 宽
- 与内容无关（通用 banner、广告、stock photo）
- 纯文字截图且文字无法辨认

**生成替换图**（图片不足 5 张或质量不合格时）:

```bash
IMAGE_GEN_SKILL_DIR=$(readlink -f ~/.claude/skills/image-gen 2>/dev/null)

bun ${IMAGE_GEN_SKILL_DIR}/scripts/main.ts \
  --promptfiles assets/gen-prompt-{rank}.md \
  --image assets/article-{rank}-gen1.png \
  --ar 16:9 --quality 2k
```

生图 prompt 统一风格前缀:
```
Minimalist tech illustration, flat design, muted color palette (ink blue #1a365d, cream #fefdfb, gray tones), clean lines, no text overlays, 16:9 aspect ratio. [核心概念描述]
```

同一期所有生成图风格一致。

---

## 阶段二：配音脚本生成

### 配音模式

| 模式 | 说明 | 适用场景 |
|------|------|---------|
| **独立配音**（默认） | 按模板生成视频专属配音脚本 | 正常视频制作 |
| **外部音频** | 用户提供已有音频文件 | 已有 podcast 音频，只需配画面 |

### 独立配音脚本规则

详细配音指南见 `references/script_templates.md`，核心要点：

- **视觉感知**: 画面展示的内容不需要口述，配音补充画面没有的语境和判断
- **字数控制**: 比播客简洁 20-30%（~300 字/分钟 vs 播客 ~400 字/分钟）
- **声画配合**: 每张 slide 对应一段配音，切换时自然过渡
- **分享心态**: 每 30 秒至少输出一个有价值的信息点，避免空话

### 配音风格（对齐 style-profile）

脚本必须读取 `contents/style-profile.md`，注入个人声音特征。

核心风格要求:
- **内容驱动结构**: 由内容本身决定怎么讲，不要套死模板
- **语气**: 自然、平实、像和朋友聊天，可以用"你看这个"等视频特有指示语
- **信息准确**: 核心信息不失真，该说清楚的说清楚
- **节奏鲜明**: 高密度（核心观点）→ 低密度（视觉消化）交替
- **禁止**: 恐惧渲染、宏大空泛、说教语气、引号、破折号、括号

### 外部音频模式

用户提供音频文件路径，跳过阶段二和阶段三，直接进入阶段四。

⚠️ 脚本生成后输出给用户确认。保存到：

```bash
contents/tmp/video/YYYY-MM-DD/script.md
```

---

## 阶段三：音频合成

与 `create-podcast` 相同的 Fish.audio TTS 流程:

```bash
SKILL_DIR=$(readlink -f ~/.claude/skills/create-video 2>/dev/null)

bun ${SKILL_DIR}/scripts/fish-tts.ts \
  --script contents/tmp/video/YYYY-MM-DD/script.md \
  --output-dir contents/tmp/video/YYYY-MM-DD/segments/ \
  --voice-id "$FISH_AUDIO_VOICE_ID" \
  --rate 1.0 \
  --merge contents/tmp/video/YYYY-MM-DD/audio.mp3
```

---

## 阶段四：视频数据编排 + 渲染

### 4.1 计算音频时间轴

```bash
for seg in contents/tmp/video/YYYY-MM-DD/segments/*.mp3; do
  ffprobe -v quiet -show_entries format=duration \
    -of default=noprint_wrappers=1:nokey=1 "$seg"
done
```

### 4.2 按模板编排 Slides

根据选定模板（daily/weekly/article/freeform）编排 slides。完整 schema 见 `scripts/remotion/src/types.ts`。

**Slides 编排核心原则**:

1. **声画同步**: slides 内容和顺序必须与音频播讲顺序一致
2. **节奏控制**: 每张 slide 8-15 秒，绝不超过 20 秒（避免画面停滞）
3. **图片分散**: 每个 `point` slide 尽量配不同图片，避免视觉重复
4. **呼吸感**: 高信息 slide（point）后接低信息 slide（quote/过渡），避免持续高压
5. **durationRatio 之和** 必须 = 1.0

**各模板 Slides 数量参考**:

| 模板 | 精讲 Slides 数 | 速览卡片数 | 总 Slides 预估 |
|------|--------------|-----------|---------------|
| daily | 6-10 张/条 × 2-3 条 | 5-7 张 | 25-40 张 |
| weekly | 8-12 张/段 × 2-4 段 | 3-5 张 | 25-55 张 |
| article | 12-15 张 | 无 | 12-15 张 |
| freeform | 自适应 | 自适应 | 视内容而定 |

**生成 video-data.json**:

关键字段:
- `title`: 根据内容和模板动态生成（daily: "MM.DD 早报"，weekly: "第 N 周精选"，article: 文章标题）
- `items[].type`: `"deep"` 或 `"quick"`
- `items[].slides`: 精讲项必须提供 slides 数组
- `items[].audioStart` / `audioDuration`: 秒数
- `audioFile`: 音频文件名（Remotion public/ 目录下）
- `totalDuration`: 总时长（秒）

保存到：`contents/tmp/video/YYYY-MM-DD/video-data.json`

⚠️ 展示 slides 编排方案给用户审核（每条精讲的 slide 顺序、类型、时长分配）。

### 4.3 Remotion 渲染

**重要**: 渲染前必须将音频和图片**复制**（不能用 symlink）到 Remotion 项目的 `public/` 目录:

```bash
SKILL_DIR=$(readlink -f ~/.claude/skills/create-video 2>/dev/null)
PROJECT_DIR=$(pwd)
REMOTION_DIR=${SKILL_DIR}/scripts/remotion
TMP_DIR=${PROJECT_DIR}/contents/tmp/video/YYYY-MM-DD
OUTPUT_DIR=${PROJECT_DIR}/contents/video/daily/YYYY-MM-DD

# 1. 复制素材到 Remotion public/
mkdir -p ${REMOTION_DIR}/public
cp ${TMP_DIR}/audio.mp3 ${REMOTION_DIR}/public/audio.mp3
cp -r ${TMP_DIR}/assets ${REMOTION_DIR}/public/assets

# 2. 渲染视频
cd ${REMOTION_DIR} && \
npx -y remotion render src/index.ts ContentVideo \
  --props="${TMP_DIR}/video-data.json" \
  --output="${OUTPUT_DIR}/video.mp4" \
  --codec=h264 \
  --image-format=jpeg \
  --quality=80 \
  --fps=30

# 3. 清理 public/
rm -rf ${REMOTION_DIR}/public/assets ${REMOTION_DIR}/public/audio.mp3
```

---

## 阶段五：上传 & 分发

### 5.1 生成 metadata.json

包含：`date`, `title`, `description`, `duration`(秒), `videoFile`(相对路径), `videoSize`(字节), `keywords`, `template`(使用的模板名), `items`。

### 5.2 上传 R2

```bash
SKILL_DIR=$(readlink -f ~/.claude/skills/create-video 2>/dev/null)

bun ${SKILL_DIR}/scripts/upload-r2.ts \
  contents/video/daily/YYYY-MM-DD/video.mp4 \
  "video/daily/YYYY-MM-DD/video.mp4"
```

### 5.3 生成平台适配信息

在 metadata.json 中生成 `platformMeta` 字段:

| 平台 | 标题策略 | 描述策略 | 特殊要求 |
|------|---------|---------|---------|
| **B站** | 关键词前置 + 吸引力，不超 80 字 | 时间戳导航 + 精讲列表 | 分区选择、标签 |
| **YouTube** | 简洁英文或双语 | Timestamps + key points | 英文描述优先 |
| **微信视频号** | 简短有力，不超 30 字 | 要点列表 | 竖版可选 |

### 5.4 ⛔ 平台分发（需用户确认）

展示上传结果摘要（文件、时长、R2 URL、各平台标题预览），询问是否分发。

---

## 输出目录

```
contents/tmp/video/YYYY-MM-DD/          # 临时中间文件（gitignore）
  script.md                             # 配音脚本
  segments/                             # TTS 音频片段
  audio.mp3                             # 合并后的配音
  assets/                               # 图片素材
  video-data.json                       # Remotion 渲染数据

contents/video/                          # 最终产出（持久化）
  daily/YYYY-MM-DD/
    video.mp4
    metadata.json
  weekly/YYYY-MM-DD/
    video.mp4
    metadata.json
  articles/{slug}/
    video.mp4
    metadata.json
```

---

## 参数调整

| 用户表述 | 参数调整 |
|---------|---------|
| "不需要上传" | 跳过阶段五 |
| "不需要配音" | 外部音频模式或固定时长无声视频 |
| "用已有播客音频" | 外部音频模式，提供 podcast.mp3 路径 |
| "竖版视频" / "视频号" | Remotion 渲染参数改为 1080×1920 (9:16) |
| "语速快一点" | TTS `--rate 1.15` |
| "重新渲染视频" | 从阶段四开始，复用已有音频 |
| "精讲 5 条" | 调整精讲数量，相应减少每条时长 |
| "发B站" / "发YouTube" | 生成对应平台的标题/描述/标签 |
| "短视频版" | 精简为 3-5 分钟，仅 Top 1 精讲 + 速览 |
| "用 weekly 模板" | 强制使用指定模板 |

---

## 错误处理

**重要**: 始终先检查 API 响应中的 `success` 字段。

### BestBlogs API
- `401`: 检查 `BESTBLOGS_API_KEY`
- `resource/markdown` 返回 `null`: 退化到仅用 summary + mainPoints

### Fish.audio TTS
- `401`: 检查 `FISH_AUDIO_API_KEY`
- `404`: 检查 `FISH_AUDIO_VOICE_ID`
- `429`: 等待 10 秒后重试

### Remotion 视频渲染
- 依赖未安装：提示用户在 `scripts/remotion/` 下运行 `npm install`
- `staticFile() 404`: 音频或图片未复制到 `public/`。**必须复制实际文件，symlink 无效**
- 渲染超时：检查图片文件是否存在、尺寸是否过大
- 图片加载失败：跳过该图片，使用 fallback 纯色背景

### FFmpeg
- 未安装：提示用户安装
- 合并失败：检查音频片段格式一致性

### R2 上传
- 认证失败：检查 R2 相关环境变量
- 上传失败：重试一次，仍失败则保留本地文件
