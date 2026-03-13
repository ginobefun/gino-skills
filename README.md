# Gino Skills

个人 Claude Code Skills 集合，服务于 [Content OS](docs/content-os-plan-v2.md) 个人内容操作系统。

## Skills 列表

### BestBlogs

| Skill | 功能 | 技术 | 状态 |
|-------|------|------|------|
| [bestblogs-fetcher](skills/bestblogs-fetcher/) | 从 BestBlogs.dev OpenAPI 拉取文章、播客、视频、推文和期刊内容 | REST API | ✅ 已完成 |
| [bestblogs-article-recommender](skills/bestblogs-article-recommender/) | 为内容生成中英文推荐语并可更新到系统 | OpenAPI + Admin API + AI 写作 | ✅ 已完成 |
| [bestblogs-transcribe-youtube](skills/bestblogs-transcribe-youtube/) | 通过 Gemini Gem 转写 YouTube 视频为 Markdown 文字稿 | Chrome AppleScript + Gemini Web API | ✅ 已完成 |
| [bestblogs-process-videos](skills/bestblogs-process-videos/) | 批量转录等待预处理的视频并更新内容到 BestBlogs | 复合工作流 (Admin API + Gemini 转录) | ✅ 已完成 |
| [bestblogs-weekly-curator](skills/bestblogs-weekly-curator/) | 从本周内容中精选 20 篇文章，基于原文生成中英文周刊推荐语 | REST API + AI 筛选 + 原文分析 | ✅ 已完成 |
| [bestblogs-weekly-blogger](skills/bestblogs-weekly-blogger/) | 从周刊生成图文并茂的博客文章 | REST API + 图片生成 + R2 上传 | ✅ 已完成 |
| [bestblogs-daily-digest](skills/bestblogs-daily-digest/) | 每日早报：智能筛选 Top 10 内容，生成纯文本/杂志风 HTML/信息图海报 | REST API + AI 筛选 + image-gen | ✅ 已完成 |
| [bestblogs-content-reviewer](skills/bestblogs-content-reviewer/) | 内容评分 Review + 推荐阅读清单（200 条筛选，分层推荐 20-30 条） | Admin API + AI 评审 | ✅ 已完成 |
| [bestblogs-add-source](skills/bestblogs-add-source/) | 从文本或 OPML 提取 RSS 地址，批量添加订阅源到 BestBlogs | Admin API | ✅ 已完成 |

### Twitter/X — 数据读取

通过 XGo (xgo.ing) 开放接口读取 Twitter/X 数据。

| Skill | 功能 | 状态 |
|-------|------|------|
| [xgo-fetch-tweets](skills/xgo-fetch-tweets/) | 拉取推文（关注者时间线、推荐、列表、标签、收藏） | ✅ 已完成 |
| [xgo-search-tweets](skills/xgo-search-tweets/) | 实时搜索推文、获取用户最新推文 | ✅ 已完成 |
| [xgo-view-profile](skills/xgo-view-profile/) | 查看用户资料及近期动态 | ✅ 已完成 |

### Twitter/X — 数据管理

通过 XGo 开放接口管理关注、列表、收藏等。

| Skill | 功能 | 状态 |
|-------|------|------|
| [xgo-manage-follows](skills/xgo-manage-follows/) | 管理关注列表（查看、刷新、统计、推荐关注/取关） | ✅ 已完成 |
| [xgo-manage-lists](skills/xgo-manage-lists/) | 管理 Twitter 列表（创建、编辑、添加/移除成员） | ✅ 已完成 |
| [xgo-manage-bookmarks](skills/xgo-manage-bookmarks/) | 管理收藏（创建收藏夹、收藏/取消收藏推文） | ✅ 已完成 |

### Twitter/X — AI 分析工作流

将多个 API 调用 + AI 分析编排成完整使用场景。

| Skill | 功能 | 复杂度 | 状态 |
|-------|------|--------|------|
| [xgo-track-kol](skills/xgo-track-kol/) | KOL 深度分析（6 维度 AI 报告 + 双用户对比） | 4 请求 → AI 分析 | ✅ 已完成 |
| [xgo-digest-tweets](skills/xgo-digest-tweets/) | 每日推文简报（智能筛选 + 4 种输出：可读简报/杂志风 HTML/信息图/完整版） | 5 请求 → 分类去重 → 智能筛选 Top 20 → 多格式输出 | ✅ 已完成 |
| [xgo-organize-follows](skills/xgo-organize-follows/) | 关注整理助手（6 阶段交互式工作流） | 多阶段 → AI 匹配 → 批量执行 | ✅ 已完成 |

### Twitter/X — 浏览器操作

通过 Chrome CDP 在 Twitter/X 上执行写操作，使用真实浏览器绕过反自动化检测。

| Skill | 功能 | 技术 | 状态 |
|-------|------|------|------|
| [x-actions](skills/x-actions/) | 发推、回复、引用、转推、点赞 | Chrome CDP + TypeScript | ✅ 已完成 |

### 图片生成

基于 [baoyu-skills](https://github.com/JimLiu/baoyu-skills) 的图片生成技能，fork 到本项目以便定制水印、风格等。

| Skill | 功能 | 技术 | 状态 |
|-------|------|------|------|
| [image-gen](skills/image-gen/) | AI 图片生成引擎，支持多 provider | Google Gemini / OpenAI / DashScope / Replicate API | ✅ 已完成 |
| [cover-image](skills/cover-image/) | 文章封面图生成（5 维度定制） | image-gen + 提示词模板 | ✅ 已完成 |
| [article-illustrator](skills/article-illustrator/) | 文章配图生成（类型 x 风格） | image-gen + 内容分析 | ✅ 已完成 |

### 内容发布

基于 [baoyu-skills](https://github.com/JimLiu/baoyu-skills) 的发布技能，fork 到本项目以便定制。

| Skill | 功能 | 技术 | 状态 |
|-------|------|------|------|
| [post-to-x](skills/post-to-x/) | 发布内容到 Twitter/X（推文、长文 Article） | Chrome CDP + 真实键盘粘贴 | ✅ 已完成 |
| [post-to-wechat](skills/post-to-wechat/) | 发布内容到微信公众号（文章、图文） | WeChat API / Chrome CDP | ✅ 已完成 |
| [send-wechat-group-message](skills/send-wechat-group-message/) | 发送消息到微信群（文本、图片，支持多群） | REST API | ✅ 已完成 |

### 图片生成典型使用场景

| 场景 | 说法示例 | 触发的 Skill |
|------|----------|-------------|
| 生成文章封面 | "生成一张封面图"、"create a cover image" | cover-image |
| 为文章配图 | "给文章配插图"、"illustrate this article" | article-illustrator |
| 通用图片生成 | "生成一张图片"、"generate an image" | image-gen |
| 指定风格生成 | "用水彩风格画一张图" | image-gen |
| 批量文章配图 | "给这篇文章的每个章节配图" | article-illustrator |

### 内容发布典型使用场景

| 场景 | 说法示例 | 触发的 Skill |
|------|----------|-------------|
| 发布长文到 X | "把这篇文章发到推特"、"publish to X" | post-to-x |
| 发推文带图片 | "发推并附上截图" | post-to-x |
| 引用转发 | "引用这条推文并评论" | post-to-x |
| 发布到微信公众号 | "发布到公众号"、"post to wechat" | post-to-wechat |
| 微信图文消息 | "发布图文到公众号" | post-to-wechat |
| 推送消息到微信群 | "发到微信群"、"推送到群"、"群发消息" | send-wechat-group-message |

### 组合发布场景

| 场景 | 流程 | 涉及的 Skills |
|------|------|--------------|
| 周刊博客全流程 | 策展周刊 → 生成博客 → 配图 → 上传 R2 → 发布推特/公众号 | bestblogs-weekly-curator → bestblogs-weekly-blogger → image-gen → post-to-x / post-to-wechat |
| 每日早报 + 分发 | 生成早报 → 发布到群聊/公众号/X | bestblogs-daily-digest → send-wechat-group-message / post-to-wechat / post-to-x |
| 文章配图后发布 | 生成配图 → 发布到公众号 | article-illustrator → post-to-wechat |
| 封面 + 发布 | 生成封面 → 发布长文到 X | cover-image → post-to-x |

### 深度阅读

| Skill | 功能 | 技术 | 状态 |
|-------|------|------|------|
| [deep-reading](skills/deep-reading/) | 通过 15+ 思维框架（SCQA、MECE、批判性思维、第一性原理、系统思维、哲学/历史视角等）深度分析文章，输出思维导图、费曼检验、元认知反思和个性化建议 | Jina Reader + 多层框架按需加载 | ✅ 已完成 |

### 深度阅读典型使用场景

| 场景 | 说法示例 | 分析级别 |
|------|----------|----------|
| 深度分析一篇文章 | "深度阅读这篇文章 https://..."、"分析这篇文章" | Level 3（默认） |
| 快速理解要点 | "快速分析一下这篇 Level 1"、"帮我快速抓重点" | Level 1 |
| 批判性审视论证 | "帮我批判性分析这篇论文" | Level 2+ |
| 学术级多源研究 | "Level 4 研究一下这个话题"、"对比分析这几篇文章" | Level 4 |
| 指定框架分析 | "用第一性原理分析"、"用六顶帽分析"、"MECE 检查一下" | 按需 |
| 粘贴内容直接分析 | 直接粘贴文章内容 + "深度阅读" | Level 3（默认） |

### Content OS

| Skill | 功能 | 状态 |
|-------|------|------|
| [daily-content-curator](skills/daily-content-curator/) | 个人多维度评分，输出分层阅读清单（必读/推荐/备选） | ✅ 已完成 |
| [reading-workflow](skills/reading-workflow/) | 每日阅读引导 + 思考反馈 + 创作素材收集 | ✅ 已完成 |
| [content-synthesizer](skills/content-synthesizer/) | 多平台内容生成（博客/推文/公众号/小红书/即刻/知乎） | ✅ 已完成 |
| [content-analytics](skills/content-analytics/) | 阅读数据分析 → 内容策略反馈闭环 | ✅ 已完成 |

## Twitter/X 典型使用场景

> 以下场景展示各 skill 的独立用途和协作方式。直接用自然语言告诉 Claude 你想做什么即可触发。

### 日常信息获取

| 场景 | 说法示例 | 触发的 Skill |
|------|----------|-------------|
| 看今天的推文精华 | "今日简报"、"每日推文摘要"、"推文日报" | xgo-digest-tweets |
| 看关注者时间线最新推文 | "拉取最新推文"、"我的时间线" | xgo-fetch-tweets |
| 搜索特定话题的推文 | "搜一下关于 AI Agent 的推文" | xgo-search-tweets |
| 查看某列表的推文 | "看一下 AI 列表的推文" | xgo-fetch-tweets |

### 用户研究

| 场景 | 说法示例 | 触发的 Skill |
|------|----------|-------------|
| 查看某人资料 | "看看 @elonmusk 的资料" | xgo-view-profile |
| 深度分析一个 KOL | "分析一下 @karpathy" | xgo-track-kol |
| 对比两个博主 | "对比 @sama 和 @elonmusk" | xgo-track-kol |
| 查看某人最新推文 | "看看 @naval 最近发了什么" | xgo-search-tweets |

### 关注列表管理

| 场景 | 说法示例 | 触发的 Skill |
|------|----------|-------------|
| 查看我关注了谁 | "我的关注列表"、"关注统计" | xgo-manage-follows |
| 获取推荐关注/取关 | "推荐关注"、"清理关注" | xgo-manage-follows |
| 整理未分类的关注用户 | "整理关注"、"自动分类" | xgo-organize-follows |
| 管理 Twitter 列表 | "创建列表"、"添加到列表" | xgo-manage-lists |
| 管理收藏 | "收藏这条推文"、"创建收藏夹" | xgo-manage-bookmarks |

### 发布与互动

| 场景 | 说法示例 | 触发的 Skill |
|------|----------|-------------|
| 发一条推文 | "帮我发推"、"发条推文" | x-actions |
| 带图片发推 | "发推并附上这张截图" | x-actions |
| 回复某条推文 | "回复这条推文" | x-actions |
| 引用转发 | "引用这条并评论" | x-actions |
| 转推 | "转推这条" | x-actions |
| 点赞 | "点赞这条推文" | x-actions |

### 组合场景

以下是跨 skill 协作的高级用法：

| 场景 | 流程 | 涉及的 Skills |
|------|------|--------------|
| 发现并关注优质博主 | 搜索话题 → 分析 KOL → 确认关注 | xgo-search-tweets → xgo-track-kol → xgo-manage-follows |
| 每日简报 + 互动 | 看今日精华 → 点赞/回复有价值的推文 | xgo-digest-tweets → x-actions |
| 每日简报 + 分发 | 生成推文日报 → 发布到 X/公众号 | xgo-digest-tweets → post-to-x / post-to-wechat |
| 整理关注 + 列表归类 | 推荐取关 → 整理分类 → 归入列表 | xgo-manage-follows → xgo-organize-follows |
| 调研后引用转发 | 查看用户资料 → 看最新推文 → 引用评论 | xgo-view-profile → xgo-search-tweets → x-actions |

## 每日内容工作流（Content OS）

> 以下是围绕 BestBlogs + Content OS skills 的完整每日工作流，从内容预处理到阅读、创作、分发的全链路。

### 工作流全景

```
7:00  process-videos ──→ 视频转录入库 ──→ 触发 AI 分析
                                              ↓
8:00  content-reviewer ──→ 评分 review ──→ 推荐阅读清单（20-30 条）
         ↓                                    ↓
8:30  人工调分                          deep-reading（逐篇深度分析）
                                              ↓
                                     content-synthesizer（多平台内容生成）
                                        ↓        ↓        ↓
                                    post-to-x  post-to-wechat  blog

9:30  daily-digest ──→ 早报生成 ──→ send-wechat-group + post-to-x + post-to-wechat
```

### Step 1: 视频预处理（7:00）

批量转录等待预处理的 YouTube 视频，更新内容到 BestBlogs 并触发 AI 分析。

| 说法示例 | 行为 | 涉及的 Skill |
|----------|------|--------------|
| "处理全部视频" | 查询待处理视频 → 全部转录（跳过确认） | bestblogs-process-videos |
| "处理前 10 个视频" | 查询待处理视频 → 取前 10 个转录 | bestblogs-process-videos |
| "处理视频" | 查询并展示列表 → 等待选择 | bestblogs-process-videos |

### Step 2: 内容评审 + 推荐阅读（8:00）

评审 200 条待 review 内容的 AI 评分，纠正偏差，并从中筛选 20-30 条值得阅读的内容。

| 说法示例 | 行为 | 涉及的 Skill |
|----------|------|--------------|
| "每日 review" / "review 并推荐阅读" | 拉取待审内容 → AI 评审分类 → 输出评分统计 + review 表格 + 推荐阅读清单（分必读/推荐/可选三层） | bestblogs-content-reviewer |
| "第 3 条评分调到 85" / "把第 5 条标记为不合格" | 调整分类或评分 → 批量执行 markNotQualified | bestblogs-content-reviewer |
| "学习偏好" / "分析评分规律" | 分析历史精选/非精选特征 → 输出偏好模型 | bestblogs-content-reviewer |

**输出内容**:
- 评分统计概览（分数分布、领域分布、偏差占比）
- Review 表格（按 🌟推荐阅读 / ⬇️偏高 / ⬆️偏低 / ✅合理 分组）
- 推荐阅读清单（🔥必读 3-5 篇 / ⭐推荐 8-12 篇 / 📌可选 5-8 篇 / 🐦推特 5-10 条）

### Step 3: 深度阅读 + 内容创作（8:30）

对推荐阅读清单中的内容进行深度分析，提取洞察，生成多平台分享内容。

| 说法示例 | 行为 | 涉及的 Skill |
|----------|------|--------------|
| "深度阅读 https://..." | 15+ 思维框架深度分析单篇文章 | deep-reading |
| "开始阅读" / "继续阅读" | 加载推荐清单 → 逐篇引导阅读 → 收集创作素材 | reading-workflow |
| "基于刚才的分析写推文和博客" | 多平台内容生成 → 审阅修改 → 发布 | content-synthesizer |
| "发布到推特" / "发到公众号" | 调用对应平台发布 | post-to-x / post-to-wechat |

**深度阅读 → 创作 → 发布的典型串联**:
```
深度阅读一篇文章 → 获得分析洞察
    → "基于这篇文章写推文" → content-synthesizer 生成推文
    → "发布到推特" → post-to-x 发布
    → "也写一篇公众号文章" → content-synthesizer 生成
    → "发到公众号" → post-to-wechat 发布
```

### Step 4: 生成早报 + 分发（9:30）

基于当日已更新评分的内容，生成 BestBlogs 每日早报，分发到多个渠道。

| 说法示例 | 行为 | 涉及的 Skill |
|----------|------|--------------|
| "生成今日早报" / "每日早报" | 智能筛选 Top 10 → 生成纯文本 + 杂志风 HTML + 海报 | bestblogs-daily-digest |
| "把早报发到微信群" | 推送早报到指定微信群 | send-wechat-group-message |
| "早报发到推特" | 发布早报精华推文 | post-to-x |
| "早报发到公众号" | 发布早报到微信公众号 | post-to-wechat |

### Skills 依赖关系

| Skill | 上游输入 | 下游输出 |
|-------|----------|----------|
| bestblogs-process-videos | BestBlogs 待处理视频 | 转录内容入库 → 触发 AI 分析 |
| bestblogs-content-reviewer | BestBlogs 待审内容 | 评分调整 + 推荐阅读清单 |
| deep-reading | 文章 URL 或推荐清单 | 深度分析结果 |
| reading-workflow | 推荐阅读清单 / URL 列表 | 阅读笔记 + 创作素材 (materials.md) |
| content-synthesizer | deep-reading 分析 / 素材清单 | 多平台内容 → post-to-x / post-to-wechat |
| bestblogs-daily-digest | BestBlogs 高分内容 | 早报 → send-wechat-group / post-to-x / post-to-wechat |

## 安装

将 skill 目录符号链接到 `~/.claude/skills/`：

```bash
# 单个安装
ln -sf /path/to/gino-skills/skills/xgo-fetch-tweets ~/.claude/skills/xgo-fetch-tweets

# 批量安装所有 skills
for d in /path/to/gino-skills/skills/*/; do
  ln -sf "$d" ~/.claude/skills/$(basename "$d")
done
```

## 环境变量

| 变量 | 用途 | 所需 Skill |
|------|------|-----------|
| `BESTBLOGS_API_KEY` | BestBlogs OpenAPI 鉴权 | bestblogs-fetcher, bestblogs-article-recommender, bestblogs-daily-digest |
| `XGO_API_KEY` | XGo (xgo.ing) 开放接口鉴权 | 所有 xgo-* skills |
| `BESTBLOGS_ADMIN_USER_ID` | BestBlogs 管理员用户 ID | bestblogs-process-videos, bestblogs-article-recommender, bestblogs-add-source |
| `BESTBLOGS_ADMIN_JWT_TOKEN` | BestBlogs 管理员 JWT Token | bestblogs-process-videos, bestblogs-article-recommender, bestblogs-add-source |
| `X_CHROME_PATH` | Chrome 可执行文件路径（可选，自动检测） | x-actions |
| `GOOGLE_API_KEY` | Google Gemini API Key | image-gen, cover-image, article-illustrator |
| `OPENAI_API_KEY` | OpenAI API Key（可选） | image-gen |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare 账号 ID | bestblogs-weekly-blogger (R2 上传) |
| `R2_ACCESS_KEY_ID` | R2 访问密钥 | bestblogs-weekly-blogger (R2 上传) |
| `R2_SECRET_ACCESS_KEY` | R2 访问密钥 | bestblogs-weekly-blogger (R2 上传) |
| `R2_BUCKET_NAME` | R2 存储桶名称 | bestblogs-weekly-blogger (R2 上传) |
| `R2_PUBLIC_URL` | R2 公开访问 URL | bestblogs-weekly-blogger (R2 上传) |
| `WECHAT_APP_ID` | 微信公众号 App ID | post-to-wechat |
| `WECHAT_APP_SECRET` | 微信公众号 App Secret | post-to-wechat |
| `WECHAT_BOT_HOST` | 微信群消息代理接口地址 | send-wechat-group-message |
| `WECHAT_BOT_API_KEY` | 微信群消息代理 API 密钥 | send-wechat-group-message |

## 相关项目

- [XGo](https://xgo.ing) - Twitter/X 数据管理平台
- [BestBlogs.dev](https://bestblogs.dev) - AI 驱动的技术内容精选平台
- [baoyu-skills](https://github.com/JimLiu/baoyu-skills) - 内容创作与分发 Skills（复用）
