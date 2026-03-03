# Gino Skills

个人 Claude Code Skills 集合，服务于 [Content OS](docs/content-os-plan-v2.md) 个人内容操作系统。

## Skills 列表

### BestBlogs

| Skill | 功能 | 状态 |
|-------|------|------|
| [bestblogs-fetcher](skills/bestblogs-fetcher/) | 从 BestBlogs.dev OpenAPI 拉取文章、播客、视频、推文和期刊内容 | ✅ 已完成 |

### XGo — 基础 CRUD Skills

封装 XGo (xgo.ing) 开放接口的基础操作，每个 skill 对应一组相关端点。

| Skill | 功能 | API 端点 | 状态 |
|-------|------|----------|------|
| [xgo-fetch-tweets](skills/xgo-fetch-tweets/) | 拉取推文（关注者时间线、推荐、列表、标签、收藏） | tweet/list | ✅ 已完成 |
| [xgo-search-tweets](skills/xgo-search-tweets/) | 实时搜索推文、获取用户最新推文 | tweet/search, tweet/latest | ✅ 已完成 |
| [xgo-view-profile](skills/xgo-view-profile/) | 查看用户资料及近期动态 | user/info | ✅ 已完成 |
| [xgo-manage-follows](skills/xgo-manage-follows/) | 管理关注列表（查看、刷新、统计、推荐关注/取关） | following/* | ✅ 已完成 |
| [xgo-manage-lists](skills/xgo-manage-lists/) | 管理 Twitter 列表（创建、编辑、添加/移除成员） | list/* | ✅ 已完成 |
| [xgo-manage-bookmarks](skills/xgo-manage-bookmarks/) | 管理收藏（创建收藏夹、收藏/取消收藏推文） | bookmark/* | ✅ 已完成 |

### XGo — 组合型工作流 Skills

将多个 API 调用 + AI 分析编排成完整使用场景，构建在基础 skills 之上。

| Skill | 功能 | 复杂度 | 状态 |
|-------|------|--------|------|
| [xgo-track-kol](skills/xgo-track-kol/) | KOL 深度分析（6 维度 AI 报告 + 双用户对比） | 4 请求 → AI 分析 | ✅ 已完成 |
| [xgo-digest-tweets](skills/xgo-digest-tweets/) | 每日推文简报（按列表分类 + AI 摘要） | 5 请求 → 分类去重 → AI 摘要 | ✅ 已完成 |
| [xgo-organize-follows](skills/xgo-organize-follows/) | 关注整理助手（6 阶段交互式工作流） | 多阶段 → AI 匹配 → 批量执行 | ✅ 已完成 |

### Content OS（计划中）

| Skill | 功能 | 状态 |
|-------|------|------|
| daily-content-curator | 每日智能筛选 & 排序生成阅读清单 | 📋 计划中 |
| reading-workflow | 每日阅读 + 思考引导工作流 | 📋 计划中 |
| content-analytics | 数据回收与分析 | 📋 计划中 |

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

## 相关项目

- [XGo](https://xgo.ing) - Twitter/X 数据管理平台
- [BestBlogs.dev](https://bestblogs.dev) - AI 驱动的技术内容精选平台
- [baoyu-skills](https://github.com/jimliu/baoyu-skills) - 内容创作与分发 Skills（复用）
