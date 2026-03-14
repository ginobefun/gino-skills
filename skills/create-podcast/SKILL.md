---
name: create-podcast
description: "将任意内容生成播客音频。适用场景：(1) 将每日早报生成播客，(2) 将每周周刊生成播客，(3) 将博客文章/文档生成播客，(4) 将任意文本生成语音播客，(5) 更新播客 RSS Feed，(6) 用我的声音播报内容，(7) 发布到小宇宙。触发短语：'生成播客', 'create podcast', '做成播客', '播客音频', '文章转播客', 'article to podcast', '语音版', '音频版', '录制播客', '把这个做成播客', '周报播客', 'weekly podcast', '早报播客', 'daily podcast', '内容转音频', '播客', '发小宇宙', 'xiaoyuzhou'"
---

# 播客生成器 (Create Podcast)

将任意内容源（每日早报、每周周刊、单篇文章、任意 Markdown）转化为**播客音频（MP3）**。采用用户克隆声音的独白式播讲，支持多种内容格式和脚本模板。

- 脚本撰写模板和风格指南见 `references/script_templates.md`
- Fish.audio TTS API 和 FFmpeg 详情见 `references/api_reference.md`

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

## ⚠️ 首次使用：Fish.audio 声音克隆配置

首次使用前需完成声音克隆。若 `FISH_AUDIO_API_KEY` 和 `FISH_AUDIO_VOICE_ID` 环境变量已设置，可跳过。

可选的 EXTEND.md 配置文件用于记录个人偏好（如开场白名字、语速）:

```markdown
# EXTEND.md 模板
voice_id: <your-voice-id>
speech_rate: 1.0          # 语速（0.5-2.0）
podcast_intro_name: Gino   # 开场白中使用的名字
```

## 工作流概览

```
- [ ] 阶段一: 内容准备（识别输入源，提取关键内容）
- [ ] 阶段二: 脚本生成 ⚠️ 需用户确认
- [ ] 阶段三: 音频合成（Fish.audio TTS 分段 + FFmpeg 合并）
- [ ] 阶段四: 产出 & 分发（标题/ShowNotes/封面 + 展示确认）
```

---

## 阶段一：内容准备

### 1.1 识别输入源

根据用户输入自动识别内容来源类型，选择对应分支：

| 来源类型 | 识别方式 | 脚本模板 | 预估时长 |
|----------|---------|---------|---------|
| **每日早报** | 用户提到"早报/daily digest" 或指定日期 | `daily` | 10-12 分钟 |
| **每周周刊** | 用户提到"周刊/weekly/newsletter"或指定期数 | `weekly` | 15-20 分钟 |
| **单篇文章** | 用户提供 URL、文件路径或粘贴文章内容 | `article` | 5-8 分钟 |
| **任意内容** | 用户提供任意文本或 Markdown | `freeform` | 视内容而定 |

### 1.2 每日早报输入

读取 `bestblogs-daily-digest` 生成的早报文件：

```bash
contents/bestblogs-digest/YYYY-MM-DD/digest.txt
```

若当日早报不存在，提示用户先运行 `bestblogs-daily-digest` 生成早报。

从早报中提取：10 条内容的标题、来源、摘要、评分、readUrl、关键词标签、日期。

**获取 Top 3 深度内容**: 对排名前 3 的内容，按 `resourceType` 获取完整信息：

```bash
# 获取资源元数据
curl -s "https://api.bestblogs.dev/openapi/v1/resource/meta?id={RESOURCE_ID}" \
  -H "X-API-KEY: $BESTBLOGS_API_KEY"

# ARTICLE — Markdown 全文
curl -s "https://api.bestblogs.dev/openapi/v1/resource/markdown?id={RESOURCE_ID}" \
  -H "X-API-KEY: $BESTBLOGS_API_KEY"

# PODCAST — 播客完整内容
curl -s "https://api.bestblogs.dev/openapi/v1/resource/podcast/content?id={RESOURCE_ID}" \
  -H "X-API-KEY: $BESTBLOGS_API_KEY"
```

3 个资源的请求并行执行。详见 `references/api_reference.md`。

### 1.3 每周周刊输入

读取 `bestblogs-weekly-curator` 生成的周刊数据：

```bash
# 获取最新周刊
curl -s -X POST https://api.bestblogs.dev/openapi/v1/newsletter/list \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: $BESTBLOGS_API_KEY" \
  -d '{"currentPage":1,"pageSize":1,"userLanguage":"zh_CN"}'

# 获取周刊详情
curl -s "https://api.bestblogs.dev/openapi/v1/newsletter/detail?id={NEWSLETTER_ID}" \
  -H "X-API-KEY: $BESTBLOGS_API_KEY"
```

提取分类文章列表、编辑推荐语、主题关键词。选出 3-5 篇重点文章获取全文。

### 1.4 单篇文章输入

用户提供的文章来源：
- URL: 使用 WebFetch 获取内容
- 文件路径：直接读取
- 粘贴内容：直接使用

### 1.5 任意内容输入

直接使用用户提供的文本，分析内容结构后选择合适的脚本组织方式。

---

## 阶段二：播客脚本生成

根据输入源类型选择对应的脚本模板。详细模板和风格指南见 `references/script_templates.md`。

### 内容类型与时长

| 类型 | 时长 | 字数 | 说明 |
|------|------|------|------|
| **daily** | 10-12 min | 3800-5000 字 | 从 10 条中选 2-4 条展开，其余速览 |
| **weekly** | 15-20 min | 6000-8000 字 | 找到本周叙事线，围绕主题串联 |
| **article** | 5-8 min | 2000-3200 字 | 提炼而非复述，加个人思考 |
| **freeform** | 视内容而定 | 视内容而定 | 根据内容特点自适应 |

### 核心规则

- **风格锚定**: **必须**读取 `contents/style-profile.md` 注入个人声音特征
- **内容驱动**: 由内容本身决定结构和节奏，不要套死模板
- **信息准确**: 核心信息不失真，技术细节不含糊
- **自然流畅**: 逻辑通顺，听众不需要倒回去重听
- **TTS 友好**: 纯文本，口语化，无 Markdown/引号/破折号/括号
- **段落标记**: `<!-- SEGMENT: name -->` 用描述性命名，放在内容自然分界处

⚠️ 脚本常偏短，必须主动扩充到时长下限。重要内容多花时间讲透，不要平均分配。

### ⚠️ 用户确认

生成脚本后，将完整脚本输出给用户，等待确认或修改后再进入阶段三。

脚本保存到：

```bash
contents/tmp/podcast/YYYY-MM-DD/script.md
```

---

## 阶段三：音频合成

### 3.1 调用 Fish.audio TTS

```bash
SKILL_DIR=$(readlink -f ~/.claude/skills/create-podcast 2>/dev/null)

# 批量合成（推荐，自动分段 + 合并）
bun ${SKILL_DIR}/scripts/fish-tts.ts \
  --script contents/tmp/podcast/YYYY-MM-DD/script.md \
  --output-dir contents/tmp/podcast/YYYY-MM-DD/segments/ \
  --voice-id "$FISH_AUDIO_VOICE_ID" \
  --rate 1.0 \
  --merge contents/podcast/daily/YYYY-MM-DD/podcast.mp3
```

脚本自动按 `<!-- SEGMENT: name -->` 标记分段合成，`--merge` 参数自动调用 FFmpeg 合并并归一化音量。

分段合成优势：避免超长文本质量下降，失败时可单段重试。

---

## 阶段四：产出 & 分发

### 4.1 生成 metadata.json

包含：`date`, `title`, `description`, `duration`(秒), `durationFormatted`, `audioFile`(相对路径), `audioSize`(字节), `keywords`, `series`（daily/weekly/article）, `items`。

### 4.2 生成小宇宙发布素材

音频合成完成后，**自动**生成小宇宙所需的全部素材，无需用户额外触发。

#### 4.2.1 单集标题

根据内容类型生成标题：

| 类型 | 标题格式 | 示例 |
|------|---------|------|
| **daily** | `EP{n} · {关键词1}/{关键词2}/{关键词3} · MM.DD 早报` | `EP12 · Claude 4/Cursor 新功能/AI 编程趋势 · 03.14 早报` |
| **weekly** | `EP{n} · 本周精选 · {核心趋势} · MM.DD-MM.DD` | `EP13 · 本周精选 · AI Agent 爆发 · 03.08-03.14` |
| **article** | `EP{n} · {文章标题的精炼版}` | `EP14 · Vibe Coding 到底改变了什么` |

规则：
- 标题不超过 50 字
- 关键词用 `/` 分隔，最多 3 个
- EP 序号从 `contents/podcast/` 目录下已有单集数量推算

#### 4.2.2 ShowNotes

小宇宙 ShowNotes 支持富文本。生成 **Markdown 格式**的 ShowNotes，用户粘贴到编辑器后自动识别。

**Daily 模板**:

```markdown
## 今日精讲

00:40 {Top1 标题}
来自 {来源}，{一句话核心观点}

03:30 {Top2 标题}
来自 {来源}，{一句话核心观点}

06:15 {Top3 标题}
来自 {来源}，{一句话核心观点}

## 速览

08:00 更多值得关注的内容
· {第 4 条标题} — {来源}
· {第 5 条标题} — {来源}
· {第 6 条标题} — {来源}
· {第 7 条标题} — {来源}
· {第 8 条标题} — {来源}
· {第 9 条标题} — {来源}
· {第 10 条标题} — {来源}

## 相关链接

· 精讲原文：{readUrl1}
· 精讲原文：{readUrl2}
· 精讲原文：{readUrl3}
· BestBlogs: https://bestblogs.dev
```

**Weekly 模板**:

```markdown
## 本周亮点

{3-5 个一句话趋势}

## 分类精选

### 模型
00:xx {标题} — {来源}
...

### 开发
xx:xx {标题} — {来源}
...

### 产品
xx:xx {标题} — {来源}
...

## 重点深度

xx:xx {标题}
{2-3 句核心内容}

## 相关链接

· 本期周刊：{newsletter_url}
· BestBlogs: https://bestblogs.dev
```

**Article 模板**:

```markdown
## 文章信息

· 原文：{文章标题}
· 作者：{作者}
· 来源：{来源}

## 内容概要

{2-3 句核心观点}

## 时间线

00:00 开场
00:30 背景介绍
01:00 核心问题
01:30 关键观点
05:00 个人思考

## 相关链接

· 原文链接：{url}
```

ShowNotes 生成规则：
- **时间戳必须准确**：从各 segment 的实际时长累加计算，格式 `MM:SS`
- 时间戳放在行首，小宇宙编辑器会自动识别为可点击锚点
- 原文链接使用 BestBlogs 的 readUrl，确保可访问
- 不写长段描述，保持精炼，用户能快速扫读

#### 4.2.3 单集封面

调用 `cover-image` skill 或 `image-gen` skill 生成封面：

```bash
IMAGE_GEN_SKILL_DIR=$(readlink -f ~/.claude/skills/image-gen 2>/dev/null)

bun ${IMAGE_GEN_SKILL_DIR}/scripts/main.ts \
  --promptfiles contents/tmp/podcast/YYYY-MM-DD/cover-prompt.md \
  --image contents/podcast/daily/YYYY-MM-DD/cover.png \
  --ar 1:1 --quality 2k
```

封面规格：
- **尺寸**: 1:1 正方形（小宇宙推荐 3000×3000，最小 1400×1400）
- **风格**: 与品牌视觉一致，墨蓝 + 米白，简洁
- 包含日期和 1-2 个关键词
- 不堆叠文字，保持留白

生成封面的 prompt 模板：
```
Minimalist podcast cover, square format, clean design.
Muted color palette (ink blue #1a365d, cream #fefdfb).
Large centered text: "{日期}". Smaller text below: "{关键词}".
No photos, no gradients, flat design, generous whitespace.
```

#### 4.2.4 产出文件

所有小宇宙素材保存到最终产出目录：

```
contents/podcast/daily/YYYY-MM-DD/
  podcast.mp3          # 音频
  metadata.json        # 元数据
  cover.png            # 单集封面
  shownotes.md         # ShowNotes（Markdown）
```

### 4.3 上传 R2（可选）

```bash
SKILL_DIR=$(readlink -f ~/.claude/skills/create-podcast 2>/dev/null)

bun ${SKILL_DIR}/scripts/upload-r2.ts \
  contents/podcast/daily/YYYY-MM-DD/podcast.mp3 \
  "podcast/daily/YYYY-MM-DD/podcast.mp3"
```

### 4.4 更新 RSS Feed（可选，扩展到 Apple/Spotify 时启用）

当前阶段可跳过。当需要分发到 Apple Podcasts/Spotify 时启用：

```bash
bun ${SKILL_DIR}/scripts/podcast-rss.ts \
  --metadata contents/podcast/daily/YYYY-MM-DD/metadata.json \
  --feed contents/podcast/podcast.xml \
  --base-url "$R2_PUBLIC_URL/podcast" \
  --upload
```

RSS 适用场景：Apple Podcasts、Spotify、Google Podcasts 等平台通过订阅 RSS Feed 自动同步新单集。小宇宙支持直接上传，不依赖 RSS。

### 4.5 ⛔ 展示 & 确认

展示完整的小宇宙发布素材：

```
📻 播客生成完成

🎵 音频: podcast.mp3 ({时长})
🖼️ 封面: cover.png

📝 小宇宙单集标题:
{生成的标题}

📋 ShowNotes:
{生成的 ShowNotes 全文}

请确认是否满意，或需要调整。
确认后可直接复制到小宇宙后台发布。
```

---

## 输出目录

```
contents/tmp/podcast/YYYY-MM-DD/        # 临时中间文件（gitignore）
  script.md                             # 播客脚本
  segments/                             # TTS 音频片段
  cover-prompt.md                       # 封面生成 prompt

contents/podcast/                        # 最终产出（持久化）
  daily/YYYY-MM-DD/
    podcast.mp3                         # 播客音频
    metadata.json                       # 元数据
    cover.png                           # 单集封面（1:1）
    shownotes.md                        # 小宇宙 ShowNotes
  weekly/YYYY-MM-DD/
    podcast.mp3
    metadata.json
    cover.png
    shownotes.md
  articles/{slug}/
    podcast.mp3
    metadata.json
    cover.png
    shownotes.md
  podcast.xml                           # RSS Feed（可选，扩展时启用）
```

---

## 参数调整

| 用户表述 | 参数调整 |
|---------|---------|
| "不需要上传" | 跳过阶段四 |
| "语速快一点" | `--rate 1.15` |
| "精讲 5 条" | Daily 模板调整为 Top 5 精讲 + 5 速览 |
| "全部速览" | 10 条均速览模式，总时长约 5-6 分钟 |
| "重新生成音频" | 从阶段三开始，复用已有脚本 |
| "换个声音" | 用新 `--voice-id` 重新合成 |
| "用英文" | 脚本语言切换为英文 |
| "发小宇宙" | 生成小宇宙适配标题和简介 |
| "短播客" | 精简为 5 分钟，仅 Top 1 精讲 + 快速速览 |

---

## 错误处理

**重要**: 始终先检查 API 响应中的 `success` 字段。

### BestBlogs API
- `401`: 检查 `BESTBLOGS_API_KEY`
- `resource/markdown` 返回 `null`: 退化到仅用 summary + mainPoints 撰写脚本

### Fish.audio TTS
- `401`: 检查 `FISH_AUDIO_API_KEY`
- `404` (Voice not found): 检查 `FISH_AUDIO_VOICE_ID`
- `429` (Rate limit): 等待 10 秒后重试当前片段
- 单段失败：重试一次，仍失败则标记该段，继续后续片段，最后汇报

### FFmpeg
- 未安装：提示用户安装 `brew install ffmpeg` 或 `apt install ffmpeg`
- 合并失败：检查音频片段格式一致性

### R2 上传
- 认证失败：检查 R2 相关环境变量
- 上传失败：重试一次，仍失败则保留本地文件并告知用户
