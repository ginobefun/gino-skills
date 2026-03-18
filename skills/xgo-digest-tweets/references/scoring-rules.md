# 智能筛选与排序规则

## 筛选维度与加权

对每条推文计算综合优先级分数，考虑以下维度：

### 1. 来源权重（最重要）

**头部厂商官方账号** — 最高优先级，这些账号发布的新模型、新产品、新功能几乎必选：
- OpenAI 系：`OpenAI`, `OpenAIDevs`, `ChatGPTapp`
- Anthropic 系：`AnthropicAI`, `claudeai`, `alexalbert__`
- Google 系：`GoogleDeepMind`, `sundarpichai`
- 国内头部：DeepSeek, 阿里通义 Qwen, 月之暗面 Kimi, 智谱 GLM, MiniMax
- Meta: `AIatMeta`, `ylecun`

**行业领袖与研究者** — 高优先级，他们的观点和判断有前瞻价值：
- `karpathy`, `sama`, `AndrewYNg`, `ylecun`

**高优媒体/创作者** — 中高优先级，内容质量稳定：
- 英文：`ycombinator`, `a16z`, `LennysPodcast`, `GergelyOrosz`, `lexfridman`, `TheRundownAI`
- 中文：宝玉 (`vista8`/`dotey`), `HiTw93`, `xicilion`, 张小珺，Latent Space, Founder Park

**Builder/独立开发者** — 中优先级，实践经验有参考价值：
- `levelsio`, `garrytan`, `pmarca`, `gregisenberg`

注意：上面列出的用户名是已知的参考示例。匹配时应同时检查 `author.userName` 和 `author.name`（显示名称可能包含公司/产品名）。国内厂商账号的 handle 可能不固定，优先通过 `author.name` 中包含的关键词（如 "DeepSeek", "Qwen", "Kimi", "智谱", "MiniMax"）匹配。不在列表中的账号按默认权重处理。

### 2. 内容主题加权

以下关键词出现在推文文本中时提升优先级：

**AI Coding（高加权）**: Claude Code, Codex, Cursor, Windsurf, Copilot, vibe coding, AI coding, agentic coding

**新模型/新产品发布（高加权）**: launching, introducing, announcing, releasing, now available, 发布，上线，开源

**方法论/深度实践（中加权）**: best practice, lesson learned, how I, architecture, framework, 实践，经验，方法论

### 3. 基础影响力

`influenceScore` 作为基础分，但不是唯一决定因素。一条来自 Anthropic 的 influenceScore=200 的产品发布，应排在一条无关账号的 influenceScore=2000 的热门段子前面。

## 排序逻辑

```
综合分 = influenceScore * 来源权重系数 * 主题加权系数
```

参考权重系数：
- 头部厂商官方：5x
- 行业领袖：3x
- 高优媒体：2x
- Builder/独立开发者: 1.5x
- 其他：1x

主题加权：
- AI Coding 相关：2x
- 新发布/新产品：1.8x
- 方法论/实践：1.3x
- 其他：1x

## 同话题去重

多条推文讨论同一话题（如多人转发评论同一事件）时，保留综合分最高的一条，在描述中可提及其他来源的视角。

**常见同话题场景**：
- 同一产品发布，多个账号转发评论 → 保留官方账号或最权威来源
- 同一新闻事件，多个媒体报导 → 保留影响力最高或最详细的一条
- 同一 meme/梗图被广泛传播 → 保留原始发布者或互动最高的一条

**AI 判断提示**：在生成简报时，AI 应识别并合并同一话题的多条推文，避免重复占用头条位置。

## 内容质量人工判断

算法排序基于互动量和来源权重，但**内容质量需要人工判断**：

**高互动但低价值的内容**（可能排在前列但不应作为头条）：
- 调侃/段子性质的对比推文（如 "Chipotle 机器人免费 vs Claude Code"）
- 情绪煽动性内容（如 "SHOCKING: AI 变 evil"）
- 纯娱乐性质的 viral 内容

**头条选择建议**：
- 优先选择产品发布、技术突破、重要观点等实质性内容
- 对于调侃类高互动推文，可放入"值得关注"或"快速浏览"部分
- 在生成简报时，AI 应识别内容类型并调整排序
