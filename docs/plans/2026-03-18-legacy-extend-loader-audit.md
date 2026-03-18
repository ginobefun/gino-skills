# Legacy `EXTEND.md` 读取器审计

日期：2026 年 3 月 18 日

## 目的

这份审计用来列出仓库里哪些 family 仍然有真实代码路径在读取 legacy `EXTEND.md`，并把它们与“只在文档中残留 legacy 说明”的 skill 区分开。

## 结论

当前仍然在运行时读取 legacy `EXTEND.md` 的活跃 loader family 一共有 4 个：

1. `image-gen`
2. `post-to-wechat`
3. `cover-image`
4. `article-illustrator`

它们是当前唯一需要在真正删除 legacy 读取前做 removal review 的 family。

这一轮发现的其他命中，主要属于以下几类：

- 只出现在文档中的 legacy 提及
- 路径元数据 helper
- 只是把已审计 loader 的路径暴露出来的兼容示例脚本

## 仍在读取 Legacy `EXTEND.md` 的 Family

### 保留到 2026 年 9 月 30 日评审点

#### `image-gen`

实际运行时 loader：
- [main.ts](/Users/gino/Documents/Github/gino-skills/skills/image-gen/scripts/main.ts)

为什么现在还要保留：
- production image generation already loads config via `loadConfigWithLegacy`
- model/provider defaults may still exist in user `EXTEND.md`
- removing fallback immediately would create a silent config regression for existing users

建议：
- 保留 legacy 读取，直到 2026 年 9 月 30 日的移除评审
- 真正移除前，先扫描本地和用户级配置目录，确认是否仍有活跃 `EXTEND.md`

#### `post-to-wechat`

实际运行时 loader：
- [extend-config.ts](/Users/gino/Documents/Github/gino-skills/skills/post-to-wechat/scripts/md/extend-config.ts)

为什么现在还要保留：
- current markdown-to-wechat path still reads legacy formatting defaults
- it also supports the historical alias `baoyu-markdown-to-html`
- removing fallback too early risks changing output formatting behavior

建议：
- 保留 legacy 读取，直到 2026 年 9 月 30 日的移除评审
- 在最终移除清单里把旧 alias 路径一并纳入检查

#### `cover-image`

Actual runtime loader:
- [cover_image_config.ts](/Users/gino/Documents/Github/gino-skills/scripts/shared/cover_image_config.ts)

Why it still needs to stay:
- this family was migrated recently and still explicitly supports legacy preference files
- users may have watermark / quick-mode / palette defaults only in `EXTEND.md`

建议：
- 在当前迁移窗口内继续保留 legacy 读取
- 只有确认 `config.json` 已被采用后再移除

#### `article-illustrator`

Actual runtime loader:
- [article_illustrator_config.ts](/Users/gino/Documents/Github/gino-skills/scripts/shared/article_illustrator_config.ts)

Why it still needs to stay:
- same migration pattern as `cover-image`
- legacy style and watermark preferences may still exist only in `EXTEND.md`

建议：
- 在当前迁移窗口内继续保留 legacy 读取
- 只有确认 `config.json` 已被采用后再移除

## 可以先停止把 Legacy 当主路径的 Family

这些 family 当前没有真实运行时代码在读 `EXTEND.md`，所以可以更激进地从文档和后续实现里淡化 legacy：

### `post-to-x`

当前状态：
- 文档里仍然提到 legacy fallback
- 仓库代码里目前没有真实 runtime loader 在读取这个 skill 的 `EXTEND.md`

建议：
- 可以安全地停止把 legacy fallback 当作活跃 runtime 依赖
- 未来如果新增 config loader，应默认 `config.json` 优先，只有存在真实迁移需求时才加 legacy 读取

### `create-podcast`

当前状态：
- 文档里提到 intro name / speech settings 等 legacy 偏好
- 仓库代码里目前没有真实 runtime loader 在读取 `EXTEND.md`

建议：
- 可以把 legacy support 视为历史 / 文档兼容，而不是运行时依赖
- 后续实现应直接读取 `config.json`

### 其他内容工作流技能

Examples:
- `manage-daily-content`
- `guide-reading`
- `content-synthesizer`
- `create-video`

当前状态：
- 这些技能依赖的是 stable state 和内容产物，而不是 legacy `EXTEND.md` loader

建议：
- legacy config 读取不是阻塞点
- 清理重点应放在旧路径措辞，而不是 loader 移除

## 不应过度解读的非 Loader 命中

### 路径元数据辅助项

- [runtime_paths.py](/Users/gino/Documents/Github/gino-skills/scripts/shared/runtime_paths.py)

这里仍暴露了 `project_extend` / `user_extend`，但它本身并不读取 legacy config。它只是路径元数据，不是活跃 loader。

### 状态示例脚本

- [cover_image_config_state.ts](/Users/gino/Documents/Github/gino-skills/scripts/examples/cover_image_config_state.ts)
- [article_illustrator_config_state.ts](/Users/gino/Documents/Github/gino-skills/scripts/examples/article_illustrator_config_state.ts)

这些脚本只是继承上面共享 loader 的行为，不能作为额外保留 legacy 读取的独立理由。

### 测试

- [config_loader.test.ts](/Users/gino/Documents/Github/gino-skills/scripts/shared/config_loader.test.ts)

这些测试是故意覆盖 legacy 行为的，只有在底层 loader 真正移除支持后才应该删除。

## 下一步建议

在 2026 年 9 月 30 日的移除评审前，建议做三件事：

1. 盘点当前机器上真实存在的本地 / 用户级 `EXTEND.md` 文件
2. 把仍在使用的值迁移进 `config.json`
3. 然后再从以下 family 中移除 legacy 读取：
   - `image-gen`
   - `post-to-wechat`
   - `cover-image`
   - `article-illustrator`
