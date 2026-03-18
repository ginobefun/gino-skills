# Skill 正文结构阶段 3 实施计划

> **给 Claude：** 必须使用 `superpowers:executing-plans` 按任务逐步执行这份计划。

**目标：** 为最高频 skill 增加便于扫描的正文段落，对最臃肿的 orchestrator 做软拆分，并扩展 lint 来验证第一波迁移。

**架构：** 更新 style guide 和 lint 预期，为强制正文段落先写失败测试，然后修改目标 `SKILL.md`，在顶部加入路由导向段落，并对部分非 family skill 使用更易记的动宾式 frontmatter 名称。

**技术栈：** Markdown、Python 3 标准库、unittest

---

### 任务 1：扩展仓库标准

**文件：**
- 修改：`docs/skill-style-guide.md`
- 新建：`docs/plans/2026-03-18-skill-body-structure-stage-3.md`
- 新建：`docs/plans/2026-03-18-skill-body-structure-stage-3-implementation.md`

**步骤 1：记录阶段 3 范围**

补充规范：
- 高频 skill 应暴露 `When to Use`、`When Not to Use`、`Gotchas`、`Related Skills`
- orchestrator 应明确委托边界
- 非 `bestblogs-*` 和非 `xgo-*` 技能在合理情况下优先使用更易记的动宾式命名

### 任务 2：先写失败测试

**文件：**
- 修改：`tests/test_skill_lint.py`

**步骤 1：增加目标段落测试**

覆盖：
- 目标文件缺少必须段落时会失败
- 拥有全部段落的目标文件会通过

**步骤 2：运行测试确认先失败**

```bash
python3 -m unittest tests.test_skill_lint -v
```

预期：
- 因为此时尚未实现正文段落校验而失败

### 任务 3：为目标正文段落实现 lint 支持

**文件：**
- 修改：`scripts/lint_skills.py`

**步骤 1：加入段落校验**

仅对目标 skill 路径要求以下段落：
- `## When to Use`
- `## When Not to Use`
- `## Gotchas`
- `## Related Skills`

**步骤 2：重新运行测试**

```bash
python3 -m unittest tests.test_skill_lint -v
```

预期：
- 测试全部通过

### 任务 4：更新目标 skill

**文件：**
- 修改：`skills/daily-content-management/SKILL.md`
- 修改：`skills/daily-content-curator/SKILL.md`
- 修改：`skills/content-synthesizer/SKILL.md`
- 修改：`skills/reading-workflow/SKILL.md`
- 修改：`skills/deep-reading/SKILL.md`
- 修改：`skills/post-to-x/SKILL.md`
- 修改：`skills/post-to-wechat/SKILL.md`
- 修改：`skills/xgo-fetch-tweets/SKILL.md`
- 修改：`skills/xgo-search-tweets/SKILL.md`

**步骤 1：加入顶部必需段落**

把新增段落插入到每个文件的顶部附近。

**步骤 2：重命名部分 frontmatter `name`**

只改以下字段：
- `daily-content-management` → `manage-daily-content`
- `daily-content-curator` → `curate-daily-content`
- `content-synthesizer` → `synthesize-content`
- `reading-workflow` → `guide-reading`
- `deep-reading` → `read-deeply`

**步骤 3：软拆分 orchestrator**

确保 `daily-content-management` 把自己表述为协调器，并将执行委托给 worker skills，而不是继续把自己写成 worker 逻辑的唯一权威。

### 任务 5：验证迁移

**文件：**
- 修改：`docs/skill-style-guide.md`
- 修改：`scripts/lint_skills.py`
- 修改：`tests/test_skill_lint.py`
- 修改：目标 `skills/*/SKILL.md`

**步骤 1：运行单元测试**

```bash
python3 -m unittest tests.test_skill_lint -v
```

预期：
- 所有测试通过

**步骤 2：运行全仓库 lint**

```bash
python3 scripts/lint_skills.py
```

预期：
- 零违规

**步骤 3：审查迁移 diff**

```bash
git diff -- docs/skill-style-guide.md scripts/lint_skills.py tests/test_skill_lint.py docs/plans skills/daily-content-management/SKILL.md skills/daily-content-curator/SKILL.md skills/content-synthesizer/SKILL.md skills/reading-workflow/SKILL.md skills/deep-reading/SKILL.md skills/post-to-x/SKILL.md skills/post-to-wechat/SKILL.md skills/xgo-fetch-tweets/SKILL.md skills/xgo-search-tweets/SKILL.md
```

预期：
- 只出现标准文档、lint、测试和目标 skill 更新
