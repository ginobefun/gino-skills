# Skill Runtime 约定

本仓库把 setup、config、stable state、长期 memory 和一次性 workspace 输出明确区分开来。

## 目标

- 让各个 skill 的 setup 和偏好加载规则可预测
- 把 durable state 从一次性 workspace 目录里剥离出来
- 在不阻碍未来插件化迁移的前提下支持当前 repo-local 使用
- 让 worker 和 orchestrator 共享同一套路径规则

## 术语

- `setup`：执行前需要的一次性或低频偏好采集
- `config`：显式的用户或项目偏好，通常由用户管理或写入版本控制外目录
- `state`：skill 自己写入的持久运行数据
- `memory`：跨会话复用的长期笔记或历史
- `workspace`：针对某一天或某个任务生成的一次性产物

## 路径约定

### 推荐的 config 位置

项目级：
- `.gino-skills/<skill>/config.json`

用户级：
- `$HOME/.gino-skills/<skill>/config.json`

兼容旧版：
- `.gino-skills/<skill>/EXTEND.md`
- `$HOME/.gino-skills/<skill>/EXTEND.md`

`config.json` 是新工作流的首选格式。
`EXTEND.md` 只在迁移窗口内作为临时 legacy fallback 保留。

明确的弃用时间线见 [deprecation-roadmap.md](deprecation-roadmap.md)，起始日期为 2026 年 3 月 18 日。

### Stable state 根目录

优先：
- `${CLAUDE_PLUGIN_DATA}/gino-skills/<skill>/`

当 `CLAUDE_PLUGIN_DATA` 不可用时的 repo fallback：
- `.gino-skills/data/<skill>/`

推荐子目录：
- `state/`
- `memory/`
- `cache/`
- `logs/`

### 一次性 workspace 根目录

按天或按任务划分的一次性产物放在：
- `contents/tmp/workspace/YYYY-MM-DD/`

workspace 只适合放：
- fetched source snapshots
- intermediate markdown or JSON
- draft outputs
- same-day coordination across orchestrator skills

不要把 workspace 当成 durable memory。

## 解析优先级

skill 解析 runtime 设置时，按以下优先级处理：

1. explicit CLI arguments
2. project `config.json`
3. user `config.json`
4. project `EXTEND.md` legacy fallback
5. user `EXTEND.md` legacy fallback
6. environment variables
7. built-in defaults

如果某个 skill 仍然使用 `EXTEND.md`，必须明确写成 legacy compatibility，而不是推荐目标状态；并尽量把细节放到附录或兼容章节。

## Setup 规则

- if required config is missing, stop and run setup before destructive or expensive execution
- setup output should be written to `config.json` when the skill is newly designed or actively migrated
- if a skill still writes `EXTEND.md`, document the future `config.json` target and keep the schema aligned
- legacy fallback instructions should not dominate the main workflow; keep primary steps focused on `config.json` and stable state

## State 与 Memory 规则

- state written by the skill belongs under the stable state root, not under `contents/tmp/workspace`
- reusable user memory belongs under `<stable-root>/memory/`
- append-only histories, prior run reports, or sync cursors belong under `<stable-root>/state/`
- large temporary files belong under workspace or `<stable-root>/cache/`, depending on whether they must survive the day

## Workspace 规则

- workspace is disposable and date-scoped
- keep filenames deterministic and machine-readable
- if downstream skills depend on the artifact, document the exact relative path in the producing skill
- if the artifact should survive upgrades or cross-repo reuse, promote it out of workspace into stable state

## 迁移指引

迁移老 skill 时，建议按这个顺序做：

1. keep existing behavior working
2. add a short `Runtime Conventions` section pointing to this document
3. declare whether the skill uses:
   - legacy `EXTEND.md`
   - preferred `config.json`
   - stable state root
   - disposable workspace
4. only then change actual loaders or writers

## 最小示例

以 `image-gen` 为例：

- project config: `.gino-skills/image-gen/config.json`
- user config: `$HOME/.gino-skills/image-gen/config.json`
- stable state: `${CLAUDE_PLUGIN_DATA}/gino-skills/image-gen/`
- repo fallback state: `.gino-skills/data/image-gen/`
- disposable run output: `contents/tmp/workspace/YYYY-MM-DD/`
