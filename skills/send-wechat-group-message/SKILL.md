---
name: send-wechat-group-message
description: "发送消息到微信群（非公众号）。适用场景: (1) 推送早报到微信群, (2) 发送热点内容到群聊, (3) 群发消息到多个微信群, (4) 发送图片到微信群, (5) 推送文章摘要到群, (6) 群聊通知, (7) 发送群聊总结, (8) 转发内容到微信群。触发短语: '发到微信群', '推送到群', 'send to wechat group', '微信群消息', '群发消息', 'post to group', '推送群聊', '发群消息', '通知微信群', '转发到群', '推到群里', '发到群里', '群里发一下', 'send group message', '微信群通知'"
---

# 微信群消息推送 (WeChat Group Messenger)

通过代理接口向微信群发送文本和图片消息。支持一份消息发送到多个群。

> **注意**: 本 skill 用于发送消息到**微信群聊**，不是微信公众号。公众号发布请使用 `post-to-wechat` skill。

## 认证

所有请求需要 `X-API-Key` 请求头。从环境变量读取配置:

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
| `picBase64` | string | 否 | 图片的 base64 编码字符串，不发图片时传空字符串 `""` |

`content` 和 `picBase64` 至少填一个。

### 构造 JSON 请求体（重要 — 中文编码）

**必须使用 Python 构造包含中文的 JSON 请求体。** 禁止使用 `jq --arg` + shell 变量拼接中文内容，否则中文会被 Unicode 双重转义变成乱码（`\\uXXXX`）。

**发送文本消息:**
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

### 发送图片（含压缩）

图片发送前**必须先压缩**，确保 base64 编码后 JSON 请求体不超过 200KB。超过此限制接口可能无响应（HTTP 000）。

```bash
# 1. 压缩图片: 长边缩至 1200px，JPEG 质量 60%
sips -Z 1200 -s format jpeg -s formatOptions 60 /path/to/image.png --out /tmp/wechat_pic.jpg

# 2. 用 Python 构造包含 base64 图片的 JSON（避免 shell 参数长度限制）
python3 -c "
import base64, json
with open('/tmp/wechat_pic.jpg', 'rb') as f:
    pic_b64 = base64.b64encode(f.read()).decode()
payload = {'content': '配图说明（可为空字符串）', 'groupName': '群名称', 'picBase64': pic_b64}
with open('/tmp/wechat_msg.json', 'w', encoding='utf-8') as f:
    json.dump(payload, f, ensure_ascii=False)
"

# 3. 发送
curl -s -X POST "$WECHAT_BOT_HOST/noc/message/info" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $WECHAT_BOT_API_KEY" \
  -d @/tmp/wechat_msg.json

# 4. 清理临时文件
rm -f /tmp/wechat_msg.json /tmp/wechat_pic.jpg
```

**图片压缩规则**:
- 原图 > 500KB 时必须压缩
- 使用 `sips`（macOS 内置）: `-Z 1200`（长边 1200px）+ `-s formatOptions 60`（JPEG 质量 60%）
- 压缩后仍 > 500KB 时，进一步降低质量到 40% 或缩至 800px

可以同时发送文本 + 图片，也可以只发图片（`content` 传空字符串）。

## 核心工作流

### 写操作安全规则

发送消息是**写操作** — 必须在用户明确确认后才能调用。

执行前先向用户展示:
- 目标群名（单个或列表）
- 消息内容预览（文本 + 是否含图片）
- 等待用户确认后再发送

### 场景一: 发送文本消息到单个群

1. 检查环境变量 `WECHAT_BOT_HOST` 和 `WECHAT_BOT_API_KEY` 是否已设置（HOST 需含 `http://` 前缀）
2. 用 Python 构造 JSON 请求体（`ensure_ascii=False`）
3. 向用户展示消息预览，等待确认
4. 用 `curl -d @/tmp/wechat_msg.json` 发送

### 场景二: 发送消息到多个群

对每个群**逐个调用** Bash 工具发送（不要用 shell for 循环，避免 JSON 转义问题）。每次调用间隔 1 秒，避免触发频率限制。

发送流程:
1. 向用户展示所有目标群名和消息内容，等待确认
2. 逐个群调用 curl 发送
3. 每批最多 5 个群，超过 5 个分批执行
4. 单个失败不中断后续发送，记录错误信息
5. 连续失败超过 3 次时暂停，告知用户可能是系统性问题
6. 全部完成后汇总报告

### 场景三: 发送图片消息

1. 先压缩图片（`sips -Z 1200 -s format jpeg -s formatOptions 60`）
2. 用 Python 构造含 base64 图片的 JSON（避免 shell 参数长度限制 + 确保编码正确）
3. 用 `curl -d @/tmp/wechat_msg.json` 发送
4. 清理临时文件

详见上方「发送图片（含压缩）」的完整代码示例。

## 输出格式

发送完成后，向用户报告结果:

单群:
```
✅ 消息已发送到「群名」
```

多群:
```
✅ 消息已发送到 3 个群:
  ✅ 群名1
  ✅ 群名2
  ❌ 群名3 — 发送失败（HTTP 状态码: 500）
```

## 错误处理

- **环境变量未设置**: 提示用户设置 `WECHAT_BOT_HOST` 和 `WECHAT_BOT_API_KEY`
- **HTTP 非 200**: 报告状态码，提示用户检查接口服务是否正常
- **多群发送部分失败**: 单个失败不中断后续发送，最终汇总报告成功/失败数量
- **连续失败 3 次**: 暂停并告知用户，可能是接口服务异常

## 安全规则

- **禁止**在输出、日志或消息内容中暴露 `WECHAT_BOT_HOST` 或 `WECHAT_BOT_API_KEY` 的实际值
- **禁止**将 API 密钥硬编码到任何请求中
- 所有请求必须通过环境变量引用接口地址和密钥
- 临时文件（如 `/tmp/wechat_msg.json`）使用后立即删除
