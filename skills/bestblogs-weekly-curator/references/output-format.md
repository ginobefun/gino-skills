# 输出格式规范

## 候选清单格式

按栏目分组展示候选清单，每篇必须包含**推荐理由**:

```markdown
## 候选清单（共 N 篇，建议最终选择约 20 篇）

### 模型与研究 (MODELS) — N 篇

| # | 分数 | 精选 | 阅读量 | 标题 | 来源 | 优先级 | 类型 | 推荐理由 |
|---|------|------|--------|------|------|--------|------|----------|
| 1 | 96 | Y | 1.2K | 文章标题 | 来源名称 | HIGH | 文章 | OpenAI 官方发布，重大模型更新，读者必读 |
| 2 | 94 | Y | 856 | 文章标题 | 来源名称 | MEDIUM | 播客 | 深度技术解析，对开发者实践价值高 |

### 开发与工具 (DEV) — N 篇
...

### 产品与设计 (PRODUCT) — N 篇
...

### 资讯与报告 (NEWS) — N 篇
...
```

推荐理由应从以下角度阐述（1-2 句话）:
- 为什么这篇内容重要（信息价值）
- 为什么适合 BestBlogs 读者（相关性）
- 内容质量亮点（深度、独特视角、实践指导等）

## 周刊草稿格式

```markdown
# BestBlogs.dev 精选文章 第 N 期

> {中文推荐语全文}

---

## 模型与研究

### 1. {文章标题}
- **来源**: {sourceName} | **评分**: {score} | **类型**: {resourceTypeDesc}
- **摘要**: {oneSentenceSummary}
- **推荐理由**: {1 句话说明为什么入选本期}
- **链接**: {readUrl 或 url}

### 2. {文章标题}
...

---

## 开发与工具
...

## 产品与设计
...

## 资讯与报告
...
```

## 结构化 JSON 格式

```json
{
  "zhTitle": "BestBlogs 周刊第 N 期：{关键词}",
  "enTitle": "BestBlogs Weekly Issue #N: {Keyword}",
  "zhSummary": "中文推荐语全文",
  "enSummary": "English summary full text",
  "articles": [
    {
      "id": "RAW_xxx",
      "title": "文章标题",
      "aiCategory": "MODELS",
      "sort": 1
    }
  ]
}
```

`sort` 值规则：按 MODELS → DEV → PRODUCT → NEWS 顺序，从 1 开始连续编号。
