# 视频处理工作流详细参考

## 分析输入 XML 格式

```xml
<video>
  <metadata>
    <title>视频标题（来自列表 title 字段）</title>
    <source>来源名称（来自列表 sourceName 字段）</source>
    <url>原始链接（来自列表 url 字段）</url>
    <priority>来源优先级（来自列表 priority 字段）</priority>
  </metadata>
  <transcript>
    <![CDATA[
    转录的 Markdown 内容
    ]]>
  </transcript>
</video>
```

## 分析输出 JSON 格式

```json
{
  "title": "可选：仅在标题含冗余信息时填写清理后的标题",
  "oneSentenceSummary": "一句话核心总结（与视频同语言）",
  "summary": "核心内容概要（200-400 字，与视频同语言）",
  "domain": "一级分类代码",
  "aiSubcategory": "二级分类代码（核心分类必填，通用分类留空）",
  "tags": ["与视频同语言的标签（3-8 个）"],
  "mainPoints": [{"point": "主要观点", "explanation": "观点解释"}],
  "keyQuotes": ["原文金句，必须逐字引用转录内容"],
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

### 模式 A — 转录/分析 + 翻译

```markdown
## 处理结果

| # | ID | 标题 | 链接 | 转录 | 评分 | 翻译 | 文件 |
|---|-----|------|------|------|------|------|------|
| 1 | RR_xxx | 标题 1 | [YouTube](url) | ✅ 12345 字 | 85 | ✅ English→中文 | transcribe-RR_xxx-xxx.md |
| 2 | RR_yyy | 标题 2 | [YouTube](url) | ✅ 8901 字 | 72 | ⏭️ <80分 | transcribe-RR_yyy-xxx.md |
| 3 | RR_zzz | 标题 3 | [YouTube](url) | ❌ 转录失败 | - | - | - |

### 统计
- 转录成功：2 / 失败：1 | 分析成功：2 | 翻译成功：1 / 跳过：1（<80 分）
- 评分分布：90+: 0 | 80-89: 1（已翻译） | 70-79: 1 | <70: 0
```

### 模式 B — 仅翻译

```markdown
## 翻译结果

| # | ID | 标题 | 链接 | 语言方向 | 翻译 |
|---|-----|------|------|----------|------|
| 1 | RR_xxx | 标题 1 | [YouTube](url) | English→中文 | ✅ |
| 2 | RR_yyy | 标题 2 | [YouTube](url) | 中文→English | ❌ 分析结果为空 |

### 统计
- 翻译成功：1 / 跳过：1
```

## 错误处理

| 错误 | 原因 | 处理 |
|------|------|------|
| `success: false` | API 返回错误 | 读取 `code` 和 `message`，告知用户 |
| `401` / `403` | Token 过期或无权限 | 立即暂停，提示用户更新 `BESTBLOGS_ADMIN_JWT_TOKEN`（可在 `~/.claude/settings.json` 的 `env` 中更新） |
| `ETIMEDOUT`（Chrome AppleScript 超时） | `pro` 模式响应过慢或 Chrome 繁忙 | 自动降级为 `think` 重试一次；若仍失败，记录并跳过 |
| `ERR:parse_failed` | Gemini 无法解析该视频（私有/受限/格式不支持） | 记录失败，跳过，继续下一个 |
| `bestblogs_update_content.py` 返回 `ok: false` | `updateContent` 写入失败，或读回校验未通过 | 查看 worker JSON 的 `meta.error`、`write`、`verify`，决定是重试还是跳过 |
| 转录失败（其他） | Chrome 未登录 / 网络问题 | 记录失败，跳过该视频后续步骤，继续下一个 |
| updateContent 失败 | 内容过大或 ID 不存在 | 记录失败，跳过分析，文件已保存可手动重试 |
| 分析 JSON 格式错误 | 分析输出不符合预期格式 | 重试分析一次，仍失败则跳过 |
| saveAnalysisResult 失败 | 参数错误或服务端异常 | 记录失败，输出分析 JSON 供手动重试 |
| `/dify/resource/markdown` 返回 `success: "false"` | 视频内容不可用（注意 success 为**字符串**类型） | 跳过翻译，继续下一个 |
| `analysisResult` 为空/null | 视频尚未完成分析 | 跳过翻译，继续下一个 |
| `analysisResult` JSON 解析失败 | 格式异常 | 记录原始内容，跳过翻译，继续下一个 |
| 翻译 JSON 格式错误 | 翻译输出不符合预期格式 | 重试翻译一次，仍失败则跳过 |
| saveTranslateResult 失败 | 参数错误或服务端异常 | 记录失败，输出翻译 JSON 供手动重试 |
| 环境变量未设置 | 缺少认证信息 | 提示配置 `BESTBLOGS_ADMIN_USER_ID` 和 `BESTBLOGS_ADMIN_JWT_TOKEN` |
