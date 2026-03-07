# 杂志风 HTML 模板

生成 `digest-YYYY-MM-DD.html` 时使用此模板。文件必须自包含（所有 CSS 内联），可直接浏览器打开。

## 设计理念

融合 BestBlogs 品牌基因与现代主义杂志美学（Monocle / Kinfolk 风格）：

- **克制精准**: 瑞士国际主义的排版纪律，每个元素恰到好处，拒绝装饰性堆砌
- **手工质感**: 纸质噪点纹理、细腻渐变、微妙的阴影层次，营造有温度的阅读体验
- **呼吸留白**: 大量留白让信息有节奏感，而非塞满画面
- **低调专业**: 像高端设计杂志或建筑事务所作品集，经得起反复观看

### 色彩体系

以 BestBlogs 墨蓝为骨架，融入大地色的温度，琥珀金作为唯一点睛：

```css
:root {
  /* 主色：深墨蓝，比纯黑更有文化底蕴 */
  --ink: #1a2332;
  --ink-soft: #2d3748;

  /* 点睛：金铜琥珀，克制使用，只在排名数字和关键标记出现 */
  --accent: #c8956c;
  --accent-warm: #d4a574;
  --accent-muted: #f5ebe0;

  /* 纸张：带奶油暖调的纸张色，不是冷白 */
  --paper: #f8f5f0;
  --paper-warm: #f3efe8;
  --surface: #ffffff;

  /* 文字层次 */
  --text-body: #374151;
  --text-secondary: #6b7280;
  --text-caption: #9ca3af;

  /* 结构线：极淡，几乎只是暗示 */
  --rule: #e8e4de;
  --rule-light: #f0ece6;
}
```

### 排版

- 标题: 衬线体（Georgia / Noto Serif），letter-spacing 微微拉宽，传递学术与沉静
- 正文: 系统无衬线体，行高宽松（1.75），阅读舒适
- 数字/排名: 等宽或 tabular figures，对齐工整
- 标题可微微倾斜（-0.5deg ~ -1deg）带来动感，但绝不浮夸

## HTML 结构模板

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Twitter Daily Digest - YYYY-MM-DD</title>
  <style>
    /* === 重置 === */
    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

    /* === 纸质噪点纹理 === */
    body::before {
      content: '';
      position: fixed;
      top: 0; left: 0; width: 100%; height: 100%;
      opacity: 0.03;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
      pointer-events: none;
      z-index: 9999;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', sans-serif;
      line-height: 1.75;
      color: #374151;
      background: #f8f5f0;
      padding: 40px 24px;
      -webkit-font-smoothing: antialiased;
    }

    .container {
      max-width: 720px;
      margin: 0 auto;
    }

    /* === 头部：克制而有份量 === */
    .header {
      padding: 0 0 40px;
      margin-bottom: 40px;
      border-bottom: 1px solid #e8e4de;
      position: relative;
    }

    .header .dateline {
      font-size: 11px;
      letter-spacing: 3px;
      text-transform: uppercase;
      color: #9ca3af;
      margin-bottom: 12px;
    }

    .header h1 {
      font-family: Georgia, 'Noto Serif SC', 'Source Han Serif SC', serif;
      font-size: 32px;
      font-weight: 400;
      color: #1a2332;
      letter-spacing: 0.5px;
      line-height: 1.3;
      transform: rotate(-0.5deg);
      transform-origin: left center;
    }

    .header .lede {
      font-size: 16px;
      color: #6b7280;
      margin-top: 16px;
      line-height: 1.8;
      max-width: 580px;
    }

    /* === 头条区域 (Top 1-3)：大卡片，有呼吸 === */
    .headline-section {
      margin-bottom: 48px;
    }

    .section-label {
      font-size: 10px;
      letter-spacing: 4px;
      text-transform: uppercase;
      color: #c8956c;
      margin-bottom: 24px;
      font-weight: 600;
    }

    .headline-card {
      background: #ffffff;
      border-radius: 4px;
      padding: 28px 32px;
      margin-bottom: 20px;
      box-shadow: 0 1px 2px rgba(26, 35, 50, 0.04);
      position: relative;
      transition: box-shadow 0.2s ease;
    }

    .headline-card:hover {
      box-shadow: 0 2px 8px rgba(26, 35, 50, 0.08);
    }

    .headline-card .rank-author {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 14px;
    }

    .headline-card .rank {
      font-family: Georgia, serif;
      font-size: 20px;
      font-weight: 400;
      color: #c8956c;
      min-width: 24px;
    }

    .headline-card .author-name {
      font-size: 14px;
      font-weight: 600;
      color: #1a2332;
      letter-spacing: 0.3px;
    }

    .headline-card .author-handle {
      font-size: 12px;
      color: #9ca3af;
    }

    .headline-card .content {
      font-size: 15px;
      color: #374151;
      line-height: 1.8;
      margin-left: 36px;
    }

    .headline-card .foot {
      margin-top: 16px;
      margin-left: 36px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 8px;
    }

    .headline-card .metrics {
      display: flex;
      gap: 14px;
      font-size: 12px;
      color: #9ca3af;
    }

    .headline-card .metrics .inf {
      color: #c8956c;
      font-weight: 600;
    }

    .headline-card .view-link {
      font-size: 12px;
      color: #6b7280;
      text-decoration: none;
      letter-spacing: 0.5px;
      transition: color 0.15s;
    }

    .headline-card .view-link:hover {
      color: #c8956c;
    }

    /* === 分隔细线 === */
    .divider {
      border: none;
      border-top: 1px solid #e8e4de;
      margin: 40px 0;
    }

    /* === 列表区域 (Top 4-10)：紧凑优雅 === */
    .list-section {
      margin-bottom: 48px;
    }

    .list-item {
      display: flex;
      align-items: flex-start;
      padding: 18px 0;
      border-bottom: 1px solid #f0ece6;
    }

    .list-item:last-child {
      border-bottom: none;
    }

    .list-item .rank {
      flex-shrink: 0;
      font-family: Georgia, serif;
      font-size: 15px;
      color: #c8956c;
      width: 28px;
      padding-top: 1px;
    }

    .list-item .info {
      flex: 1;
    }

    .list-item .top-line {
      display: flex;
      align-items: baseline;
      gap: 8px;
      margin-bottom: 4px;
    }

    .list-item .author-name {
      font-size: 13px;
      font-weight: 600;
      color: #1a2332;
    }

    .list-item .author-handle {
      font-size: 11px;
      color: #9ca3af;
    }

    .list-item .summary-text {
      font-size: 14px;
      color: #374151;
      line-height: 1.7;
    }

    .list-item .summary-text a {
      color: #6b7280;
      text-decoration: none;
      border-bottom: 1px solid #e8e4de;
      transition: color 0.15s, border-color 0.15s;
    }

    .list-item .summary-text a:hover {
      color: #c8956c;
      border-color: #c8956c;
    }

    .list-item .meta {
      font-size: 11px;
      color: #9ca3af;
      margin-top: 6px;
    }

    .list-item .meta .inf {
      color: #c8956c;
    }

    /* === 关键词区域：标签云 === */
    .tags-section {
      padding: 32px 0;
      border-top: 1px solid #e8e4de;
    }

    .tags-section .section-label {
      text-align: center;
      margin-bottom: 20px;
    }

    .tags-wrap {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 8px;
    }

    .tag {
      display: inline-block;
      padding: 5px 14px;
      border-radius: 20px;
      font-size: 12px;
      letter-spacing: 0.3px;
      background: #f0ece6;
      color: #6b7280;
      transition: background 0.15s;
    }

    .tag:hover {
      background: #e8e4de;
    }

    .tag.accent {
      background: #f5ebe0;
      color: #92400e;
    }

    /* === 页脚：极简 === */
    .footer {
      text-align: center;
      padding: 32px 0 0;
      font-size: 11px;
      color: #9ca3af;
      letter-spacing: 0.5px;
    }

    .footer a {
      color: #6b7280;
      text-decoration: none;
      border-bottom: 1px solid #e8e4de;
    }

    .footer a:hover {
      color: #c8956c;
      border-color: #c8956c;
    }

    /* === 移动端 === */
    @media (max-width: 640px) {
      body { padding: 24px 16px; }
      .header h1 { font-size: 24px; }
      .headline-card { padding: 20px; }
      .headline-card .content { margin-left: 0; margin-top: 4px; }
      .headline-card .foot { margin-left: 0; }
    }
  </style>
</head>
<body>
  <div class="container">

    <div class="header">
      <div class="dateline">YYYY-MM-DD · TWITTER DAILY DIGEST</div>
      <h1>今日推特圈最值得关注的 10 件事</h1>
      <div class="lede">一句话总结今日整体动态，点出最核心的 1-2 个主题。</div>
    </div>

    <!-- 头条 Top 1-3 -->
    <div class="headline-section">
      <div class="section-label">Headlines</div>

      <div class="headline-card">
        <div class="rank-author">
          <span class="rank">01</span>
          <div class="author-block">
            <span class="author-name">DisplayName</span>
            <span class="author-handle">@username</span>
          </div>
        </div>
        <div class="content">
          用自然语言概括推文核心内容（2-3 句），传递关键信息和为什么重要。
        </div>
        <div class="foot">
          <div class="metrics">
            <span class="inf">影响力 1341</span>
            <span>👍 4.6K</span>
            <span>🔁 633</span>
            <span>👁 2M</span>
          </div>
          <a class="view-link" href="https://x.com/..." target="_blank">查看原文 →</a>
        </div>
      </div>

      <!-- 重复 Top 2, 3 -->
    </div>

    <hr class="divider">

    <!-- 列表 Top 4-10 -->
    <div class="list-section">
      <div class="section-label">Also Noteworthy</div>

      <div class="list-item">
        <span class="rank">04</span>
        <div class="info">
          <div class="top-line">
            <span class="author-name">DisplayName</span>
            <span class="author-handle">@username</span>
          </div>
          <div class="summary-text">
            一句话概括核心内容。
            <a href="https://x.com/..." target="_blank">查看原文 →</a>
          </div>
          <div class="meta"><span class="inf">影响力 791</span> · 👍 2.9K · 👁 347K</div>
        </div>
      </div>

      <!-- 重复 Top 5-10 -->
    </div>

    <!-- 关键词 -->
    <div class="tags-section">
      <div class="section-label">Today's Keywords</div>
      <div class="tags-wrap">
        <span class="tag accent">Claude Code</span>
        <span class="tag accent">Codex Security</span>
        <span class="tag">GPT-5.4</span>
        <span class="tag">vibe coding</span>
        <span class="tag">nanochat</span>
      </div>
    </div>

    <div class="footer">
      Data via <a href="https://xgo.ing">XGo</a> ·
      <a href="digest-YYYY-MM-DD-full.md">Full version</a>
    </div>

  </div>
</body>
</html>
```

## 内容填充规则

1. **标题 h1**: 根据 Top 10 内容提炼一个概括性标题，如「Anthropic 安全研究突破与 AI Coding 工具竞赛」，使用用户习惯的语言。不要用泛泛的「每日简报」。
2. **Lede**: 一句话点出今日最核心的趋势或事件。
3. **头条 (Top 1-3)**: 2-3 句自然语言概括，传递核心信息和 why it matters。排名数字用两位数格式（01, 02, 03）。
4. **列表 (Top 4-10)**: 一句话概括。只保留影响力 + 2 个最高的互动指标。
5. **关键词**: 8-12 个，AI Coding 和头部厂商相关的标记为 `accent`。从推文内容中提取，不要编造。
6. **互动指标**: 为 0 或 null 时省略，大数字用 K/M 格式化。
7. **链接**: `查看原文 →` 统一格式，`target="_blank"` 新窗口打开。
