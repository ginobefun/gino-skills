# BestBlogs 与 XGo 第 4 阶段实施计划

> **给 Claude：** 必须使用 `superpowers:executing-plans` 按任务逐步执行这份计划。

**目标：** 将导航段落和 gotcha 模式扩展到 `bestblogs-*` 和剩余的 `xgo-*` skills，并把 BestBlogs 处理类 skill 中共享的 fetch/analyze/translate 职责真正拆出去。

**架构：** 更新 style guide 和 lint 规则，为 family 级段落要求先写失败测试，创建 3 个新的 worker skill，然后把现有 `bestblogs-process-*` 改写成 orchestrator，通过路由 worker 保留内容类型特有逻辑。

**技术栈：** Markdown、Python 3 标准库、unittest

---

### 任务 1：记录第 4 阶段标准

**文件：**
- 新建：`docs/plans/2026-03-18-bestblogs-xgo-stage-4.md`
- 新建：`docs/plans/2026-03-18-bestblogs-xgo-stage-4-implementation.md`
- 修改：`docs/skill-style-guide.md`

**步骤 1：记录 family 级结构要求**

明确规定：
- 所有 `bestblogs-*` 和 `xgo-*` skills 都应该暴露四个导航段落
- process orchestrator 应路由到 worker skills，而不是重复定义共享 worker 逻辑

### 任务 2：补失败测试

**文件：**
- 修改：`tests/test_skill_lint.py`

**步骤 1：为 family 级段落写测试**

覆盖：
- 缺少段落的 `bestblogs-*` skill 会失败
- 缺少段落的 `xgo-*` skill 会失败
- 新 worker skill 具备段落时可以通过

**步骤 2：运行测试确认先失败**

```bash
python3 -m unittest tests.test_skill_lint -v
```

预期：
- 因为尚未实现 family 级正文段落校验而失败

### 任务 3：扩展 lint

**文件：**
- 修改：`scripts/lint_skills.py`

**步骤 1：对 family 模式强制要求段落**

为以下路径强制要求导航段落：
- `skills/bestblogs-*/SKILL.md`
- `skills/xgo-*/SKILL.md`
- 第 3 阶段迁移过的非 family 文件

**步骤 2：重新运行测试**

```bash
python3 -m unittest tests.test_skill_lint -v
```

预期：
- 所有测试通过

### 任务 4：创建 worker skills

**文件：**
- 新建：`skills/bestblogs-fetch-pending-content/SKILL.md`
- 新建：`skills/bestblogs-analyze-content/SKILL.md`
- 新建：`skills/bestblogs-translate-analysis-result/SKILL.md`

**步骤 1：补 frontmatter 和导航段落**

每个 worker skill 必须包含：
- `name`
- `description`
- `When to Use`
- `When Not to Use`
- `Gotchas`
- `Related Skills`

**步骤 2：定义 worker 边界**

- fetch worker 负责队列查询和原始内容获取
- analyze worker 负责结构化分析生成与保存
- translate worker 负责已保存分析结果的翻译与保存

### 任务 5：更新 BestBlogs skills

**文件：**
- 修改所有现有 `skills/bestblogs-*/SKILL.md`

**步骤 1：加入导航段落**

在文档顶部附近插入 4 个必需段落。

**步骤 2：重构 `bestblogs-process-*`**

对于：
- `bestblogs-process-articles`
- `bestblogs-process-podcasts`
- `bestblogs-process-videos`

加入：
- 薄 orchestrator 定位
- 到 fetch/analyze/translate worker 的显式路由
- 内容类型特有的边界说明

### 任务 6：更新剩余 XGo skills

**文件：**
- 修改尚未迁移的 `skills/xgo-*/SKILL.md`

**步骤 1：加入导航段落**

插入：
- `When to Use`
- `When Not to Use`
- `Gotchas`
- `Related Skills`

路由语言要尽量简洁，并明确 sibling 边界。

### 任务 7：验证迁移

**文件：**
- 修改：`docs/skill-style-guide.md`
- 修改：`scripts/lint_skills.py`
- 修改：`tests/test_skill_lint.py`
- 修改：目标 `skills/bestblogs-*/SKILL.md`
- 修改：目标 `skills/xgo-*/SKILL.md`
- 新建：worker `skills/bestblogs-*/SKILL.md`

**步骤 1：运行测试**

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

**步骤 3：审查 diff**

```bash
git diff -- docs/skill-style-guide.md scripts/lint_skills.py tests/test_skill_lint.py docs/plans skills/bestblogs-* skills/xgo-*
```

预期：
- 只出现标准文档、lint、测试、family skill 更新以及新的 worker skills
