# BestBlogs 订阅源分类调整建议

> 基于 `bestblogs_category_config.csv` 中定义的有效分类，对 `bestblogs_resource_source.csv` 中各订阅源的分类进行逐一核查。
> 有效子分类汇总：
> - **Artificial_Intelligence**: MODELS / AI_CODING / DEV / PRODUCT / NEWS
> - **Business_Tech**: BT_STARTUP / BT_NEWS / BT_INSIGHT / BT_PEOPLE
> - **Product_Development**: PD_PM / PD_DESIGN / PD_CREATIVE
> - **Productivity_Growth**: PG_TOOLS / PG_CAREER / PG_LEARNING
> - **Programming_Technology**: SE_FRONTEND / SE_BACKEND / SE_DEVOPS / SE_TOOLS / SE_PRACTICE
> - **News_Media / Finance_Economy / Lifestyle_Culture**: 未定义子分类

---

## 一、主分类错误（Priority: 高）

| 行号 | 订阅源名称 | 当前分类 | 建议分类 | 理由 |
|------|-----------|----------|----------|------|
| 116 | SuperTechFans | `Business_Tech, BT_NEWS` | `Artificial_Intelligence, NEWS` | 描述明确为"HackerNews 每日 AI 摘要"，是 AI 内容聚合而非科技商业资讯 |
| 155 | 向阳乔木推荐看 | `Artificial_Intelligence, NEWS` | `Productivity_Growth, PG_LEARNING` | 描述为"每日阅读记录，创业、心理、学习等方面"，与 AI 无关，属个人阅读/成长内容 |
| 206 | Marc Andreessen(@pmarca) | `Artificial_Intelligence, NEWS` | `Business_Tech, BT_INSIGHT` | a16z 联创/顶级 VC，主要发表科技与商业投资观点，不是 AI 领域专业新闻源 |
| 354 | 刘小排r | `Artificial_Intelligence, DEV` | `Artificial_Intelligence, PRODUCT` | 描述为"AI 产品创业者，主要产品是 Raphael AI"，是 AI 产品从业者而非 AI 开发技术分享 |
| 355 | Elevate（Addy Osmani） | `Artificial_Intelligence, DEV` | `Programming_Technology, SE_PRACTICE` | Addy Osmani 是 Google Chrome 前端性能工程师，newsletter 聚焦工程师效率提升，不是 AI 开发内容 |
| 398 | 言午 | `Artificial_Intelligence, DEV` | `Lifestyle_Culture` 或 `Productivity_Growth` | 描述"贩卖你想要的人生"，是生活/个人成长内容，归为 AI 开发有误 |

---

## 二、子分类错误（主分类正确，Priority: 中）

| 行号 | 订阅源名称 | 当前分类 | 建议分类 | 理由 |
|------|-----------|----------|----------|------|
| 6 | AWS Machine Learning Blog | `Artificial_Intelligence, MODELS` | `Artificial_Intelligence, DEV` | 内容侧重在 AWS 上构建 ML 应用的工程实践，不是模型研究 |
| 19 | deeplearning.ai (The Batch) | `Artificial_Intelligence, DEV` | `Artificial_Intelligence, NEWS` | The Batch 是 Andrew Ng 的 AI 新闻周报，以行业资讯为主，不是 AI 开发技术 |
| 148 | 花叔 | `Artificial_Intelligence, NEWS` | `Artificial_Intelligence, AI_CODING` | 描述明确"AI Native Coder，关注AI、AI编程"，应归为 AI 编程而非 AI 资讯 |
| 151 | Groq（网站） | `Artificial_Intelligence, MODELS` | `Artificial_Intelligence, DEV` | Groq 提供推理 API 服务，是面向开发者的基础设施工具，不是模型研发机构 |
| 152 | ElevenLabs Blog | `Artificial_Intelligence, MODELS` | `Artificial_Intelligence, PRODUCT` | ElevenLabs 是语音 AI 产品公司，博客内容是产品动态/使用指南，不是模型研究 |
| 235 | Groq Inc(@GroqInc) | `Artificial_Intelligence, MODELS` | `Artificial_Intelligence, DEV` | 同 Groq 网站，推理基础设施服务提供商，非模型研发 |
| 303 | Naval(@naval) | `Business_Tech, OTHERS` | `Business_Tech, BT_INSIGHT` | OTHERS 不是有效子分类；内容为投资/创业/哲学洞察，`BT_INSIGHT` 更匹配 |
| 316 | Paul Graham(@paulg) | `Business_Tech, OTHERS` | `Business_Tech, BT_INSIGHT` | OTHERS 无效；PG 发布创业/哲学深度文章，`BT_INSIGHT` 或 `BT_STARTUP` 更合适 |
| 323 | Sahil Lavingia(@shl) | `Business_Tech, OTHERS` | `Business_Tech, BT_STARTUP` | OTHERS 无效；Gumroad 创始人，分享创业/独立开发者经验，`BT_STARTUP` 匹配 |

---

## 三、使用未定义的 `OTHERS` 子分类（需替换，Priority: 中低）

`OTHERS` 在 `bestblogs_category_config.csv` 中**未定义**，以下条目需要映射到合法子分类。

### 3.1 Programming_Technology, OTHERS → 建议替换

| 行号 | 订阅源名称 | 建议子分类 | 理由 |
|------|-----------|-----------|------|
| 8 | Engineering at Meta | `SE_PRACTICE` | 大厂工程团队博客 |
| 9 | Microsoft Azure Blog | `SE_DEVOPS` | 云服务平台，DevOps 内容为主 |
| 20 | 腾讯技术工程 | `SE_PRACTICE` | 大厂工程实践博客 |
| 21 | ByteByteGo Newsletter | `SE_BACKEND` | 系统设计/架构为主 |
| 50 | The Airbnb Tech Blog | `SE_PRACTICE` | 大厂工程实践博客 |
| 55 | 阿里技术 | `SE_PRACTICE` | 大厂工程实践 |
| 56 | 小米技术 | `SE_PRACTICE` | 大厂工程实践 |
| 57 | 哔哩哔哩技术 | `SE_PRACTICE` | 大厂工程实践 |
| 58 | 阿里云开发者 | `SE_DEVOPS` | 云开发平台，DevOps 内容为主 |
| 59 | 字节跳动技术团队 | `SE_PRACTICE` | 大厂工程实践 |
| 65 | 奇舞精选 | `SE_FRONTEND` | 奇舞团是前端团队，内容明确为前端技术 |
| 66 | 京东技术 | `SE_PRACTICE` | 大厂工程实践 |
| 68 | 得物技术 | `SE_PRACTICE` | 大厂工程实践 |
| 69 | 百度Geek说 | `SE_PRACTICE` | 大厂工程实践 |
| 70 | 大淘宝技术 | `SE_PRACTICE` | 大厂工程实践 |
| 76 | 前端充电宝 | `SE_FRONTEND` | 明确为前端技术内容 |
| 77 | 稀土掘金技术社区 | `SE_PRACTICE` | 开发者综合社区 |
| 78 | 腾讯云开发者 | `SE_DEVOPS` | 云开发平台内容 |
| 80 | 前端早读课 | `SE_FRONTEND` | 明确为前端技术内容 |
| 81 | 开源服务指南 | `SE_TOOLS` | 开源工具/服务推荐 |
| 82 | dbaplus社群 | `SE_BACKEND` | 数据库/大数据为主 |
| 84 | Qunar技术沙龙 | `SE_PRACTICE` | 大厂工程实践 |
| 91 | vivo互联网技术 | `SE_PRACTICE` | 大厂工程实践 |
| 96 | InfoQ 中文 | `SE_PRACTICE` | 开发者技术媒体 |
| 99 | CSDN | `SE_PRACTICE` | 开发者综合平台 |
| 103 | 小红书技术REDtech | `SE_PRACTICE` | 大厂工程实践 |
| 108 | HelloGitHub | `SE_TOOLS` | 开源项目推荐，明确归属 SE_TOOLS |
| 121 | 印记中文 | `SE_FRONTEND` | 专注国外前端新领域的中文翻译平台 |
| 140 | 快手技术 | `SE_PRACTICE` | 大厂工程实践 |
| 167 | 逛逛GitHub | `SE_TOOLS` | 开源项目推荐 |
| 171 | 架构师之路 | `SE_BACKEND` | 架构设计内容 |
| 317 | Guillermo Rauch(@rauchg) | `SE_FRONTEND` | Vercel CEO，内容聚焦前端/全栈/Next.js |
| 342 | GitHub(@github) | `SE_TOOLS` | 代码托管平台，开发者工具生态 |
| 345 | Martin Fowler(@martinfowler) | `SE_PRACTICE` | 软件工程实践大师，已有网站也是同类 |
| 346 | Viking(@vikingmute) | `SE_PRACTICE` | 独立开发者，分享软件开发经验 |
| 347 | Geek(@geekbb) | `SE_TOOLS` | 科技工具爱好者 |
| 348 | Tw93(@HiTw93) | `SE_TOOLS` | 妙言/Pake 等工具作者，开发者工具方向 |
| 349 | Yangyi(@Yangyixxxx) | `SE_PRACTICE` | "人机协同内容架构师"，工程实践方向 |

### 3.2 Business_Tech, OTHERS → 建议替换

| 行号 | 订阅源名称 | 建议子分类 | 理由 |
|------|-----------|-----------|------|
| 60 | 极客公园 | `BT_NEWS` | 科技行业媒体，科技资讯为主 |
| 67 | 硅谷科技评论 | `BT_NEWS` | 科技/创投资讯 |
| 71 | Web3天空之城 | `BT_NEWS` | Web3/科技资讯 |
| 85 | 42章经 | `BT_INSIGHT` | 创投洞察，"思考事物本质" |
| 86 | 随机小分队 | `BT_NEWS` | 科技创新资讯 |
| 87 | 阿里研究院 | `BT_INSIGHT` | 商业洞察与研究报告 |
| 89 | 创业邦 | `BT_STARTUP` | 专注中国创新经济，创业生态 |
| 90 | Founder Park | `BT_PEOPLE` | 极客公园旗下，与科技创业者深度对话 |
| 95 | 腾讯科技 | `BT_NEWS` | 科技行业新闻媒体 |
| 98 | 海外独角兽 | `BT_STARTUP` | 研究科技大航海时代伟大公司，创业生态 |
| 102 | 笔记侠 | `BT_INSIGHT` | 新商业知识干货，商业洞察 |
| 109 | 经纬创投 | `BT_STARTUP` | VC 机构，创投生态 |
| 111 | 刘润 | `BT_INSIGHT` | 著名商业顾问，商业洞察 |
| 113 | 吴晓波频道 | `BT_INSIGHT` | 财经作家，商业分析 |
| 115 | 腾讯研究院 | `BT_INSIGHT` | 社会科学研究机构，商业洞察 |
| 122 | 真格基金 | `BT_STARTUP` | VC 机构，早期投资 |
| 124 | 甲子光年 | `BT_INSIGHT` | 科技智库，行业深度分析 |
| 125 | Z Potentials | `BT_INSIGHT` | 商业洞察内容 |
| 126 | 深网腾讯新闻 | `BT_INSIGHT` | 深度报道/调查，商业深度内容 |
| 128 | 白鲸出海 | `BT_STARTUP` | 出海创业/互联网出海服务 |
| 129 | 硅星人Pro | `BT_NEWS` | 科技行业资讯 |
| 136 | 暗涌Waves | `BT_STARTUP` | 36氪旗下投资报道，VC/创投动态 |
| 162 | 有新Newin | `BT_NEWS` | 科技资讯 |
| 163 | 晚点LatePost | `BT_INSIGHT` | 深度商业报道，硬核调查 |
| 170 | 网易科技 | `BT_NEWS` | 科技新闻媒体 |
| 174 | 硅谷101（文章） | `BT_PEOPLE` | 商业访谈为主 |
| 313 | a16z(@a16z) | `BT_STARTUP` | 顶级 VC，创业投资生态 |
| 314 | Y Combinator(@ycombinator) | `BT_STARTUP` | 最知名加速器，创业生态 |
| 318 | andrew chen(@andrewchen) | `BT_STARTUP` | a16z 合伙人，专注增长/创业 |
| 333 | 跨国串门儿计划 | `BT_PEOPLE` | AI 翻译英文播客，内容涉及科技人物访谈 |
| 334 | 卫诗婕｜商业漫谈Jane's talk | `BT_PEOPLE` | 独立商业记者，深度人物访谈 |
| 336 | 牛油果烤面包 | `BT_PEOPLE` | 硅谷资深专家访谈节目 |
| 337 | 半拿铁 | `BT_PEOPLE` | 商业人物故事，访谈节目 |
| 340 | 声动早咖啡 | `BT_NEWS` | 晨间商业科技快讯 |
| 352 | 罗永浩的十字路口 | `BT_PEOPLE` | 深度人物访谈播客 |
| 353 | 语言即世界language is world | `BT_PEOPLE` | 张小珺的内容工作室，商业人物报道 |

### 3.3 Product_Development, OTHERS → 建议替换

| 行号 | 订阅源名称 | 建议子分类 | 理由 |
|------|-----------|-----------|------|
| 2 | 人人都是产品经理 | `PD_PM` | 专注产品管理方法论和职业发展 |
| 75 | 优设 | `PD_CREATIVE` | 定位 AIGC 数字设计，创意与视觉方向 |
| 79 | 体验进阶 | `PD_DESIGN` | 用户体验设计 |
| 83 | 超人的电话亭 | `PD_DESIGN` | "只分享有价值的设计经验"，UX/UI 设计 |
| 93 | Clip设计夹 | `PD_DESIGN` | "B端设计、UI交互上的设计思考" |
| 134 | 强少来了 | `PD_PM` | 互联网产品经理 |

---

## 四、子分类为空但有明确归属（Priority: 低）

以下条目主分类正确，但 subCategory 为空，可按内容补充。

### 4.1 Programming_Technology（空 subCategory）

| 行号 | 订阅源名称 | 建议子分类 | 理由 |
|------|-----------|-----------|------|
| 7 | LinkedIn Engineering | `SE_PRACTICE` | 大厂工程博客（同时 category 也为空，需补充） |
| 10 | Netflix TechBlog | `SE_PRACTICE` | 大厂工程实践 |
| 11 | Slack Engineering | `SE_PRACTICE` | 大厂工程实践 |
| 12 | DoorDash Engineering Blog | `SE_PRACTICE` | 大厂工程实践 |
| 13 | Discord Blog | `SE_PRACTICE` | 大厂工程实践 |
| 14 | Elastic Blog | `SE_BACKEND` | Elasticsearch 生态，后端/搜索技术 |
| 15 | antirez | `SE_BACKEND` | Redis 作者，后端/数据库技术 |
| 17 | 掘金本周最热 | `SE_PRACTICE` | 开发者社区内容 |
| 18 | Supabase Blog | `SE_BACKEND` | 后端即服务（BaaS），数据库技术 |
| 22 | Google Cloud Blog | `SE_DEVOPS` | 云平台，DevOps 内容 |
| 24 | Next.js Blog | `SE_FRONTEND` | 前端框架 |
| 25 | Dropbox Tech Blog | `SE_PRACTICE` | 大厂工程实践 |
| 26 | David Heinemeier Hansson | `SE_PRACTICE` | Rails 作者，软件工程观点 |
| 27 | Stripe Blog | `SE_BACKEND` | 支付基础设施，后端/API 设计 |
| 45 | MongoDB Blog | `SE_BACKEND` | 数据库技术 |
| 46 | Databricks | `SE_BACKEND` | 数据工程/大数据平台 |
| 47 | Coding Horror | `SE_PRACTICE` | Jeff Atwood 的软件工程思考 |
| 48 | Visual Studio Blog | `SE_TOOLS` | IDE 工具 |
| 49 | Google Developers Blog | `SE_TOOLS` | 开发者工具与平台 |
| 51 | Node.js Blog | `SE_BACKEND` | Node.js 后端运行时 |
| 53 | Canva Engineering Blog | `SE_PRACTICE` | 大厂工程实践 |
| 54 | Docker | `SE_DEVOPS` | 容器化技术，DevOps |
| 61 | 美团技术团队 | `SE_PRACTICE` | 大厂工程实践 |
| 62 | Stack Overflow Blog | `SE_PRACTICE` | 开发者社区，软件工程观点 |
| 63 | Vercel News | `SE_FRONTEND` | 前端部署平台 |
| 64 | The Cloudflare Blog | `SE_DEVOPS` | 边缘计算/CDN，DevOps 基础设施 |
| 172 | Playwright实战教程 | `SE_PRACTICE` | 测试实践 |
| 367 | Fireship (YouTube) | `SE_FRONTEND` | 快节奏前端/全栈教程 |
| 368 | Spring I/O (YouTube) | `SE_BACKEND` | Java/Spring 后端框架 |
| 389 | freeCodeCamp.org (YouTube) | `SE_PRACTICE` | 编程学习与实践 |
| 390 | ByteByteGo (YouTube) | `SE_BACKEND` | 系统设计/架构，已有文章版也对应此类 |
| 396 | Sean Goedecke | `SE_PRACTICE` | 个人技术博客，工程实践 |

### 4.2 Artificial_Intelligence（空 subCategory）

| 行号 | 订阅源名称 | 建议子分类 | 理由 |
|------|-----------|-----------|------|
| 181 | 十字路口Crossing（播客） | `NEWS` | AI 行业变革与机会讨论，资讯观点类 |
| 186 | AI炼金术（播客） | `NEWS` | AI 行业洞察与机会讨论 |
| 187 | 人民公园说AI（播客） | `NEWS` | AI 创业陪伴型播客，资讯观点类 |

### 4.3 Business_Tech（空 subCategory）

| 行号 | 订阅源名称 | 建议子分类 | 理由 |
|------|-----------|-----------|------|
| 34 | HBR.org | `BT_INSIGHT` | 哈佛商业评论，商业洞察/管理思想 |
| 169 | 阑夕 | `BT_INSIGHT` | "寻找科技与商业的光芒"，深度洞察 |
| 173 | 36氪 | `BT_NEWS` | 科技商业资讯媒体 |
| 175 | What's Next｜科技早知道（播客） | `BT_NEWS` | 科技行业动态解读 |
| 176 | 无人知晓（播客） | `BT_PEOPLE` | 深度访谈节目 |
| 177 | 硅谷101（播客） | `BT_PEOPLE` | 硅谷精英深度访谈 |
| 178 | 三五环（播客） | `BT_PEOPLE` | 局内人访谈，以人物为核心 |
| 179 | 张小珺Jùn｜商业访谈录（播客） | `BT_PEOPLE` | 深度商业人物访谈 |
| 180 | 42章经（播客） | `BT_PEOPLE` | 与有趣/有认知的人深度对话 |
| 184 | 乱翻书（播客） | `BT_INSIGHT` | 商业科技深度分析，行业观察 |
| 185 | 硬地骇客（播客） | `BT_STARTUP` | 独立开发者/创业者，小而美生意 |
| 188 | 保持偏见（播客） | `BT_INSIGHT` | 商业深度解读，观点分析 |
| 189 | 枫言枫语（播客） | `BT_INSIGHT` | 科技与人文的思考，深度讨论 |
| 191 | 晚点聊 LateTalk（播客） | `BT_PEOPLE` | 晚点出品，科技从业者深度访谈 |
| 192 | 开始连接LinkStart（播客） | `BT_PEOPLE` | 极客公园出品，跨界对话访谈 |
| 193 | 此话当真（播客） | `BT_PEOPLE` | 真格基金出品，领域领军人物访谈 |
| 356 | 43 Talks | `BT_INSIGHT` | 深度思考与洞察类内容 |
| 363 | Y Combinator (YouTube) | `BT_STARTUP` | 最知名加速器，创业生态 |
| 365 | Sequoia Capital (YouTube) | `BT_STARTUP` | 顶级 VC，创业投资 |
| 366 | Stripe (YouTube) | `BT_STARTUP` | 创业基础设施，对创业者有高度相关性 |
| 369 | Dwarkesh Patel (YouTube) | `BT_PEOPLE` | 深度学术/商业人物访谈 |
| 370 | Lex Fridman (YouTube) | `BT_PEOPLE` | 深度访谈为核心，科学家/企业家/思想家 |
| 372 | a16z (YouTube) | `BT_STARTUP` | 顶级 VC，创业投资 |
| 373 | The Diary Of A CEO (YouTube) | `BT_PEOPLE` | CEO 人物故事访谈 |
| 380 | Greg Isenberg (YouTube) | `BT_STARTUP` | 创业想法/AI 创业实践 |
| 381 | My First Million (YouTube) | `BT_STARTUP` | 商业创业机会讨论 |
| 385 | All-In Podcast (YouTube) | `BT_INSIGHT` | 科技/经济/政治深度圆桌讨论 |
| 393 | TED (YouTube) | `BT_PEOPLE` | 以人物演讲为核心 |
| 397 | Silicon Valley Girl (YouTube) | `BT_PEOPLE` | 硅谷创业者/科技人的故事 |

### 4.4 Product_Development（空 subCategory）

| 行号 | 订阅源名称 | 建议子分类 | 理由 |
|------|-----------|-----------|------|
| 33 | UX Magazine | `PD_DESIGN` | 专注用户体验设计 |
| 38 | Smashing Magazine | `PD_DESIGN` | "For Web Designers And Developers"，UX/UI 设计 |
| 391 | Product School (YouTube) | `PD_PM` | 产品管理培训 |
| 392 | yobi321 (YouTube) | `PD_DESIGN` | UX Designer 内容 |

---

## 五、其他待确认项

| 行号 | 订阅源名称 | 当前分类 | 说明 |
|------|-----------|----------|------|
| 7 | LinkedIn Engineering | 空（无 category） | 需补充 `Programming_Technology, SE_PRACTICE` |
| 154 | Gino Notes | `Programming_Technology,`（空 subCategory） | 个人博客涵盖技术/AI/产品，可考虑改为 `Artificial_Intelligence, NEWS` 或补充 `SE_PRACTICE` |
| 286 | Satya Nadella(@satyanadella) | `Artificial_Intelligence, NEWS` | 微软 CEO，可改为 `Business_Tech, BT_PEOPLE`；当前分类也可接受，取决于内容导向 |
| 292 | Sundar Pichai(@sundarpichai) | `Artificial_Intelligence, NEWS` | Google CEO，同上，可改为 `Business_Tech, BT_PEOPLE` |
