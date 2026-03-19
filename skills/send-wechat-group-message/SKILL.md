---
name: send-wechat-group-message
description: "Use when 用户想向一个或多个微信群发送文本或图片消息，而不是发布到微信公众号。"
disable-model-invocation: true
---

# 微信群消息推送 (WeChat Group Messenger)

通过代理接口向微信群发送文本和图片消息。支持一份消息发送到多个群。

> **注意**: 本 skill 用于发送消息到**微信群聊**，不是微信公众号。公众号发布请使用 `post-to-wechat` skill。

## 认证

所有请求需要 `X-API-Key` 请求头。从环境变量读取配置：

- **接口地址**: 环境变量 `WECHAT_BOT_HOST`（必须包含 `http://` 协议前缀，如 `http://x.x.x.x`）
- **API 密钥**: 环境变量 `WECHAT_BOT_API_KEY`

```bash
-H "X-API-Key: $WECHAT_BOT_API_KEY"
```

**启动检查**:
1. 若任一环境变量未设置，提示用户配置后再继续
2. 若 `WECHAT_BOT_HOST` 不以 `http://` 或 `https://` 开头，自动补全 `http://` 前缀再使用

**禁止在任何输出中暴露接口地址或 API 密钥的实际值。**

## 接口

| 方法 | 路径 | 类型 | 用途 |
|------|------|------|------|
| POST | `/noc/message/info` | 写入 | 发送群消息（文本/图片） |

## 请求格式

```bash
curl -s -X POST "$WECHAT_BOT_HOST/noc/message/info" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $WECHAT_BOT_API_KEY" \
  -d '{
    "content": "消息文本内容",
    "groupName": "群名称",
    "picBase64": ""
  }'
```

### 字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `content` | string | 否 | 消息文本，换行使用 `\n`（JSON 转义换行符）；不发文本时传空字符串 `""` |
| `groupName` | string | 是 | 目标微信群名称（精确匹配） |
| `picBase64` | string | 否 | 图片的 base64 编码字符串，**必须包含 `data:image/<type>;base64,` 前缀**（如 `data:image/jpeg;base64,/9j/...`）；不发图片时传空字符串 `""` |

`content` 和 `picBase64` 至少填一个。

> **文本 vs 图片编码规则**
> - **文本** (`content`): 保留换行符 `\n`，`json.dump` 会自动将其序列化为 JSON 的 `\n` 转义，服务端正确还原为换行
> - **图片** (`picBase64`): 直接使用 `base64.b64encode(data).decode()`，**不做任何额外处理**（不去换行、不替换字符）；必须加 `data:image/<type>;base64,` 前缀

### 构造 JSON 请求体（重要 — 中文编码）

**必须使用 Python 构造包含中文的 JSON 请求体。** 禁止使用 `jq --arg` + shell 变量拼接中文内容，否则中文会被 Unicode 双重转义变成乱码（`\\uXXXX`）。

**发送文本消息：**
```bash
# 从文件读取内容
python3 -c "
import json
with open('/path/to/content.txt', 'r') as f:
    content = f.read()
payload = {'content': content, 'groupName': '群名称', 'picBase64': ''}
with open('/tmp/wechat_msg.json', 'w', encoding='utf-8') as f:
    json.dump(payload, f, ensure_ascii=False)
"

curl -s -X POST "$WECHAT_BOT_HOST/noc/message/info" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $WECHAT_BOT_API_KEY" \
  -d @/tmp/wechat_msg.json

rm -f /tmp/wechat_msg.json
```

**关键**: `json.dump` 必须指定 `ensure_ascii=False`，否则中文会被转为 `\uXXXX` 转义序列，经 curl 发送后显示为乱码。

### 发送图片

接口支持最大约 10MB 的原始图片，无需压缩。直接读取图片文件，加上 MIME 前缀后编码：

```bash
# 用 Python 构造含 base64 图片的 JSON
python3 -c "
import base64, json

with open('/path/to/image.png', 'rb') as f:
    raw = f.read()

# 直接编码，不做任何额外处理；加 data URI 前缀
# JPEG 文件用 data:image/jpeg;base64,，PNG 文件用 data:image/png;base64,
pic_b64 = 'data:image/jpeg;base64,' + base64.b64encode(raw).decode()

payload = {'content': '配图说明（可为空字符串）', 'groupName': '群名称', 'picBase64': pic_b64}
with open('/tmp/wechat_msg.json', 'w', encoding='utf-8') as f:
    json.dump(payload, f, ensure_ascii=False)
"

curl -s -X POST "$WECHAT_BOT_HOST/noc/message/info" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $WECHAT_BOT_API_KEY" \
  -d @/tmp/wechat_msg.json

rm -f /tmp/wechat_msg.json
```

**图片编码规则（重要）**:
- 使用 `base64.b64encode(raw).decode()`，**不做任何额外处理**（不去换行、不替换任何字符）
- 必须加 `data:image/<type>;base64,` 前缀，根据实际文件格式选择 MIME 类型：
  - JPEG 文件（含 `.jpg`、`.jpeg`，以及扩展名为 `.png` 但实际为 JPEG 的文件）→ `data:image/jpeg;base64,`
  - 真正的 PNG 文件 → `data:image/png;base64,`
  - 用 `file /path/to/image` 命令确认实际格式
- 原图超过 10MB 时再考虑压缩：`sips -Z 1200 -s format jpeg -s formatOptions 60 input --out output.jpg`
- 若图片数据已包含 `data:image/` 前缀，直接使用，**不重复添加**

可以同时发送文本 + 图片，也可以只发图片（`content` 传空字符串）。

## 核心工作流

### 写操作安全规则

发送消息是**写操作** — 必须在用户明确确认后才能调用。

执行前先向用户展示：
- 目标群名（单个或列表）
- 消息内容预览（文本 + 是否含图片）
- 等待用户确认后再发送

### 场景一：发送文本消息到单个群

1. 检查环境变量 `WECHAT_BOT_HOST` 和 `WECHAT_BOT_API_KEY` 是否已设置（HOST 需含 `http://` 前缀）
2. 用 Python 构造 JSON 请求体（`ensure_ascii=False`）
3. 向用户展示消息预览，等待确认
4. 用 `curl -d @/tmp/wechat_msg.json` 发送

### 场景二：发送消息到多个群

对每个群**逐个调用** Bash 工具发送（不要用 shell for 循环，避免 JSON 转义问题）。每次调用间隔随机 3-8 秒（`sleep $((RANDOM % 6 + 3))`），避免固定间隔被识别为机器人。

发送流程：
1. 向用户展示所有目标群名和消息内容，等待确认
2. 逐个群调用 curl 发送
3. 每批最多 5 个群，超过 5 个分批执行
4. 单个失败不中断后续发送，记录错误信息
5. 连续失败超过 3 次时暂停，告知用户可能是系统性问题
6. 全部完成后汇总报告

### 场景三：发送图片消息

1. 用 `file` 命令确认图片实际格式（扩展名可能与格式不符）
2. 用 Python 直接读取图片，`base64.b64encode(raw).decode()` 编码，加 `data:image/<type>;base64,` 前缀，**不做任何额外处理**
3. 用 `curl -d @/tmp/wechat_msg.json` 发送
4. 清理临时文件

详见上方「发送图片」的完整代码示例。

### 场景四：向多个群依次发送图片 + 文字

适用于早报/周报推送等需要对每个群先发图后发文的场景。

发送流程：
1. 用 Python 一次性为所有群预生成 JSON 文件（图片 base64 只编码一次，复用到各群）
2. 按群逐个发送，每群内**先图后文**，两条之间随机 `sleep $((RANDOM % 3 + 3))`（3-5 秒），换群时随机 `sleep $((RANDOM % 4 + 4))`（4-7 秒），避免固定间隔被识别为机器人
3. 每批最多 5 个群，超过 5 个分批执行
4. 单条失败不中断，记录 ❌ 继续执行；连续失败 3 次暂停告知用户
5. 全部完成后清理所有临时文件，汇总报告

```bash
# 预生成所有 JSON（Python，只编码一次图片）
python3 -c "
import base64, json

with open('/path/to/poster.png', 'rb') as f:
    raw = f.read()
# 用 file 命令确认格式；JPEG 文件即使扩展名是 .png 也用 jpeg MIME
pic_b64 = 'data:image/jpeg;base64,' + base64.b64encode(raw).decode()

with open('/path/to/digest.txt', 'r') as f:
    text = f.read()

groups = ['群名1', '群名2', '群名3']
for i, g in enumerate(groups):
    with open(f'/tmp/wechat_poster_{i}.json', 'w', encoding='utf-8') as f:
        json.dump({'content': '', 'groupName': g, 'picBase64': pic_b64}, f, ensure_ascii=False)
    with open(f'/tmp/wechat_text_{i}.json', 'w', encoding='utf-8') as f:
        json.dump({'content': text, 'groupName': g, 'picBase64': ''}, f, ensure_ascii=False)
"

# 对每个群逐个调用（不用 shell for 循环）
# 群名1
curl -s -X POST "$WECHAT_BOT_HOST/noc/message/info" \
  -H "Content-Type: application/json" -H "X-API-Key: $WECHAT_BOT_API_KEY" \
  -d @/tmp/wechat_poster_0.json
sleep 1
curl -s -X POST "$WECHAT_BOT_HOST/noc/message/info" \
  -H "Content-Type: application/json" -H "X-API-Key: $WECHAT_BOT_API_KEY" \
  -d @/tmp/wechat_text_0.json
# ... 以此类推（每群之间 sleep 1）

# 全部完成后清理
rm -f /tmp/wechat_poster_*.json /tmp/wechat_text_*.json
```

## 输出格式

发送完成后，向用户报告结果：

单群：
```
✅ 消息已发送到「群名」
```

多群：
```
✅ 消息已发送到 3 个群:
  ✅ 群名1
  ✅ 群名2
  ❌ 群名3 — 发送失败（HTTP 状态码: 500）
```

## 错误处理

- **环境变量未设置**: 提示用户设置 `WECHAT_BOT_HOST` 和 `WECHAT_BOT_API_KEY`
- **HTTP 非 200**: 报告状态码，提示用户检查接口服务是否正常
- **curl exit code 52（Empty reply from server）**: 服务端偶发空响应，常见于大 payload（如 base64 图片）发送后紧接文本请求的场景。处理：等待 2 秒后自动重试一次，重试时加 `-w "\nHTTP_CODE:%{http_code}"` 以便确认状态码
- **多群发送部分失败**: 单个失败不中断后续发送，最终汇总报告成功/失败数量
- **连续失败 3 次**: 暂停并告知用户，可能是接口服务异常

## 安全规则

- **禁止**在输出、日志或消息内容中暴露 `WECHAT_BOT_HOST` 或 `WECHAT_BOT_API_KEY` 的实际值
- **禁止**将 API 密钥硬编码到任何请求中
- 所有请求必须通过环境变量引用接口地址和密钥
- 临时文件（如 `/tmp/wechat_msg.json`）使用后立即删除
