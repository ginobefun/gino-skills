---
name: create-video
description: "将任意内容生成短视频。适用场景：(1) 将每日早报制作成视频，(2) 将每周周刊制作成视频，(3) 将文章/博客做成讲解视频，(4) 提供音频文件同步生成视频，(5) 将内容做成带配音的短视频。触发短语：'生成视频', 'create video', '做成视频', '制作视频', '短视频', '文章转视频', 'article to video', '早报视频', '视频版', '讲解视频', 'explainer video', '周报视频', 'weekly video', '内容转视频', '视频'"
---

# 视频生成器 (Create Video)

将任意内容源（每日早报、每周周刊、单篇文章、任意 Markdown）转化为**短视频（MP4）**。独立生成配音，使用 Remotion 渲染画面，支持多种内容格式。

- 视频视觉设计指南见 `references/video_design_guide.md`
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

## 工作流概览

```
- [ ] 阶段一: 内容准备（源内容 + 图片素材抓取与质量审核）
- [ ] 阶段二: 配音脚本生成 ⚠️ 用户确认脚本
- [ ] 阶段三: 音频合成（独立配音，Fish.audio TTS）
- [ ] 阶段四: 视频渲染（生成 video-data.json + Remotion 渲染）⚠️ 用户审核 slides 方案
- [ ] 阶段五: 上传 & 分发 ⛔ 需用户确认
```

---

## 阶段一：内容准备

### 1.1 识别输入源

与 `create-podcast` 相同的多源输入支持：

| 来源类型 | 识别方式 | 预估时长 |
|----------|---------|---------|
| **每日早报** | 用户提到"早报/daily" | 10-12 分钟 |
| **每周周刊** | 用户提到"周刊/weekly" | 15-20 分钟 |
| **单篇文章** | URL/文件/粘贴内容 | 5-8 分钟 |
| **任意内容** | 任意文本 | 视内容而定 |

**每日早报输入**:

```bash
# 读取早报文件
contents/bestblogs-digest/YYYY-MM-DD/digest.txt

# 获取 Top 3 详情（并行）
curl -s "https://api.bestblogs.dev/openapi/v1/resource/meta?id={ID}" -H "X-API-KEY: $BESTBLOGS_API_KEY"
curl -s "https://api.bestblogs.dev/openapi/v1/resource/markdown?id={ID}" -H "X-API-KEY: $BESTBLOGS_API_KEY"
```

**每周周刊/单篇文章/任意内容**: 同 create-podcast 的内容获取方式。

### 1.2 抓取配图素材

为视频准备**大量**图片素材。精讲项需要 5-8 张图用于 slides 切换（每 8-15 秒换一张）。

```bash
mkdir -p contents/tmp/video/YYYY-MM-DD/assets
```

**各类型配图来源**（按优先级获取）:

| resourceType | 优先级 1 | 优先级 2 | 优先级 3 | 优先级 4 |
|-------------|---------|---------|---------|---------|
| ARTICLE | 元数据 `cover` | Markdown 文内所有图片 | `sourceImage` | `image-gen` 生成 |
| VIDEO | 元数据 `cover` | yt-dlp 截帧 | 描述内图片 | `image-gen` 生成 |
| PODCAST | 元数据 `cover` | showNotes 图片 | `sourceImage` | `image-gen` 生成 |
| TWITTER | `mediaList[].mediaUrlHttps` | 元数据 `cover` | 引用推文 OG 图 | `image-gen` 生成 |

**命名规范**: `article-{rank}-{type}-{n}.{ext}`（type: `cover`, `fig`, `frame`, `media`, `gen`）
**数量要求**: 精讲项（Top 3）**至少 5 张**，速览项至少 1 张封面

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

视频配音脚本比播客脚本**更简洁**，因为视觉元素承担了部分信息传递。

### 配音模式

| 模式 | 说明 | 适用场景 |
|------|------|---------|
| **独立配音**（默认） | 生成视频专属配音脚本 | 正常视频制作 |
| **外部音频** | 用户提供已有音频文件 | 已有 podcast 音频，只需配画面 |

### 独立配音脚本规则

- 比播客脚本简洁 20-30%（视觉辅助替代口述细节）
- 不需要详细描述图表/截图（"如图所示" 即可）
- 保留 BCPT 结构但每段更精炼
- 同样使用 `<!-- SEGMENT: name -->` 分段标记

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

## 阶段四：视频渲染

### 4.1 计算音频时间轴

用 ffprobe 获取每个段的时长，累加计算各 item 的 `audioStart` 和 `audioDuration`:

```bash
for seg in contents/tmp/video/YYYY-MM-DD/segments/*.mp3; do
  ffprobe -v quiet -show_entries format=duration \
    -of default=noprint_wrappers=1:nokey=1 "$seg"
done
```

### 4.2 准备视频数据

生成 Remotion 所需的 JSON 数据文件。完整 schema 见 `scripts/remotion/src/types.ts`。

**关键字段**:
- `title`: 视频标题（不再硬编码，根据内容源动态生成）
- `items[].type`: `"deep"` 或 `"quick"`
- `items[].images`: 图片路径列表（相对 Remotion `public/`）
- `items[].slides`: 精讲项必须提供 slides 数组
- `items[].audioStart` / `audioDuration`: 秒数
- `audioFile`: 音频文件名（Remotion public/ 目录下）
- `totalDuration`: 总时长（秒）

**Slides 编排原则**:
- 每张 slide **8-15 秒**，避免超过 20 秒
- `durationRatio` 之和必须 = 1.0
- 图片分配：每个 `point` slide 尽量配不同图片
- slides 内容和顺序必须与音频播讲顺序一致

保存到：`contents/tmp/video/YYYY-MM-DD/video-data.json`

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

视觉设计详见 `references/video_design_guide.md`。

---

## 阶段五：上传 & 分发

### 5.1 生成 metadata.json

包含：`date`, `title`, `description`, `duration`(秒), `videoFile`(相对路径), `videoSize`(字节), `keywords`, `items`。

### 5.2 上传 R2

```bash
SKILL_DIR=$(readlink -f ~/.claude/skills/create-video 2>/dev/null)

bun ${SKILL_DIR}/scripts/upload-r2.ts \
  contents/video/daily/YYYY-MM-DD/video.mp4 \
  "video/daily/YYYY-MM-DD/video.mp4"
```

### 5.3 ⛔ 平台分发（需用户确认）

展示上传结果摘要（文件、时长、R2 URL），询问是否分发到微信视频号/B站。

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
    video.mp4                           # 短视频
    metadata.json                       # 元数据
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
| "不需要配音" | 使用外部音频模式或固定时长无声视频 |
| "用已有播客音频" | 外部音频模式，提供 podcast.mp3 路径 |
| "竖版视频" | Remotion 渲染参数改为 1080×1920 (9:16) |
| "语速快一点" | TTS `--rate 1.15` |
| "重新渲染视频" | 从阶段四开始，复用已有音频 |
| "精讲 5 条" | 调整 items 数量 |

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
