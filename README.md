# Gino Skills

个人 Claude Code Skills 集合，服务于 [Content OS](docs/content-os-plan-v2.md) 个人内容操作系统。

## Skills 列表

| Skill | 功能 | 状态 |
|-------|------|------|
| [bestblogs-fetcher](skills/bestblogs-fetcher/) | 从 BestBlogs.dev OpenAPI 拉取文章、播客、视频、推文和期刊内容 | ✅ 已完成 |
| twitter-fetcher | 通过 xgo.ing API 获取推文内容 | 📋 计划中 |
| daily-content-curator | 每日智能筛选 & 排序生成阅读清单 | 📋 计划中 |
| reading-workflow | 每日阅读 + 思考引导工作流 | 📋 计划中 |
| content-analytics | 数据回收与分析 | 📋 计划中 |

## 安装

将 skill 目录符号链接到 `~/.claude/skills/`：

```bash
ln -sf /path/to/gino-skills/skills/bestblogs-fetcher ~/.claude/skills/bestblogs-fetcher
```

## 环境变量

| 变量 | 用途 | 所需 Skill |
|------|------|-----------|
| `BESTBLOGS_API_KEY` | BestBlogs OpenAPI 鉴权 | bestblogs-fetcher |

## 相关项目

- [BestBlogs.dev](https://bestblogs.dev) - AI 驱动的技术内容精选平台
- [baoyu-skills](https://github.com/jimliu/baoyu-skills) - 内容创作与分发 Skills（复用）
