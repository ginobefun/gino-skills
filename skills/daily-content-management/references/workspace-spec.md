# Daily Workspace 规范

本文档定义每日工作区的数据格式、读写协议和 skill 间共享规则。

---

## 一、目录结构

```
contents/daily-workspace/
  YYYY-MM-DD/
    ├── raw-articles.md          # BestBlogs 原始文章列表
    ├── raw-tweets.md            # XGo 原始推文列表
    ├── article-details/         # 文章详情缓存
    │   ├── {article-id}.md
    │   └── ...
    ├── tweet-details/           # 推文详情缓存
    │   ├── {tweet-id}.md
    │   └── ...
    ├── topic-clusters.md        # 同主题聚合结果
    ├── plan.md                  # 选题计划 + 执行状态
    └── outputs/                 # 创作产出
        ├── 01-blog-title.md
        ├── 02-thread-title.md
        └── ...
```

---

## 二、文件格式规范

### raw-articles.md

存储 BestBlogs 获取的文章列表基础信息。每条记录只包含选题所需的关键字段，不含全文。

```markdown
# BestBlogs 文章列表 | YYYY-MM-DD

> 获取时间: HH:MM | 数据源: daily-content-curator
> 总计: N 篇 | 过滤条件: score >= 75, 时间范围 1d

## AI 分类 (N 篇)

### 1. [文章标题](url)
- **ID**: bestblogs-{id}
- **来源**: 来源名 | **作者**: 作者名
- **评分**: 92 | **发布时间**: YYYY-MM-DD HH:MM
- **摘要**: 一句话 AI 摘要
- **标签**: tag1, tag2, tag3
- **阅读时长**: 15 分钟
- **readUrl**: https://bestblogs.dev/...
- **详情缓存**: ❌ 未获取 / ✅ article-details/bestblogs-{id}.md

### 2. [文章标题](url)
...

## 编程技术分类 (N 篇)
...

## 商业科技分类 (N 篇)
...
```

### raw-tweets.md

```markdown
# XGo 推文列表 | YYYY-MM-DD

> 获取时间: HH:MM | 数据源: daily-content-curator
> 总计: M 条 | 过滤条件: influenceScore >= 40

## 关注者推文 (N 条)

### 1. @username — 影响力: 85
- **ID**: xgo-{id}
- **内容**: [推文全文，不截断]
- **互动**: 👍 1.2K 🔁 234 💬 56 👁 45K
- **发布时间**: YYYY-MM-DD HH:MM
- **URL**: https://x.com/...
- **详情缓存**: ❌ / ✅ tweet-details/xgo-{id}.md

### 2. @username — 影响力: 78
...

## 推荐推文 (M 条)
...
```

### article-details/{id}.md

文章详情缓存。任何 skill 首次获取文章全文后存入此处。

```markdown
# [文章标题]

> 缓存时间: YYYY-MM-DD HH:MM
> 来源 Skill: deep-reading / daily-content-management
> 原始 URL: [url]
> Read URL: [bestblogs readUrl]

## 元数据
- **作者**: 作者名
- **来源**: 来源名
- **发布时间**: YYYY-MM-DD
- **评分**: 92
- **字数**: 3500
- **标签**: tag1, tag2

## 全文内容

[通过 Jina Reader 或直接抓取的完整文章内容]

## AI 分析（如有）

[如果 deep-reading 已分析过，附加分析结果]
```

### tweet-details/{id}.md

推文详情缓存。包含推文完整内容及上下文（引用推文、对话线程等）。

```markdown
# @username 推文

> 缓存时间: YYYY-MM-DD HH:MM
> 来源 Skill: xgo-fetch-tweets / daily-content-management
> URL: https://x.com/...

## 推文内容
[完整推文文本]

## 互动数据
👍 1.2K 🔁 234 💬 56 🔄 12 📑 89 👁 45K

## 上下文
### 引用推文（如有）
[被引用的原始推文内容]

### 对话线程（如有）
[上下文对话]

## 作者信息
- **用户名**: @username
- **显示名**: Display Name
- **简介**: [bio]
- **粉丝**: 12.5K
```

### topic-clusters.md

同主题聚合结果（阶段二产出）。

```markdown
# 主题聚合 | YYYY-MM-DD

> 聚合来源: raw-articles.md (N 篇) + raw-tweets.md (M 条)
> 聚合结果: K 个主题簇 + L 个独立内容

---

## 簇 1: [主题名称] — N 篇相关内容

**聚合关键词**: Claude 4.5, Anthropic, 新模型
**信息丰富度**: ⭐⭐⭐⭐⭐（多角度覆盖）
**建议内容类型**: 🔴 长文（信息量充足）

### 来源内容
1. 📄 [文章标题1](url) | ID: bestblogs-xxx
   - **角度**: 技术评测
   - **核心贡献**: [此文独特的信息/观点]

2. 📄 [文章标题2](url) | ID: bestblogs-yyy
   - **角度**: 行业分析
   - **核心贡献**: [此文独特的信息/观点]

3. 🐦 @author [推文](url) | ID: xgo-zzz
   - **角度**: 实践体验
   - **核心贡献**: [此推特独特的信息/观点]

### 综合分析
[整合所有来源后的完整信息概览，3-5 句]

### 观点对比（如有）
- **观点 A** (来源1): [观点描述]
- **观点 B** (来源3): [不同观点描述]

### 可选创作角度
1. 技术深度解读 — 适合 🔴 长文
2. 个人体验分享 — 适合 🟡 推文串
3. 快速速评 — 适合 🟢 短文

---

## 簇 2: [主题名称] — M 篇相关内容
...

---

## 独立内容（未被聚合）

### 📄 [标题](url) | ID: bestblogs-xxx
- **评分**: 88 | **分类**: 产品设计
- **独特角度**: [为什么单独成题]

### 🐦 @author [推文](url) | ID: xgo-xxx
- **影响力**: 90 | **主题**: 个人成长
- **独特角度**: [为什么单独成题]
```

### plan.md

选题计划和执行状态追踪。

```markdown
# 每日内容计划 | YYYY-MM-DD

> 创建时间: HH:MM | 最后更新: HH:MM
> 风格画像: ✅ 已加载 (更新于 YYYY-MM-DD)

## 工作流状态

- [x] 阶段零: 初始化工作区 + 风格加载
- [x] 阶段一: 数据获取 (N 篇文章 + M 条推文)
- [x] 阶段二: 选题生成 (K 个主题簇 → 20 个选题)
- [x] 阶段三: 用户选题 (选中 10 个)
- [ ] 阶段四: 内容创作 (进度 3/10)
- [ ] 阶段五: 审阅确认
- [ ] 阶段六: 分发执行
- [ ] 阶段七: 记录归档

## 选题清单

| # | 类型 | 领域 | 标题 | 来源簇 | 创作状态 | 审阅 | 分发渠道 | 分发状态 |
|---|------|------|------|--------|---------|------|---------|---------|
| 01 | 🔴 | AI | [标题] | 簇1(3篇) | ✅ 完成 | ✅ 通过 | 博客+公众号 | ✅ 已发布 |
| 02 | 🟡 | 编程 | [标题] | 独立 | ✅ 完成 | ✅ 通过 | 推文串+小红书 | 📤 推文已发 / 📋 小红书待复制 |
| 03 | 🟢 | AI | [标题] | 簇2(2篇) | 🔄 创作中 | - | 推文+即刻 | - |
| 04 | 🟢 | 产品 | [标题] | 独立 | ⏳ 待创作 | - | 推文+朋友圈 | - |
| ... | ... | ... | ... | ... | ... | ... | ... | ... |

## 产出统计

| 维度 | 数量 |
|------|------|
| 选题候选 | 20 |
| 用户选择 | 10 |
| 已创作 | 3/10 |
| 已审阅 | 2/10 |
| 已发布 | 1 (3 个渠道) |
| 渠道覆盖 | Twitter×1, 博客×1, 公众号×1 |

## 数据源

- BestBlogs: N 篇文章 (AI×a, 编程×b, 商业×c, 产品×d)
- XGo: M 条推文 (关注者×x, 推荐×y)
- 主题簇: K 个 (含 2+ 来源的聚合选题)
```

### outputs/{序号}-{slug}.md

单个选题的完整创作产出（所有渠道版本）。

```markdown
# 选题 01: [标题]

> 类型: 🔴 长文 | 领域: AI | 创建时间: HH:MM
> 来源簇: 簇1 — [主题名] (3 篇)
> 审阅状态: ✅ 通过 | 分发状态: ✅ 博客 + 📤 公众号发布中

## 素材来源
- 📄 [文章1](url) — article-details/bestblogs-xxx.md
- 📄 [文章2](url) — article-details/bestblogs-yyy.md
- 🐦 @author [推文](url) — tweet-details/xgo-zzz.md

## 📝 博客版本

[完整博客内容...]

## 📱 公众号适配版

[完整公众号版本...]

## 🐦 衍生推文

### 推文 1
[核心观点推文]

### 推文 2
[另一角度推文]

## 💬 衍生即刻

[即刻版本]
```

---

## 三、Skill 间共享协议

### 读取规则

| 场景 | 操作 |
|------|------|
| 需要文章列表 | 先读 `raw-articles.md` → 不存在则调 API 并写入 |
| 需要文章全文 | 先查 `article-details/{id}.md` → 不存在则通过 Jina Reader 获取并缓存 |
| 需要推文详情 | 先查 `tweet-details/{id}.md` → 不存在则调 XGo API 并缓存 |
| 需要风格参考 | 读 `contents/style-profile.md`（根级别） → 不存在则触发风格画像生成 |
| 需要选题状态 | 读 `plan.md` |

### 写入规则

| Skill | 写入文件 |
|-------|---------|
| daily-content-curator | raw-articles.md, raw-tweets.md |
| daily-content-management | topic-clusters.md, plan.md, outputs/ |
| deep-reading | article-details/{id}.md（追加 AI 分析部分） |
| content-synthesizer | outputs/{序号}-{slug}.md |
| reading-workflow | article-details/{id}.md（追加阅读笔记） |

### 缓存策略

- **当日数据**: 始终有效，不过期
- **历史工作区**: 保留 3 天供去重和参考
- **style-profile.md**: 每周更新一次，存放在 `contents/style-profile.md`（根级别，不在工作区内）
- **article-details/**: 永不过期（内容不变）

---

## 四、Token 优化策略

工作区设计的核心目标是最小化 token 消耗：

| 策略 | 说明 |
|------|------|
| **分层存储** | 列表只存基础信息（标题+摘要+评分），详情按需获取 |
| **缓存复用** | 同一文章被多个 skill 引用时，只获取一次全文 |
| **增量更新** | 聚合结果、分析结果追加到已有文件，不重新生成 |
| **状态追踪** | plan.md 记录进度，中断恢复时只处理未完成项 |
| **风格复用** | style-profile.md 一周一次，不每天重新分析 |
