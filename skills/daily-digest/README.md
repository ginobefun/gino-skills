# Daily Digest - 每日技术早报

从多个数据源智能筛选 Top 10 技术新闻，生成纯文本 + 杂志风 HTML 两种格式的早报。

## 特点

- **免费数据源**：Hacker News、微博热搜、知乎热榜（无需 API key）
- **智能筛选**：4 层优先级（头部厂商 → AI Coding → 高优来源 → 内容质量）
- **双格式输出**：纯文本（IM 分享）+ HTML（杂志风设计）
- **定时执行**：集成 OpenClaw heartbeat，每天 9:00 自动运行

## 安装

```bash
# Clone to your skills directory
git clone https://github.com/ginobefun/gino-skills.git
# Or copy this skill to your skills folder
cp -r daily-digest ~/.openclaw/workspace/skills/
```

## 使用

### 手动触发

```bash
node scripts/generate-digest.js
```

### 定时任务

在 `HEARTBEAT.md` 中添加：

```markdown
### 新闻摘要（每天 9:00-12:00）
- 调用 daily-digest skill
- 生成纯文本 + HTML
```

## 输出示例

### 纯文本版

```
📰 技术早报 | 2026-03-07

🔥 头条
[1] OpenAI 发布 GPT-5 预告片
Sam Altman 在 X 上发布 GPT-5 预告片，暗示下周正式发布
来源：X / Twitter | HN 评分：520
链接

⚡ AI 动态
[2] Claude Code 新功能：支持多文件编辑
...
```

### HTML 版

杂志风设计，墨蓝 + 琥珀配色，可直接在浏览器打开或截图分享。

## 筛选逻辑

| 优先级 | 类型 | 示例 |
|--------|------|------|
| 1 | 头部厂商动态 | OpenAI、Anthropic、阿里、腾讯 |
| 2 | AI Coding 专题 | Claude Code、Cursor、Copilot |
| 3 | 高优来源 | a16z、Y Combinator、宝玉 |
| 4 | 内容质量 | HN 评分 + 评论数 |

## 文件结构

```
daily-digest/
├── SKILL.md              # Skill 定义
├── README.md             # 本文档
└── scripts/
    ├── generate-digest.js    # 执行脚本
    └── fetch-hn.sh          # 数据抓取（预留）
```

## 自定义

编辑 `scripts/generate-digest.js` 调整：

- `HEADLINE_COMPANIES` - 头部厂商列表
- `AI_CODING_KEYWORDS` - AI Coding 关键词
- `TRUSTED_SOURCES` - 高优来源列表

## License

MIT
