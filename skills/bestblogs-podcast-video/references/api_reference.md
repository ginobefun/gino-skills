# BestBlogs 播客视频 API 参考

## 一、Fish.audio TTS API

### 基础信息

- **端点**: `POST https://api.fish.audio/v1/tts`
- **认证**: `Authorization: Bearer $FISH_AUDIO_API_KEY`
- **Content-Type**: `application/json`
- **响应**: 音频流（直接返回音频数据，非 JSON）
- **官方文档**: https://docs.fish.audio/api-reference/endpoint/openapi-v1/text-to-speech

### 请求参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `text` | String | **必填** | 要合成的文本 |
| `reference_id` | String | — | 预上传的声音模型 ID（即克隆后的 voice_id） |
| `format` | String | `"mp3"` | 输出格式: `mp3`, `wav`, `opus`, `pcm` |
| `mp3_bitrate` | Integer | `128` | MP3 比特率 |
| `sample_rate` | Integer | — | 采样率 |
| `prosody.speed` | Float | `1.0` | 语速控制（0.5-2.0） |
| `prosody.volume` | Float | `0` | 音量调整 |
| `temperature` | Float | `0.7` | 随机性控制 |
| `top_p` | Float | `0.7` | 核采样参数 |
| `chunk_length` | Integer | `300` | 文本分块长度（字符） |
| `min_chunk_length` | Integer | `50` | 最小分块字符数 |
| `normalize` | Boolean | `true` | 文本归一化（改善数字/符号朗读） |
| `latency` | String | `"normal"` | 延迟模式: `normal`（最高质量）, `balanced`, `low` |
| `max_new_tokens` | Integer | `1024` | 每个文本块的最大音频 token 数 |
| `repetition_penalty` | Float | `1.2` | 重复惩罚（>1.0 减少重复） |
| `condition_on_previous_chunks` | Boolean | `true` | 使用前一片段作为上下文保持声音一致性 |

### V3 HD 模型额外参数

| 参数 | 说明 |
|------|------|
| `emotion` | 情绪控制: `"calm"`, `"happy"`, `"sad"` 等 |
| `language` | 语言增强: `"zh"`（中文）, `"en"`（英文） |

### curl 示例

```bash
# 基础 TTS 调用 — 使用克隆声音
curl -s -X POST https://api.fish.audio/v1/tts \
  -H "Authorization: Bearer $FISH_AUDIO_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "大家好，我是 Gino，欢迎收听 BestBlogs 每日早报。",
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
| 400 | 请求参数无效 |
| 401 | API Key 无效或缺失 |
| 404 | Voice ID 不存在 |
| 429 | 频率限制，等待后重试 |
| 500 | 服务器内部错误 |

### 声音克隆

声音克隆通过 Fish.audio 平台完成（非 API 直接调用）:

1. 登录 https://fish.audio
2. 进入「我的声音」页面
3. 上传语音样本（推荐 1-3 分钟，最少 15 秒）
4. 系统自动训练克隆模型
5. 获得 `voice_id`（即 `reference_id`）

克隆后的声音通过 `reference_id` 在 TTS 调用中使用，与内置声音使用方式完全一致。

### 最佳实践

- **文本分段**: 每段 500-1000 字，避免超长文本质量下降
- **归一化**: 始终开启 `normalize: true`，改善数字和英文朗读
- **一致性**: 开启 `condition_on_previous_chunks: true`，保持声音连贯
- **比特率**: 播客建议 192kbps，保证音质
- **语速**: 默认 1.0，可根据用户偏好调整
- **重复惩罚**: 保持 1.2，避免重复音节

---

## 二、BestBlogs API（内容获取）

### 资源元数据

`GET /openapi/v1/resource/meta?id={RESOURCE_ID}`

返回单个资源的完整元数据（同 resource/list 中的 item 结构）。

### 文章 Markdown 全文

`GET /openapi/v1/resource/markdown?id={RESOURCE_ID}`

返回文章正文的 Markdown 文本。

```json
{
  "success": true,
  "data": "# 文章标题\n\n正文内容..."
}
```

`data` 为 `null` 时表示该文章无全文内容。

### 关键字段（用于脚本撰写）

| 字段 | 用途 |
|------|------|
| `title` | 播客脚本中的标题 |
| `authors` | 介绍文章作者 |
| `sourceName` | 介绍来源平台 |
| `summary` | 详细摘要，精讲部分的核心素材 |
| `mainPoints` | 主要观点列表 [{point, explanation}]，精讲的骨架 |
| `keyQuotes` | 关键金句，可原文引用增加权威感 |
| `oneSentenceSummary` | 一句话摘要，速览部分使用 |
| `tags` | 标签，用于开场关键词 |
| `score` | 评分 |
| `readUrl` | BestBlogs 站内链接 |
| `resourceType` | 资源类型: `ARTICLE`, `PODCAST`, `VIDEO`, `TWITTER` |
| `cover` | 封面图片 URL（视频为 YouTube 缩略图） |
| `mediaDuration` | 媒体时长（秒），视频/播客类型 |
| `enclosureUrl` | 附件链接（音频/视频文件 URL） |
| `url` | 原文链接（视频为 YouTube 链接） |

完整 BestBlogs API 参数详见 `bestblogs-daily-digest/references/api_reference.md`。

### 播客内容详情

`GET /openapi/v1/resource/podcast/content?id={RESOURCE_ID}`

用于获取播客类型资源的完整分析结果，**仅当 `resourceType` 为 `PODCAST` 时调用**。

```bash
curl -s "https://api.bestblogs.dev/openapi/v1/resource/podcast/content?id={RESOURCE_ID}" \
  -H "X-API-KEY: $BESTBLOGS_API_KEY"
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `transcriptionSegments` | Array | 转录分段 [{id, speakerId, beginTime, endTime, text}] |
| `autoChapters` | Array | 章节 [{id, headLine, summary, beginTime, endTime}] |
| `podCastSummary` | String | 播客全文摘要 |
| `speakerSummaries` | Array | 发言人总结 [{speakerId, speakerName, summary}] |
| `questionsAnswers` | Array | 问答 [{question, answer}] |
| `keywords` | Array | 关键词列表 |
| `keySentences` | Array | 关键句子 [{sentence, beginTime, endTime}] |

**脚本撰写用途**:
- `autoChapters` → 精讲结构骨架（按章节组织内容）
- `podCastSummary` → 精讲核心素材
- `speakerSummaries` → 介绍嘉宾/主播背景
- `questionsAnswers` → 精讲亮点（可引用问答对）
- `keySentences` → 金句引用

### 推文媒体字段

推文类型资源的媒体数据已包含在 digest 中（来自 `tweet/list` 接口的 `tweet` 字段）:

| 字段 | 说明 |
|------|------|
| `mediaList` | 推文媒体 [{type, mediaUrlHttps, url}]，type 为 `photo`/`video`/`animated_gif` |
| `author.profileImageUrl` | 作者头像 URL |
| `author.userName` | 作者用户名（@handle） |
| `text` | 推文文本（可能经翻译） |
| `likeCount` / `retweetCount` / `viewCount` | 互动数据 |

---

## 三、FFmpeg 音频处理

### 合并音频片段

```bash
# 生成文件列表
for f in segments/segment-*.mp3; do
  echo "file '$f'" >> segments/filelist.txt
done

# 合并 + 音量归一化
ffmpeg -y -f concat -safe 0 -i segments/filelist.txt \
  -af "loudnorm=I=-16:TP=-1.5:LRA=11" \
  -ar 44100 -b:a 192k \
  podcast.mp3
```

### 获取音频时长

```bash
ffprobe -v error -show_entries format=duration \
  -of default=noprint_wrappers=1:nokey=1 podcast.mp3
```

### 参数说明

| 参数 | 说明 |
|------|------|
| `loudnorm` | EBU R128 响度归一化，`I=-16` 为播客标准响度 |
| `TP=-1.5` | True Peak 限制，防止削波 |
| `LRA=11` | 响度范围 |
| `-ar 44100` | 采样率 44.1kHz |
| `-b:a 192k` | 比特率 192kbps |

---

## 四、Remotion 视频渲染

### 渲染命令

```bash
npx -y remotion render src/index.ts BestBlogsPodcast \
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
  date: string;                    // "2026-03-08"
  keywords: string[];              // ["Claude 4", "AI Coding"]
  brandName: string;               // "BestBlogs 早报"
  brandSlogan: string;             // "遇见更好的技术阅读"
  audioFile: string;               // 相对路径到 podcast.mp3
  totalDuration: number;           // 总时长（秒）
  items: VideoItem[];
}

interface VideoItem {
  rank: number;                    // 排名 1-10
  type: "deep" | "quick";         // deep=精讲, quick=速览
  resourceType?: "ARTICLE" | "PODCAST" | "VIDEO" | "TWITTER"; // 原始内容类型
  title: string;
  source: string;
  author?: string;                 // 仅精讲项
  score: number;
  summary?: string;                // 仅精讲项
  points?: string[];               // 仅精讲项，关键观点
  quote?: string;                  // 仅精讲项，关键金句
  oneLiner?: string;               // 仅速览项
  images: string[];                // 图片路径列表
  audioStart: number;              // 在音频中的起始时间（秒）
  audioDuration: number;           // 该段音频时长（秒）
}
```

### 品牌配色（BestBlogs）

| 角色 | 色值 | 用途 |
|------|------|------|
| 墨蓝 | `#1a365d` | 主色、标题、品牌 |
| 琥珀 | `#d97706` | Top 1 强调色 |
| 米白 | `#fefdfb` | 背景 |
| 深炭灰 | `#374151` | 正文文字 |
| 中灰 | `#6b7280` | 辅助信息 |

---

## 五、R2 上传

复用 `image-gen` 中的 R2 上传逻辑。

### 环境变量

- `CLOUDFLARE_ACCOUNT_ID`: Cloudflare 账户 ID
- `R2_ACCESS_KEY_ID`: R2 Access Key
- `R2_SECRET_ACCESS_KEY`: R2 Secret Key
- `R2_BUCKET_NAME`: Bucket 名称
- `R2_PUBLIC_URL`: 公开访问 URL 前缀

### 上传路径约定

```
podcast/YYYY-MM-DD/podcast.mp3     # 播客音频
podcast/YYYY-MM-DD/video.mp4       # 短视频
podcast/podcast.xml                 # RSS Feed
```

### 访问 URL

```
${R2_PUBLIC_URL}/podcast/2026-03-08/podcast.mp3
${R2_PUBLIC_URL}/podcast/podcast.xml
```
