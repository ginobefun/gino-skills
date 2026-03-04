# Twitter/X CDP 选择器参考

本文档记录 Twitter/X 页面中关键 UI 元素的 `data-testid` 选择器，供脚本开发和维护使用。

> ⚠️ Twitter/X 可能随时更新页面结构，选择器失效时需在浏览器 DevTools 中重新查找。

## 推文编辑器

| 选择器 | 元素 | 使用场景 |
|--------|------|----------|
| `[data-testid="tweetTextarea_0"]` | 推文输入框 | 发推、回复、引用 |
| `[data-testid="tweetButton"]` | 发送按钮（"Post"） | 提交推文/回复/引用 |

## 推文互动按钮

| 选择器 | 元素 | 使用场景 |
|--------|------|----------|
| `[data-testid="reply"]` | 回复按钮 | 打开回复编辑器 |
| `[data-testid="retweet"]` | 转推按钮（未转推状态） | 打开转推/引用菜单 |
| `[data-testid="unretweet"]` | 取消转推按钮（已转推状态） | 取消转推 |
| `[data-testid="like"]` | 点赞按钮（未点赞状态） | 点赞 |
| `[data-testid="unlike"]` | 取消点赞按钮（已点赞状态） | 取消点赞 |

## 转推菜单

点击 `[data-testid="retweet"]` 后弹出的下拉菜单:

| 选择器 | 元素 | 使用场景 |
|--------|------|----------|
| `[data-testid="retweetConfirm"]` | "Repost"（转推确认） | 简单转推 |
| `[data-testid="Dropdown"] [role="menuitem"]:nth-child(2)` | "Quote"（引用选项） | 引用推文 |
| `[data-testid="unretweetConfirm"]` | 取消转推确认 | 撤销转推 |

## 页面 URL 模式

| URL | 用途 |
|-----|------|
| `https://x.com/compose/post` | 发新推文（编辑器页面） |
| `https://x.com/{user}/status/{id}` | 推文详情页 |

## 发现新选择器

在 Chrome DevTools 中查找:

1. 打开推文页面，按 `F12` 打开 DevTools
2. 使用元素选择器（左上角箭头图标）点击目标元素
3. 在 Elements 面板中查找 `data-testid` 属性
4. 若无 `data-testid`，使用 `[role]`、`aria-label` 或结构化 CSS 选择器
