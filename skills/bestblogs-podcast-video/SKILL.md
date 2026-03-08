---
name: bestblogs-podcast-video
description: "将 BestBlogs 每日早报转化为播客和短视频。适用场景: (1) 将今日早报生成播客音频, (2) 将早报制作成短视频, (3) 生成每日播客+视频, (4) 用我的声音播报今天的早报, (5) 更新播客 RSS Feed。触发短语: '生成播客', '生成视频', '早报播客', '早报视频', 'podcast', 'daily podcast', '播客视频', '生成音频', '录制早报', 'bestblogs podcast', 'bestblogs video', '把早报变成播客', '把早报变成视频', '早报音频', '每日播客'"
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

接口地址: `https://api.bestblogs.dev`

### Fish.audio TTS

```bash
-H "Authorization: Bearer $FISH_AUDIO_API_KEY"
```

需要的环境变量:
- `FISH_AUDIO_API_KEY`: Fish.audio API 密钥
- `FISH_AUDIO_VOICE_ID`: 克隆后的声音 ID

### R2 存储

复用 `image-gen` 已有的 R2 配置:
- `CLOUDFLARE_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`, `R2_PUBLIC_URL`

若任一环境变量未设置，提示用户配置。

## ⛔ 首次使用: Fish.audio 声音克隆配置

首次使用前必须完成声音克隆。检查 EXTEND.md 配置文件:

```bash
# 检查配置文件（优先项目级，其次用户级）
# .gino-skills/bestblogs-podcast-video/EXTEND.md
# ~/.gino-skills/bestblogs-podcast-video/EXTEND.md
```

若不存在，引导用户完成以下步骤:

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
- [ ] 阶段一: 内容准备（读取早报 + 获取 Top 3 全文 + 抓取图片）
- [ ] 阶段二: 播客脚本生成 ⚠️ 需用户确认脚本
- [ ] 阶段三: 音频合成（Fish.audio TTS 分段生成 + FFmpeg 合并）
- [ ] 阶段四: 视频制作（Remotion 渲染）
- [ ] 阶段五: 上传 & 分发 ⛔ 分发需用户确认
```

---

## 阶段一: 内容准备

### 1.1 读取当日早报

读取 `bestblogs-daily-digest` 生成的早报文件:

```bash
# 早报文件路径
contents/bestblogs-digest/YYYY-MM-DD/digest.txt
```

若当日早报不存在，提示用户先运行 `bestblogs-daily-digest` 生成早报。

从早报中提取:
- 10 条内容的标题、来源、摘要、评分、readUrl
- 关键词标签
- 日期

### 1.2 获取 Top 3 深度内容

对排名前 3 的内容，根据 `resourceType` 获取完整信息用于深度解读:

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

3 个资源的请求并行执行。从返回数据中提取:
- `summary`: 详细摘要
- `mainPoints`: 主要观点（{point, explanation}）
- `keyQuotes`: 关键金句
- `authors`: 作者信息
- `sourceName`: 来源
- `tags`: 标签

**ARTICLE 额外**: Markdown 全文（用于理解上下文，不直接输出）

**PODCAST 额外**:
- `autoChapters`: 章节列表（{headLine, summary, beginTime, endTime}）— 用于脚本结构
- `podCastSummary`: 全文摘要 — 作为精讲核心素材
- `speakerSummaries`: 发言人总结 — 介绍嘉宾/主播
- `questionsAnswers`: 问答对 — 可引用为精讲亮点
- `keySentences`: 关键句子 — 可作为金句引用

**TWITTER 额外**: 推文互动数据（点赞/转推/引用数）、`mediaList`（图片/视频）、`author`

### 1.3 抓取配图素材

为视频准备图片素材。**按 `resourceType` 采用不同策略**:

```bash
mkdir -p contents/bestblogs-podcast-video/YYYY-MM-DD/assets
```

#### ARTICLE — 文章配图

按优先级获取:
1. **封面图**: 元数据 `cover` 字段
2. **文内图片**: 从 Markdown 全文提取（正则 `!\[.*?\]\((.*?)\)`）
3. **来源图标**: `sourceImage` 字段

#### VIDEO — 视频配图

1. **视频封面**: 元数据 `cover` 字段（即 YouTube 缩略图，直接使用）
2. **关键帧截图**（仅 Top 3 精讲项）: 若 `url` 为 YouTube 链接，使用 `yt-dlp` + `ffmpeg` 截取关键画面

```bash
# 下载视频封面
curl -s -o assets/article-{rank}-cover.jpg "COVER_URL"

# 精讲项: 截取关键帧（需要 yt-dlp 已安装）
# 先下载视频到临时文件，再按时间点截帧
yt-dlp -f "bestvideo[height<=720]" --no-audio -o assets/temp-video.mp4 "YOUTUBE_URL"

# 在章节关键时间点截帧（如 30s, 120s, 300s）
ffmpeg -ss 30 -i assets/temp-video.mp4 -frames:v 1 -q:v 2 assets/article-{rank}-frame1.jpg
ffmpeg -ss 120 -i assets/temp-video.mp4 -frames:v 1 -q:v 2 assets/article-{rank}-frame2.jpg

# 截帧完成后删除临时视频
rm -f assets/temp-video.mp4
```

**注意**: 截帧时间点优先从 `resource/markdown` 返回的视频描述中推断关键章节位置；若无章节信息，均匀分布在视频时长内（通过 `mediaDuration` 字段计算）。

#### PODCAST — 播客配图

1. **封面图**: 元数据 `cover` 字段（播客节目封面）
2. **showNotes 图片**: 从 `resource/markdown` 返回的 showNotes 中提取图片 URL
3. **来源图标**: `sourceImage` 字段

```bash
# 获取 showNotes（播客的 markdown 内容即 showNotes）
curl -s "https://api.bestblogs.dev/openapi/v1/resource/markdown?id={RESOURCE_ID}" \
  -H "X-API-KEY: $BESTBLOGS_API_KEY"
# 从返回的 Markdown 中提取图片 URL
```

#### TWITTER — 推文配图

1. **推文媒体**: `mediaList[].mediaUrlHttps`（推文中的图片/视频截图）
2. **作者头像**: `author.profileImageUrl`
3. **封面图**: 元数据 `cover` 字段（如有）

```bash
# 下载推文图片
curl -s -o assets/article-{rank}-media1.jpg "MEDIA_URL_HTTPS"
```

#### 通用规则

- **每条内容保留 2-3 张关键图片**，用于视频配图轮播
- 精讲项（Top 3）优先保证图片丰富度，速览项仅需 1 张封面
- 图片命名规范: `article-{rank}-{type}.{ext}`（type: `cover`, `fig1`, `frame1`, `media1`）

#### ⚠️ 配图质量审核（必须执行）

抓取到的图片**必须逐张审核**，确保与当前内容上下文匹配:

1. **内容相关性检查**: 图片是否与该条内容的主题、观点相关？
   - ✅ 文章讲 AI 编程 → 代码编辑器截图、架构图
   - ❌ 文章讲 AI 编程 → 网站通用 banner、广告图、无关装饰图
2. **信息价值判断**: 图片是否能辅助讲解？
   - ✅ 产品演示截图、数据可视化、流程图、对比图
   - ❌ 纯 logo、stock photo、低分辨率模糊图、文字截图（看不清）
3. **淘汰条件**（符合任一则丢弃）:
   - 分辨率低于 800px 宽
   - 纯文字截图且文字无法辨认
   - 通用性图片（网站 header、社交媒体模板、广告）
   - 与当前讨论内容无关的图片

**不匹配时的处理**: 若原文图片不符合要求或数量不足，使用 `image-gen` 生成补充图:

```bash
IMAGE_GEN_SKILL_DIR=$(readlink -f ~/.claude/skills/image-gen 2>/dev/null)

npx -y bun ${IMAGE_GEN_SKILL_DIR}/scripts/main.ts \
  --promptfiles assets/gen-prompt-{rank}.md \
  --image assets/article-{rank}-gen1.png \
  --ar 16:9 \
  --quality 2k
```

**生图风格统一规则**:
- 所有生成图片使用统一的 prompt 风格前缀:

```
Minimalist tech illustration, flat design, muted color palette (ink blue #1a365d, cream #fefdfb, gray tones), clean lines, no text overlays, 16:9 aspect ratio.
```

- 在风格前缀后追加该内容的核心概念描述，例如 `AI agent autonomously writing code in a modern IDE`
- 同一期节目的所有生成图必须风格一致，禁止混搭（如有的写实有的卡通）、禁止包含文字、禁止使用鲜艳配色

---

## 阶段二: 播客脚本生成

根据 `references/script_style_guide.md` 中的详细指南生成播客脚本。

### 脚本整体结构

```
[开场白] ～30秒
  品牌问候 + 日期 + 今日关键词概览

[精讲区: Top 1] ～2-3分钟
  背景/作者介绍 → 核心问题 → 关键观点 → 个人思考/启发

[精讲区: Top 2] ～2-3分钟
  同上结构

[精讲区: Top 3] ～2-3分钟
  同上结构

[速览区: 第 4-10 条] ～3-4分钟
  每条 15-20 秒，标题+一句话核心要点

[结尾] ～20秒
  总结 + BestBlogs 品牌引导
```

预计总时长: **10-12 分钟**

### 脚本生成规则

- **语气**: 自然、专业、像朋友间分享有趣发现，不要朗读感
- **精讲部分**: 必须包含文章背景/作者、要解决的问题、核心观点（2-3个）、个人思考或启发
- **速览部分**: 一句话概括 + 为什么值得关注
- **禁止**: 过度客套、重复"接下来"、机械化转场
- **关键金句**: 可以原文引用，增加权威感和层次感

### ⚠️ 用户确认

生成脚本后，将完整脚本输出给用户，等待确认或修改后再进入阶段三。

脚本保存到:

```bash
contents/bestblogs-podcast-video/YYYY-MM-DD/script.md
```

---

## 阶段三: 音频合成

### 3.1 脚本分段

将播客脚本按章节分割为多个片段，每段控制在 **500-1000 字**:

| 段落 | 内容 | 预估字数 |
|------|------|---------|
| segment-00 | 开场白 | 100-150 |
| segment-01 | Top 1 精讲 | 500-800 |
| segment-02 | Top 2 精讲 | 500-800 |
| segment-03 | Top 3 精讲 | 500-800 |
| segment-04 | 速览第 4-7 条 | 300-500 |
| segment-05 | 速览第 8-10 条 + 结尾 | 300-500 |

### 3.2 调用 Fish.audio TTS

每个分段独立调用 Fish.audio API:

```bash
# TTS 脚本位置
SKILL_DIR=$(readlink -f ~/.claude/skills/bestblogs-podcast-video 2>/dev/null)

# 合成单个片段
npx -y bun ${SKILL_DIR}/scripts/fish-tts.ts \
  --text "片段文本" \
  --output contents/bestblogs-podcast-video/YYYY-MM-DD/segments/segment-00.mp3 \
  --voice-id "$FISH_AUDIO_VOICE_ID" \
  --rate 1.0
```

或批量合成:

```bash
npx -y bun ${SKILL_DIR}/scripts/fish-tts.ts \
  --script contents/bestblogs-podcast-video/YYYY-MM-DD/script.md \
  --output-dir contents/bestblogs-podcast-video/YYYY-MM-DD/segments/ \
  --voice-id "$FISH_AUDIO_VOICE_ID" \
  --rate 1.0
```

**分段合成优势**: 避免超长文本质量下降，失败时可单段重试。

### 3.3 音频合并

使用 FFmpeg 合并所有片段为完整播客:

```bash
# 生成合并文件列表
ls segments/segment-*.mp3 | sort | sed 's/^/file /' > segments/filelist.txt

# 合并 + 归一化音量
ffmpeg -f concat -safe 0 -i segments/filelist.txt \
  -af "loudnorm=I=-16:TP=-1.5:LRA=11" \
  -ar 44100 -ab 192k \
  podcast.mp3
```

输出: `contents/bestblogs-podcast-video/YYYY-MM-DD/podcast.mp3`

---

## 阶段四: 视频制作

### 4.1 素材确认

确认阶段一抓取和生成的图片素材完整性:

- 检查精讲项（Top 3）每条至少 2 张图片（已在阶段 1.3 完成审核和补充）
- 检查速览项每条至少 1 张封面图
- 确认所有 `image-gen` 生成的图片风格统一（极简科技插画、BestBlogs 品牌配色）
- 确认图片分辨率均 ≥ 800px 宽

### 4.2 准备视频数据

生成 Remotion 所需的 JSON 数据文件:

```json
{
  "date": "2026-03-08",
  "keywords": ["Claude 4", "AI Coding", "DeepSeek"],
  "brandName": "BestBlogs 早报",
  "brandSlogan": "遇见更好的技术阅读",
  "items": [
    {
      "rank": 1,
      "type": "deep",
      "resourceType": "VIDEO",
      "title": "文章标题",
      "source": "来源名称",
      "author": "作者",
      "score": 96,
      "summary": "详细摘要...",
      "points": ["观点1", "观点2"],
      "quote": "关键金句",
      "images": ["assets/article-1-cover.jpg", "assets/article-1-frame1.jpg"],
      "audioStart": 30,
      "audioDuration": 150
    },
    {
      "rank": 4,
      "type": "quick",
      "title": "文章标题",
      "source": "来源名称",
      "score": 91,
      "oneLiner": "一句话核心要点",
      "images": ["assets/article-4-og.jpg"],
      "audioStart": 510,
      "audioDuration": 18
    }
  ],
  "audioFile": "podcast.mp3",
  "totalDuration": 720
}
```

保存到: `contents/bestblogs-podcast-video/YYYY-MM-DD/video-data.json`

### 4.3 Remotion 渲染

```bash
SKILL_DIR=$(readlink -f ~/.claude/skills/bestblogs-podcast-video 2>/dev/null)

# 渲染视频
cd ${SKILL_DIR}/scripts/remotion && \
npx -y remotion render src/index.ts BestBlogsPodcast \
  --props="contents/bestblogs-podcast-video/YYYY-MM-DD/video-data.json" \
  --output="contents/bestblogs-podcast-video/YYYY-MM-DD/video.mp4" \
  --codec=h264 \
  --image-format=jpeg \
  --quality=80
```

视觉设计详见 `references/video_design_guide.md`。

输出: `contents/bestblogs-podcast-video/YYYY-MM-DD/video.mp4`

---

## 阶段五: 上传 & 分发

### 5.1 上传 R2

```bash
SKILL_DIR=$(readlink -f ~/.claude/skills/bestblogs-podcast-video 2>/dev/null)

# 上传播客
npx -y bun ${SKILL_DIR}/scripts/upload-r2.ts \
  --file contents/bestblogs-podcast-video/YYYY-MM-DD/podcast.mp3 \
  --key "podcast/YYYY-MM-DD/podcast.mp3"

# 上传视频
npx -y bun ${SKILL_DIR}/scripts/upload-r2.ts \
  --file contents/bestblogs-podcast-video/YYYY-MM-DD/video.mp4 \
  --key "podcast/YYYY-MM-DD/video.mp4"
```

### 5.2 更新 RSS Feed

```bash
npx -y bun ${SKILL_DIR}/scripts/podcast-rss.ts \
  --metadata contents/bestblogs-podcast-video/YYYY-MM-DD/metadata.json \
  --feed contents/bestblogs-podcast-video/podcast.xml \
  --base-url "$R2_PUBLIC_URL/podcast"
```

RSS Feed 保存在: `contents/bestblogs-podcast-video/podcast.xml`，同步上传 R2。

### 5.3 ⛔ 平台分发（需用户确认）

展示以下信息，等待用户确认后执行:

```
✅ 播客已生成: podcast.mp3 (10:32)
✅ 视频已生成: video.mp4 (10:32)
✅ 已上传 R2:
   - 音频: https://r2-url/podcast/2026-03-08/podcast.mp3
   - 视频: https://r2-url/podcast/2026-03-08/video.mp4
✅ RSS Feed 已更新: https://r2-url/podcast/podcast.xml

是否要分发到以下平台？
- [ ] 微信视频号
- [ ] B站
```

分发为**写操作**，必须等待用户明确确认。V1 版本仅生成文件+上传 R2+更新 RSS，平台分发后续扩展。

---

## 阶段完成: 保存文件

所有输出保存到项目根目录下:

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

完成后输出摘要:

```
🎙️ BestBlogs 播客视频 | YYYY-MM-DD

📝 脚本: contents/bestblogs-podcast-video/YYYY-MM-DD/script.md
🎧 播客: contents/bestblogs-podcast-video/YYYY-MM-DD/podcast.mp3 (XX:XX)
🎬 视频: contents/bestblogs-podcast-video/YYYY-MM-DD/video.mp4 (XX:XX)

精讲内容:
1. [Top 1 标题] - 来源
2. [Top 2 标题] - 来源
3. [Top 3 标题] - 来源

速览内容: 第 4-10 条共 7 篇
```

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
- 单段失败: 重试一次，仍失败则标记该段，继续后续片段，最后汇报
- 合成质量问题: 建议用户检查原始语音样本质量

### Remotion 视频渲染
- 依赖未安装: 提示用户在 `scripts/remotion/` 下运行 `npm install`
- 渲染超时: 检查图片文件是否存在、尺寸是否过大
- 图片加载失败: 跳过该图片，使用 fallback 纯色背景

### FFmpeg
- 未安装: 提示用户安装 `brew install ffmpeg` 或 `apt install ffmpeg`
- 合并失败: 检查音频片段格式一致性

### R2 上传
- 认证失败: 检查 R2 相关环境变量
- 上传失败: 重试一次，仍失败则保留本地文件并告知用户
