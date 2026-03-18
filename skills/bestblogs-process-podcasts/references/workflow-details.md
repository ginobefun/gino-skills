# 播客处理工作流详细参考

## 审校输入 XML 格式

```xml
<podcast>
  <metadata>
    <title>播客标题（来自列表的 title 字段）</title>
    <source>来源名称（来自列表的 sourceName 字段）</source>
    <authors>作者/主持人列表（来自列表的 authors 字段）</authors>
    <description>播客描述（来自列表的 description 字段）</description>
    <url>原文链接（来自列表的 url 字段）</url>
  </metadata>
  <content>
    <podcast_summary>全文摘要</podcast_summary>
    <speaker_summaries>发言人总结 JSON</speaker_summaries>
    <auto_chapters>章节列表 JSON</auto_chapters>
    <questions_answers>问答列表 JSON</questions_answers>
    <keywords>关键词列表</keywords>
    <transcription_segments>转录分段 JSON（全部）</transcription_segments>
  </content>
</podcast>
```

## 审校关注点

1. **人名校正**: `speakerSummaries` 中的 `speakerName` 是否与播客元数据（authors, sourceName）一致。通义听悟通常返回 "Speaker 1"、"Speaker 2" 等通用标签，需根据播客描述和作者信息映射为实际人名
2. **关键术语**: 转录文本中技术术语、产品名、公司名的 ASR 识别是否正确（如 "Claude" 被识别为 "Cloud"、"GPT" 被识别为 "GBT" 等）
3. **文字稿准确性**: `transcriptionSegments` 中是否有明显的语音识别错误
4. **一致性**: 同一术语/人名在不同 segment、chapter、summary 中拼写是否一致
5. **章节标题/摘要**: `autoChapters` 的 `headLine` 和 `summary` 是否准确反映内容

## 审校输出

- 变更说明（告知用户改了什么、改了多少处）
- 若有修改：校正后的完整 PodcastContentDetailDTO JSON
- 若无需修改：明确说明"无需校正"

## 分析输入 XML 格式

```xml
<podcast>
  <metadata>
    <title>播客标题</title>
    <source>来源名称</source>
    <url>原文链接</url>
    <priority>来源优先级</priority>
  </metadata>
  <content>
    <chapters>
      ## 章节 1：{headLine}
      {summary}
      [时间: {beginTime} - {endTime}]

      ## 章节 2：{headLine}
      {summary}
    </chapters>
    <podcast_summary>{podCastSummary}</podcast_summary>
    <speaker_summaries>
      {speakerName}: {summary}
    </speaker_summaries>
    <questions_answers>
      Q: {question}
      A: {answer}
    </questions_answers>
    <key_sentences>
      - {sentence} [{beginTime}-{endTime}]
    </key_sentences>
    <transcription>
      [{speakerName}] {text}
      [{speakerName}] {text}
      ...（按时间顺序拼接全部 transcriptionSegments，标注说话人）
    </transcription>
  </content>
</podcast>
```

## 分析输出 JSON 格式

```json
{
  "title": "可选：仅在标题含冗余信息时填写清理后版本，否则省略",
  "oneSentenceSummary": "一句话核心总结，与播客同语言",
  "summary": "核心内容概要（200-400 字），与播客同语言",
  "domain": "一级分类代码",
  "aiSubcategory": "二级分类代码（核心分类必填，通用分类留空）",
  "tags": ["与播客同语言的标签（3-8 个）"],
  "mainPoints": [{"point": "主要观点", "explanation": "观点解释"}],
  "keyQuotes": ["转录文本中的金句，逐字引用（3-5 句）"],
  "score": 85,
  "remark": "中文评分依据、分析和推荐等级"
}
```

## 翻译输出 JSON 格式

```json
{
  "title": "翻译后的标题",
  "oneSentenceSummary": "翻译后的一句话总结",
  "summary": "翻译后的全文摘要",
  "tags": ["翻译后标签1", "翻译后标签2"],
  "mainPoints": [
    {"point": "翻译后的观点 1", "explanation": "翻译后的解释 1"}
  ],
  "keyQuotes": ["翻译后的金句 1", "翻译后的金句 2"]
}
```

## 阶段五：输出结果模板

```markdown
## 处理结果

| # | ID | 标题 | 来源 | 审校 | 评分 | 领域 | 分析 | 翻译 |
|---|-----|------|------|------|------|------|------|------|
| 1 | RAW_xxx | 标题 1 | 来源 A | ✅ 3处校正 | 85 | 人工智能 | ✅ | ✅ 中文→English |
| 2 | RAW_yyy | 标题 2 | 来源 B | ⏭️ 无需校正 | 72 | 软件编程 | ✅ | ⏭️ <80分 |
| 3 | RAW_zzz | 标题 3 | 来源 C | ❌ 内容不可用 | - | - | ❌ | - |

### 统计
- 审校成功：2（校正：1 / 无需校正：1）/ 失败：1
- 分析成功：2 / 失败：1
- 翻译成功：1 / 跳过：1（<80 分）

### 评分分布
- 90+ 分：0 个
- 80-89 分：1 个（已翻译）
- 70-79 分：1 个
- <70 分：0 个
```

## 错误处理

| 错误 | 原因 | 处理 |
|------|------|------|
| `success: false` | API 返回错误 | 读取 `code` 和 `message`，告知用户 |
| `401` / `403` | Token 过期或无权限 | 立即暂停，提示用户更新认证信息 |
| podcast/content 返回 `null` | 转录内容不可用 | 跳过该播客，继续下一个 |
| 审校输出格式错误 | AI 输出不符合预期 | 跳过审校，直接进入分析（使用原始内容） |
| savePodcastContent 失败 | 参数错误或服务端异常 | 记录失败，仍继续分析（使用原始未校正内容） |
| 分析 JSON 格式错误 | 分析输出不符合预期格式 | 重试分析一次，仍失败则跳过 |
| saveAnalysisResult 失败 | 参数错误或服务端异常 | 记录失败，输出分析 JSON 供手动重试 |
| `/dify/resource/markdown` 返回 `success: "false"` | 内容不可用 | 跳过翻译，继续下一个 |
| `analysisResult` 为空 | 播客尚未分析 | 跳过翻译，继续下一个 |
| 翻译 JSON 格式错误 | 翻译输出不符合预期格式 | 重试翻译一次，仍失败则跳过 |
| saveTranslateResult 失败 | 参数错误或服务端异常 | 记录失败，输出翻译 JSON 供手动重试 |
| 环境变量未设置 | 缺少认证信息 | 提示配置 `BESTBLOGS_ADMIN_USER_ID`、`BESTBLOGS_ADMIN_JWT_TOKEN` |
