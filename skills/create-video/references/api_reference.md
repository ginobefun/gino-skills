# 视频生成 API 参考

## 一、Fish.audio TTS API

### 基础信息

- **端点**: `POST https://api.fish.audio/v1/tts`
- **认证**: `Authorization: Bearer $FISH_AUDIO_API_KEY`
- **Content-Type**: `application/json`
- **响应**: 音频流（直接返回音频数据，非 JSON）

### 请求参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `text` | String | **必填** | 要合成的文本 |
| `reference_id` | String | — | 克隆后的 voice_id |
| `format` | String | `"mp3"` | 输出格式: `mp3`, `wav`, `opus`, `pcm` |
| `mp3_bitrate` | Integer | `128` | MP3 比特率 |
| `prosody.speed` | Float | `1.0` | 语速控制（0.5-2.0） |
| `temperature` | Float | `0.7` | 随机性控制 |
| `normalize` | Boolean | `true` | 文本归一化 |
| `latency` | String | `"normal"` | 延迟模式 |
| `repetition_penalty` | Float | `1.2` | 重复惩罚 |
| `condition_on_previous_chunks` | Boolean | `true` | 保持声音一致性 |

### curl 示例

```bash
curl -s -X POST https://api.fish.audio/v1/tts \
  -H "Authorization: Bearer $FISH_AUDIO_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "要合成的文本内容",
    "reference_id": "'$FISH_AUDIO_VOICE_ID'",
    "format": "mp3",
    "mp3_bitrate": 192,
    "prosody": {"speed": 1.0},
    "latency": "normal",
    "normalize": true
  }' \
  --output segment.mp3
```

### 错误码

| HTTP 状态码 | 说明 |
|-------------|------|
| 200 | 成功，返回音频流 |
| 401 | API Key 无效 |
| 404 | Voice ID 不存在 |
| 429 | 频率限制 |

---

## 二、FFmpeg 音频处理

### 合并音频片段

```bash
ffmpeg -y -f concat -safe 0 -i segments/filelist.txt \
  -af "loudnorm=I=-16:TP=-1.5:LRA=11" \
  -ar 44100 -b:a 192k \
  audio.mp3
```

### 获取音频时长

```bash
ffprobe -v error -show_entries format=duration \
  -of default=noprint_wrappers=1:nokey=1 audio.mp3
```

---

## 三、Remotion 视频渲染

### 渲染命令

```bash
npx -y remotion render src/index.ts ContentVideo \
  --props="path/to/video-data.json" \
  --output="path/to/video.mp4" \
  --codec=h264 \
  --image-format=jpeg \
  --quality=80 \
  --fps=30
```

### video-data.json 数据结构

```typescript
interface VideoData {
  title: string;                     // 视频标题
  subtitle?: string;                 // 可选副标题
  date: string;                      // "2026-03-14"
  keywords: string[];                // ["AI", "Claude"]
  brandName?: string;                // 可选品牌名
  brandSlogan?: string;              // 可选品牌标语
  audioFile?: string;                // 音频文件名（相对 public/），可选
  totalDuration: number;             // 总时长（秒）
  items: VideoItem[];
}

interface VideoItem {
  rank: number;
  type: "deep" | "quick";
  resourceType?: "ARTICLE" | "PODCAST" | "VIDEO" | "TWITTER";
  title: string;
  source: string;
  author?: string;
  score?: number;
  summary?: string;
  points?: string[];
  quote?: string;
  oneLiner?: string;
  images: string[];
  slides?: DeepSlide[];              // 精讲项 slides（8-12 张，每张 8-15 秒）
  audioStart: number;                // 音频起始时间（秒）
  audioDuration: number;             // 音频时长（秒）
}

interface DeepSlide {
  type: "cover" | "problem" | "point" | "quote" | "takeaway" | "source-card";
  text: string;
  subText?: string;
  image?: string;                    // 图片路径（相对 Remotion public/）
  durationRatio: number;             // 占 item 时长的比例（0-1，和为 1.0）
}
```

### Slide 类型说明

| type | 布局 | 说明 |
|------|------|------|
| `cover` | 全幅图片 + 底部渐变 + 标题 | 引入文章 |
| `source-card` | 白色卡片 UI + 评分徽章 | 来源预览 |
| `problem` | 居中大字 | 核心问题 |
| `point` | 左图(60%) + 右文(40%) | 观点 + 配图 |
| `quote` | 斜体居中 + 装饰引号 | 金句引用 |
| `takeaway` | 暗色图片叠加 + 白字 | 思考/总结 |

### Remotion 项目组件架构

```
src/
  index.ts                 # 入口
  Root.tsx                 # Composition 注册
  ContentVideo.tsx         # 主编排组件
  types.ts                 # 数据类型定义
  utils.tsx                # 共享工具（SpringIn, SceneWrapper, KenBurnsImage）
  scenes/
    BrandIntro.tsx         # 品牌开场
    KeywordsScene.tsx      # 关键词展示
    DeepDiveScene.tsx       # 精讲场景（含 fallback slides 生成）
    QuickBrowseScene.tsx   # 速览引导 + 卡片
    BrandOutro.tsx         # 品牌结尾
  slides/
    SlideRenderer.tsx      # Slide 类型分发
    CoverSlide.tsx
    ProblemSlide.tsx
    PointSlide.tsx
    QuoteSlide.tsx
    TakeawaySlide.tsx
    SourceCardSlide.tsx
```

---

## 四、BestBlogs API（内容获取）

### 资源元数据

`GET /openapi/v1/resource/meta?id={RESOURCE_ID}`

### 文章 Markdown 全文

`GET /openapi/v1/resource/markdown?id={RESOURCE_ID}`

### 播客内容详情

`GET /openapi/v1/resource/podcast/content?id={RESOURCE_ID}`

### 关键字段

| 字段 | 用途 |
|------|------|
| `title` | 标题 |
| `cover` | 封面图 URL |
| `mainPoints` | 主要观点 [{point, explanation}] |
| `keyQuotes` | 关键金句 |
| `summary` | 详细摘要 |
| `resourceType` | 资源类型 |

---

## 五、R2 上传

### 环境变量

- `CLOUDFLARE_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`, `R2_PUBLIC_URL`

### 上传路径约定

```
video/daily/YYYY-MM-DD/video.mp4     # 每日视频
video/weekly/YYYY-MM-DD/video.mp4    # 每周视频
video/articles/{slug}/video.mp4       # 文章视频
```

### 品牌配色

| 角色 | 色值 | 用途 |
|------|------|------|
| 墨蓝 | `#1a365d` | 主色、标题 |
| 琥珀 | `#d97706` | Top 1 强调 |
| 米白 | `#fefdfb` | 背景 |
| 深炭灰 | `#374151` | 正文 |
| 中灰 | `#6b7280` | 辅助信息 |
