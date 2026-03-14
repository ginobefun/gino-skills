---
name: create-video
description: "将任意内容生成短视频。适用场景：(1) 将每日早报制作成视频，(2) 将每周周刊制作成视频，(3) 将文章/博客做成讲解视频，(4) 提供音频文件同步生成视频，(5) 将内容做成带配音的短视频，(6) 发布到 B站/YouTube。触发短语：'生成视频', 'create video', '做成视频', '制作视频', '短视频', '文章转视频', 'article to video', '早报视频', '视频版', '讲解视频', 'explainer video', '周报视频', 'weekly video', '内容转视频', '视频', '发B站', 'bilibili', '发YouTube', 'youtube', '视频号'"
---

# 视频生成器 (Create Video)

将任意内容源（每日早报、每周周刊、单篇文章、任意 Markdown）转化为**短视频（MP4）**。

**核心理念**: 这不是一套固定模板，而是一组**叙事策略**。每期视频的结构应该由**内容本身决定**，不是被模板框住。好的视频让观众获得信息和思考，而不是千篇一律地走流程。

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

## 内容类型识别

第一步：识别输入类型，决定基础参数范围。

| 输入类型 | 识别方式 | 时长范围 | 基础结构 |
|---------|---------|---------|---------|
| **daily** | "早报/daily" 或日期 | 6-12 分钟 | 精讲 + 速览 |
| **weekly** | "周刊/weekly/newsletter" | 10-18 分钟 | 主题段 + 速览 |
| **article** | URL/文件/粘贴内容 | 4-8 分钟 | 全篇深度 |
| **freeform** | 任意文本 | 视内容而定 | 自适应 |

**注意**: 输入类型只决定"原料是什么"，不决定视频结构。视频结构由下面的叙事策略决定。

---

## 叙事策略库

阅读完所有内容后，根据内容特征选择最合适的叙事策略。**同一种输入类型可以用不同策略，甚至混合策略**。

### 策略一：标准精讲 + 速览

**适用**: 多数 daily 场景，内容质量均匀，2-3 条值得展开

```
[开场]     → 打招呼 + 今天最值得聊的一句话钩子
[精讲 ×2-3] → 每条独立讲，cover→point→quote→takeaway
[速览]     → 其余内容快速带过
[收尾]     → 一个记住的点 + 推荐
```

**选择信号**: 内容间关联性弱，各自独立成立，没有明显主线

### 策略二：深度聚焦

**适用**: 有一条内容特别好，值得花大量时间讲透

```
[开场]     → 直接抛出这个话题为什么重要
[深度 ×1]  → 单条 4-6 分钟，12-15 张 slides，层层展开
[速览]     → 其余内容一句话带过（可选）
[收尾]     → 核心判断 + 推荐原文
```

**选择信号**: 某条评分远超其他，或话题复杂度高需要充分展开，或用户指定"重点聊某条"

### 策略三：主题串联

**适用**: 多条内容指向同一个话题，串起来比单独讲更有价值

```
[开场]     → 提炼主题线，"今天有好几条都和 XX 有关"
[主题段]   → 2-3 条相关内容编织成一个叙事，而非逐条讲
[补充速览] → 不相关的内容快速带过
[收尾]     → 这个主题的整体判断
```

**选择信号**: 2-3 条内容有明显的话题重叠（如都涉及 Agent、都涉及某公司、都涉及同一技术方向），串联后信息增量大于分开讲

### 策略四：对比分析

**适用**: 有两条内容形成对比、互补或对立关系

```
[开场]     → 抛出对比视角，"今天有两个很不同的声音"
[A 观点]   → 第一条的核心观点和依据
[B 观点]   → 第二条的核心观点和依据
[对比总结] → 你的判断：谁更有道理？各自的适用边界是什么？
[速览]     → 其余内容
[收尾]
```

**选择信号**: 两条内容观点相反（如看好 vs 看衰）、方案不同（如两种技术路线）、或同一话题的不同角度

### 策略五：趋势信号

**适用**: 多条内容指向一个正在形成的趋势，值得提炼信号

```
[开场]     → 直接亮出趋势判断，"最近一个明显的信号是……"
[信号 ×3-5] → 每个信号一张 slide + 一句话，快节奏列举证据
[深入分析] → 挑 1-2 个最关键的信号展开
[判断]     → 这个趋势意味着什么？谁应该关注？
[收尾]
```

**选择信号**: 3+ 条内容都在说同一件事但角度不同，或本周/今天有一个明显的行业集体动向

### 策略六：实操拆解

**适用**: 内容偏工具、教程、实战经验

```
[开场]     → 痛点或场景引入，"如果你也遇到过 XX 问题"
[背景]     → 为什么需要这个，解决什么问题
[步骤/要点] → 按逻辑顺序展开，配合截图/示意图
[效果/经验] → 实际效果 + 踩坑经验
[收尾]     → 行动建议
```

**选择信号**: 内容以 How-to、工具介绍、配置教程、经验分享为主

### 策略选择决策流程

```
阅读所有内容
  ↓
有 3+ 条指向同一趋势？ → 策略五（趋势信号）
  ↓ 否
有 2 条形成对比/对立？ → 策略四（对比分析）
  ↓ 否
有 2-3 条话题重叠可串联？ → 策略三（主题串联）
  ↓ 否
有 1 条远超其他？ → 策略二（深度聚焦）
  ↓ 否
内容偏教程/实操？ → 策略六（实操拆解）
  ↓ 否
→ 策略一（标准精讲 + 速览）
```

**可以混合**: 比如用策略三讲主体 + 策略一的速览收尾。策略只是思路，不是牢笼。

### Weekly 特别说明

周刊视频天然适合策略三（主题串联）或策略五（趋势信号），因为一周的内容通常能归纳出 2-3 个主题线。但如果这周内容很分散，也可以用策略一。

**关键区别**: 周刊不是日报的堆叠，要找到**这一周的叙事线**。

---

## 工作流概览

```
- [ ] 阶段一: 内容准备（读取内容 + 选择策略 + 图片素材抓取与质量审核）
- [ ] 阶段二: 配音脚本生成 ⚠️ 用户确认脚本
- [ ] 阶段三: 音频合成（Fish.audio TTS）
- [ ] 阶段四: 视频数据编排 + Remotion 渲染 ⚠️ 用户审核 slides 方案
- [ ] 阶段五: 上传 & 分发 ⛔ 需用户确认
```

---

## 阶段一：内容准备

### 1.1 读取内容 + 选择叙事策略

1. 识别输入类型（daily/weekly/article/freeform）
2. 读取所有内容，理解每条的核心信息
3. 分析内容间的关系（关联性、对比性、趋势性）
4. 选择叙事策略（参考上方决策流程）
5. 向用户简要说明选择的策略和理由

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
| **独立配音**（默认） | 根据叙事策略生成视频专属配音脚本 | 正常视频制作 |
| **外部音频** | 用户提供已有音频文件 | 已有 podcast 音频，只需配画面 |

### 独立配音脚本规则

详细配音指南见 `references/script_templates.md`，核心要点：

- **内容驱动**: 叙事策略决定脚本结构，不套死模板。每期视频应该有不同的节奏和切入角度
- **视觉感知**: 画面展示的内容不需要口述，配音补充画面没有的语境和判断
- **字数控制**: 比播客简洁 20-30%（~300 字/分钟 vs 播客 ~400 字/分钟）
- **分享心态**: 每 30 秒至少输出一个有价值的信息点。目的是让观众获得信息和思考
- **开场变化**: 每期视频的开场方式都应该不同，避免千篇一律

### 配音风格（对齐 style-profile）

脚本必须读取 `contents/style-profile.md`，注入个人声音特征。

核心风格要求:
- **语气**: 自然、平实、像和朋友聊天
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

### 4.2 编排 Slides

根据叙事策略和配音内容编排 slides。完整 schema 见 `scripts/remotion/src/types.ts`，slides 编排变体见 `references/video_design_guide.md`。

**Slides 编排核心原则**:

1. **声画同步**: slides 内容和顺序必须与音频播讲顺序一致
2. **节奏控制**: 每张 slide 8-15 秒，绝不超过 20 秒（避免画面停滞）
3. **密度波动**: 高信息 slide（point）后接低信息 slide（quote/problem），避免持续高压
4. **图片分散**: 每个 `point` slide 尽量配不同图片，避免视觉重复
5. **开场变化**: 不是每次都 cover → source-card，可以 problem 先行或 quote 先行
6. **durationRatio 之和** 必须 = 1.0

**生成 video-data.json**:

关键字段:
- `title`: 根据内容动态生成（不必是固定格式）
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

包含：`date`, `title`, `description`, `duration`(秒), `videoFile`(相对路径), `videoSize`(字节), `keywords`, `strategy`(使用的叙事策略名), `items`。

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
| "短视频版" | 精简为 3-5 分钟，仅 Top 1 深度聚焦 |
| "重点聊 XX" | 对指定内容使用深度聚焦策略 |
| "串起来讲" | 使用主题串联策略 |
| "做个对比" | 使用对比分析策略 |

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
