# Gino Skills

个人 Claude Code Skills 集合，服务于 [Content OS](docs/content-os-plan-v2.md) 个人内容操作系统。

## Skills 列表

### BestBlogs

| Skill | 功能 | 技术 | 状态 |
|-------|------|------|------|
| [bestblogs-fetcher](skills/bestblogs-fetcher/) | 从 BestBlogs.dev OpenAPI 拉取文章、播客、视频、推文和期刊内容 | REST API | ✅ 已完成 |
| [bestblogs-transcribe-youtube](skills/bestblogs-transcribe-youtube/) | 通过 Gemini Gem 转写 YouTube 视频为 Markdown 文字稿 | Chrome AppleScript + Gemini Web API | ✅ 已完成 |
| [bestblogs-process-videos](skills/bestblogs-process-videos/) | 批量转录等待预处理的视频并更新内容到 BestBlogs | 复合工作流 (Admin API + Gemini 转录) | ✅ 已完成 |
| [bestblogs-weekly-curator](skills/bestblogs-weekly-curator/) | 从本周内容中精选 20 篇文章生成周刊 | REST API + AI 筛选 | ✅ 已完成 |
| [bestblogs-weekly-blogger](skills/bestblogs-weekly-blogger/) | 从周刊生成图文并茂的博客文章 | REST API + 图片生成 + R2 上传 | ✅ 已完成 |

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
| [xgo-digest-tweets](skills/xgo-digest-tweets/) | 每日推文简报（按列表分类 + AI 摘要） | 5 请求 → 分类去重 → AI 摘要 | ✅ 已完成 |
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

### 组合发布场景

| 场景 | 流程 | 涉及的 Skills |
|------|------|--------------|
| 周刊博客全流程 | 策展周刊 → 生成博客 → 配图 → 上传 R2 → 发布推特/公众号 | bestblogs-weekly-curator → bestblogs-weekly-blogger → image-gen → post-to-x / post-to-wechat |
| 文章配图后发布 | 生成配图 → 发布到公众号 | article-illustrator → post-to-wechat |
| 封面+发布 | 生成封面 → 发布长文到 X | cover-image → post-to-x |

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

### Content OS（计划中）

| Skill | 功能 | 状态 |
|-------|------|------|
| daily-content-curator | 每日智能筛选 & 排序生成阅读清单 | 📋 计划中 |
| reading-workflow | 每日阅读 + 思考引导工作流 | 📋 计划中 |
| content-analytics | 数据回收与分析 | 📋 计划中 |

## Twitter/X 典型使用场景

> 以下场景展示各 skill 的独立用途和协作方式。直接用自然语言告诉 Claude 你想做什么即可触发。

### 日常信息获取

| 场景 | 说法示例 | 触发的 Skill |
|------|----------|-------------|
| 看今天的推文精华 | "今日简报"、"每日推文摘要" | xgo-digest-tweets |
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

以下是跨 skill 协作的高级用法:

| 场景 | 流程 | 涉及的 Skills |
|------|------|--------------|
| 发现并关注优质博主 | 搜索话题 → 分析 KOL → 确认关注 | xgo-search-tweets → xgo-track-kol → xgo-manage-follows |
| 每日简报 + 互动 | 看今日精华 → 点赞/回复有价值的推文 | xgo-digest-tweets → x-actions |
| 整理关注 + 列表归类 | 推荐取关 → 整理分类 → 归入列表 | xgo-manage-follows → xgo-organize-follows |
| 调研后引用转发 | 查看用户资料 → 看最新推文 → 引用评论 | xgo-view-profile → xgo-search-tweets → x-actions |

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
| `BESTBLOGS_API_KEY` | BestBlogs OpenAPI 鉴权 | bestblogs-fetcher |
| `XGO_API_KEY` | XGo (xgo.ing) 开放接口鉴权 | 所有 xgo-* skills |
| `BESTBLOGS_ADMIN_USER_ID` | BestBlogs 管理员用户 ID | bestblogs-process-videos |
| `BESTBLOGS_ADMIN_JWT_TOKEN` | BestBlogs 管理员 JWT Token | bestblogs-process-videos |
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

## 相关项目

- [XGo](https://xgo.ing) - Twitter/X 数据管理平台
- [BestBlogs.dev](https://bestblogs.dev) - AI 驱动的技术内容精选平台
- [baoyu-skills](https://github.com/JimLiu/baoyu-skills) - 内容创作与分发 Skills（复用）
