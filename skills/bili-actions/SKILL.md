---
name: bili-actions
description: "Use when 用户想在 Bilibili 执行写操作，例如点赞、投币、三连、发布动态、删除动态或取消关注。"
---

# B站操作 (Bilibili Actions)

通过 bilibili-cli 命令行工具在B站执行写操作。支持点赞、投币、三连、发布/删除动态、取关等。

完整命令参数详情见 `references/api_reference.md`。

## Worker Entrypoints

- `python3 scripts/examples/bili_action_worker.py --subcommand like BV1xxxxxxxxx`
- `python3 scripts/examples/bili_action_worker.py --subcommand triple BV1xxxxxxxxx`
- `python3 scripts/examples/bili_action_worker.py --subcommand dynamic-post "动态内容"`

这些入口统一了写操作的结构化输出，便于上游编排器记录批次、失败和用户确认状态。

## Shared Runtime

- 主路径优先走 `scripts/examples/bili_action_worker.py`
- 用户确认、批量执行和结果记录应由 orchestrator 负责
- 原始 `bili ... --yaml` 仅作为调试或手工验证路径

## 前置条件

需要安装 bilibili-cli 并登录：

```bash
uv tool install bilibili-cli
bili login  # QR码扫码登录
```

## 可用命令

| 命令 | 类型 | 用途 |
|------|------|------|
| `bili like` | 写操作 | 点赞视频 |
| `bili coin` | 写操作 | 投币视频 |
| `bili triple` | 写操作 | 一键三连（点赞+投币+收藏） |
| `bili dynamic-post` | 写操作 | 发布文字动态 |
| `bili dynamic-delete` | 写操作 | 删除动态 |
| `bili unfollow` | 写操作 | 取关UP主 |

**⚠️ 所有写操作必须在用户明确确认后才能执行。**

## 核心工作流

### 场景一：视频互动

**写操作 — 必须在用户明确确认后才能调用**

```bash
python3 scripts/examples/bili_action_worker.py --subcommand like BV1xxxxxxxxx
python3 scripts/examples/bili_action_worker.py --subcommand coin BV1xxxxxxxxx
python3 scripts/examples/bili_action_worker.py --subcommand triple BV1xxxxxxxxx
```

**执行流程**:
1. 展示要操作的视频信息（标题、UP主、BV号）
2. ⛔ 等待用户明确确认
3. 执行操作
4. 报告结果

### 场景二：发布动态

**写操作 — 必须在用户明确确认后才能调用**

```bash
python3 scripts/examples/bili_action_worker.py --subcommand dynamic-post "动态文本内容"
```

**执行流程**:
1. 展示要发布的动态内容预览
2. ⛔ 等待用户明确确认
3. 执行发布
4. 报告发布结果

### 场景三：删除动态

**写操作 — 必须在用户明确确认后才能调用**

```bash
python3 scripts/examples/bili_fetch_worker.py --subcommand my-dynamics
python3 scripts/examples/bili_action_worker.py --subcommand dynamic-delete <dynamic_id>
```

**执行流程**:
1. 列出用户动态供选择
2. 展示要删除的动态内容
3. ⛔ 等待用户明确确认
4. 执行删除

### 场景四：取关UP主

**写操作 — 必须在用户明确确认后才能调用**

```bash
python3 scripts/examples/bili_action_worker.py --subcommand unfollow <UID>
```

**执行流程**:
1. 展示要取关的UP主信息
2. ⛔ 等待用户明确确认
3. 执行取关

## 批量操作规则

- 每批最多 **5 个**操作，逐批输出进度
- 单个失败不中断整批，记录 ❌ 和错误信息并继续
- 连续失败超过 **3 次**时暂停，告知用户可能是系统性问题
- 空结果时给出友好提示

### 批量互动示例

```
- [ ] 阶段一：确认操作列表
- [ ] 阶段二：用户确认 ⛔ BLOCKING
- [ ] 阶段三：分批执行（每批 5 个）
- [ ] 阶段四：汇报结果
```

## 参数调整

| 用户意图 | 命令 |
|---------|------|
| "给这个视频点赞" | `bili like <BV_ID> --yaml` |
| "投个币" | `bili coin <BV_ID> --yaml` |
| "三连" / "一键三连" | `bili triple <BV_ID> --yaml` |
| "发条动态" | `bili dynamic-post "内容" --yaml` |
| "删除动态" | `bili dynamic-delete <ID> --yaml` |
| "取关这个UP主" | `bili unfollow <UID> --yaml` |

## 输出格式

```markdown
## B站操作结果

### ✅ 点赞成功
- **视频**: 视频标题
- **BV号**: BV1xxxxxxxxx
- **操作**: 点赞

### ❌ 投币失败
- **视频**: 视频标题
- **BV号**: BV1xxxxxxxxx
- **错误**: 错误信息
```

## 错误处理

- 命令未找到：提示安装 `uv tool install bilibili-cli`
- 未登录：提示运行 `bili login` 扫码登录
- 视频不存在：BV 号错误或视频已删除
- 已操作过：如已点赞/已投币，不重复操作
- 币不足：投币时余额不足
- 网络错误：检查网络连接，重试一次
