# AGENTS.md

本项目是个人 Skills 集合，通过 skills 扩展 Agent 的能力。

## Sub-agent 使用指南

Sub-agent 在执行任务时可能会触发本项目中的 skills。以下是关键注意事项：

### Skill 加载机制

- Skills 通过 `~/.claude/skills/` 下的 symlink 激活
- Agent 根据 SKILL.md 的 `description` 字段自动匹配触发
- SKILL.md 正文在触发时加载，`references/` 目录内容按需读取

### 核心约束

- **写操作门控**: 所有写操作（关注/取关/收藏/发布等）必须在用户确认后执行
- **API 错误处理**: 始终检查 `response.success` 字段，不能仅依赖 HTTP 状态码
- **频率限制**: XGo API — PLUS 200次/分, PRO 600次/分
- **批量操作**: 每批最多 5 个，逐批输出进度
- **内容完整性**: 不得截断推文文本、用户简介等内容字段

### 工作区共享

Content OS skills 通过 `contents/tmp/workspace/` 共享中间数据。获取内容详情前先检查缓存，避免重复 API 调用。

详细规范参见 CLAUDE.md。
