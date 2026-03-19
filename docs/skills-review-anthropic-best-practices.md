# Skills 项目深度 Review：基于 Anthropic "Lessons from Building Claude Code" 最佳实践

## Context

基于 Anthropic 官方文章 "Lessons from Building Claude Code: How We Use Skills" 中总结的 9 大 Skill 类型和 12 条最佳实践，对本项目 43 个 skills 进行全面审视。目标不是逐个 skill 挑错，而是从架构层面识别结构性优势、缺口和改进机会。

---

## 一、Skill 类型覆盖度分析

### 已覆盖（4/9 类型，且深度很好）

| 文章类型 | 本项目对应 | 评价 |
|---------|-----------|------|
| **Data Fetching & Analysis** | xgo-fetch-tweets, xgo-search-tweets, xgo-view-profile, bestblogs-fetcher, bestblogs-fetch-pending-content, bili-fetch-content, xhs-fetch-content, xgo-track-kol, xgo-digest-tweets, content-analytics | ✅ **最强项**，覆盖 4 个平台（X/BestBlogs/B站/小红书），有原子读取和 AI 分析两层 |
| **Business Process & Team Automation** | daily-content-management, daily-content-curator, reading-workflow, content-synthesizer, bestblogs-daily-digest, bestblogs-weekly-curator, bestblogs-weekly-blogger | ✅ **亮点**，Content OS 五件套是教科书级的编排模式 |
| **Library & API Reference** | remotion-best-practices | ⚠️ 仅 1 个，且只有 61 行，属于最薄弱的已覆盖类型 |
| **Code Scaffolding & Templates** | cover-image, article-illustrator（模板驱动的内容生成） | ⚠️ 勉强归类，这些更像 Content Creation 而非代码脚手架 |

### 未覆盖（5/9 类型）

| 文章类型 | 缺失分析 | 建议 |
|---------|---------|------|
| **Product Verification** | 无任何验证类 skill。43 个 skill 均无自动化测试或输出校验机制 | **高优先级** — 见下方建议 |
| **Code Quality & Review** | 无。CLAUDE.md 有编写规范但未转化为可执行的 review skill | **中优先级** — skill 数量到 43 后，质量守护变得重要 |
| **CI/CD & Deployment** | 无。skill 安装仍是手动 symlink | **低优先级** — 个人项目影响较小 |
| **Runbooks** | 无。遇到 API 故障、频率限制等问题时缺少结构化排障流程 | **中优先级** — XGo API 依赖重，排障场景真实存在 |
| **Infrastructure Operations** | 无。contents/ 目录清理、过期缓存处理等无自动化 | **低优先级** — 可通过简单脚本解决 |

### 独有类型（文章未提及但本项目有）

本项目有一个文章未覆盖的独特类型：**Content Distribution Skills**（post-to-x, post-to-wechat, send-wechat-group-message）。这些结合了浏览器自动化 + CDP 协议 + 剪贴板操作，是非常有创意的 skill 用法。

---

## 二、12 条最佳实践逐项评估

### ✅ 做得好的（7/12）

**1. Use the File System & Progressive Disclosure**
- **评分：优秀**
- 36/43 skill 有 references/ 目录，大量使用 `完整 API 参数详情见 references/api_reference.md` 指针
- cover-image 有 10+ 子目录（config/, dimensions/, palettes/, renderings/, workflow/），是渐进加载的范例
- SKILL.md 行数控制在 400 行以内，细节全部外推

**2. The Description Field Is For the Model**
- **评分：优秀**
- 全部 43 个 skill 使用 "Use when" 模式，聚焦触发条件而非功能列表
- 23 个 skill 显式标注了 sibling skill 边界（如 "话题搜索请使用 xgo-search-tweets"）
- 完全符合 style guide 要求

**3. Build a Gotchas Section**
- **评分：良好**
- 14/15 抽样 skill 有独立 Gotchas 区块，内容聚焦真实踩坑（如 sortType 默认值、success 字段检查）
- 编排类 skill 的 gotchas 特别实用（"不要在这里重新定义 worker skill 的细节规则"）
- **改进空间**：gotchas 目前像是一次性写入的，缺少持续迭代积累的痕迹

**4. Store Scripts & Generate Code**
- **评分：良好**
- 9 个 skill 有 scripts/ 目录，最复杂的 post-to-wechat 有 10+ TypeScript 文件
- image-gen 用 main.ts + providers/ 架构让 Claude 专注编排而非重写生成逻辑
- x-actions 的 CDP 脚本库（cdp-lib.ts + 具体操作脚本）是 "给 Claude 代码而非指令" 的好例子
- **不足**：34 个 skill 没有脚本，某些重复的 curl 编排逻辑可以抽取为共享脚本

**5. Think through the Setup**
- **评分：良好**
- image-gen 有完整的首次配置流程：检测 config.json → 未找到则阻塞引导设置 → 写入后继续
- 使用 `${CLAUDE_PLUGIN_DATA}` 做持久存储路径
- **不足**：大多数 skill 的 setup 仅限于检查环境变量是否存在，缺少引导式配置

**6. Avoid Railroading Claude**
- **评分：良好**
- 编排类 skill 明确定义了 boundary（"本 skill 只负责定义阶段顺序、确认点和 handoff"）
- Worker skill 有清晰的 "When to Use / When Not to Use" 边界
- curl 示例给出了具体的参数但说明了意图到参数的映射逻辑
- **改进空间**：部分 BestBlogs processing skill 步骤较为刻板，可以给 Claude 更多判断空间

**7. Memory & Storing Data**
- **评分：良好**
- image-gen: config.json 持久化用户偏好
- deep-reading: `${CLAUDE_PLUGIN_DATA}` 存分析历史
- Content OS: workspace 共享中间数据，避免重复 API 调用
- style-profile.md: 写作风格画像持久化
- **不足**：仅少数 skill 利用了记忆机制，很多 skill 可以受益（如 xgo-digest-tweets 记住上次摘要时间、bestblogs-content-reviewer 记住审核标准的微调）

### ⚠️ 需要改进的（3/12）

**8. Don't State the Obvious**
- **评分：中等**
- 很多 skill 包含 Claude 已经知道的通用知识（如 JSON 解析方式、markdown 格式化规则、基础 curl 语法）
- 认证区块的模板在 43 个 skill 中重复出现，可以提取为共享约定
- 错误处理模板也大量重复
- **建议**：将通用模式（认证、错误处理、分页）提取到项目级共享引用，每个 skill 只写特有内容

**9. Composing Skills**
- **评分：中等**
- Content OS 五件套有良好的组合关系：manage-daily-content → curate-daily-content → guide-reading → synthesize-content → post-to-x/wechat
- Related Skills 区块在大多数 skill 中存在
- **不足**：组合关系仅通过 "Related Skills" 文本描述，没有结构化的依赖声明；Claude 需要靠名称匹配来发现依赖的 skill 是否已安装

**10. Distributing Skills**
- **评分：中等**
- 有 symlink 安装机制和批量安装脚本
- 与 baoyu-skills、skills-anthropics 有协同关系
- **不足**：没有版本管理、没有 plugin marketplace 集成、没有安装后验证

### ❌ 缺失的（2/12）

**11. On Demand Hooks**
- **评分：缺失**
- **0 个 skill 使用了 hooks 配置**，这是最大的功能盲区
- 文章示例的 `/careful`（阻止危险操作）和 `/freeze`（锁定编辑范围）模式在本项目完全适用：
  - 写操作 skill（manage-follows, manage-bookmarks, x-actions）可以注册 PreToolUse hook 做二次确认
  - 发布 skill（post-to-x, post-to-wechat）可以在发送前强制预览
  - 批量处理 skill 可以注册 PostToolUse hook 做进度追踪

**12. Measuring Skills**
- **评分：缺失**
- 无任何 skill 使用追踪或分析机制
- 不知道哪些 skill 被频繁使用、哪些 undertriggering
- 43 个 skill 的 description 触发效果无法量化评估

---

## 三、结构性问题

### 3.1 重复模板膨胀
- 认证区块（~10 行）在所有 XGo/BestBlogs skill 中逐字重复
- 错误处理模板（~15 行）在所有 API skill 中重复
- 这些重复加起来占用了每个 skill 约 25-30 行的配额（总预算 400 行的 6-7%）
- **建议**：创建 `references/shared/auth.md` 和 `references/shared/error-handling.md`，各 skill 引用而非内联

### 3.2 Description 语言不一致
- 20/43 skill 混用英文 "Use when" + 中文正文
- 23/43 skill 纯中文（"Use when 用户想..."）
- 功能上无影响（模型都能理解），但作为 43 个 skill 的集合，一致性有助于维护
- **建议**：统一为全中文或全英文（考虑到项目和用户主要是中文环境，建议统一为中文 description）

### 3.3 Skill 粒度不均
- BestBlogs 有 16 个 skill（部分粒度非常细，如 bestblogs-analyze-content 仅 70 行、bestblogs-translate-analysis-result 仅 72 行）
- 这些超细粒度 skill 更像是函数而非独立能力，它们的 description 也难以让 Claude 自然触发
- **建议**：考虑将 bestblogs-analyze-content + bestblogs-translate-analysis-result + bestblogs-fetch-pending-content 合并为一个 `bestblogs-pipeline-worker` skill，由编排器调度

### 3.4 缺少验证层
- 43 个 skill 中没有一个包含输出验证机制
- 例如：bestblogs-daily-digest 生成 HTML 但没有验证 HTML 是否正确渲染
- create-podcast 生成音频但没有验证音频是否可播放
- post-to-x 发布推文但没有验证发布是否成功（仅依赖 API 返回）
- **建议**：为关键产出 skill 添加验证步骤（至少是 smoke test 级别）

---

## 四、优先级建议（按影响力排序）

### P0 — 高影响、低成本

1. **添加 On Demand Hooks**
   - 为写操作类 skill 添加 `hooks` 配置（PreToolUse 安全门控）
   - 为发布类 skill 添加发送前预览 hook
   - 预计工作量：每个 skill 几行 YAML
   - 参考文章示例：`/careful` 模式

2. **提取共享模板减少重复**
   - 创建 `skills/_shared/auth-xgo.md`、`skills/_shared/error-handling-xgo.md`
   - 各 skill 改为引用（"认证方式见 `../_shared/auth-xgo.md`"）
   - 每个 XGo skill 可释放 25-30 行空间用于更有价值的内容

3. **持续迭代 Gotchas**
   - 建立机制：每次 skill 执行出错时，将 gotcha 追加到对应 SKILL.md
   - 文章强调这是 "highest-signal content"
   - 目前 gotchas 看起来像一次性写入的，缺少迭代痕迹

### P1 — 高影响、中成本

4. **创建 Skill Verification 技能**
   - 新建 `skill-verifier` skill：验证一个 skill 的 SKILL.md 是否符合项目规范（行数、必需区块、description 格式等）
   - 可以作为新 skill 提交前的 quality gate
   - 对应文章的 "Product Verification" 和 "Code Quality & Review" 两个类型

5. **添加 Skill 使用追踪**
   - 参考文章提到的 PreToolUse hook 日志方案
   - 记录每个 skill 的触发次数、触发上下文、完成率
   - 用于识别 undertriggering 的 skill 和 description 需要优化的 skill

6. **合并超细粒度 BestBlogs skills**
   - 将 bestblogs-analyze-content (70行) + bestblogs-translate-analysis-result (72行) + bestblogs-fetch-pending-content (85行) 合并
   - 这三个 skill 是 pipeline 步骤而非独立能力，单独存在增加了 Claude 的选择负担

### P2 — 中影响、中成本

7. **创建 XGo API Runbook**
   - 新建 `xgo-troubleshooter` skill：症状 → 诊断 → 修复
   - 覆盖：API Key 过期、频率限制、会员等级不足、接口变更等场景
   - 对应文章的 "Runbooks" 类型

8. **增强 Memory 使用**
   - xgo-digest-tweets：记住上次摘要时间戳，避免重复内容
   - bestblogs-content-reviewer：记住审核偏好调整
   - content-analytics：积累历史数据做趋势分析
   - 使用 `${CLAUDE_PLUGIN_DATA}` 持久存储

9. **减少 "Don't State the Obvious" 内容**
   - 审查每个 skill 中 Claude 已知的通用知识（JSON 解析、markdown 格式、curl 基础语法）
   - 删除这些内容，用释放的空间补充更多 gotchas 和真实 edge case

### P3 — 低优先级

10. **统一 Description 语言**
11. **探索 Plugin Marketplace 分发**
12. **为 remotion-best-practices 补充内容**（目前仅 61 行，作为 Library & API Reference 类型太薄）

---

## 五、验证计划

Review 完成后，通过以下方式验证改进效果：

1. **对比测试**：选择 3 个改进过的 skill，在实际使用中对比改进前后的执行成功率
2. **Gotchas 覆盖率**：在使用 skill 过程中记录新发现的 edge case，检查是否已在 gotchas 中覆盖
3. **Hook 验证**：手动触发写操作 skill，确认 hook 是否正确拦截并要求确认
4. **Description 触发测试**：用自然语言描述意图，检查 Claude 是否能正确选择对应 skill

---

## 六、总结

本项目在 **Data Fetching & Analysis** 和 **Business Process Automation** 两个维度做到了业界领先水平，Content OS 五件套的编排模式和渐进加载架构值得作为 skill 开发的参考案例。

最大的结构性缺口是 **Hooks（零使用）** 和 **验证/度量（零覆盖）**，这两项恰好是文章强调的将 skill 从 "能用" 提升到 "好用" 的关键机制。

43 个 skill 的规模已经到了需要 **元管理** 的阶段 — 需要 skill 来管理 skill（验证器、度量器、排障手册），而不仅仅是不断增加新的功能 skill。
