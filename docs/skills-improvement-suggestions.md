# Skills 改进建议

> 基于对 38 个 skills 的全面梳理，从定位、命名、使用体验三个维度提出改进建议。

---

## 一、命名改进建议

### 1.1 前缀不一致问题

当前 BestBlogs 系列使用 `bestblogs-` 前缀，XGo 系列使用 `xgo-` 前缀，但 X/Twitter 浏览器操作使用 `x-actions`，内容发布使用 `post-to-x`。建议统一：

| 当前名称 | 建议名称 | 理由 |
|----------|----------|------|
| `x-actions` | `xgo-actions` 或保持 `x-actions` | 与 xgo-* 系列不一致，但 x-actions 走的是 CDP 而非 XGo API，语义上 `x-` 前缀更准确 |
| `post-to-x` | 保持不变 | `post-to-x` 清晰表达"发布到 X"的意图，不依赖 XGo API |
| `post-to-wechat` | 保持不变 | 同上 |

**结论**: 当前命名虽然前缀不完全一致，但语义清晰（xgo-* = XGo API，x-* = Chrome CDP，post-to-* = 发布），**建议保持现状**。

### 1.2 BestBlogs 系列名称过长

`bestblogs-translate-article-result` (36 字符) 和 `bestblogs-article-recommender` (31 字符) 较长。考虑到 Claude Code 的 skill description 是主要触发方式而非名称本身，**长名称影响不大，建议保持不变**。

### 1.3 建议重命名的 Skills

| 当前名称 | 建议名称 | 理由 |
|----------|----------|------|
| `bestblogs-transcribe-youtube` | `bestblogs-transcribe-video` | 未来可能支持非 YouTube 视频，且与 `bestblogs-process-videos` 对齐 |
| `send-wechat-group-message` | `post-to-wechat-group` | 与 `post-to-x` / `post-to-wechat` 形成 `post-to-*` 系列，更一致 |

---

## 二、定位与职责改进建议

### 2.1 功能重叠问题

**问题 1: `x-actions` vs `post-to-x`**

两者都能发推文，职责边界模糊：
- `x-actions`: 发推、回复、引用、转推、点赞（轻量互动）
- `post-to-x`: 发推文、图片、视频、长文 Article（内容发布）

**建议**: 明确分工 —
- `x-actions` → **社交互动**（回复、转推、点赞、引用转发），仅在需要"互动"语境下触发
- `post-to-x` → **内容发布**（原创推文、图片、视频、长文），仅在需要"发布"语境下触发
- 在两者的 SKILL.md description 中明确互斥触发条件

**问题 2: `bestblogs-content-reviewer` vs `daily-content-curator`**

两者都做"筛选推荐"：
- `content-reviewer`: 评审 AI 评分 + 输出推荐阅读清单（BestBlogs 单源）
- `daily-content-curator`: 跨 BestBlogs + Twitter 多维度评分（多源）

**建议**: 这两者定位其实已清晰（单源评审 vs 多源策展），但 `content-reviewer` 的"推荐阅读清单"功能与 `daily-content-curator` 输出有重叠。建议 `content-reviewer` 专注于 **评分评审和纠偏**，推荐阅读清单功能收归 `daily-content-curator`。

**问题 3: `xgo-fetch-tweets` vs `xgo-search-tweets`**

两者都能获取推文，区别在于：
- `fetch-tweets`: 基于时间线/列表/标签等固定源拉取
- `search-tweets`: 基于关键词实时搜索 + 获取特定用户最新推文

**建议**: 定位已清晰，但 `search-tweets` 中"获取特定用户最新推文"的功能与 `view-profile` 有交叉。建议将"看看某人最近发了什么"的触发统一收归 `xgo-view-profile`（获取 profile + 近期推文），`search-tweets` 专注于关键词搜索。

### 2.2 缺失的 Skill

| 建议新增 | 功能 | 理由 |
|----------|------|------|
| `bestblogs-manage-sources` | 订阅源管理（查看、启用/禁用、删除、分类） | 当前只有 `add-source`，缺少管理能力 |
| `content-calendar` | 内容日历/排期管理 | Content OS 缺少发布排期和内容规划工具 |

### 2.3 可考虑合并的 Skills

| 合并候选 | 合并为 | 理由 |
|----------|--------|------|
| ~~`bestblogs-translate-article-result`~~ | ~~已合并到 `bestblogs-process-articles`~~ | ✅ 已完成：分析 ≥80 分自动翻译，无待分析时自动处理待翻译 |
| `bestblogs-process-articles` + `bestblogs-process-tweets` + `bestblogs-process-videos` | `bestblogs-process-content` | 三者工作流模式相同（查询待处理 → 选择 → 逐个处理 → 更新），仅内容类型不同。合并后通过参数区分，减少 3→1 个 skill |
| `cover-image` + `article-illustrator` | 保持分离 | 虽然都生成图片，但触发场景和工作流差异大（单图 vs 多图），保持分离更好 |

---

## 三、使用体验改进建议

### 3.1 Description 触发词优化

以下 skills 的 description 可能导致误触发或漏触发：

| Skill | 问题 | 建议 |
|-------|------|------|
| `image-gen` | 英文 description，中文用户可能不触发 | 添加中文触发短语："生成图片"、"AI画图"、"文生图" |
| `cover-image` | 英文 description | 添加中文触发短语："封面图"、"文章封面"、"生成封面" |
| `article-illustrator` | 英文 description | 添加中文触发短语："文章配图"、"插图生成"、"给文章配图" |
| `create-podcast` | 可能与 "播客推荐" 混淆 | 确保 description 强调"生成/制作"语义，排除"推荐/收听" |
| `x-actions` | 可能与 `post-to-x` 冲突 | 强调"互动"语义：回复、点赞、转推；排除"发布内容" |

### 3.2 Skill 间串联可发现性

当前用户需要记住 skill 组合才能完成完整工作流。建议：

1. **在每个 skill 的输出末尾添加"下一步建议"**，如 `deep-reading` 完成后提示"可以用 'content-synthesizer' 基于分析生成内容"
2. **`daily-content-management` 作为入口**：强化其"总控"角色，让用户说"开始今日内容工作"即可自动编排所有步骤

### 3.3 错误恢复体验

当前 skills 的错误处理是统一模板，建议增加：
- **断点续传**: 批量操作中断后，记录进度到 workspace，下次继续时从断点恢复
- **常见问题自诊断**: 如 API Key 过期、频率限制等，给出明确的修复步骤而非仅报错

---

## 四、架构层面建议

### 4.1 Skill 粒度问题

当前 38 个 skills 中，BestBlogs 系列占 13 个 (34%)。如果 BestBlogs 的 API 功能继续扩展，skill 数量会进一步膨胀。建议：

- **短期**: 维持现状，每个 skill 职责清晰
- **中期**: 考虑将 `bestblogs-process-*` 三兄弟合并为一个 `bestblogs-process-content`
- **长期**: 如果 skill 超过 50 个，考虑引入 skill 分组/命名空间机制（如 `bestblogs/fetcher`）

### 4.2 Content OS 编排层强化

5 个 Content OS skills 是整个体系的"大脑"，但当前 `daily-content-management` 与其他 4 个的关系不够清晰。建议：

- `daily-content-management` 的 SKILL.md 中显式声明它是其他 4 个 skill 的编排器
- 在 description 中添加"每日内容"、"Content OS"、"今日工作"等高频触发词
- 让用户通过一句话（如"今天做什么"）就能进入完整工作流

---

## 五、优先级排序

| 优先级 | 改进项 | 工作量 | 影响 |
|--------|--------|--------|------|
| P0 | 图片生成 skills 添加中文触发短语 | 小 | 直接影响中文用户触发率 |
| P0 | 明确 `x-actions` vs `post-to-x` 职责边界 | 小 | 消除用户困惑 |
| P1 | `send-wechat-group-message` → `post-to-wechat-group` 重命名 | 小 | 统一命名体系 |
| P1 | 强化 `daily-content-management` 作为入口 | 中 | 改善工作流可发现性 |
| ~~P2~~ | ~~合并 `bestblogs-translate-article-result`~~ | ~~小~~ | ✅ 已完成 |
| P2 | 合并 `bestblogs-process-*` 三兄弟 | 大 | 减少 skill 数量 |
| P2 | `content-reviewer` 去除推荐阅读功能 | 中 | 消除与 curator 重叠 |
| P3 | 新增 `content-calendar` | 大 | 补全 Content OS |
