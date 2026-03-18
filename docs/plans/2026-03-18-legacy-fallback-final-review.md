# Legacy Fallback 最终移除评审

## 评审目标

在提交前确认两件事：

1. 仓库里是否还有真实的 legacy `EXTEND.md` 配置文件阻塞移除。
2. 运行时代码里的 legacy fallback 是否应该在这次提交中直接删除。

## 当前事实

### 本机实况

- 已扫描仓库与用户级默认查找路径。
- 当前没有发现任何真实存在、仍在被使用的 `EXTEND.md` 文件。
- 已迁移到 `config.json` / stable state 的 family 不受 legacy 文件影响。

### 仍保留 runtime fallback 的代码家族

当前仍保留 legacy `EXTEND.md` 读取能力的 family 共 4 个：

1. `image-gen`
2. `post-to-wechat`
3. `cover-image`
4. `article-illustrator`

对应 loader 仍在代码中存在，但当前机器上没有活跃 legacy 文件命中。

## 评审结论

### 是否存在“本地数据阻塞”

结论：**没有**。

以当前机器和当前仓库状态看，移除 legacy fallback 不会导致本地配置丢失，因为：

- 没有真实 `EXTEND.md` 文件需要迁移
- 相关高频 skill 已全部支持 `config.json`
- 文档主流程也已经切到 `config.json`

### 是否建议“这次提交直接删除所有 fallback”

结论：**这次提交不直接删除运行时代码中的 fallback，保留兼容窗口；但从评审角度看，已经具备下一次 breaking-change PR 中删除的条件。**

原因：

1. 这次提交的目标是收尾治理，而不是引入潜在的行为破坏。
2. 仓库内已经没有活跃 blocker，但仍无法证明其他机器或旧工作目录不存在历史 `EXTEND.md`。
3. 现有文档、审计、弃用路线已经足够明确，继续保留一小段兼容窗口的边际成本很低。

## 建议动作

### 本次提交保留

- 保留 4 个 family 的 runtime fallback 代码
- 保留 `deprecation-roadmap.md` 中的移除评审节点
- 保留文档中的兼容附录，但不再出现在主流程

### 下一次 breaking-change PR 可执行

满足以下条件时，可以直接删除 legacy fallback：

1. 发布说明明确写出 `EXTEND.md` 不再支持
2. 再次扫描目标机器，确认无残留 `EXTEND.md`
3. 同步删掉：
   - `loadConfigWithLegacy` 的 legacy 路径分支
   - `project_extend` / `user_extend` 相关示例输出
   - 各 skill 文档附录中的 `EXTEND.md` 路径说明

## 最终判断

- **本地迁移阻塞**：无
- **本次提交是否立即移除 fallback**：否
- **是否已经达到“可进入最终删除 PR”的状态**：是
