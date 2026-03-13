---
name: bestblogs-podcast-video
description: "将 BestBlogs 每日早报转化为播客和短视频。适用场景：(1) 将今日早报生成播客音频，(2) 将早报制作成短视频，(3) 生成每日播客 + 视频，(4) 用我的声音播报今天的早报，(5) 更新播客 RSS Feed。触发短语：'生成播客', '生成视频', '早报播客', '早报视频', 'podcast', 'daily podcast', '播客视频', '生成音频', '录制早报', 'bestblogs podcast', 'bestblogs video', '把早报变成播客', '把早报变成视频', '早报音频', '每日播客'"
---

# BestBlogs 播客视频 (Podcast & Video)

将 BestBlogs 每日早报（由 `bestblogs-daily-digest` 生成）转化为**播客（MP3）**和**短视频（MP4）**两种形式。先生成播客脚本和音频，再在音频基础上叠加图片与字幕渲染成视频，音频和视频共享同一套内容。

采用用户克隆声音的独白式播讲，**Top 3 精讲 + 7 条速览**的节奏，保持 BestBlogs 品牌调性。

- 播客脚本撰写指南见 `references/script_style_guide.md`
- 视频视觉设计指南见 `references/video_design_guide.md`
- Fish.audio TTS API 和 Remotion 配置详情见 `references/api_reference.md`

## 认证与环境变量

### BestBlogs API

```bash
-H "X-API-KEY: $BESTBLOGS_API_KEY"
```

接口地址：`https://api.bestblogs.dev`

### Fish.audio TTS

```bash
-H "Authorization: Bearer $FISH_AUDIO_API_KEY"
```

需要的环境变量：
- `FISH_AUDIO_API_KEY`: Fish.audio API 密钥
- `FISH_AUDIO_VOICE_ID`: 克隆后的声音 ID

### R2 存储

复用 `image-gen` 已有的 R2 配置：
- `CLOUDFLARE_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`, `R2_PUBLIC_URL`

若任一环境变量未设置，提示用户配置。

## ⚠️ 首次使用：Fish.audio 声音克隆配置

首次使用前需完成声音克隆。若 `FISH_AUDIO_API_KEY` 和 `FISH_AUDIO_VOICE_ID` 环境变量已设置，可跳过此步骤直接使用。

可选的 EXTEND.md 配置文件用于记录个人偏好（如开场白名字、语速）:

```bash
# 配置文件路径（优先项目级，其次用户级）
# .gino-skills/bestblogs-podcast-video/EXTEND.md
# ~/.gino-skills/bestblogs-podcast-video/EXTEND.md
```

若环境变量未设置且 EXTEND.md 不存在，引导用户完成以下步骤：

1. **注册 Fish.audio**: 访问 https://fish.audio 注册账号
2. **获取 API Key**: 在 https://fish.audio/api 页面创建 API Key
3. **录制语音样本**: 朗读 3-5 分钟中文内容（建议内容丰富、语速自然、情绪稳定）
4. **上传克隆声音**: 在 Fish.audio 平台创建自定义声音模型
5. **获取 Voice ID**: 创建成功后复制 Voice ID
6. **配置环境变量**: 设置 `FISH_AUDIO_API_KEY` 和 `FISH_AUDIO_VOICE_ID`
7. **创建 EXTEND.md**: 记录个人偏好

```markdown
# EXTEND.md 模板
voice_id: <your-voice-id>
speech_rate: 1.0          # 语速（0.5-2.0）
podcast_intro_name: Gino   # 开场白中使用的名字
```

## 工作流概览

```
- [ ] 阶段一: 内容准备（早报 + Top 3 全文 + 抓取 5+ 张配图/项）
- [ ] 阶段二: 脚本生成（10-12 分钟，≥3800 字） ⚠️ 需用户确认
- [ ] 阶段三: 音频合成（Fish.audio TTS 分段 + FFmpeg 合并）
- [ ] 阶段四: 视频制作（生成 slides 数据 + Remotion 渲染）
- [ ] 阶段五: 上传 & 分发 ⛔ 分发需用户确认
```

---

## 阶段一：内容准备

### 1.1 读取当日早报

读取 `bestblogs-daily-digest` 生成的早报文件：

```bash
# 早报文件路径
contents/bestblogs-digest/YYYY-MM-DD/digest.txt
```

若当日早报不存在，提示用户先运行 `bestblogs-daily-digest` 生成早报。

从早报中提取：
- 10 条内容的标题、来源、摘要、评分、readUrl
- 关键词标签
- 日期

### 1.2 获取 Top 3 深度内容

对排名前 3 的内容，根据 `resourceType` 获取完整信息用于深度解读：

**通用请求**（所有类型都需要）:

```bash
# 获取资源元数据（mainPoints, keyQuotes, summary 等）
curl -s "https://api.bestblogs.dev/openapi/v1/resource/meta?id={RESOURCE_ID}" \
  -H "X-API-KEY: $BESTBLOGS_API_KEY"
```

**按内容类型获取详情**:

| resourceType | 详情接口 | 获取内容 |
|-------------|---------|---------|
| `ARTICLE` | `resource/markdown` | Markdown 全文 |
| `PODCAST` | `resource/podcast/content` | 转录分段、章节、发言人摘要、问答、关键句 |
| `VIDEO` | `resource/markdown` | 视频描述/笔记（如有） |
| `TWITTER` | 无需额外调用 | 推文数据已在 digest 中（文本、媒体、互动数据） |

```bash
# ARTICLE — 获取 Markdown 全文
curl -s "https://api.bestblogs.dev/openapi/v1/resource/markdown?id={RESOURCE_ID}" \
  -H "X-API-KEY: $BESTBLOGS_API_KEY"

# PODCAST — 获取播客完整内容（转录、章节、摘要）
curl -s "https://api.bestblogs.dev/openapi/v1/resource/podcast/content?id={RESOURCE_ID}" \
  -H "X-API-KEY: $BESTBLOGS_API_KEY"

# VIDEO — 获取视频描述（如有 Markdown 内容）
curl -s "https://api.bestblogs.dev/openapi/v1/resource/markdown?id={RESOURCE_ID}" \
  -H "X-API-KEY: $BESTBLOGS_API_KEY"
```

3 个资源的请求并行执行。从返回数据中提取：
- `summary`: 详细摘要
- `mainPoints`: 主要观点（{point, explanation}）
- `keyQuotes`: 关键金句
- `authors`: 作者信息
- `sourceName`: 来源
- `tags`: 标签

**ARTICLE**: Markdown 全文用于深度理解。**PODCAST**: `autoChapters`(章节)、`podCastSummary`(摘要)、`speakerSummaries`(发言人)、`questionsAnswers`(问答)、`keySentences`(金句)。**TWITTER**: 互动数据 + `mediaList` + `author`。详见 `references/api_reference.md`。

### 1.3 抓取配图素材（丰富视觉）

为视频准备**大量**图片素材。精讲项需要 5-8 张图用于 slides 切换（每 8-15 秒换一张），避免长时间停留在同一画面。

```bash
mkdir -p contents/bestblogs-podcast-video/YYYY-MM-DD/assets
```

**各类型配图来源**（按优先级逐级获取，尽量多收集）:

| resourceType | 优先级 1 | 优先级 2 | 优先级 3 | 优先级 4 |
|-------------|---------|---------|---------|---------|
| ARTICLE | 元数据 `cover` | Markdown 文内**所有**图片 | `sourceImage` | `image-gen` 生成补充 |
| VIDEO | 元数据 `cover`（缩略图） | yt-dlp + ffmpeg 截帧（每 30 秒一帧，Top 3） | 视频描述内图片 | `image-gen` 生成 |
| PODCAST | 元数据 `cover` | showNotes 图片 | `sourceImage` | `image-gen` 生成 |
| TWITTER | `mediaList[].mediaUrlHttps`（**全部**下载） | 元数据 `cover` | 引用推文的 OG 图 | `image-gen` 生成 |

**命名规范**: `article-{rank}-{type}-{n}.{ext}`（type: `cover`, `fig`, `frame`, `media`, `gen`）
**数量要求**: 精讲项（Top 3）**至少 5 张**，速览项至少 1 张封面

#### ⚠️ 配图质量审核（必须执行）

**淘汰条件**（符合任一则丢弃，用 `image-gen` 生成替换图）:
- **文件大小低于 10KB**（通常为 Twitter 头像、图标等低质量图片）
- 分辨率低于 800px 宽
- 与当前内容无关（通用 banner、广告、stock photo）
- 纯文字截图且文字无法辨认

**生成替换图**（图片不足 5 张或质量不合格时）:

```bash
IMAGE_GEN_SKILL_DIR=$(readlink -f ~/.claude/skills/image-gen 2>/dev/null)

bun ${IMAGE_GEN_SKILL_DIR}/scripts/main.ts \
  --promptfiles assets/gen-prompt-{rank}.md \
  --image assets/article-{rank}-gen1.png \
  --ar 16:9 --quality 2k
```

**生图 prompt 必须使用统一风格前缀**:
```
Minimalist tech illustration, flat design, muted color palette (ink blue #1a365d, cream #fefdfb, gray tones), clean lines, no text overlays, 16:9 aspect ratio. [核心概念描述]
```

同一期所有生成图风格一致，禁止混搭、禁止包含文字、禁止鲜艳配色。

---

## 阶段二：播客脚本生成

根据 `references/script_style_guide.md` 中的详细指南生成播客脚本。

### 脚本整体结构

```
[开场白] ～40秒
  品牌问候 + 日期 + 今日关键词概览 + 悬念预告

[精讲区: Top 1] ～3分钟
  背景/作者介绍 → 核心问题 → 关键观点（3 个） → 金句引用 → 个人思考/启发

[精讲区: Top 2] ～2.5-3分钟
  同上结构

[精讲区: Top 3] ～2.5-3分钟
  同上结构

[速览区: 第 4-10 条] ～3-4分钟
  每条 20-30 秒，标题+核心要点+为什么值得关注

[结尾] ～30秒
  今日精华回顾 + 总结 + BestBlogs 品牌引导
```

预计总时长：**10-12 分钟**（约 4000-5000 字脚本，**不低于 3800 字**）

⚠️ 脚本常偏短，必须**主动扩充**: 精讲每条 3 个观点 + 速览每条 2 句话 + 精讲间过渡桥接

### 脚本生成规则

- **语气**: 自然、专业、像朋友间分享有趣发现，不要朗读感
- **精讲部分**: 必须包含文章背景/作者、要解决的问题、核心观点（2-3 个）、个人思考或启发
- **速览部分**: 一句话概括 + 为什么值得关注
- **禁止**: 过度客套、重复"接下来"、机械化转场
- **关键金句**: 可以原文引用，增加权威感和层次感

### ⚠️ 用户确认

生成脚本后，将完整脚本输出给用户，等待确认或修改后再进入阶段三。

脚本保存到：

```bash
contents/bestblogs-podcast-video/YYYY-MM-DD/script.md
```

---

## 阶段三：音频合成

### 3.1 脚本分段

将播客脚本按章节分割为多个片段，每段控制在 **500-1000 字**:

| 段落标记 | 内容 | 预估字数 |
|---------|------|---------|
| `<!-- SEGMENT: intro -->` | 开场白 | 120-180 |
| `<!-- SEGMENT: deep-1 -->` | Top 1 精讲 | 650-1000 |
| `<!-- SEGMENT: deep-2 -->` | Top 2 精讲 | 650-1000 |
| `<!-- SEGMENT: deep-3 -->` | Top 3 精讲 | 650-1000 |
| `<!-- SEGMENT: quick -->` | 速览第 4-7 条 | 400-600 |
| `<!-- SEGMENT: quick-2 -->` | 速览第 8-10 条 | 300-500 |
| `<!-- SEGMENT: outro -->` | 结尾 | 80-120 |

### 3.2 调用 Fish.audio TTS

每个分段独立调用 Fish.audio API:

```bash
# TTS 脚本位置
SKILL_DIR=$(readlink -f ~/.claude/skills/bestblogs-podcast-video 2>/dev/null)

# 合成单个片段
bun ${SKILL_DIR}/scripts/fish-tts.ts \
  --text "片段文本" \
  --output contents/bestblogs-podcast-video/YYYY-MM-DD/segments/segment-00.mp3 \
  --voice-id "$FISH_AUDIO_VOICE_ID" \
  --rate 1.0
```

或批量合成（推荐，自动分段 + 合并）:

```bash
bun ${SKILL_DIR}/scripts/fish-tts.ts \
  --script contents/bestblogs-podcast-video/YYYY-MM-DD/script.md \
  --output-dir contents/bestblogs-podcast-video/YYYY-MM-DD/segments/ \
  --voice-id "$FISH_AUDIO_VOICE_ID" \
  --rate 1.0 \
  --merge contents/bestblogs-podcast-video/YYYY-MM-DD/podcast.mp3
```

脚本自动按 `<!-- SEGMENT: name -->` 标记分段合成，`--merge` 参数自动调用 FFmpeg 合并并归一化音量。

**分段合成优势**: 避免超长文本质量下降，失败时可单段重试。

输出：`contents/bestblogs-podcast-video/YYYY-MM-DD/podcast.mp3`

---

## 阶段四：视频制作

### 4.1 素材确认

确认阶段一抓取和生成的图片素材完整性：

- 检查精讲项（Top 3）每条**至少 5 张**图片（确保 slides 有足够素材切换）
- 检查速览项每条至少 1 张封面图
- 确认所有 `image-gen` 生成的图片风格统一（极简科技插画、BestBlogs 品牌配色）
- 确认图片分辨率均 ≥ 800px 宽
- 图片不足时立即用 `image-gen` 补充（参见 1.3 补充策略）

### 4.2 准备视频数据（含 Slides）

生成 Remotion 所需的 JSON 数据文件。完整 schema 见 `scripts/remotion/src/types.ts`（`VideoData` + `VideoItem` + `DeepSlide`）。

**关键字段**:
- `items[].type`: `"deep"` (精讲) 或 `"quick"` (速览)
- `items[].images`: 所有可用图片路径列表（相对 Remotion `public/`）
- `items[].slides`: **精讲项必须提供** slides 数组，每个 slide 8-15 秒
- `items[].audioStart` / `audioDuration`: 秒数，从 ffprobe 段时长累加计算（见 4.3）
- `audioFile`: `"podcast.mp3"`（Remotion public/ 目录下）
- `totalDuration`: podcast.mp3 总时长（秒）

**Slides 结构**（仅 deep 项需要），完整 schema 见 `scripts/remotion/src/types.ts`（`DeepSlide`），slides 编排和布局详见 `references/video_design_guide.md`。

⚠️ **关键原则**:
- 每张 slide **8-15 秒**，避免任何画面停留超过 20 秒
- `durationRatio` 之和必须 = 1.0
- 图片分配：每个 `point` slide 尽量配不同图片
- 无图片的 slide（problem/quote）用纯色背景 + 大字排版
- slides 内容和顺序必须与音频播讲顺序一致

保存到：`contents/bestblogs-podcast-video/YYYY-MM-DD/video-data.json`

### 4.3 计算音频时间轴

用 ffprobe 获取每个段的时长，**累加计算各 item 的 `audioStart` 和 `audioDuration`**:

```bash
# 获取各段时长（秒）
for seg in intro deep-1 deep-2 deep-3 quick quick-2 outro; do
  ffprobe -v quiet -show_entries format=duration \
    -of default=noprint_wrappers=1:nokey=1 \
    contents/bestblogs-podcast-video/YYYY-MM-DD/segments/$seg.mp3
done
```

时间轴映射规则：
- **deep items 1-3**: `audioStart` = 前面所有段的累计时长，`audioDuration` = 对应 deep-N 段时长
- **quick items 4-7**: 均分 `quick` 段时长（quick 时长 / 4）
- **quick items 8-10**: 均分 `quick-2` 段时长（quick-2 时长 / 3）
- **totalDuration**: 合并后 podcast.mp3 的总时长

### 4.4 生成 Slides 数据

根据脚本 BCPT 结构和收集的图片，为每个精讲 item 生成 `slides` 数组。按段落字数比例计算 `durationRatio`，校验每 slide 在 8-15 秒范围内。

**音视频同步原则**: slides 顺序和内容必须与音频播讲顺序一致。

### 4.5 Remotion 渲染

**重要**: Remotion 的 `staticFile()` 从 `public/` 目录加载文件。渲染前必须将音频和图片**复制**（不能用 symlink）到 Remotion 项目的 `public/` 目录，渲染后清理：

```bash
SKILL_DIR=$(readlink -f ~/.claude/skills/bestblogs-podcast-video 2>/dev/null)
PROJECT_DIR=$(pwd)
REMOTION_DIR=${SKILL_DIR}/scripts/remotion
CONTENT_DIR=${PROJECT_DIR}/contents/bestblogs-podcast-video/YYYY-MM-DD

# 1. 复制素材到 Remotion public/（不能用 symlink，Remotion 会复制到临时目录）
mkdir -p ${REMOTION_DIR}/public
cp ${CONTENT_DIR}/podcast.mp3 ${REMOTION_DIR}/public/podcast.mp3
cp -r ${CONTENT_DIR}/assets ${REMOTION_DIR}/public/assets

# 2. 渲染视频
cd ${REMOTION_DIR} && \
npx remotion render src/index.ts BestBlogsPodcast \
  --props="${CONTENT_DIR}/video-data.json" \
  --output="${CONTENT_DIR}/video.mp4" \
  --codec=h264 \
  --image-format=jpeg \
  --quality=80

# 3. 清理 public/（避免占用磁盘空间和被 git 跟踪）
rm -rf ${REMOTION_DIR}/public/assets ${REMOTION_DIR}/public/podcast.mp3
```

视觉设计详见 `references/video_design_guide.md`。

输出：`contents/bestblogs-podcast-video/YYYY-MM-DD/video.mp4`

---

## 阶段五：上传 & 分发

### 5.1 生成 metadata.json

上传和 RSS 更新需要的元数据文件，**必须在上传前创建**。包含：`date`, `title`, `description`, `duration`(秒), `durationFormatted`, `audioFile`(相对路径), `audioSize`(字节，`stat -f%z`), `keywords`, `items`(10 条的 rank+title+source)。

### 5.2 上传 R2

```bash
SKILL_DIR=$(readlink -f ~/.claude/skills/bestblogs-podcast-video 2>/dev/null)

# 首次上传（位置参数: <local-file> <r2-key>）
bun ${SKILL_DIR}/scripts/upload-r2.ts \
  contents/bestblogs-podcast-video/YYYY-MM-DD/podcast.mp3 \
  "podcast/YYYY-MM-DD/podcast.mp3"

# 重新生成后需要 --overwrite 覆盖已有文件
bun ${SKILL_DIR}/scripts/upload-r2.ts --overwrite \
  contents/bestblogs-podcast-video/YYYY-MM-DD/podcast.mp3 \
  "podcast/YYYY-MM-DD/podcast.mp3"

# 上传视频（同理，重新生成加 --overwrite）
bun ${SKILL_DIR}/scripts/upload-r2.ts \
  contents/bestblogs-podcast-video/YYYY-MM-DD/video.mp4 \
  "podcast/YYYY-MM-DD/video.mp4"
```

### 5.3 更新 RSS Feed

```bash
bun ${SKILL_DIR}/scripts/podcast-rss.ts \
  --metadata contents/bestblogs-podcast-video/YYYY-MM-DD/metadata.json \
  --feed contents/bestblogs-podcast-video/podcast.xml \
  --base-url "$R2_PUBLIC_URL/podcast" \
  --upload
```

`--upload` 参数会自动将更新后的 podcast.xml 上传到 R2。
RSS Feed 保存在：`contents/bestblogs-podcast-video/podcast.xml`。

### 5.3 ⛔ 平台分发（需用户确认）

展示上传结果摘要（文件、时长、R2 URL），询问是否分发到微信视频号/B 站。分发为**写操作**，必须等待用户明确确认。V1 版本仅生成 + 上传+RSS。

---

## 阶段完成：保存文件

所有输出保存到项目根目录下：

```
contents/bestblogs-podcast-video/
  YYYY-MM-DD/
    script.md          # 播客脚本
    podcast.mp3        # 播客音频
    video.mp4          # 短视频
    video-data.json    # 视频渲染数据
    metadata.json      # 元数据（标题、描述、时长、URL）
    assets/            # 图片素材
    segments/          # TTS 音频片段（可清理）
  podcast.xml          # RSS Feed（累积更新）
```

完成后输出摘要（脚本/播客/视频路径 + 精讲 3 条标题 + 速览 7 条）。

---

## 参数调整

| 用户表述 | 参数调整 |
|---------|---------|
| "只生成播客" | 跳过阶段四（视频制作） |
| "只生成视频" | 仍需阶段三（音频是视频的音轨） |
| "不需要上传" | 跳过阶段五 |
| "语速快一点" | `--rate 1.15` |
| "精讲 5 条" | Top 5 精讲 + 5 条速览 |
| "全部速览" | 10 条均速览模式，总时长约 5-6 分钟 |
| "重新生成音频" | 从阶段三开始，复用已有脚本 |
| "重新生成视频" | 从阶段四开始，复用已有音频 |
| "换个声音" / "更换声音模型" | 从阶段三开始，用新的 `--voice-id` 重新合成，然后重新渲染视频并用 `--overwrite` 覆盖上传 |

---

## 错误处理

**重要**: 始终先检查 API 响应中的 `success` 字段。

### BestBlogs API
- `401`: 检查 `BESTBLOGS_API_KEY`
- `resource/markdown` 返回 `null`: 该文章无全文，退化到仅用 summary + mainPoints 撰写脚本

### Fish.audio TTS
- `401`: 检查 `FISH_AUDIO_API_KEY`
- `404` (Voice not found): 检查 `FISH_AUDIO_VOICE_ID` 是否正确
- `429` (Rate limit): 等待 10 秒后重试当前片段
- 单段失败：重试一次，仍失败则标记该段，继续后续片段，最后汇报
- 合成质量问题：建议用户检查原始语音样本质量

### Remotion 视频渲染
- 依赖未安装：提示用户在 `scripts/remotion/` 下运行 `npm install`
- `staticFile() 404`: 音频或图片未复制到 `scripts/remotion/public/`。**必须复制实际文件，symlink 无效**（Remotion 会将 public/ 复制到临时目录，symlink 会断裂）
- 渲染超时：检查图片文件是否存在、尺寸是否过大
- 图片加载失败：跳过该图片，使用 fallback 纯色背景

### FFmpeg
- 未安装：提示用户安装 `brew install ffmpeg` 或 `apt install ffmpeg`
- 合并失败：检查音频片段格式一致性

### R2 上传
- 认证失败：检查 R2 相关环境变量
- 上传失败：重试一次，仍失败则保留本地文件并告知用户
