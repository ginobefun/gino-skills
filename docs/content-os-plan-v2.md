# Gino 的个人内容操作系统 (Content OS) 规划 v2

## 一、系统全景

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     Content OS - 个人内容操作系统                         │
├──────────┬──────────┬───────────┬───────────┬──────────────────────────┤
│  ① 输入  │  ② 筛选  │  ③ 阅读   │  ④ 输出   │  ⑤ 分发与反馈            │
│          │          │  & 思考   │  & 创作   │                          │
├──────────┼──────────┼───────────┼───────────┼──────────────────────────┤
│BestBlogs │ AI评分   │ 深度阅读  │ 素材生成  │ 多平台分发               │
│  API     │ +个人    │ 思考引导  │ 博客长文  │ 数据回收                 │
│xgo.ing   │  偏好    │ 观点提炼  │ 社媒适配  │ 策略优化                 │
│  API     │  筛选    │          │ 配图生成  │                          │
└──────────┴──────────┴───────────┴───────────┴──────────────────────────┘

Skills 来源:
  🟢 已有 (Gino 自有)    🔵 可复用 (baoyu-skills)    🟡 需新建
```

## 二、Skills 全景图

### 🟢 Gino 已有 Skills (4个)

| Skill | 功能 | 对应环节 |
|-------|------|---------|
| deep-reading-analyst | 10+ 思维模型深度阅读分析 | ③ 阅读&思考 |
| content-synthesizer | 内容转化为博客/社媒/可视化等格式 | ④ 输出&创作 |
| article-recommender | 生成三版本推荐语（标准/精炼/个人评论） | ④ 输出（周刊） |
| weekly-newsletter-writer | 双语周刊内容生成 | ④ 输出（周刊） |

### 🔵 baoyu-skills 可复用 (8个)

| Skill | 功能 | 对应环节 | 价值 |
|-------|------|---------|------|
| **baoyu-post-to-x** | 发布推文（文字/图片/长文章） | ⑤ 分发 | 直接发推特，支持文章模式 |
| **baoyu-post-to-wechat** | 发布微信公众号（贴图/文章模式） | ⑤ 分发 | 支持 Markdown 转公众号文章 |
| **baoyu-xhs-images** | 小红书信息图系列（1-10张卡片） | ④ 输出 | 风格×布局二维系统 |
| **baoyu-cover-image** | 文章封面图生成（5D系统） | ④ 输出 | 博客和公众号配图 |
| **baoyu-infographic** | 信息图生成 | ④ 输出 | 知识可视化 |
| **baoyu-slide-deck** | 演示文稿幻灯片生成 | ④ 输出 | 内容转演示 |
| **baoyu-article-illustrator** | 文章智能插图 | ④ 输出 | 自动分析+生成+插入 |
| **baoyu-danger-x-to-markdown** | 推特内容转 Markdown | ① 输入 | 推文内容结构化 |
| **baoyu-compress-image** | 图片压缩 | ⑤ 工具 | 发布前优化 |
| **baoyu-danger-gemini-web** | Gemini API (文本+图片生成) | 底层 | 图片生成后端 |

### 🟡 需要新建的 Skills (5个)

| Skill | 功能 | 对应环节 | 优先级 |
|-------|------|---------|--------|
| **bestblogs-fetcher** | BestBlogs API 数据拉取 | ① 输入 | P0 |
| **twitter-fetcher** | xgo.ing 推文拉取 | ① 输入 | P0 |
| **daily-content-curator** | 每日智能筛选 & 排序 | ② 筛选 | P0 |
| **reading-workflow** | 每日阅读 + 思考引导工作流 | ③ 阅读 | P1 |
| **content-analytics** | 数据回收与分析 | ⑤ 反馈 | P2 |

## 三、环节 → Skills 映射

### ① 输入环节

```
bestblogs-fetcher (新建)     → BestBlogs API 拉取文章/播客/推文
twitter-fetcher (新建)       → xgo.ing API 拉取推文
baoyu-x-to-markdown (复用)   → 推特内容结构化转 Markdown
```

### ② 筛选环节

```
daily-content-curator (新建)  → 多维度评分 + 个人偏好筛选 → 每日 10-20 条精选
```

### ③ 阅读&思考环节

```
reading-workflow (新建)       → 编排每日阅读流程
  └── deep-reading-analyst (已有) → 按需深度分析
```

### ④ 输出&创作环节

```
content-synthesizer (已有)    → 核心: 阅读笔记 → 多格式内容
article-recommender (已有)    → 推荐语生成
weekly-newsletter-writer (已有) → 周刊生成

baoyu-xhs-images (复用)      → 小红书卡片生成
baoyu-cover-image (复用)     → 封面图/配图
baoyu-infographic (复用)     → 信息图
baoyu-article-illustrator (复用) → 文章自动配图
baoyu-slide-deck (复用)      → 演示文稿（按需）
```

### ⑤ 分发&反馈环节

```
baoyu-post-to-x (复用)       → 推特发布
baoyu-post-to-wechat (复用)  → 公众号发布
baoyu-compress-image (复用)  → 发布前图片压缩

content-analytics (新建)     → 数据回收 + 分析报告

小红书/即刻/知乎 → 暂时手动发布（内容由 content-synthesizer 生成）
```

## 四、每日工作流编排（更新版）

### 🌅 早间自动化 (5:00 AM 定时触发)

```
Step 1: bestblogs-fetcher
        → 拉取过去 12h 的新文章/播客/推文

Step 2: twitter-fetcher
        → 拉取关注者最新推文
        → baoyu-x-to-markdown 将精彩推文结构化

Step 3: daily-content-curator
        → 合并 Step 1 + 2 的内容
        → AI评分 + 个人偏好筛选
        → 去重合并同主题内容
        → 输出"早间阅读清单" (10-15条)
```

### 📖 早间阅读 (7:00 AM 手动触发)

```
Step 4: reading-workflow 引导逐篇阅读
        ├── 展示摘要 + 关键信息
        ├── deep-reading-analyst 深度分析（对重点文章）
        ├── 引导性提问 → 记录个人思考
        └── 汇总素材清单

Step 5: 快速输出（可选）
        → 基于早间阅读的 1-2 条即时思考
        → content-synthesizer → 推特短文
        → baoyu-post-to-x 发布
```

### 🌆 晚间自动化 (5:00 PM 定时触发)

```
Step 6: bestblogs-fetcher + twitter-fetcher
        → 拉取下午的新内容

Step 7: daily-content-curator
        → 输出"晚间阅读清单" (5-10条)
```

### 📖 晚间阅读 + 创作 (7:00 PM 手动触发)

```
Step 8:  reading-workflow → 晚间阅读 + 思考

Step 9:  daily-content-producer 批量内容生产
         ├── content-synthesizer → 核心内容生成
         │   ├── 博客长文 (1篇) → ginonotes.com
         │   ├── 推特素材 (5-8条)
         │   ├── 公众号文章 (1篇，可选)
         │   ├── 小红书笔记 (2-3条)
         │   ├── 即刻动态 (2-3条)
         │   └── 知乎文章 (1篇，可选)
         │
         ├── baoyu-cover-image → 博客/公众号封面
         ├── baoyu-article-illustrator → 文章内配图
         ├── baoyu-xhs-images → 小红书卡片
         └── baoyu-compress-image → 图片压缩优化

Step 10: 分发
         ├── baoyu-post-to-x → 推特发布
         ├── baoyu-post-to-wechat → 公众号发布
         └── 小红书/即刻/知乎 → 手动发布（复制内容）
```

### 📊 周度复盘 (每周日)

```
Step 11: content-analytics
         ├── 拉取各平台数据
         ├── 生成周度表现报告
         └── 策略优化建议

Step 12: weekly-newsletter-writer
         → 基于本周精选生成周刊
         → article-recommender 生成推荐语
```

## 五、新建 Skills 详细设计

### Skill 1: `bestblogs-fetcher` (P0)

```yaml
名称: bestblogs-fetcher
职责: 调用 BestBlogs OpenAPI 获取文章、播客、推文
触发: "拉取BestBlogs内容" / "获取最新文章" / 定时任务调用

核心功能:
  - 按时间范围获取内容 (24h/48h/7d)
  - 按分类筛选 (AI/编程/产品/商业)
  - 按评分范围筛选 (≥80分)
  - 获取文章/播客/推文详情
  - 支持分页遍历

输出格式:
  结构化 JSON/Markdown 列表，含:
  - 标题、链接、来源
  - AI评分、分类、标签
  - 一句话摘要
  - 发布时间

依赖: BestBlogs API Key (环境变量)
待确认: 完整 API 端点文档
```

### Skill 2: `twitter-fetcher` (P0)

```yaml
名称: twitter-fetcher
职责: 通过 xgo.ing API 获取推文内容
触发: "拉取推特内容" / "查看最新推文" / 定时任务调用

核心功能:
  - 获取关注列表的最新推文
  - 搜索特定话题推文
  - 获取推文详情 (含互动数据)
  - 获取 Thread 完整内容
  - 配合 baoyu-x-to-markdown 结构化

输出格式:
  结构化列表，含:
  - 作者、内容、链接
  - 互动数据 (转发/点赞/评论)
  - 发布时间

依赖: xgo.ing API 配置
待确认: 完整 API 接口文档
```

### Skill 3: `daily-content-curator` (P0)

```yaml
名称: daily-content-curator
职责: 智能筛选 + 个人偏好排序 → 每日阅读清单
触发: "生成阅读清单" / "今天读什么" / 定时任务自动调用

核心功能:
  - 调用 bestblogs-fetcher + twitter-fetcher 获取原始内容
  - 多维度评分:
    · BestBlogs AI 评分 (基础分, 40%)
    · 个人兴趣匹配度 (30%)
    · 时效性 (15%)
    · 来源可信度 (10%)
    · 内容类型多样性 (5%)
  - 同主题去重合并
  - 输出分层清单: 必读(3-5) / 推荐(5-10) / 备选(5)

个人偏好配置:
  interests:
    high: [AI Agent, LLM应用, 提示词工程, Claude, 分布式系统]
    medium: [产品设计, 开发者工具, 创业, 内容创作]
    low: [前端框架, 移动开发, 区块链]
  preferred_sources: [可配置]
  content_mix:
    articles: 60%
    tweets: 25%
    podcasts: 15%
  min_score: 75
  daily_target: 15
```

### Skill 4: `reading-workflow` (P1)

```yaml
名称: reading-workflow
职责: 编排每日阅读流程，引导思考输出
触发: "开始今天的阅读" / "继续阅读"

核心功能:
  - 从 daily-content-curator 输出中逐篇引导
  - 展示阅读上下文:
    · 摘要 + 核心论点
    · 与你之前阅读的关联 ("上周你读了 X 文章，这篇有不同视角")
    · 阅读时间估算
  - 按需调用 deep-reading-analyst 深度分析
  - 引导性提问 (每篇 2-3 个):
    · "作者的核心假设是什么？你认同吗？"
    · "这与你在证券业务中的经验有什么共鸣？"
    · "如果应用到 BestBlogs 的产品设计中，你会怎么做？"
  - 记录个人观点和思考碎片
  - 阅读结束时生成素材清单

输出:
  - 个人思考笔记 (Markdown)
  - 素材清单 (供 content-synthesizer 使用)
```

### Skill 5: `content-analytics` (P2)

```yaml
名称: content-analytics
职责: 拉取各平台数据，分析内容表现，生成报告
触发: "分析内容表现" / "生成周报" / 每周定时触发

核心功能:
  - 拉取推特互动数据 (通过 xgo.ing)
  - 拉取公众号数据 (如果有 API)
  - 生成报告:
    · 各平台数据概览
    · 最佳表现内容 TOP5
    · 话题维度分析
    · 发布时间分析
    · 增长趋势
  - 策略建议
  - 反馈到 daily-content-curator 的偏好调整

输出: 周度/月度分析报告 (Markdown)
```

## 六、整合后的 Skills 拓扑图

```
                        ┌─────────────────────────────┐
                        │     定时触发 (Claude Code)    │
                        └──────────┬──────────────────┘
                                   │
                    ┌──────────────┼──────────────┐
                    ▼              ▼              ▼
            ┌──────────┐  ┌──────────────┐  ┌─────────────┐
            │bestblogs- │  │twitter-      │  │baoyu-x-to-  │
  🟡 新建  │fetcher    │  │fetcher       │  │markdown      │ 🔵 复用
            └─────┬────┘  └──────┬───────┘  └──────┬──────┘
                  │              │                  │
                  └──────────────┼──────────────────┘
                                 ▼
                      ┌────────────────────┐
              🟡 新建 │daily-content-curator│ (智能筛选)
                      └─────────┬──────────┘
                                ▼
                      ┌────────────────────┐
              🟡 新建 │reading-workflow     │ (阅读引导)
                      │  └── deep-reading  │ 🟢 已有
                      │      -analyst      │
                      └─────────┬──────────┘
                                ▼
                  ┌─────────────────────────────┐
                  │    内容创作 & 视觉生成        │
                  ├─────────────┬───────────────┤
                  │ 🟢 已有     │ 🔵 复用        │
                  │             │               │
                  │ content-    │ baoyu-cover-  │
                  │ synthesizer │ image         │
                  │             │               │
                  │ article-    │ baoyu-xhs-    │
                  │ recommender │ images        │
                  │             │               │
                  │ weekly-     │ baoyu-article │
                  │ newsletter  │ -illustrator  │
                  │ -writer     │               │
                  │             │ baoyu-        │
                  │             │ infographic   │
                  │             │               │
                  │             │ baoyu-slide-  │
                  │             │ deck          │
                  │             │               │
                  │             │ baoyu-compress│
                  │             │ -image        │
                  └──────┬──────┴───────┬───────┘
                         │              │
                         ▼              ▼
                  ┌─────────────────────────────┐
                  │         分发                  │
                  ├─────────────┬───────────────┤
                  │ 🔵 复用     │ 手动           │
                  │             │               │
                  │ baoyu-post- │ 小红书         │
                  │ to-x        │ 即刻           │
                  │             │ 知乎           │
                  │ baoyu-post- │               │
                  │ to-wechat   │               │
                  └──────┬──────┴───────────────┘
                         │
                         ▼
                  ┌────────────────────┐
          🟡 新建 │content-analytics   │ (数据反馈)
                  └────────────────────┘
```

## 七、实施路线图（更新版）

### Phase 0: 环境准备 (第 0 周)
- [ ] 安装 baoyu-skills: `npx skills add jimliu/baoyu-skills`
- [ ] 配置 baoyu-skills 环境变量 (.env):
  - X/Twitter 认证
  - 微信公众号 AppID/AppSecret
- [ ] 确认 BestBlogs OpenAPI 完整文档
- [ ] 确认 xgo.ing API 文档
- [ ] 配置 Claude Code 定时触发机制

### Phase 1: 输入 + 筛选 (第 1-2 周)
- [ ] 创建 `bestblogs-fetcher` Skill
- [ ] 创建 `twitter-fetcher` Skill
- [ ] 创建 `daily-content-curator` Skill
- [ ] 定义个人偏好配置
- [ ] 配置定时触发 (早5点/晚5点)
- [ ] 试运行 3 天，调整筛选参数
- **里程碑: 每天自动收到个性化阅读清单**

### Phase 2: 阅读工作流 (第 3 周)
- [ ] 创建 `reading-workflow` Skill
- [ ] 与 deep-reading-analyst 集成
- [ ] 设计引导性提问模板库
- [ ] 试运行 + 迭代
- **里程碑: 阅读 → 思考 → 素材 流程打通**

### Phase 3: 内容生产 (第 4 周)
- [ ] 将 reading-workflow 输出对接 content-synthesizer
- [ ] 配置各平台内容模板 (推特/公众号/小红书/即刻/知乎)
- [ ] 集成 baoyu-cover-image + baoyu-xhs-images 视觉生成
- [ ] 集成 baoyu-article-illustrator 自动配图
- [ ] 试运行 + 调整风格
- **里程碑: 一次阅读 → 多平台内容自动生成**

### Phase 4: 分发 (第 5 周)
- [ ] 配置 baoyu-post-to-x 推特发布
- [ ] 配置 baoyu-post-to-wechat 公众号发布
- [ ] 建立发布前审核流程
- [ ] 探索小红书/即刻/知乎自动化可能
- **里程碑: 一键分发到主要平台**

### Phase 5: 反馈闭环 (第 6 周)
- [ ] 创建 `content-analytics` Skill
- [ ] 打通数据回收 → 偏好调整循环
- [ ] 建立周度复盘机制
- **里程碑: 完整闭环运转**

## 八、关键决策点

### 已确定
- ✅ 定时触发: Claude Code 支持
- ✅ 推特发布: baoyu-post-to-x
- ✅ 公众号发布: baoyu-post-to-wechat
- ✅ 小红书视觉: baoyu-xhs-images
- ✅ 图片生成后端: baoyu-danger-gemini-web

### 待确认
- ❓ BestBlogs OpenAPI 完整端点文档
- ❓ xgo.ing API 完整接口文档
- ❓ baoyu-post-to-x 是否通过 xgo.ing 发布，还是独立的 X API？
- ❓ 小红书/即刻/知乎是否有自动化发布方案？
- ❓ 个人偏好的具体主题优先级和常关注作者列表
