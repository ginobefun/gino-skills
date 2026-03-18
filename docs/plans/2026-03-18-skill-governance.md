# Skill 治理实施计划

> **给 Claude：** 必须使用 `superpowers:executing-plans` 按任务逐步执行这份计划。

**目标：** 为仓库建立 skill 级治理规范，用 lint 强制执行，并统一所有 skill 的 frontmatter `description`。

**架构：** 在 `docs/` 下新增可读的风格指南，在 `scripts/` 下新增零依赖 Python lint 命令，在 `tests/` 下新增一小组 unittest。然后把所有 `SKILL.md` 的 frontmatter `description` 重写成“只描述何时触发”的形式，不改正文结构。

**技术栈：** Markdown、Python 3 标准库、unittest

---

### 任务 1：定义仓库标准

**文件：**
- 新建：`docs/skill-style-guide.md`
- 新建：`docs/plans/2026-03-18-skill-governance.md`

**步骤 1：编写风格指南**

文档中需要明确 frontmatter 规则：
- 只支持 `name` 和 `description`
- `description` 必须以 `Use when` 开头
- `description` 只能描述触发条件
- 不要写工作流摘要、触发短语清单或能力堆砌
- 如有必要，只做简短的 sibling 区分

同时定义推荐的正文结构：
- `Overview`
- `When to Use`
- `When Not to Use`
- `Setup`
- `Workflow`
- `Gotchas`
- `Related Skills`

**步骤 2：加入示例**

包括：
- 当前仓库里常见的不良 description 写法
- 修正后的 `Use when ...` 示例
- 双语或领域型触发词的编写建议

### 任务 2：用测试锁定规则

**文件：**
- 新建：`tests/test_skill_lint.py`

**步骤 1：先写失败测试**

为以下规则添加 unittest：
- 合法 skill frontmatter 可以通过
- 不是 `Use when` 开头的 description 会失败
- 存在不支持的 frontmatter 字段会失败
- 过长的 description 会失败
- description 中包含 `适用场景`、`触发短语` 之类清单型字样会失败

**步骤 2：运行测试，确认先失败**

```bash
python3 -m unittest tests.test_skill_lint -v
```

预期：
- 在 lint 模块实现前出现导入失败或断言失败

### 任务 3：实现零依赖 Skill Lint

**文件：**
- 新建：`scripts/lint_skills.py`

**步骤 1：实现 frontmatter 解析**

只使用 Python 标准库实现：
- 发现 `skills/*/SKILL.md`
- 解析类 YAML frontmatter
- 强制只允许 `name` 和 `description`
- 以可读方式输出具体文件的失败原因

**步骤 2：补 CLI 行为**

支持：
- 默认扫描 `skills/*/SKILL.md`
- 可选显式传入路径
- 全部通过时退出码为 `0`，否则非 `0`

**步骤 3：运行测试**

```bash
python3 -m unittest tests.test_skill_lint -v
```

预期：
- 所有测试通过

### 任务 4：统一仓库 Frontmatter

**文件：**
- 修改：`skills/*/SKILL.md`

**步骤 1：重写 description**

对每个 skill：
- 保留现有 `name`，除非它本身不合法
- 将 `description` 改为简洁的、只描述触发条件的形式
- 删除工作流摘要、枚举式用例、触发短语清单
- 有必要时补充 sibling 边界

**步骤 2：抽样检查几类 family**

至少检查：
- `bestblogs-*`
- `xgo-*`
- `daily-content-*`
- 媒体 / 发布类技能

### 任务 5：验证仓库状态

**文件：**
- 修改：`docs/skill-style-guide.md`
- 修改：`scripts/lint_skills.py`
- 修改：`tests/test_skill_lint.py`
- 修改：`skills/*/SKILL.md`

**步骤 1：运行测试**

```bash
python3 -m unittest tests.test_skill_lint -v
```

预期：
- 所有测试通过

**步骤 2：对全仓库运行 lint**

```bash
python3 scripts/lint_skills.py
```

预期：
- 零违规

**步骤 3：审查变更**

```bash
git diff -- docs/skill-style-guide.md scripts/lint_skills.py tests/test_skill_lint.py skills
```

预期：
- 只出现治理文档、lint 工具、测试和 frontmatter 改写相关变更
