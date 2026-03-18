# 杂志风 HTML 模板与设计规范

生成一个可直接在浏览器打开的独立 HTML 文件，信息量介于纯文本和海报之间，适合浏览和截图分享。

整体追求**高端设计杂志**（Monocle、Kinfolk）的气质 — 低调、专业、有文化底蕴，经得起反复观看。

## 视觉风格（BestBlogs 品牌 + 现代主义杂志美学）

| 维度 | 规范 |
|------|------|
| **色彩体系** | 墨蓝 `#1a365d`（主色/标题/序号）、琥珀 `#d97706`（唯一强调色，仅用于 Top 1）、米白纸张 `#fefdfb`（背景）、深炭灰 `#374151`（正文）、中灰 `#6b7280`（辅助信息） |
| **标题字体** | Georgia, 'Noto Serif SC', serif — 衬线体营造书卷气质 |
| **正文字体** | -apple-system, 'PingFang SC', 'Helvetica Neue', sans-serif |
| **数字/评分** | 'Inter', sans-serif — 等宽数字对齐 |
| **质感纹理** | body 叠加细腻纸质噪点（CSS SVG filter，opacity 0.03），营造纸张手工质感 |
| **卡片风格** | 无边框，仅用极淡分隔线 `#e5e7eb` 区隔条目；避免堆叠阴影，保持平面克制感 |
| **Top 1 强调** | 左侧 3px 琥珀色竖线 + 浅琥珀背景 `rgba(217,119,6,0.06)`，克制而醒目 |
| **留白** | 大量留白让信息有呼吸感 — 卡片间距 32px，内边距 24px，标题与摘要间距 12px |
| **宽度** | max-width 640px 居中，窄幅阅读体验 |

## HTML 结构

```html
<!-- 独立 HTML，内联所有 CSS + SVG 噪点，无外部依赖 -->
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BestBlogs 早报 | YYYY-MM-DD</title>
  <style>
    /* 纸质噪点纹理 */
    body::before {
      content: '';
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      opacity: 0.03; pointer-events: none; z-index: 9999;
      background-image: url("data:image/svg+xml,..."); /* inline SVG noise */
    }
    /* 其余样式内联 */
  </style>
</head>
<body style="background: #fefdfb;">
  <!-- 头部区域 -->
  <!--   "BestBlogs 早报" 品牌标题（墨蓝，衬线体，letter-spacing 0.05em） -->
  <!--   日期（中灰，小号） -->
  <!--   关键词标签（墨蓝边框胶囊，背景透明，font-size 12px） -->

  <!-- Top 1 精选卡片 -->
  <!--   琥珀色左边线 + 微暖背景 -->
  <!--   标题（墨蓝衬线体，font-size 20px） -->
  <!--   2-3 句摘要 + 主要观点 -->
  <!--   来源 | 分类 | 评分 -->

  <!-- 2-10 常规条目 -->
  <!--   序号（墨蓝，Inter 字体，与标题同行） -->
  <!--   标题（可点击链接，衬线体，font-size 17px） -->
  <!--   1-2 句摘要（深炭灰，font-size 14px，line-height 1.6） -->
  <!--   来源 | 类型标签 | 评分（中灰，font-size 12px） -->
  <!--   条目间以极淡分隔线区隔 -->

  <!-- 底部 -->
  <!--   细分隔线 -->
  <!--   "BestBlogs.dev" 品牌标识（墨蓝，letter-spacing） -->
  <!--   "遇见更好的技术阅读"（中灰，font-size 12px） -->
</body>
</html>
```

## 每张卡片包含

- 墨蓝序号 + 衬线体标题（可点击，链接到 readUrl）
- 来源 | 分类 | 评分（中灰辅助行）
- 1-2 句摘要（深炭灰正文）
- Top 1 额外展示：主要观点（如有）、为什么值得关注
- 内容类型标识：文章无标注、推文 `@` 前缀、播客/视频显示时长胶囊标签

## 设计禁忌

- 不要使用渐变背景、发光效果、蓝紫科技感
- 不要给每张卡片加投影 — 用分隔线代替
- 不要塞满画面 — 留白是设计的一部分
- 不要超过两种强调色 — 琥珀是唯一的点睛
