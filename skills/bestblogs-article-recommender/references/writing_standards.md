# 推荐语写作规范

## 一、中文写作规范

### 核心原则

- **自然流畅**: 使用符合中文阅读习惯的表达，避免翻译腔
- **精准简洁**: 每个字都有价值，删除冗余修饰
- **信息密度**: 在有限字数内传达最多价值

### 常见问题与改进

#### 1. 翻译腔

```
✗ 这个工具提供了一个全面的解决方案对于开发者来说
✓ 这个工具为开发者提供了全面的解决方案

✗ 一个新的框架被提出用于解决这个问题
✓ 作者提出了一个新框架来解决这个问题
```

#### 2. 口语化过度

```
✗ 那么，让我们来看看这篇文章到底讲了啥
✓ 文章主要探讨了...

✗ 首先，文章介绍了 X。然后，作者讨论了 Y。最后，总结了 Z
✓ 文章介绍了 X，讨论了 Y，并总结了 Z
```

#### 3. 标点符号

中文标点的正确使用:
- 句号：。（非 .）
- 逗号：，（非 ,）
- 顿号：、（列举时使用）
- 冒号：：（非 :）
- 引号：""（非 ""）
- 书名号：《》（书籍、文章标题）

英文单词、数字、专有名词内部保留英文标点。

#### 4. 空格使用规范

**必须加空格** — 中文与英文/数字之间:
```
✗ GitHub官方发布的Copilot代码审查指南
✓ GitHub 官方发布的 Copilot 代码审查指南

✗ 支持Python、JavaScript和TypeScript等语言
✓ 支持 Python、JavaScript 和 TypeScript 等语言

✗ 性能提升了50%以上
✓ 性能提升了 50% 以上
```

**不应加空格** — 中文与中文之间:
```
✗ 这是 一个 很好的 工具
✓ 这是一个很好的工具
```

#### 5. 修饰词控制

```
过度修饰:
✗ 这是一个非常非常重要的、极其关键的、绝对不可或缺的工具
✓ 这是一个关键的开发工具

空洞修饰:
✗ 这篇文章写得很好，内容很丰富，值得一读
✓ 文章系统介绍了 X 技术的核心原理和实践案例
```

### 版本一写作模式

- 完整但不冗长，客观呈现价值
- 句式: [主题定位] + [核心内容概述] + [关键亮点] + [适用场景/目标读者]

```
示例:
GitHub 官方发布的 Copilot 代码审查指令文件实战指南。文章针对开发者
在使用自定义指令时遇到的常见困惑，提供了系统的解决方案：如何让
Copilot 准确理解并执行你的审查规则。作者从实际案例出发，总结了指令
编写的核心原则：保持简洁、结构化组织、使用命令式语句、提供代码示例。
```

### 版本二写作模式

- 去掉所有非核心信息，每句话都是关键点
- 句式: [核心主题] + [关键方法/内容] + [直接价值]

```
示例:
GitHub 团队总结的 Copilot 代码审查指令编写最佳实践。文章直击痛点：
为什么 Copilot 不按指令执行？核心建议包括保持简洁、结构化组织、
使用命令式语句，并提供可直接使用的模板和示例。
```

### 常用表达模板

**文章类型引导词**: 实战指南、深度解析、技术分析、案例研究、官方发布、团队总结

**价值描述**: 提供了系统的解决方案、总结了核心原则、揭示了底层逻辑、给出了可落地的实践方案

**适用场景**: 对于...的开发团队来说、如果你正在...、适合...的场景

**评价用词（谨慎使用）**:
- 积极但克制: 不可多得、值得关注、很有参考价值
- 避免夸张: ~~史上最强~~、~~空前绝后~~、~~颠覆性的~~、~~必读~~

---

## 二、英文写作规范

### 核心原则

- **Natural and Idiomatic**: 使用母语者自然表达，避免过度学术化
- **Concise and Precise**: 每个词都有价值，删除冗余修饰
- **Professional Yet Accessible**: 技术准确但不晦涩

### 常见问题与改进

#### 1. 冗余表达

```
✗ This article provides a comprehensive overview of the various different approaches
✓ This article overviews various approaches

✗ A very comprehensive and complete guide
✓ A comprehensive guide
```

#### 2. 被动语态过度

```
✗ A new framework is presented by the author for solving this problem
✓ The author presents a new framework for solving this problem
```

#### 3. 弱开头

```
✗ This is an article about GitHub Copilot code review
✓ An official GitHub guide to writing effective Copilot code review instructions

✗ In this article, the author discusses...
✓ The article discusses...
```

#### 4. 陈词滥调

```
避免: Game-changing, paradigm shift, revolutionary, cutting-edge
改用: 具体描述实际的新颖之处或不同之处

✗ This leverages best-in-class solutions
✓ This uses [specific technology/approach]
```

#### 5. 过度修饰

```
✗ This might possibly help to somewhat improve your process
✓ This improves your process
```

### 版本一写作模式

- Complete but not verbose, objective value presentation
- Pattern: [Topic positioning] + [Core content] + [Key highlights] + [Target audience]

```
Example:
An official GitHub guide to writing effective instruction files for Copilot
code review. The article addresses common developer challenges with custom
instructions by providing systematic solutions for ensuring Copilot accurately
understands and executes review rules.
```

### 版本二写作模式

- Core information only, every sentence is a key point
- Pattern: [Core topic] + [Key method/content] + [Direct value]

```
Example:
GitHub's best practices for writing Copilot code review instructions.
The article addresses a key pain point: why doesn't Copilot follow instructions?
Core recommendations include keeping content concise, using structured formatting,
and providing code examples.
```

### 语气校准

**Version 1**: Professional, informative, balanced
**Version 2**: Direct, efficient, matter-of-fact

### 风格要点

- 使用 Oxford comma: "A, B, and C"
- 混合使用长短句
- 用词具体而非模糊
- 避免不必要的限定词
- 积极但克制的评价: valuable, noteworthy, practical
- 避免夸大: ~~revolutionary~~, ~~groundbreaking~~, ~~must-read~~

---

## 三、质量自检清单

- [ ] 没有冗余修饰词
- [ ] 没有过度使用引号和括号
- [ ] 标点符号使用正确
- [ ] 中英文、数字之间有空格
- [ ] 中文表达自然流畅，无翻译腔
- [ ] 英文地道专业，非中文直译
- [ ] 信息准确，基于原文
- [ ] 结构清晰，逻辑顺畅
- [ ] 两个版本间有明确差异化
- [ ] 字数符合要求
