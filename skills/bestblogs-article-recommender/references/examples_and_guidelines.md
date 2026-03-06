# 领域指引与推荐语示例

## 一、内容领域指引

### 1. 人工智能 (AI)

**读者画像**: 中级到专家级，包括研究者、ML 工程师、AI 产品经理

**推荐重点**: 技术深度与新颖性、实际应用场景、模型架构与训练技术、性能指标与评测数据、伦理与局限性

**关键术语**: 保持英文 — LLM, RAG, GPT, Transformer, Fine-tuning, Prompt Engineering, RLHF；使用中文 — 机器学习, 深度学习, 神经网络, 训练数据, 模型优化

### 2. 产品开发

**读者画像**: 产品经理、设计师、创业者，技术和非技术背景混合

**推荐重点**: 用户问题与解决方案、产品策略与定位、设计决策与权衡、实用框架与工具、指标与成功标准

**关键术语**: 保持英文 — MVP, PMF, A/B testing, SaaS；使用中文 — 产品经理, 用户体验, 需求分析, 迭代, 增长策略

### 3. 商业科技

**读者画像**: 创业者、高管、商业策略师

**推荐重点**: 商业模式与营收策略、市场分析与竞争格局、组织架构与文化、案例研究与经验教训

**关键术语**: 保持英文 — ROI, SaaS, B2B, B2C, VC, IPO；使用中文 — 商业模式, 营收, 增长, 战略, 运营

### 4. 编程技术

**读者画像**: 软件工程师、架构师、技术负责人

**推荐重点**: 代码质量与可维护性、架构与设计模式、工具与框架、性能优化、开发者生产力

**关键术语**: 保持英文 — API, SDK, Git, Docker, CI/CD, React, TypeScript；使用中文 — 代码, 架构, 开发, 测试, 部署, 性能优化, 重构

---

## 二、内容类型指引

### 文章 (ARTICLE)

最常见的类型。聚焦核心论点和关键收获，突出实际价值或独特洞察。

**开头模式**:
- 中文: "一篇关于 X 的深度分析..."、"作者系统介绍了..."、"文章详细阐述了..."
- English: "A deep-dive analysis of X...", "The author systematically explains...", "The article thoroughly explores..."

### 视频 (VIDEO)

注明时长，强调演示和视觉学习价值，指出是否有代码示例或架构图。

**开头模式**:
- 中文: "时长 XX 分钟的技术分享..."、"演讲者通过实际案例展示了..."
- English: "A XX-minute technical presentation...", "The speaker demonstrates through real examples..."

### 播客 (PODCAST)

注明时长和嘉宾信息，突出讨论主题和关键洞察。

**开头模式**:
- 中文: "时长 XX 分钟的播客访谈..."、"嘉宾是 YY，讨论了..."
- English: "A XX-minute podcast interview with...", "The guest discusses..."

### 推文/推文串 (TWITTER)

捕捉核心论点，简洁有力。注明推文数量，突出引发思考的角度。

**开头模式**:
- 中文: "一条引发热议的推文串..."、"作者通过推文串阐述了..."
- English: "A widely-discussed tweet thread...", "The author explains through a thread..."

---

## 三、推荐语示例

### 示例 1：技术指南类

**版本一：推荐版本**

中文:
GitHub 官方发布的 Copilot 代码审查指令文件实战指南。文章针对开发者在使用自定义指令时遇到的常见困惑，提供了系统的解决方案：如何让 Copilot 准确理解并执行你的审查规则。作者从实际案例出发，总结了指令编写的核心原则：保持简洁、结构化组织、使用命令式语句、提供代码示例。文章还详细区分了仓库级和路径级指令文件的应用场景，并明确列出了不支持的指令类型。最有价值的是提供了可直接使用的 Markdown 模板和完整的 TypeScript 示例，让团队能快速建立统一的代码审查标准。

English:
An official GitHub guide to writing effective instruction files for Copilot code review. The article addresses common developer challenges with custom instructions by providing systematic solutions for ensuring Copilot accurately understands and executes review rules. Drawing from real-world cases, the author identifies core principles: keep instructions concise, use structured formatting, write imperative statements, and include code examples. The guide clearly distinguishes between repository-wide and path-specific instruction files while explicitly listing unsupported instruction types. Most valuable are the ready-to-use Markdown template and complete TypeScript example that enable teams to quickly establish unified code review standards.

**版本二：精炼简洁版本**

中文:
GitHub 团队总结的 Copilot 代码审查指令编写最佳实践。文章直击痛点：为什么 Copilot 不按指令执行？答案在于指令的表达方式。核心建议包括保持简洁、结构化组织、使用命令式语句、提供代码示例，同时明确哪些指令类型不被支持。文章提供了可直接使用的模板和 TypeScript 完整示例，帮助团队快速建立有效的代码审查规范。

English:
GitHub's best practices for writing Copilot code review instructions. The article addresses a key pain point: why doesn't Copilot follow instructions? The answer lies in how instructions are expressed. Core recommendations include keeping content concise, using structured formatting, writing imperative statements, and providing code examples, while clarifying unsupported instruction types. The article offers ready-to-use templates and complete TypeScript examples to help teams quickly establish effective code review standards.

---

### 示例 2：框架/架构类

**版本一：推荐版本**

中文:
一篇关于 React Server Components 架构演进的深度分析。文章从传统客户端渲染的局限性出发，系统阐述了服务端组件如何重新定义前端开发范式。作者详细解析了 RSC 的核心机制：组件在服务端执行、自动代码分割、零客户端 JavaScript 开销。特别值得关注的是文章对数据获取模式的讨论，展示了如何在组件内直接访问后端资源，消除了传统 API 层的中间环节。配合实际的性能对比数据和迁移路径建议，为已有 React 项目提供了清晰的升级参考。

English:
A deep-dive analysis of React Server Components' architectural evolution. Starting from traditional client-side rendering limitations, the article systematically explains how server components redefine frontend development paradigms. The author details RSC's core mechanisms: server-side component execution, automatic code splitting, and zero client-side JavaScript overhead. Particularly noteworthy is the discussion of data fetching patterns, demonstrating how components can directly access backend resources and eliminate the traditional API layer. Combined with actual performance comparisons and migration path recommendations, it provides clear upgrade guidance for existing React projects.

**版本二：精炼简洁版本**

中文:
React Server Components 架构解析。文章阐述了 RSC 的核心价值：组件在服务端执行，零客户端 JavaScript，直接访问后端资源。包含性能对比数据和实际迁移建议，适合考虑采用 RSC 的团队。

English:
Analysis of React Server Components architecture. The article explains RSC's core value: server-side component execution, zero client JavaScript, and direct backend access. Includes performance comparisons and practical migration advice for teams considering RSC adoption.

---

### 示例 3：最佳实践类

**版本一：推荐版本**

中文:
Google 工程团队分享的大规模微服务架构实践经验。文章基于 Google 内部数百个微服务系统的运维经验，总结出一套可落地的设计原则和反模式清单。核心内容包括服务边界划分的实用指导、API 版本管理的演进策略、以及分布式追踪的最佳实践。作者特别强调了最小化服务间依赖的重要性，并通过具体案例展示如何识别和解耦不必要的服务调用。文章还提供了容量规划的量化方法和故障演练的实施框架，对正在构建或优化微服务架构的团队具有很高的参考价值。

English:
Google engineering team's practical experience with large-scale microservices architecture. Based on operational experience with hundreds of internal microservice systems, the article distills actionable design principles and anti-pattern checklists. Core content includes practical guidance on service boundary definition, API versioning evolution strategies, and distributed tracing best practices. The author particularly emphasizes minimizing inter-service dependencies, demonstrating through concrete cases how to identify and decouple unnecessary service calls. The article also provides quantitative capacity planning methods and failure drill implementation frameworks, offering high reference value for teams building or optimizing microservice architectures.

**版本二：精炼简洁版本**

中文:
Google 团队的微服务架构实践总结。基于数百个内部系统的经验，提炼出服务划分、API 版本管理、分布式追踪的最佳实践。强调最小化服务依赖，包含容量规划和故障演练的具体方法。

English:
Google team's microservices architecture practice summary. Drawing from hundreds of internal systems, it distills best practices for service boundaries, API versioning, and distributed tracing. Emphasizes minimizing dependencies with concrete methods for capacity planning and failure drills.

---

### 示例 4：视频内容

**版本一：推荐版本**

中文:
时长 40 分钟的技术分享，OpenAI 工程师详细讲解 LLM 应用的生产环境部署实践。演讲涵盖了从模型选择、提示词工程到性能优化的完整流程，配合清晰的架构图和代码示例。特别值得关注的是关于成本控制的讨论，演讲者分享了如何通过缓存策略和批处理将推理成本降低 70% 的具体方法。适合正在将 LLM 集成到产品中的开发团队。

English:
A 40-minute technical presentation where an OpenAI engineer details production deployment practices for LLM applications. The talk covers the complete workflow from model selection and prompt engineering to performance optimization, accompanied by clear architecture diagrams and code examples. Particularly noteworthy is the discussion on cost control, where the speaker shares specific methods to reduce inference costs by 70% through caching strategies and batch processing. Ideal for development teams integrating LLMs into their products.

**版本二：精炼简洁版本**

中文:
OpenAI 工程师分享 LLM 生产部署实践。40 分钟演讲涵盖模型选择、提示词工程、性能优化，重点介绍如何通过缓存和批处理降低 70% 推理成本。包含架构图和代码示例。

English:
OpenAI engineer shares LLM production deployment practices. 40-minute talk covers model selection, prompt engineering, and performance optimization, highlighting how to reduce inference costs by 70% through caching and batching. Includes architecture diagrams and code examples.

---

### 示例 5：播客内容

**版本一：推荐版本**

中文:
时长 75 分钟的播客访谈，嘉宾是 Stripe 前产品副总裁，深入探讨如何在快速增长的同时保持产品质量。对话涵盖了产品优先级的制定、技术债务的平衡、以及如何在规模化过程中维护工程师文化。嘉宾分享了 Stripe 在支付基础设施上的决策过程，以及如何通过"无情地简化"哲学来应对产品复杂度。对正在经历快速增长阶段的创业公司特别有参考价值。

English:
A 75-minute podcast interview with Stripe's former VP of Product, deeply exploring how to maintain product quality during rapid growth. The conversation covers product prioritization, balancing technical debt, and preserving engineering culture during scaling. The guest shares Stripe's decision-making process for payment infrastructure and how to manage product complexity through a "ruthlessly simplify" philosophy. Particularly valuable for startups experiencing rapid growth phases.

**版本二：精炼简洁版本**

中文:
Stripe 前产品副总裁谈快速增长中的产品质量管理。75 分钟深度访谈，讨论产品优先级、技术债务平衡、工程师文化维护。分享"无情地简化"的实践经验。

English:
Former Stripe VP of Product discusses maintaining product quality during rapid growth. 75-minute deep interview covering product prioritization, technical debt balance, and engineering culture. Shares "ruthlessly simplify" practical experience.

---

### 示例 6：推文串

**版本一：推荐版本**

中文:
一条引发热议的推文串，作者用 12 条推文阐述了为什么 LLM 编程助手不会取代程序员，而是重新定义了编程技能的价值。核心观点是：能写代码的人会越来越多，但能设计好系统架构、做出正确技术决策的人仍然稀缺。推文结合了具体的代码示例和思考框架，简洁但有力。适合对 AI 编程工具的未来影响感兴趣的开发者。

English:
A widely-discussed tweet thread where the author uses 12 tweets to explain why LLM coding assistants won't replace programmers, but rather redefine the value of programming skills. Core argument: people who can write code will proliferate, but those who can design good system architectures and make correct technical decisions will remain scarce. The thread combines concrete code examples with thinking frameworks. Ideal for developers interested in AI coding tools' future impact.

**版本二：精炼简洁版本**

中文:
12 条推文阐述 LLM 编程助手如何重新定义编程技能价值。核心观点：写代码会普及，但系统设计和技术决策能力仍然稀缺。结合代码示例和思考框架。

English:
12-tweet thread on how LLM coding assistants redefine programming skill value. Core point: code writing will democratize, but system design and technical decision-making remain scarce. Combines code examples and thinking frameworks.

---

## 四、写作模式总结

### 好的开头

- 以权威来源开头: "Google 工程团队分享的..."
- 以问题空间开头: "一篇关于 React Server Components 架构演进的..."
- 视频注明时长: "时长 XX 分钟的技术分享..."
- 播客注明嘉宾: "嘉宾是 YY，探讨了..."
- 避免泛泛: ~~"这是一篇讨论..."~~

### 价值表达

- 具体优于模糊: "总结出一套可落地的设计原则" vs ~~"提供了很多有用的建议"~~
- 突出独特性: "基于 Google 内部数百个微服务系统的运维经验"
- 连接读者需求: "对正在构建或优化微服务架构的团队具有很高的参考价值"

### 版本差异化

- **版本一**: 完整呈现，均衡覆盖核心内容
- **版本二**: 只保留核心信息，精简到极致
