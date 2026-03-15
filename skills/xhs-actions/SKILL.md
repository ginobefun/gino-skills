---
name: xhs-actions
description: "通过 xiaohongshu-cli 在小红书执行操作 — 发布笔记、点赞、收藏、评论、关注/取关。适用场景：(1) 发布小红书笔记（图文），(2) 给笔记点赞/收藏，(3) 评论或回复笔记，(4) 关注/取关用户，(5) 删除自己的笔记或评论。触发短语：'发小红书', '发布笔记', '小红书发帖', 'xhs post', 'xhs publish', '小红书点赞', '小红书收藏', '小红书评论', '小红书关注', '小红书取关', '删除笔记', 'post to xiaohongshu', '发布到小红书', 'like on xhs', 'favorite xhs', 'comment on xhs', '小红书互动'。"
---

# 小红书操作 (Xiaohongshu Actions)

通过 xiaohongshu-cli 命令行工具在小红书执行写操作。支持发布笔记、点赞、收藏、评论、关注/取关等。

完整命令参数详情见 `references/api_reference.md`。

## 前置条件

需要安装 xiaohongshu-cli 并登录：

```bash
uv tool install xiaohongshu-cli
xhs login  # 提取浏览器 cookie
```

**注意**: Cookie 有效期约 7 天，过期需重新登录。

## 可用命令

| 命令 | 类型 | 用途 |
|------|------|------|
| `xhs post` | 写操作 | 发布图文笔记 |
| `xhs delete` | 写操作 | 删除笔记 |
| `xhs like` | 写操作 | 点赞笔记 |
| `xhs favorite` | 写操作 | 收藏笔记 |
| `xhs unfavorite` | 写操作 | 取消收藏 |
| `xhs comment` | 写操作 | 评论笔记 |
| `xhs reply` | 写操作 | 回复评论 |
| `xhs delete-comment` | 写操作 | 删除评论 |
| `xhs follow` | 写操作 | 关注用户 |
| `xhs unfollow` | 写操作 | 取关用户 |

**⚠️ 所有写操作必须在用户明确确认后才能执行。**

## 核心工作流

### 场景一：发布笔记

**写操作 — 必须在用户明确确认后才能调用**

```bash
xhs post --title "笔记标题" --body "笔记正文内容" --images image1.jpg image2.jpg --yaml
```

**执行流程**:
1. 准备笔记内容（标题、正文、图片）
2. 展示发布预览
3. ⛔ 等待用户明确确认
4. 执行发布
5. 报告发布结果（笔记 ID 和链接）

**与 content-synthesizer 联动**: content-synthesizer 产出小红书格式文案后，可直接调用此命令发布。

### 场景二：笔记互动

**写操作 — 必须在用户明确确认后才能调用**

```bash
# 点赞（支持短索引或笔记 ID）
xhs like 1 --yaml
xhs like <note_id> --yaml

# 取消点赞
xhs like <note_id> --undo --yaml

# 收藏
xhs favorite <note_id> --yaml

# 取消收藏
xhs unfavorite <note_id> --yaml
```

### 场景三：评论与回复

**写操作 — 必须在用户明确确认后才能调用**

```bash
# 评论笔记
xhs comment <note_id> -c "评论内容" --yaml

# 回复评论
xhs reply <note_id> --comment-id <comment_id> -c "回复内容" --yaml

# 删除自己的评论
xhs delete-comment <note_id> <comment_id> --yaml
```

**执行流程**:
1. 展示评论/回复内容预览
2. ⛔ 等待用户明确确认
3. 执行操作
4. 报告结果

### 场景四：关注管理

**写操作 — 必须在用户明确确认后才能调用**

```bash
# 关注用户
xhs follow <user_id> --yaml

# 取关用户
xhs unfollow <user_id> --yaml
```

### 场景五：删除笔记

**写操作 — 必须在用户明确确认后才能调用**

```bash
# 先查看自己的笔记列表
xhs my-notes --yaml

# 删除指定笔记
xhs delete <note_id> --yaml
```

**执行流程**:
1. 展示要删除的笔记信息
2. ⛔ 等待用户明确确认
3. 执行删除

## 批量操作规则

- 每批最多 **5 个**操作，逐批输出进度
- 单个失败不中断整批，记录 ❌ 和错误信息并继续
- 连续失败超过 **3 次**时暂停，告知用户可能是系统性问题
- 空结果时给出友好提示
- 小红书反爬严格，批量操作间自动添加随机延迟

### 批量操作进度模板

```
- [ ] 阶段一：确认操作列表
- [ ] 阶段二：用户确认 ⛔ BLOCKING
- [ ] 阶段三：分批执行（每批 5 个，自动延迟）
- [ ] 阶段四：汇报结果
```

## 参数调整

| 用户意图 | 命令 |
|---------|------|
| "发笔记" | `xhs post --title "标题" --body "内容" --images ...` |
| "点赞这篇" | `xhs like <note_id> --yaml` |
| "收藏" | `xhs favorite <note_id> --yaml` |
| "评论" | `xhs comment <note_id> -c "内容" --yaml` |
| "回复评论" | `xhs reply <note_id> --comment-id <id> -c "内容"` |
| "关注这个博主" | `xhs follow <user_id> --yaml` |
| "取关" | `xhs unfollow <user_id> --yaml` |
| "删除笔记" | `xhs delete <note_id> --yaml` |

## 输出格式

```markdown
## 小红书操作结果

### ✅ 发布成功
- **标题**: 笔记标题
- **笔记ID**: note_id
- **链接**: https://www.xiaohongshu.com/explore/...

### ✅ 点赞成功
- **笔记**: 笔记标题
- **操作**: 点赞

### ❌ 操作失败
- **笔记**: 笔记标题
- **错误**: 错误信息
```

## 错误处理

- 命令未找到：提示安装 `uv tool install xiaohongshu-cli`
- 未登录：提示运行 `xhs login` 登录
- Cookie 过期：提示重新运行 `xhs login`
- 频率限制：工具自动进行指数退避重试
- 验证码拦截：工具自动进行渐进式冷却，等待后重试
- 笔记不存在：ID 错误或已被删除
- 发布失败：检查图片路径是否正确，内容是否违规
- 网络错误：检查网络连接，重试一次
