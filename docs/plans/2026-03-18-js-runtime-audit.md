# JS 运行时审计：共享 API 调用层

## 范围

这轮审计检查了在引入 BestBlogs 和 XGo 共享 Python client 之后，仓库里剩余的 JavaScript / TypeScript 文件。

2026-03-18 的全仓库 JS/TS 清单：
- `scripts/generate-digest.js`
- `scripts/process-tweets.js`
- `skills/bestblogs-transcribe-youtube/scripts/transcribe.ts`
- `skills/create-podcast/scripts/*.ts`
- `skills/create-video/scripts/*.ts`
- `skills/image-gen/scripts/*.ts`
- `skills/post-to-wechat/scripts/*.ts`
- `skills/post-to-x/scripts/*.ts`
- `skills/x-actions/scripts/*.ts`

## 发现

### 顶层 JS API 调用器目前没有需要立即退役的对象

两个顶层 Node 脚本：
- `scripts/process-tweets.js`
- `scripts/generate-digest.js`

现阶段应继续保留。

原因：
- 它们负责 `xgo-digest-tweets` 的本地转换和产物生成
- 它们并不重复 BestBlogs / XGo 新的共享 Python HTTP client
- 现在替换它们会改变运行时和输出结构，但并不能减少网络调用层重复

### Skill 内部 TS/JS 脚本大多是领域 worker，不属于重复层

以下脚本应保留：
- `skills/bestblogs-transcribe-youtube/scripts/transcribe.ts`
  原因：这是浏览器 / Gemini 自动化 worker，不是 BestBlogs Admin/OpenAPI 的重复调用层
- `skills/post-to-wechat/scripts/*.ts`
  原因：这是浏览器自动化和 markdown 渲染链路，不在 BestBlogs/XGo 共享 client 的范围内
- `skills/post-to-x/scripts/*.ts`
  原因：这是 X 发布 / 浏览器自动化链路，不是 XGo OpenAPI 的重复
- `skills/x-actions/scripts/*.ts`
  原因：这是浏览器动作型 worker，和 XGo list/follow/bookmark API 分层不同
- `skills/create-podcast/scripts/*.ts`、`skills/create-video/scripts/*.ts`、`skills/image-gen/scripts/*.ts`
  原因：它们是媒体生成 / 上传链路，不是共享 HTTP client 的重复层

## 退役候选

这一轮没有安全的代码级退役候选。

下一批更现实的清理对象不是脚本文件，而是重复的文档和运行时指引：
- `xgo-digest-tweets` 里的 raw `curl` 编排
- `xgo-organize-follows` 里的 raw `curl` 编排

等这些 skill 都切到稳定的 `scripts/examples/` worker 入口后，再评估是否还能删掉一些临时 shell 或 Node 胶水层。

## 推荐下一步

如果目标是“每个 API family 只保留一套共享执行层”，下一轮应该：
1. 把 `xgo-digest-tweets` 的读路径 worker 化，并接到共享 Python 入口
2. 把 `xgo-organize-follows` 的读路径 worker 化，并接到共享 Python 入口
3. 完成以上两步后，再评估 `scripts/process-tweets.js` 是继续作为纯 ranking/render 阶段，还是值得迁成 Python
