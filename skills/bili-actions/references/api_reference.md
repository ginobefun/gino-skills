# bilibili-cli 写操作命令参考

## 安装

```bash
# 推荐方式
uv tool install bilibili-cli

# 备选方式
pipx install bilibili-cli
```

## 认证

### 登录方式

```bash
# QR码登录（推荐）
bili login

# 检查登录状态
bili status --yaml

# 查看账号信息
bili whoami --yaml
```

### 认证优先级
1. 自动从浏览器提取 cookie（Chrome, Firefox, Edge, Brave）
2. QR 码登录（生成登录二维码）

**注意**: 写操作命令要求已登录状态，使用前请确认 `bili status` 返回已登录。

---

## 写操作命令

### bili like — 点赞视频

```bash
bili like <BV_ID> --yaml
```

**参数**:
- `BV_ID`: 视频 BV 号（必填）

**返回**: 操作成功/失败状态

### bili coin — 投币视频

```bash
bili coin <BV_ID> --yaml
```

**参数**:
- `BV_ID`: 视频 BV 号（必填）

**注意**: 需要账户有足够硬币余额。

### bili triple — 一键三连

```bash
bili triple <BV_ID> --yaml
```

同时执行点赞 + 投币 + 收藏。

**参数**:
- `BV_ID`: 视频 BV 号（必填）

### bili dynamic-post — 发布动态

```bash
bili dynamic-post "动态文本内容" --yaml
```

**参数**:
- 第一个参数: 动态文本内容（必填）

### bili dynamic-delete — 删除动态

```bash
bili dynamic-delete <dynamic_id> --yaml
```

**参数**:
- `dynamic_id`: 动态 ID（必填，可通过 `bili my-dynamics` 获取）

### bili unfollow — 取关UP主

```bash
bili unfollow <UID> --yaml
```

**参数**:
- `UID`: UP主的用户 ID（必填）

---

## 辅助读取命令

写操作前常用的读取命令：

### bili my-dynamics — 查看自己的动态

```bash
bili my-dynamics --yaml
```

用于获取动态 ID 以便删除。

### bili video — 确认视频信息

```bash
bili video <BV_ID> --yaml
```

在点赞/投币/三连前确认视频信息。

### bili whoami — 确认登录账号

```bash
bili whoami --yaml
```

确认当前登录的账号信息。

---

## 输出格式

成功：
```yaml
ok: true
data:
  message: "操作成功"
error: null
```

失败：
```yaml
ok: false
data: null
error:
  code: "ERROR_CODE"
  message: "错误描述"
```

## 常见错误

| 场景 | 错误信息 | 处理方式 |
|------|---------|---------|
| 未登录 | 需要登录 | `bili login` |
| BV号无效 | 视频不存在 | 确认 BV 号正确 |
| 已点赞 | 已经点过赞 | 跳过，不重复操作 |
| 已投币 | 已经投过币 | 跳过 |
| 币不足 | 硬币余额不足 | 告知用户 |
| 动态不存在 | 动态 ID 无效 | 确认 ID 正确 |
