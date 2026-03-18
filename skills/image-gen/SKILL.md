---
name: image-gen
description: "Use when 用户想基于提示词或参考图用 AI 生成或编辑图片，而不需要 cover-image 或 article-illustrator 那种额外编排。"
---

# 图片生成（AI SDK）

基于官方 API 的图片生成技能。支持 OpenAI、Google、DashScope（阿里通义万象）和 Replicate。

## 脚本目录

**Agent 执行方式**：
1. `SKILL_DIR` = this SKILL.md file's directory
2. Script path = `${SKILL_DIR}/scripts/main.ts`
3. Resolve `${BUN_X}` runtime: if `bun` installed → `bun`; if `npx` available → `npx -y bun`; else suggest installing bun

## 运行时约定

本技能遵循 `docs/skill-runtime-conventions.md`。

- 首选配置：`.gino-skills/image-gen/config.json`
- 用户级回退配置：`$HOME/.gino-skills/image-gen/config.json`
- 兼容旧版：`.gino-skills/image-gen/EXTEND.md` 和 `$HOME/.gino-skills/image-gen/EXTEND.md`
- 持久状态与记忆：`${CLAUDE_PLUGIN_DATA}/gino-skills/image-gen/` 或 `.gino-skills/data/image-gen/`
- 一次性输出应放在当前任务工作区，不应写入持久记忆

## 第 0 步：加载偏好 / 配置 ⛔ 阻塞步骤

**关键要求**：任何图片生成之前都必须完成这一步，不能跳过，也不能后置。

优先检查 `config.json`：

```bash
# macOS、Linux、WSL、Git Bash
test -f .gino-skills/image-gen/config.json && echo "project-config"
test -f "$HOME/.gino-skills/image-gen/config.json" && echo "user-config"
```

```powershell
# PowerShell（Windows）
if (Test-Path .gino-skills/image-gen/config.json) { "project-config" }
if (Test-Path "$HOME/.gino-skills/image-gen/config.json") { "user-config" }
```

| 结果 | 动作 |
|--------|--------|
| 找到 `config.json` | 读取、解析并应用设置；如果 `default_model.[provider]` 为空，只询问模型 |
| 未找到 | ⛔ 运行首次配置（[references/config/first-time-setup.md](references/config/first-time-setup.md)）→ 保存 `config.json` → 再继续 |

**关键要求**：如果没找到配置，必须先完成完整设置（provider + model + quality + save location），然后才能开始生成图片。在 `config.json` 写入前，生成流程一律阻塞。

| 路径 | 位置 |
|------|----------|
| `.gino-skills/image-gen/config.json` | 项目级首选配置 |
| `$HOME/.gino-skills/image-gen/config.json` | 用户级首选配置 |

**支持的配置项**：默认 provider | 默认质量 | 默认宽高比 | 默认图片尺寸 | 默认模型

Schema：`references/config/preferences-schema.md`

## 用法

```bash
# 基础用法
${BUN_X} ${SKILL_DIR}/scripts/main.ts --prompt "A cat" --image cat.png

# 指定宽高比
${BUN_X} ${SKILL_DIR}/scripts/main.ts --prompt "A landscape" --image out.png --ar 16:9

# 高质量
${BUN_X} ${SKILL_DIR}/scripts/main.ts --prompt "A cat" --image out.png --quality 2k

# 从 prompt 文件读取
${BUN_X} ${SKILL_DIR}/scripts/main.ts --promptfiles system.md content.md --image out.png

# 使用参考图（Google 多模态或 OpenAI 编辑）
${BUN_X} ${SKILL_DIR}/scripts/main.ts --prompt "Make blue" --image out.png --ref source.png

# 使用参考图（显式指定 provider/model）
${BUN_X} ${SKILL_DIR}/scripts/main.ts --prompt "Make blue" --image out.png --provider google --model gemini-3-pro-image-preview --ref source.png

# 指定 provider
${BUN_X} ${SKILL_DIR}/scripts/main.ts --prompt "A cat" --image out.png --provider openai

# DashScope（阿里通义万象）
${BUN_X} ${SKILL_DIR}/scripts/main.ts --prompt "一只可爱的猫" --image out.png --provider dashscope

# Replicate（google/nano-banana-pro）
${BUN_X} ${SKILL_DIR}/scripts/main.ts --prompt "A cat" --image out.png --provider replicate

# Replicate 指定模型
${BUN_X} ${SKILL_DIR}/scripts/main.ts --prompt "A cat" --image out.png --provider replicate --model google/nano-banana
```

## 参数

| 参数 | 说明 |
|--------|-------------|
| `--prompt <text>`, `-p` | Prompt 文本 |
| `--promptfiles <files...>` | 从文件读取 prompt（按顺序拼接） |
| `--image <path>` | 输出图片路径（必填） |
| `--provider google\|openai\|dashscope\|replicate` | 强制指定 provider（默认：google） |
| `--model <id>`, `-m` | 模型 ID（Google：`gemini-3-pro-image-preview`、`gemini-3.1-flash-image-preview`；OpenAI：`gpt-image-1.5`） |
| `--ar <ratio>` | 宽高比（如 `16:9`、`1:1`、`4:3`） |
| `--size <WxH>` | 图片尺寸（如 `1024x1024`） |
| `--quality normal\|2k` | 质量预设（默认：2k） |
| `--imageSize 1K\|2K\|4K` | Google 的图片尺寸（默认跟随 quality） |
| `--ref <files...>` | 参考图。支持 Google 多模态（`gemini-3-pro-image-preview`、`gemini-3-flash-preview`、`gemini-3.1-flash-image-preview`）和 OpenAI 编辑（GPT Image 系列）。未指定 provider 时先尝试 Google，再尝试 OpenAI |
| `--n <count>` | 生成图片数量 |
| `--json` | 输出 JSON |

## 环境变量

| 变量 | 说明 |
|----------|-------------|
| `OPENAI_API_KEY` | OpenAI API Key |
| `GOOGLE_API_KEY` | Google API Key |
| `DASHSCOPE_API_KEY` | DashScope API Key（阿里云） |
| `REPLICATE_API_TOKEN` | Replicate API Token |
| `OPENAI_IMAGE_MODEL` | OpenAI 模型覆盖值 |
| `GOOGLE_IMAGE_MODEL` | Google 模型覆盖值 |
| `DASHSCOPE_IMAGE_MODEL` | DashScope 模型覆盖值（默认：`z-image-turbo`） |
| `REPLICATE_IMAGE_MODEL` | Replicate 模型覆盖值（默认：`google/nano-banana-pro`） |
| `OPENAI_BASE_URL` | 自定义 OpenAI Endpoint |
| `GOOGLE_BASE_URL` | 自定义 Google Endpoint |
| `DASHSCOPE_BASE_URL` | 自定义 DashScope Endpoint |
| `REPLICATE_BASE_URL` | 自定义 Replicate Endpoint |

**加载优先级**：CLI 参数 > `config.json` > legacy `EXTEND.md` > 环境变量 > `<cwd>/.gino-skills/.env` > `~/.gino-skills/.env`

## 模型解析

模型优先级（从高到低），适用于所有 provider：

1. CLI 参数：`--model <id>`
2. `config.json`：`default_model.[provider]`
3. legacy `EXTEND.md`：`default_model.[provider]`
4. 环境变量：`<PROVIDER>_IMAGE_MODEL`（例如 `GOOGLE_IMAGE_MODEL`）
5. 内置默认值

**配置优先于环境变量**。如果 `config.json` 或 legacy `EXTEND.md` 和环境变量同时存在，以配置文件为准。

**每次生成前都必须展示模型信息**：
- 显示：`Using [provider] / [model]`
- 显示切换提示：`Switch model: --model <id> | config default_model.[provider] | env <PROVIDER>_IMAGE_MODEL`

### Replicate 模型

支持的模型格式：

- `owner/name`（推荐，适合官方模型），例如 `google/nano-banana-pro`
- `owner/name:version`（按版本指定的社区模型），例如 `stability-ai/sdxl:<version>`

示例：

```bash
# 使用 Replicate 默认模型
${BUN_X} ${SKILL_DIR}/scripts/main.ts --prompt "A cat" --image out.png --provider replicate

# 显式覆盖模型
${BUN_X} ${SKILL_DIR}/scripts/main.ts --prompt "A cat" --image out.png --provider replicate --model google/nano-banana
```

## Provider 选择

1. 传了 `--ref` 且没传 `--provider` → 自动优先选 Google，其次 OpenAI，再其次 Replicate
2. 显式指定了 `--provider` → 直接使用（如果同时用了 `--ref`，则 provider 必须是 `google`、`openai` 或 `replicate`）
3. 只配置了一个 API Key → 使用该 provider
4. 配置了多个 provider → 默认选 Google

## 质量预设

| 预设 | Google imageSize | OpenAI Size | 适用场景 |
|--------|------------------|-------------|----------|
| `normal` | 1K | 1024px | 快速预览 |
| `2k`（默认） | 2K | 2048px | 封面图、插图、信息图 |

**Google imageSize**：可以用 `--imageSize 1K|2K|4K` 覆盖。

## 宽高比

支持：`1:1`、`16:9`、`9:16`、`4:3`、`3:4`、`2.35:1`

- Google 多模态：使用 `imageConfig.aspectRatio`
- Google Imagen：使用 `aspectRatio` 参数
- OpenAI：映射到最接近的受支持尺寸

## 生成模式

**默认**：串行生成（一次一张）。这样更稳定，也更容易排查问题。

**并行生成**：只有用户明确要求并行/并发时才使用。

| 模式 | 适用场景 |
|------|-------------|
| 串行（默认） | 常规使用、单图、少量批量生成 |
| 并行 | 用户明确要求，且批量较大（10+） |

**并行设置**（仅在用户要求时使用）：

| 设置项 | 建议值 |
|---------|-------|
| 推荐并发数 | 4 个子代理 |
| 最大并发数 | 8 个子代理 |
| 使用场景 | 用户要求并行的大批量生成 |

**Agent 实现方式**（仅并行模式）：
```
# 使用 Task 工具并行发起多个生成任务
# 每个 Task 作为后台子代理运行，run_in_background=true
# 全部完成后通过 TaskOutput 汇总结果
```

## 错误处理

- 缺少 API Key → 报错，并给出配置指引
- 生成失败 → 自动重试一次
- 宽高比无效 → 给出警告，并退回默认值
- 参考图与 provider/model 不兼容 → 报错，并给出修复建议（切换到 Google 多模态：`gemini-3-pro-image-preview`、`gemini-3.1-flash-image-preview`；或 OpenAI GPT Image 编辑模型）

## 扩展配置支持

自定义配置优先使用 `config.json`。详见 `docs/skill-runtime-conventions.md`。

## Legacy 兼容附录

迁移期内仍支持读取 legacy `EXTEND.md`，但它仅用于兼容，不应作为新配置方式。计划在 2026 年 9 月 30 日进入移除评审。详见 [docs/deprecation-roadmap.md](/Users/gino/Documents/Github/gino-skills/docs/deprecation-roadmap.md)。

Fallback paths:
- `.gino-skills/image-gen/EXTEND.md`
- `$HOME/.gino-skills/image-gen/EXTEND.md`

Legacy 优先级说明：
- 加载优先级为 `CLI args > config.json > legacy EXTEND.md > env vars > .env`
- 在迁移完成前，模型解析仍接受 legacy `EXTEND.md` 里的 `default_model.[provider]`
