# 弃用时间线

本文档定义了本仓库 legacy runtime 路径与旧 config 格式的明确弃用节奏。

## 范围

当前这轮弃用收口覆盖：

- `contents/style-profile.md`
- skill-local `EXTEND.md` config files under `.gino-skills/<skill>/EXTEND.md`
- user-local `EXTEND.md` config files under `$HOME/.gino-skills/<skill>/EXTEND.md`

## 时间线

### 立即生效：2026 年 3 月 18 日

- `config.json` 成为活跃 skill 的默认且首选 config 格式
- `${CLAUDE_PLUGIN_DATA}/gino-skills/...` 在可用时是 canonical durable runtime 根目录
- `.gino-skills/data/...` 继续作为 repo-local stable fallback
- `contents/style-profile.md` 降级为 compatibility-only，不再视作 canonical runtime state
- 新文档应把 legacy fallback 放到附录或兼容章节，而不是主流程步骤

### 文档清理目标：2026 年 4 月 30 日

- 高频 skill 应完成把 legacy fallback 说明迁出主流程章节
- reference 文档应默认展示 `config.json` 和 stable state 路径
- 剩余的 legacy 说明必须标注为 compatibility-only

### 写路径切换目标：2026 年 6 月 30 日

- stable style profile 的写入应优先落到 `${CLAUDE_PLUGIN_DATA}/gino-skills/manage-daily-content/memory/style-profile.md`
- `contents/style-profile.md` 只应在明确要求 compatibility sync 时才写入
- 新建或已迁移的 worker 不应再创建新的 `EXTEND.md`

### 移除评审目标：2026 年 9 月 30 日

- 评审是否还有活跃 skill 依赖 `EXTEND.md` 读取
- 如果没有阻塞依赖，就从活跃 loader 中移除 legacy `EXTEND.md` 读取
- 评审 `contents/style-profile.md` 是否可以停止作为兼容镜像继续写入

## 弃用窗口内的仓库规则

- 不要再引入新的 `EXTEND.md`-first 工作流
- 不要再把 `contents/style-profile.md` 写成 canonical runtime state
- 当必须提到 legacy compatibility 时，要写清它为什么还存在，以及 canonical 替代路径是什么
- 如果某个 worker 仍支持 legacy fallback，优先用简短附录说明，而不是在主流程反复展开
