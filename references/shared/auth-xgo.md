# XGo API 认证

所有请求需要 `X-API-KEY` 请求头。从环境变量 `XGO_API_KEY` 读取密钥：

```bash
-H "X-API-KEY: $XGO_API_KEY"
```

若 `XGO_API_KEY` 未设置，提示用户配置。

接口地址：`https://api.xgo.ing`

API Key 绑定特定 XGo 用户账号。服务端会自动从密钥推断 `userName`，因此大多数请求中 `userName` 为**可选**参数。仅在查询其他用户数据时需要显式指定 `userName`。
