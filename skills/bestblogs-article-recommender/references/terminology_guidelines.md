# 技术术语处理规范

## 决策原则

保持英文: 术语在技术社区通用、易于理解、无合适中文对应词时。
使用中文: 有广泛认可的中文译名、中文表达更自然时。

## 各领域术语指引

### 人工智能 / 机器学习

**保持英文**: LLM, GPT, RAG, Transformer, Fine-tuning, Prompt Engineering, RLHF, CNN, RNN, LSTM, API, SDK, Token, Embedding, Few-shot learning, Zero-shot learning

**使用中文**: 机器学习, 深度学习, 神经网络, 训练数据, 测试集, 验证集, 模型优化, 过拟合, 欠拟合, 准确率, 召回率, 损失函数

**视情况而定**:
- AI / 人工智能: 技术语境用 AI，正式场合用人工智能
- Model / 模型: "GPT 模型"、"模型架构"

**混合用法**:
```
✓ LLM 应用开发
✓ Transformer 架构
✓ 使用 RAG 提升生成质量
✓ Fine-tuning 预训练模型
✓ 机器学习模型部署
```

### 产品开发

**保持英文**: MVP, PMF, A/B testing, SaaS, B2B, B2C, API, SDK, OKR, ROI, NPS

**使用中文**: 产品经理, 用户体验, 需求分析, 迭代, 增长策略, 转化率, 留存率, 产品路线图

**混合用法**:
```
✓ MVP 验证产品假设
✓ SaaS 产品定价策略
✓ 用户体验设计
✓ A/B 测试提升转化率
```

### 商业

**保持英文**: ROI, VC, IPO, CEO, CFO, CTO, B2B, B2C, SaaS, M&A, Due Diligence

**使用中文**: 商业模式, 营收, 利润, 增长, 战略, 运营, 组织架构, 供应链, 现金流

**混合用法**:
```
✓ 提升 ROI
✓ VC 投资逻辑
✓ SaaS 商业模式
✓ 营收增长策略
```

### 编程

**保持英文**: API, REST, GraphQL, SDK, CLI, Git, GitHub, Docker, Kubernetes, CI/CD, React, Vue, TypeScript, JavaScript, Python, Microservices, Serverless

**使用中文**: 代码, 架构, 开发, 测试, 部署, 性能优化, 重构, 代码审查, 技术债

**混合用法**:
```
✓ API 接口设计
✓ React 组件开发
✓ CI/CD 流程优化
✓ Docker 容器化部署
✓ 代码质量提升
```

## 空格规范

中文与英文/数字之间加空格:
```
✓ 使用 React 开发前端应用
✓ 性能提升了 50%
✓ GitHub 官方发布的指南
```

## 括号说明最小化

除非引入新术语，否则不加括号解释:
```
✗ 使用 LLM(大型语言模型)进行文本生成
✓ 使用 LLM 进行文本生成

引入新术语时可加:
✓ 使用 RAG（检索增强生成）提升回答准确性
```

## 常见易错处理

| 英文术语 | 保持英文? | 中文替代 | 说明 |
|---------|----------|---------|------|
| LLM | 是 | - | 无对应中文 |
| Machine Learning | 否 | 机器学习 | 中文通用 |
| API | 是 | - | 通用简洁 |
| Transformer | 是 | - | 架构名称 |
| Fine-tuning | 是 | - | 技术社区通用 |
| Overfitting | 否 | 过拟合 | 中文通用 |
| MVP | 是 | - | 通用缩写 |
| User Experience | 否 | 用户体验 | 除非用 UX |
| ROI | 是 | - | 商业通用 |
| Revenue | 否 | 营收 | 中文自然 |
| Framework | 视情况 | 框架 | "React 框架" vs "框架选择" |
| Code Review | 否 | 代码审查 | 中文自然 |
| CI/CD | 是 | - | DevOps 标准 |

## 一致性要求

两个版本中对同一术语的处理必须一致。如果版本一用 "API 接口设计"，版本二也用相同表述，不要变成"应用程序接口设计"。
