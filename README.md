# Gino Skills

个人 Claude Code Skills 集合，服务于 [Content OS](docs/content-os-plan-v2.md) 个人内容操作系统。

> **41 个 Skills** 覆盖从内容获取、筛选、阅读、创作到多渠道分发的完整链路。

## Skills 总览

```
┌─────────────────────────────────────────────────────────────────────┐
│                   Content OS - 个人内容操作系统                       │
├──────────┬──────────┬──────────┬──────────┬─────────────────────────┤
│  ① 输入  │  ② 筛选  │ ③ 阅读   │ ④ 创作   │  ⑤ 分发 & 反馈          │
│  & 预处理│  & 评审  │ & 思考   │ & 生成   │                         │
├──────────┼──────────┼──────────┼──────────┼─────────────────────────┤
│bestblogs │content   │deep      │content   │post-to-x               │
│-fetcher  │-reviewer │-reading  │-synthe   │post-to-wechat           │
│xgo-fetch │daily     │reading   │-sizer    │send-wechat-group        │
│-tweets   │-content  │-workflow │create    │x-actions                │
│xgo-search│-curator  │          │-podcast  │bili-actions              │
│-tweets   │          │          │create    │xhs-actions               │
│bili-fetch│          │          │-video    │content-analytics        │
│-content  │          │          │image-gen │                         │
│xhs-fetch │          │          │          │                         │
│-content  │          │          │          │                         │
└──────────┴──────────┴──────────┴──────────┴─────────────────────────┘
```

---

## 一、BestBlogs 内容平台 Skills (12 个)

从 [BestBlogs.dev](https://bestblogs.dev) 获取、处理、策展、生成内容。

### 数据获取与预处理

| Skill | 功能 | 技术 |
|-------|------|------|
| [bestblogs-fetcher](skills/bestblogs-fetcher/) | 拉取文章、播客、视频、推文、期刊内容 | REST API |
| [bestblogs-add-source](skills/bestblogs-add-source/) | 从文本或 OPML 批量添加 RSS 订阅源 | Admin API |
| [bestblogs-process-videos](skills/bestblogs-process-videos/) | 批量转录待预处理视频并更新到系统 | Admin API + Gemini 转录 |
| [bestblogs-transcribe-youtube](skills/bestblogs-transcribe-youtube/) | 通过 Gemini Gem 转写单个 YouTube 视频 | Chrome AppleScript + Gemini |
| [bestblogs-process-articles](skills/bestblogs-process-articles/) | 批量获取文章正文、深度分析并更新，≥80 分自动翻译 | Admin API + AI 分析/翻译 |
| [bestblogs-process-tweets](skills/bestblogs-process-tweets/) | 按作者分组批量分析推文并更新 | Admin API + AI 分析 |

### 评审与策展

| Skill | 功能 | 技术 |
|-------|------|------|
| [bestblogs-content-reviewer](skills/bestblogs-content-reviewer/) | 评审 AI 评分、纠偏、输出推荐阅读清单 | Admin API + AI 评审 |
| [bestblogs-article-recommender](skills/bestblogs-article-recommender/) | 为内容生成中英文推荐语 | OpenAPI + AI 写作 |
| [bestblogs-weekly-curator](skills/bestblogs-weekly-curator/) | 精选本周 20 篇文章，生成中英文周刊 | REST API + AI 筛选 |

### 内容生成

| Skill | 功能 | 技术 |
|-------|------|------|
| [bestblogs-daily-digest](skills/bestblogs-daily-digest/) | 每日早报：Top 10 内容 → 纯文本 + 杂志风 HTML + 海报 | REST API + image-gen |
| [bestblogs-weekly-blogger](skills/bestblogs-weekly-blogger/) | 从周刊生成图文并茂的博客文章 | REST API + image-gen + R2 |

---

## 二、Twitter/X 数据 Skills (10 个)

通过 [XGo](https://xgo.ing) 开放接口操作 Twitter/X 数据。

### 数据读取 (3 个)

| Skill | 功能 |
|-------|------|
| [xgo-fetch-tweets](skills/xgo-fetch-tweets/) | 拉取推文（关注者时间线、推荐、列表、标签、收藏） |
| [xgo-search-tweets](skills/xgo-search-tweets/) | 实时搜索推文、获取用户最新推文 |
| [xgo-view-profile](skills/xgo-view-profile/) | 查看用户资料及近期动态（DB 缓存 + 实时） |

### 数据管理 (3 个)

| Skill | 功能 |
|-------|------|
| [xgo-manage-follows](skills/xgo-manage-follows/) | 管理关注（查看、刷新、统计、推荐关注/取关） |
| [xgo-manage-lists](skills/xgo-manage-lists/) | 管理列表（创建、编辑、添加/移除成员） |
| [xgo-manage-bookmarks](skills/xgo-manage-bookmarks/) | 管理收藏（创建收藏夹、收藏/取消收藏推文） |

### AI 分析工作流 (3 个)

| Skill | 功能 | 复杂度 |
|-------|------|--------|
| [xgo-track-kol](skills/xgo-track-kol/) | KOL 深度分析（6 维度报告 + 双用户对比） | 4 请求 → AI 分析 |
| [xgo-digest-tweets](skills/xgo-digest-tweets/) | 每日推文简报（Top 20 → 简报/HTML/信息图/完整版） | 5 请求 → 分类去重 → 多格式 |
| [xgo-organize-follows](skills/xgo-organize-follows/) | 关注整理（6 阶段交互式工作流：发现 → AI 分类 → 执行） | 多阶段 → AI 匹配 → 批量执行 |

### 浏览器操作 (1 个)

| Skill | 功能 | 技术 |
|-------|------|------|
| [x-actions](skills/x-actions/) | 发推、回复、引用、转推、点赞 | Chrome CDP + TypeScript |

---

## 三、内容创作 Skills (7 个)

### 深度阅读与思考

| Skill | 功能 | 技术 |
|-------|------|------|
| [deep-reading](skills/deep-reading/) | 15+ 思维框架深度分析（SCQA、MECE、第一性原理、系统思维等） | Jina Reader + 多层框架 |

### 图片生成

| Skill | 功能 | 技术 |
|-------|------|------|
| [image-gen](skills/image-gen/) | AI 图片生成引擎，支持多 provider | Google / OpenAI / DashScope / Replicate |
| [cover-image](skills/cover-image/) | 文章封面图（5 维度定制：类型 × 调色盘 × 渲染 × 文字 × 情绪） | image-gen + 提示词模板 |
| [article-illustrator](skills/article-illustrator/) | 文章配图（分析结构 → 自动定位 → 类型 × 风格生成） | image-gen + 内容分析 |

### 多媒体生成

| Skill | 功能 | 技术 |
|-------|------|------|
| [create-podcast](skills/create-podcast/) | 将任意内容转化为播客音频 MP3（克隆声音独白式） | Fish.audio TTS + 脚本编排 |
| [create-video](skills/create-video/) | 将任意内容转化为短视频 MP4 | TTS + 视频渲染 |

---

## 四、内容分发 Skills (3 个)

| Skill | 功能 | 技术 |
|-------|------|------|
| [post-to-x](skills/post-to-x/) | 发布到 Twitter/X（推文、图片、视频、长文 Article） | Chrome CDP |
| [post-to-wechat](skills/post-to-wechat/) | 发布到微信公众号（文章、图文） | WeChat API / Chrome CDP |
| [send-wechat-group-message](skills/send-wechat-group-message/) | 推送消息到微信群（文本、图片，支持多群） | REST API |

---

## 五、Content OS 编排 Skills (5 个)

编排每日内容全流程，通过 Daily Workspace (`contents/tmp/workspace/`) 共享中间数据。

| Skill | 功能 | 在流程中的位置 |
|-------|------|---------------|
| [daily-content-management](skills/daily-content-management/) | 每日内容全流程编排器（获取 → 选题 → 创作 → 分发） | 总控 |
| [daily-content-curator](skills/daily-content-curator/) | 跨 BestBlogs + Twitter 多维度评分，输出分层阅读清单 | ② 筛选 |
| [reading-workflow](skills/reading-workflow/) | 逐篇阅读引导 + 思考反馈 + 创作素材收集 | ③ 阅读 |
| [content-synthesizer](skills/content-synthesizer/) | 多平台内容生成（博客/推文/公众号/小红书/即刻/知乎） | ④ 创作 |
| [content-analytics](skills/content-analytics/) | X/Twitter 发布数据回收，周度/月度分析报告 | ⑤ 反馈 |

---

## 六、内容平台集成 Skills (4 个)

通过 CLI 工具操作 Bilibili 和小红书平台。

### Bilibili (2 个)

| Skill | 功能 | 技术 |
|-------|------|------|
| [bili-fetch-content](skills/bili-fetch-content/) | 获取B站内容（热门/排行/搜索/视频详情/字幕/AI摘要/评论/UP主） | bilibili-cli |
| [bili-actions](skills/bili-actions/) | B站互动操作（点赞/投币/三连/发布动态/取关） | bilibili-cli |

### 小红书 (2 个)

| Skill | 功能 | 技术 |
|-------|------|------|
| [xhs-fetch-content](skills/xhs-fetch-content/) | 获取小红书内容（搜索/热门/笔记详情/评论/用户/话题） | xiaohongshu-cli |
| [xhs-actions](skills/xhs-actions/) | 小红书互动操作（发布笔记/点赞/收藏/评论/关注） | xiaohongshu-cli |

---

## 典型使用场景

### 日常信息获取

| 说法示例 | 触发的 Skill |
|----------|-------------|
| "今日简报" / "每日推文摘要" | xgo-digest-tweets |
| "拉取最新推文" / "我的时间线" | xgo-fetch-tweets |
| "搜一下关于 AI Agent 的推文" | xgo-search-tweets |
| "生成今日早报" / "每日早报" | bestblogs-daily-digest |

### B站 & 小红书

| 说法示例 | 触发的 Skill |
|----------|-------------|
| "B站热门" / "bilibili trending" | bili-fetch-content |
| "搜B站视频" / "bili search" | bili-fetch-content |
| "这个视频的字幕" / "AI摘要" | bili-fetch-content |
| "给视频三连" / "B站点赞" | bili-actions |
| "搜小红书" / "xhs search" | xhs-fetch-content |
| "小红书热门" / "看看小红书" | xhs-fetch-content |
| "发小红书笔记" / "post to xhs" | xhs-actions |
| "小红书点赞" / "收藏笔记" | xhs-actions |

### 用户研究

| 说法示例 | 触发的 Skill |
|----------|-------------|
| "看看 @elonmusk 的资料" | xgo-view-profile |
| "分析一下 @karpathy" | xgo-track-kol |
| "对比 @sama 和 @elonmusk" | xgo-track-kol |

### 内容管理

| 说法示例 | 触发的 Skill |
|----------|-------------|
| "每日 review" / "review 并推荐阅读" | bestblogs-content-reviewer |
| "处理待分析的文章" / "翻译文章结果" | bestblogs-process-articles |
| "处理待分析的推文" | bestblogs-process-tweets |
| "处理全部视频" | bestblogs-process-videos |

### 深度阅读 → 创作 → 发布

```
"深度阅读 https://..."  →  deep-reading 分析
    → "基于这篇写推文"  →  content-synthesizer 生成
    → "发布到推特"       →  post-to-x 发布
    → "也写一篇公众号"   →  content-synthesizer 生成
    → "发到公众号"       →  post-to-wechat 发布
```

### 图片生成

| 说法示例 | 触发的 Skill |
|----------|-------------|
| "生成封面图" / "create a cover image" | cover-image |
| "给文章配插图" / "illustrate this article" | article-illustrator |
| "生成一张图片" / "generate an image" | image-gen |

### 多媒体生成

| 说法示例 | 触发的 Skill |
|----------|-------------|
| "把早报做成播客" / "生成播客" | create-podcast |
| "生成短视频" / "把这篇做成视频" | create-video |

### 组合工作流

| 场景 | 流程 |
|------|------|
| 周刊博客全流程 | weekly-curator → weekly-blogger → image-gen → post-to-x / post-to-wechat |
| 每日早报 + 分发 | daily-digest → send-wechat-group / post-to-x / post-to-wechat |
| 每日简报 + 互动 | digest-tweets → x-actions (点赞/回复) |
| 发现并关注博主 | search-tweets → track-kol → manage-follows |
| 整理关注 + 分类 | manage-follows → organize-follows |

---

## 每日内容工作流

```
7:00  process-videos ──→ 视频转录入库 ──→ 触发 AI 分析
                                              ↓
8:00  content-reviewer ──→ 评分 review ──→ 推荐阅读清单
         ↓                                    ↓
8:30  人工调分                          deep-reading → reading-workflow
                                              ↓
                                     content-synthesizer（多平台内容生成）
                                        ↓        ↓        ↓
                                    post-to-x  post-to-wechat  blog

9:30  daily-digest ──→ 早报生成 ──→ send-wechat-group + post-to-x + post-to-wechat
      digest-tweets ──→ 推文简报 ──→ 同上

晚间  content-analytics ──→ 数据回收 → 策略优化
```

---

## 安装

```bash
# 单个安装
ln -sf /path/to/gino-skills/skills/<skill-name> ~/.claude/skills/<skill-name>

# 批量安装所有 skills
for d in /path/to/gino-skills/skills/*/; do
  ln -sf "$d" ~/.claude/skills/$(basename "$d")
done
```

## 环境变量

| 变量 | 用途 | 所需 Skill |
|------|------|-----------|
| `BESTBLOGS_API_KEY` | BestBlogs OpenAPI 鉴权 | bestblogs-fetcher 及相关 skills |
| `BESTBLOGS_ADMIN_USER_ID` | BestBlogs 管理员用户 ID | bestblogs-process-*, bestblogs-add-source 等 |
| `BESTBLOGS_ADMIN_JWT_TOKEN` | BestBlogs 管理员 JWT Token | 同上 |
| `XGO_API_KEY` | XGo 开放接口鉴权 | 所有 xgo-* skills |
| `X_CHROME_PATH` | Chrome 路径（可选，自动检测） | x-actions, post-to-x |
| `GOOGLE_API_KEY` | Google Gemini API Key | image-gen, cover-image, article-illustrator |
| `OPENAI_API_KEY` | OpenAI API Key（可选） | image-gen |
| `FISH_API_KEY` | Fish.audio API Key | create-podcast, create-video |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare 账号 ID | bestblogs-weekly-blogger (R2) |
| `R2_ACCESS_KEY_ID` | R2 访问密钥 | bestblogs-weekly-blogger (R2) |
| `R2_SECRET_ACCESS_KEY` | R2 密钥 | bestblogs-weekly-blogger (R2) |
| `R2_BUCKET_NAME` | R2 存储桶名称 | bestblogs-weekly-blogger (R2) |
| `R2_PUBLIC_URL` | R2 公开 URL | bestblogs-weekly-blogger (R2) |
| `WECHAT_APP_ID` | 微信公众号 App ID | post-to-wechat |
| `WECHAT_APP_SECRET` | 微信公众号 App Secret | post-to-wechat |
| `WECHAT_BOT_HOST` | 微信群消息代理地址 | send-wechat-group-message |
| `WECHAT_BOT_API_KEY` | 微信群消息代理密钥 | send-wechat-group-message |

## 相关项目

- [XGo](https://xgo.ing) — Twitter/X 数据管理平台
- [BestBlogs.dev](https://bestblogs.dev) — AI 驱动的技术内容精选平台
- [baoyu-skills](https://github.com/JimLiu/baoyu-skills) — 内容创作与分发 Skills（部分 fork 定制）
- [bilibili-cli](https://github.com/jackwener/bilibili-cli) — Bilibili 命令行工具
- [xiaohongshu-cli](https://github.com/jackwener/xiaohongshu-cli) — 小红书命令行工具
- [twitter-cli](https://github.com/jackwener/twitter-cli) — Twitter/X 命令行工具

## License

MIT
