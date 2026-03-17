# 播客生成 API 参考

## 一、Fish.audio TTS API

### 基础信息

- **端点**: `POST https://api.fish.audio/v1/tts`
- **认证**: `Authorization: Bearer $FISH_AUDIO_API_KEY`
- **Content-Type**: `application/json`
- **响应**: 音频流（直接返回音频数据，非 JSON）

### 请求参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `model` | String | — | 模型选择：`s2-pro`（最新推荐）、`s1`（旧版） |
| `text` | String | **必填** | 要合成的文本 |
| `reference_id` | String | — | 克隆后的 voice_id |
| `format` | String | `"mp3"` | 输出格式：`mp3`, `wav`, `opus`, `pcm` |
| `mp3_bitrate` | Integer | `128` | MP3 比特率 |
| `prosody.speed` | Float | `1.0` | 语速控制（0.5-2.0），播客推荐 0.95 |
| `prosody.volume` | Float | `0` | 音量调整 |
| `temperature` | Float | `0.7` | 随机性控制 |
| `top_p` | Float | `0.7` | 核采样参数 |
| `chunk_length` | Integer | `300` | 文本分块长度 |
| `normalize` | Boolean | `true` | 文本归一化 |
| `latency` | String | `"normal"` | 延迟模式：`normal`, `balanced`, `low` |
| `repetition_penalty` | Float | `1.2` | 重复惩罚 |
| `condition_on_previous_chunks` | Boolean | `true` | 保持声音一致性 |

### S2-Pro 模型特性

S2-Pro 是 Fish.audio 最新一代模型，推荐优先使用。

**情绪标记语法**（S2-Pro 用 `[bracket]`，S1 用 `(parenthesis)`）：

```
[excited] 这个消息太棒了！
[thoughtful] 这个问题值得深入想一想。
[amused] 他说他以前一直不喜欢 TDD。
```

规则：
- 情绪标记**必须放在句首**
- 每句话只用一个情绪标记
- 不要过度标记，只在需要明显情绪变化时使用
- 支持自然语言描述，不限于固定标签

### S1 模型额外参数（旧版）

| 参数 | 说明 |
|------|------|
| `emotion` | 情绪控制：`"calm"`, `"happy"`, `"sad"` 等 |
| `language` | 语言增强：`"zh"`, `"en"` |

### curl 示例

```bash
curl -s -X POST https://api.fish.audio/v1/tts \
  -H "Authorization: Bearer $FISH_AUDIO_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "要合成的文本内容",
    "model": "s2-pro",
    "reference_id": "'$FISH_AUDIO_VOICE_ID'",
    "format": "mp3",
    "mp3_bitrate": 192,
    "prosody": {"speed": 0.95},
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

### 最佳实践

- **文本分段**: 每段 500-1000 字，避免超长文本质量下降
- **归一化**: 始终开启 `normalize: true`
- **一致性**: 开启 `condition_on_previous_chunks: true`
- **比特率**: 播客建议 192kbps
- **重复惩罚**: 保持 1.2

---

## 二、BestBlogs API（内容获取）

### 资源元数据

`GET /openapi/v1/resource/meta?id={RESOURCE_ID}`

返回单个资源的完整元数据。

### 文章 Markdown 全文

`GET /openapi/v1/resource/markdown?id={RESOURCE_ID}`

```json
{
  "success": true,
  "data": "# 文章标题\n\n正文内容..."
}
```

`data` 为 `null` 时表示该文章无全文。

### 播客内容详情

`GET /openapi/v1/resource/podcast/content?id={RESOURCE_ID}`

仅当 `resourceType` 为 `PODCAST` 时调用。

| 字段 | 类型 | 说明 |
|------|------|------|
| `autoChapters` | Array | 章节 [{headLine, summary, beginTime, endTime}] |
| `podCastSummary` | String | 播客全文摘要 |
| `speakerSummaries` | Array | 发言人总结 |
| `questionsAnswers` | Array | 问答 [{question, answer}] |
| `keySentences` | Array | 关键句子 |

### 周刊列表

`POST /openapi/v1/newsletter/list`

```bash
curl -s -X POST https://api.bestblogs.dev/openapi/v1/newsletter/list \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: $BESTBLOGS_API_KEY" \
  -d '{"currentPage":1,"pageSize":3,"userLanguage":"zh_CN"}'
```

### 周刊详情

`GET /openapi/v1/newsletter/detail?id={NEWSLETTER_ID}`

### 关键字段（脚本撰写用）

| 字段 | 用途 |
|------|------|
| `title` | 标题 |
| `authors` | 作者 |
| `sourceName` | 来源平台 |
| `summary` | 详细摘要 |
| `mainPoints` | 主要观点 [{point, explanation}] |
| `keyQuotes` | 关键金句 |
| `oneSentenceSummary` | 一句话摘要 |
| `resourceType` | 资源类型 |

---

## 三、FFmpeg 音频处理

### 合并音频片段

```bash
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
| `loudnorm` | EBU R128 响度归一化 |
| `I=-16` | 播客标准响度 |
| `TP=-1.5` | True Peak 限制 |
| `-ar 44100` | 采样率 44.1kHz |
| `-b:a 192k` | 比特率 192kbps |

---

## 四、R2 上传

### 环境变量

- `CLOUDFLARE_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`, `R2_PUBLIC_URL`

### 上传路径约定

```
podcast/daily/YYYY-MM-DD/podcast.mp3    # 每日播客
podcast/weekly/YYYY-MM-DD/podcast.mp3   # 每周播客
podcast/articles/{slug}/podcast.mp3     # 文章播客
podcast/podcast.xml                     # RSS Feed
```
