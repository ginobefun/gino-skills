# Skills Review Log

日期：2026-03-18

## 背景

这份日志用于回顾本仓库针对 skills 体系做过的一轮完整治理与优化，方便作者快速了解：

- 最初发现了什么问题
- 原定优化步骤是什么
- 每一步已经完成到什么程度
- 还剩哪些收尾或后续迭代项

最初的判断是：仓库已经具备不错的 `references/` 和部分 `scripts/` 基础，但还没有充分吃到 skills 设计里的几项关键红利，尤其是：

- 触发描述真正为模型服务
- gotchas 前置
- skill 边界清晰
- 脚本化与验证分层

## 最初 Findings 回顾

### 1. 触发层 description 写法偏离“只写何时触发”

**原始问题**
- 40/40 个 skill 的 `description` 都没有统一使用 `Use when ...`
- description 里混入了工作流、功能枚举、触发短语清单
- 模型可能只读 frontmatter 就停止深入正文

**当前状态：已完成**

已完成的改动：
- 为仓库建立统一的 frontmatter 规范：[docs/skill-style-guide.md](/Users/gino/Documents/Github/gino-skills/docs/skill-style-guide.md)
- 用 lint 强制 `description` 必须以 `Use when` 开头：[scripts/lint_skills.py](/Users/gino/Documents/Github/gino-skills/scripts/lint_skills.py)
- 用测试锁定规则：[tests/test_skill_lint.py](/Users/gino/Documents/Github/gino-skills/tests/test_skill_lint.py)
- 已对全仓库 skill frontmatter description 做统一改写

结果：
- 当前 `43` 个 skill 均满足 frontmatter 规则
- `python3 scripts/lint_skills.py` 已验证 `0 violations`

### 2. skill 边界不清，megaskill 过载

**原始问题**
- `daily-content-management`、`content-synthesizer`、`bestblogs-process-videos` 等同时承担多种职责
- orchestration、fetch、analyze、translate、publish 混在一起

**当前状态：大部分完成**

已完成的改动：
- 第 3 阶段对高频 skill 做了正文导航化和 soft split
- `daily-content-management` 已重新定位为 orchestrator
- `daily-content-curator`、`content-synthesizer`、`reading-workflow`、`deep-reading` 的边界已明确
- `bestblogs-process-articles` / `podcasts` / `videos` 已改成 thin orchestrator + worker routing
- 新增 worker skills：
  - [bestblogs-fetch-pending-content](/Users/gino/Documents/Github/gino-skills/skills/bestblogs-fetch-pending-content/SKILL.md)
  - [bestblogs-analyze-content](/Users/gino/Documents/Github/gino-skills/skills/bestblogs-analyze-content/SKILL.md)
  - [bestblogs-translate-analysis-result](/Users/gino/Documents/Github/gino-skills/skills/bestblogs-translate-analysis-result/SKILL.md)

补充说明：
- `bestblogs-translate-content` 已被收口为更准确的 [bestblogs-translate-analysis-result](/Users/gino/Documents/Github/gino-skills/skills/bestblogs-translate-analysis-result/SKILL.md)
- `xgo-digest-tweets` 和 `xgo-organize-follows` 也已经切到 worker-first 思路

仍然保留的现实情况：
- 这轮已经完成“边界澄清 + 第一层 worker 拆分”
- 但不是所有 family 都已经做到底层彻底解耦，后续仍有继续下沉实现的空间

### 3. Gotchas 没有系统沉淀

**原始问题**
- 大量高价值坑点散落在正文里，没有统一的高召回章节
- 只有极少数 skill 明确有 `Gotchas`/`Common Mistakes` 结构

**当前状态：高频范围已完成**

已完成的改动：
- 对高频 family 和核心发布类 skill 增加了统一的：
  - `When to Use`
  - `When Not to Use`
  - `Gotchas`
  - `Related Skills`
- 这些章节已经进入 lint 约束范围，适用于：
  - 第一批高频 skill
  - 全部 `bestblogs-*`
  - 全部 `xgo-*`

结果：
- `xgo-*`、`bestblogs-*`、`post-*` 家族已经具备稳定的 gotchas 导航层

### 4. state / memory 路径不稳定，缺少统一约定

**原始问题**
- 长期状态主要绑在仓库路径里
- 缺少 `${CLAUDE_PLUGIN_DATA}`、stable state root、统一 config/state schema

**当前状态：大部分完成，仍保留兼容窗口**

已完成的改动：
- 引入运行时约定文档：[docs/skill-runtime-conventions.md](/Users/gino/Documents/Github/gino-skills/docs/skill-runtime-conventions.md)
- 引入弃用时间线：[docs/deprecation-roadmap.md](/Users/gino/Documents/Github/gino-skills/docs/deprecation-roadmap.md)
- 共享路径规则落到代码层：[scripts/shared/runtime_paths.py](/Users/gino/Documents/Github/gino-skills/scripts/shared/runtime_paths.py)
- 内容状态 helper 落到代码层：
  - [scripts/shared/content_runtime.py](/Users/gino/Documents/Github/gino-skills/scripts/shared/content_runtime.py)
  - [scripts/shared/content_state.py](/Users/gino/Documents/Github/gino-skills/scripts/shared/content_state.py)
- `style-profile`、阅读缓存、日报状态已开始迁移到 stable root

已做的数据迁移：
- canonical style profile 已迁到 [`.gino-skills/data/manage-daily-content/memory/style-profile.md`](/Users/gino/Documents/Github/gino-skills/.gino-skills/data/manage-daily-content/memory/style-profile.md)
- legacy 副本仍保留在 [contents/style-profile.md](/Users/gino/Documents/Github/gino-skills/contents/style-profile.md)

验证：
- [tests/test_runtime_conventions.py](/Users/gino/Documents/Github/gino-skills/tests/test_runtime_conventions.py) 已覆盖核心路径与读写行为

仍待后续处理：
- legacy 路径尚未完全删除，而是进入兼容窗口
- 计划在 `2026-09-30` 做 removal review

### 5. 执行细节仍停留在 SKILL.md，脚本化不足

**原始问题**
- 大量 `curl`、分页、错误处理、写后校验仍写在文档里
- 说明多，稳定执行层少

**当前状态：已大幅改善**

已完成的改动：
- 建立共享 API 层：
  - [scripts/shared/api_common.py](/Users/gino/Documents/Github/gino-skills/scripts/shared/api_common.py)
  - [scripts/shared/bestblogs_client.py](/Users/gino/Documents/Github/gino-skills/scripts/shared/bestblogs_client.py)
  - [scripts/shared/xgo_client.py](/Users/gino/Documents/Github/gino-skills/scripts/shared/xgo_client.py)
- 建立统一 example worker 输出契约：
  - [scripts/shared/example_output.py](/Users/gino/Documents/Github/gino-skills/scripts/shared/example_output.py)
- 增加了大量 `scripts/examples/` worker 入口，用于：
  - BestBlogs 读写
  - XGo 读写
  - digest source / rank / render
  - config / state 读取

代表性结果：
- `bestblogs` / `xgo` 高频 skill 已经从“文档里手写 curl 主路径”迁移到“shared client + example worker”
- `xgo-digest-tweets` 已形成：
  - [xgo_digest_source_data.py](/Users/gino/Documents/Github/gino-skills/scripts/examples/xgo_digest_source_data.py)
  - [xgo_digest_rank.py](/Users/gino/Documents/Github/gino-skills/scripts/examples/xgo_digest_rank.py)
  - [xgo_digest_render.py](/Users/gino/Documents/Github/gino-skills/scripts/examples/xgo_digest_render.py)

### 6. setup / config 方案不统一，依赖 EXTEND.md 口头约定

**原始问题**
- 不同 skill 各自定义 setup 和优先级
- 缺少统一 loader 和 schema

**当前状态：大部分完成**

已完成的改动：
- 通用 loader 已落地：[scripts/shared/config_loader.ts](/Users/gino/Documents/Github/gino-skills/scripts/shared/config_loader.ts)
- 对应测试已补：[scripts/shared/config_loader.test.ts](/Users/gino/Documents/Github/gino-skills/scripts/shared/config_loader.test.ts)
- 高频 skill 已补最小 schema：
  - [skills/image-gen/config.schema.json](/Users/gino/Documents/Github/gino-skills/skills/image-gen/config.schema.json)
  - [skills/post-to-wechat/config.schema.json](/Users/gino/Documents/Github/gino-skills/skills/post-to-wechat/config.schema.json)
  - [skills/post-to-x/config.schema.json](/Users/gino/Documents/Github/gino-skills/skills/post-to-x/config.schema.json)
  - [skills/daily-content-management/config.schema.json](/Users/gino/Documents/Github/gino-skills/skills/daily-content-management/config.schema.json)
  - [skills/reading-workflow/config.schema.json](/Users/gino/Documents/Github/gino-skills/skills/reading-workflow/config.schema.json)
  - [skills/content-synthesizer/config.schema.json](/Users/gino/Documents/Github/gino-skills/skills/content-synthesizer/config.schema.json)
  - [skills/cover-image/config.schema.json](/Users/gino/Documents/Github/gino-skills/skills/cover-image/config.schema.json)
  - [skills/article-illustrator/config.schema.json](/Users/gino/Documents/Github/gino-skills/skills/article-illustrator/config.schema.json)
- `image-gen`、`post-to-wechat`、`cover-image`、`article-illustrator` 已切到 `config.json` 优先

审计结果：
- legacy `EXTEND.md` 的真实 runtime reader 已被收口并记入审计文档：[docs/plans/2026-03-18-legacy-extend-loader-audit.md](/Users/gino/Documents/Github/gino-skills/docs/plans/2026-03-18-legacy-extend-loader-audit.md)

当前判断：
- `config.json` 优先和 schema 基线已经建立
- legacy `EXTEND.md` 尚未完全删除，但已从“主路径”降级为“兼容路径”

### 7. verification 能力偏弱，尤其是写操作 skill

**原始问题**
- 写操作缺少统一的 read-after-write 校验套路
- 发布和批量写入的成功判断不够稳

**当前状态：已大幅改善**

已完成的改动：
- `bestblogs` / `xgo` 的写路径已经下沉到 shared client
- 增加了 write-after-read / best-effort verify helper
- example worker 输出统一 JSON 契约，并明确 success/failure exit code
- 相关测试已补：
  - [tests/test_shared_api_clients.py](/Users/gino/Documents/Github/gino-skills/tests/test_shared_api_clients.py)

当前能力：
- follow / unfollow
- list add/remove member
- bookmark collect/remove
- bestblogs save analysis / save translate result / update featured reason 等

限制说明：
- 少数接口天然没有稳定读回字段时，仍只能做 best-effort 校验
- 这一点已在 skill 文档中显式说明，而不是伪装成强校验

## 最初实施方案回顾

### 第 1 步：仓库级规范和 lint

**状态：已完成**

落地物：
- [docs/skill-style-guide.md](/Users/gino/Documents/Github/gino-skills/docs/skill-style-guide.md)
- [scripts/lint_skills.py](/Users/gino/Documents/Github/gino-skills/scripts/lint_skills.py)
- [tests/test_skill_lint.py](/Users/gino/Documents/Github/gino-skills/tests/test_skill_lint.py)

### 第 2 步：统一 frontmatter

**状态：已完成**

结果：
- 全仓库 skill 的 `description` 已统一成 `Use when ...`
- 保留 family prefix：`bestblogs-*`、`xgo-*`
- 非 family 高频 skill 采用了更易记的动宾式名称

### 第 3 步：拆 megaskill

**状态：已完成第一阶段**

完成内容：
- orchestrator / worker 边界已明确
- 新建 BestBlogs worker skills
- `daily-content-management`、`bestblogs-process-*` 已从“全能 skill”收窄成编排器

### 第 4 步：把隐性坑显式化

**状态：高频家族已完成**

完成内容：
- `xgo-*`、`bestblogs-*`、`post-*` 高频 skill 已系统加入 `Gotchas`
- 同时加入 `When to Use / When Not to Use / Related Skills`

### 第 5 步：做 shared scripts 和验证层

**状态：已完成，并且比原计划更深入**

完成内容：
- shared API clients
- example workers
- 统一 JSON 输出契约
- 统一失败输出和退出码
- read-after-write / best-effort verify
- `xgo-digest-tweets` 的 Node 排序 / 渲染层也已包装成稳定 worker 入口

### 第 6 步：统一 config 和 data

**状态：大部分完成，进入弃用收口阶段**

完成内容：
- runtime conventions 已建立
- `config.json` 优先已落到代码
- stable state root 已统一
- style-profile 和阅读记忆开始迁移
- deprecation timeline 已建立

仍保留：
- legacy `EXTEND.md` 与少数旧路径还在兼容窗口内

## 额外完成的增强项

除最初 6 步之外，这轮还额外完成了几项重要增强：

1. **命名收口**
   - `bestblogs-translate-content` 已改为更准确的 `bestblogs-translate-analysis-result`

2. **shared worker 化深入到 family 执行层**
   - `xgo-digest-tweets`、`xgo-organize-follows` 已不再以 raw curl 编排为主

3. **中文化**
   - 仓库治理文档已中文化
   - 高频 skill 正文已中文化
   - API reference 已完成第一轮“保留字段名原文、翻译说明文字”

4. **真正的数据迁移与兼容管理**
   - `style-profile.md` 已迁到 stable state
   - legacy 路径和 EXTEND 读取已进入显式 deprecation timeline

## 当前阶段判断

### 已完成

- 仓库级 skill 治理基线
- frontmatter 统一
- 高频 family 的导航层与 gotchas
- shared scripts / worker / verify 基线
- config / state / memory 约定
- deprecation timeline

### 基本完成但仍有后续空间

- megaskill 深层实现拆分
- 全仓库 reference 文档中文化收尾
- 全量 API reference 细致中文化
- legacy fallback 的最终移除

### 明确未完全结束的事项

- `EXTEND.md` 仍有少量 runtime reader 处于兼容窗口内
- 并非所有低频 skill / reference 都已经完全迁到 worker-first 思路
- 仍有部分 repo 文档存在中英混合，需要后续继续清理

## 当前可验证结果

本轮回顾时的已知验证基线：

- `python3 scripts/lint_skills.py`
  - 结果：`Linted 43 skill file(s): 0 violations.`
- `python3 -m unittest tests.test_skill_lint tests.test_runtime_conventions -v`
  - 结果：当前相关测试通过

此外，仓库中还存在：
- [tests/test_shared_api_clients.py](/Users/gino/Documents/Github/gino-skills/tests/test_shared_api_clients.py)
- [tests/test_runtime_conventions.py](/Users/gino/Documents/Github/gino-skills/tests/test_runtime_conventions.py)

用于锁定 shared client、worker 输出契约、runtime state 约定等能力。

## 给作者的结论

这次优化的核心价值，不是“把 skill 文档写得更漂亮”，而是把整个 skills 体系从“很多经验散落在 markdown 里”推进成了“有治理规则、有 lint、有 worker、有 shared client、有验证层、有 runtime 约定”的状态。

按最初的目标来看：

- **问题 1、3、5、7：基本已经解决**
- **问题 2、6：大部分解决，后续仍可继续收口**
- **问题 4：已经从无规范状态推进到有统一 runtime 体系，但 legacy 兼容尚未完全移除**

如果后续还要继续推进，最有价值的方向不是重新设计前 5 个 family，而是：

1. 完成全仓库剩余文档中文化收尾
2. 做 legacy fallback 的最终 removal review
3. 继续把低频 skill/reference 迁到 worker-first + shared runtime 模式

## 提交前复审补充（2026-03-18）

进入 CR 前又补了一轮“可提交性”复审，额外修正了三类问题：

### 1. 低频 CLI worker 的参数透传缺陷

问题：

- 第一版 `bili_*_worker.py` / `xhs_*_worker.py` 只识别 `--subcommand`
- 文档里的 `--subtitle`、`--sort`、`--title`、`--body` 等下游参数会被 Python 自己先报错
- 会导致 worker-first 示例不能真正运行

修复：

- 改为 `parse_known_args()`，把未知参数完整透传给下游 CLI
- 现在以下场景可以按文档预期进入真实命令：
  - `python3 scripts/examples/bili_fetch_worker.py --subcommand video BV1xxxx --subtitle`
  - `python3 scripts/examples/xhs_action_worker.py --subcommand post --title ... --body ...`

### 2. BestBlogs 资源读取 worker 补齐关键词检索

问题：

- `create-podcast` / `create-video` 文档已经改成用 `bestblogs_fetch_resources.py`
- 但最初版本没有 `--keyword`
- “按关键词搜索相关报道” 这条主路径因此和文档不一致

修复：

- 为 `scripts/examples/bestblogs_fetch_resources.py` 增加 `--keyword`
- 现在 worker 能覆盖搜索补充场景，而不只是分类拉取

### 3. `.gitignore` 收口 runtime / cache 文件

新增忽略项：

- `.gino-skills/`
- `__pycache__/`
- `*.pyc`

原因：

- `.gino-skills/` 是仓库内 stable state / runtime fallback 根目录，不应进入 CR
- Python 缓存文件没有提交价值

### 本轮复审结论

- 当前改动已经从“治理实施中”推进到“适合发起 CR”的状态
- 保留的 legacy fallback 是有意保留的兼容窗口，不是遗漏
- 剩余英文主要集中在 `Use when` 触发位、schema 字段名和 CLI `Usage` 文本，属于可接受范围
