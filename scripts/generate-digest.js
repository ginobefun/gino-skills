#!/usr/bin/env node
/**
 * 生成每日推文简报输出
 */

const fs = require('fs');
const path = require('path');

const data = JSON.parse(fs.readFileSync('/tmp/tweet_digest_data.json', 'utf8'));
const date = data.date;
const top20 = data.top20;
const top10 = data.top10;
const allTweets = data.allTweets;
const categories = data.categories;

const outputDir = path.join('contents/twitter-digest', date);
fs.mkdirSync(outputDir, { recursive: true });

// 格式化数字
function formatNumber(n) {
  if (!n || n === 0) return null;
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toString();
}

// 格式化互动指标
function formatEngagement(tweet) {
  const parts = [];
  const like = formatNumber(tweet.likeCount);
  const rt = formatNumber(tweet.retweetCount);
  const reply = formatNumber(tweet.replyCount);
  const quote = formatNumber(tweet.quoteCount);
  const bookmark = formatNumber(tweet.bookmarkCount);
  const view = formatNumber(tweet.viewCount);

  if (like) parts.push(`👍 ${like}`);
  if (rt) parts.push(`🔁 ${rt}`);
  if (reply) parts.push(`💬 ${reply}`);
  if (quote) parts.push(`🔄 ${quote}`);
  if (bookmark) parts.push(`📑 ${bookmark}`);
  if (view) parts.push(`👁 ${view}`);

  return parts.join(' ');
}

// 生成一句话摘要（简化版）
function summarizeTweet(tweet, index) {
  const text = tweet.text || '';
  const author = tweet.author?.userName || 'unknown';

  // 头条（1-3）多写几句
  if (index < 3) {
    return text.substring(0, 200) + (text.length > 200 ? '...' : '');
  }
  // 值得关注（4-10）
  if (index < 10) {
    return text.substring(0, 150) + (text.length > 150 ? '...' : '');
  }
  // 快速浏览（11-20）
  return text.substring(0, 100) + (text.length > 100 ? '...' : '');
}

// ============ 5.1 可读简报 ============
function generateDigest() {
  let md = `# Twitter 日报 ${date}

> 过去24小时推特圈最值得关注的动态：Claude 100万token上下文正式开放、AI Agent与人类协作新商业模式出现、Anthropic承认Claude存在谄媚行为。

---

## 头条

`;

  // Top 1-3
  for (let i = 0; i < Math.min(3, top20.length); i++) {
    const t = top20[i];
    const summary = summarizeTweet(t, i);
    md += `**${i+1}. @${t.author.userName}** [🔗](${t.url})\n\n`;
    md += `${summary}\n\n`;
    md += `*影响力: ${t.influenceScore} | ${formatEngagement(t)}*\n\n`;
  }

  md += `## 值得关注

`;

  // Top 4-10
  for (let i = 3; i < Math.min(10, top20.length); i++) {
    const t = top20[i];
    const summary = summarizeTweet(t, i);
    md += `**${i+1}. @${t.author.userName}**: ${summary} [🔗](${t.url})\n\n`;
  }

  md += `## 快速浏览

`;

  // Top 11-20
  for (let i = 10; i < top20.length; i++) {
    const t = top20[i];
    const summary = summarizeTweet(t, i);
    md += `- **@${t.author.userName}**: ${summary} [链接](${t.url})\n`;
  }

  md += `\n---

*数据来源：XGo | 关注者 ${data.stats.following} 条 + 推荐 ${data.stats.recommendation} 条 | [完整版](digest-full.md)*`;

  fs.writeFileSync(path.join(outputDir, 'digest.md'), md);
  console.log('✅ 可读简报已生成:', path.join(outputDir, 'digest.md'));
}

// ============ 5.2 完整版 ============
function generateFullDigest() {
  let md = `# 每日推文简报 - 完整版 (${date}, 共 ${data.stats.total} 条)\n\n`;
  md += `来源：关注者推文 ${data.stats.following} 条 + 推荐推文 ${data.stats.recommendation} 条，去重后 ${data.stats.total} 条。\n\n---\n\n`;

  // 按分类组织全部推文
  categories.forEach(cat => {
    const catTweets = cat.tweets;
    if (catTweets.length === 0) return;

    // AI 摘要（简化版）
    md += `## ${cat.name} (${catTweets.length} 条)\n\n`;

    catTweets.forEach((t, i) => {
      md += `#### ${i+1}. @${t.author.userName} - ${t.author.name}\n`;
      md += `- **影响力**: ${t.influenceScore} | **互动**: ${formatEngagement(t)}\n`;
      md += `- **内容**:\n\n  ${t.text.replace(/\n/g, '\n  ')}\n\n`;
      md += `- **链接**: [查看原文](${t.url})\n\n`;
    });
  });

  fs.writeFileSync(path.join(outputDir, 'digest-full.md'), md);
  console.log('✅ 完整版已生成:', path.join(outputDir, 'digest-full.md'));
}

// ============ 5.3 杂志风 HTML ============
function generateHTML() {
  const dateStr = date;

  // 构建头条卡片 (Top 1-3)
  const headlineCards = top20.slice(0, 3).map((t, i) => {
    const summary = summarizeTweet(t, i);
    const engagement = formatEngagement(t);
    return `
    <div class="headline-card card-${i+1}">
      <div class="card-meta">
        <img class="avatar" src="${t.author.profileImageUrl}" alt="@${t.author.userName}">
        <div class="author-info">
          <div class="author-name">@${t.author.userName}</div>
          <div class="author-display">${t.author.name}</div>
        </div>
      </div>
      <div class="card-content">${summary}</div>
      <div class="card-footer">
        <span class="score">📊 ${t.influenceScore}</span>
        <span class="engagement">${engagement}</span>
        <a href="${t.url}" target="_blank" class="link">查看原文 →</a>
      </div>
    </div>`;
  }).join('\n');

  // 构建列表项 (Top 4-20)
  const listItems = top20.slice(3).map((t, i) => {
    const summary = summarizeTweet(t, i + 3);
    return `
    <div class="list-item">
      <div class="list-rank">${i + 4}</div>
      <div class="list-content">
        <div class="list-author">@${t.author.userName}</div>
        <div class="list-text">${summary}</div>
        <div class="list-meta">
          <span>📊 ${t.influenceScore}</span>
          <a href="${t.url}" target="_blank">查看原文</a>
        </div>
      </div>
    </div>`;
  }).join('\n');

  // 提取关键词（基于 top 20 的文本）
  const allText = top20.map(t => t.text).join(' ').toLowerCase();
  const keywords = [];
  const keywordList = ['Claude', 'AI', 'OpenAI', 'Anthropic', 'coding', 'agent', 'model', 'launch', 'new', 'feature'];
  keywordList.forEach(kw => {
    if (allText.includes(kw.toLowerCase())) keywords.push(kw);
  });
  const keywordTags = keywords.slice(0, 6).map(k => `<span class="tag">${k}</span>`).join(' ');

  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Twitter 日报 ${dateStr}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #fafafa;
      color: #1a1a1a;
      line-height: 1.6;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    header {
      text-align: center;
      padding: 40px 0;
      border-bottom: 2px solid #1a1a1a;
      margin-bottom: 40px;
    }
    .brand {
      font-size: 12px;
      letter-spacing: 2px;
      color: #666;
      margin-bottom: 10px;
    }
    h1 {
      font-size: 42px;
      font-weight: 700;
      letter-spacing: -1px;
    }
    .date {
      font-size: 16px;
      color: #666;
      margin-top: 10px;
    }
    .tagline {
      font-size: 16px;
      color: #444;
      margin-top: 20px;
      font-style: italic;
    }
    .section-title {
      font-size: 14px;
      font-weight: 600;
      letter-spacing: 1px;
      text-transform: uppercase;
      color: #666;
      margin: 40px 0 20px;
      padding-bottom: 10px;
      border-bottom: 1px solid #ddd;
    }
    .headlines {
      display: grid;
      gap: 20px;
    }
    .headline-card {
      background: white;
      border: 1px solid #e0e0e0;
      padding: 24px;
      position: relative;
    }
    .card-1 { border-left: 4px solid #1a1a1a; }
    .card-2 { border-left: 4px solid #333; }
    .card-3 { border-left: 4px solid #666; }
    .card-meta {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
    }
    .avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
    }
    .author-name {
      font-weight: 600;
      font-size: 15px;
    }
    .author-display {
      font-size: 13px;
      color: #666;
    }
    .card-content {
      font-size: 15px;
      line-height: 1.7;
      color: #333;
      margin-bottom: 16px;
    }
    .card-footer {
      display: flex;
      align-items: center;
      gap: 16px;
      font-size: 13px;
      color: #666;
    }
    .card-footer .link {
      color: #1a1a1a;
      text-decoration: none;
      font-weight: 500;
    }
    .card-footer .link:hover {
      text-decoration: underline;
    }
    .list-section {
      margin-top: 20px;
    }
    .list-item {
      display: flex;
      gap: 16px;
      padding: 20px;
      background: white;
      border: 1px solid #e0e0e0;
      margin-bottom: 12px;
    }
    .list-rank {
      width: 28px;
      height: 28px;
      background: #1a1a1a;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 13px;
    }
    .list-content {
      flex: 1;
    }
    .list-author {
      font-weight: 600;
      font-size: 14px;
      margin-bottom: 6px;
    }
    .list-text {
      font-size: 14px;
      color: #444;
      line-height: 1.6;
      margin-bottom: 10px;
    }
    .list-meta {
      display: flex;
      gap: 16px;
      font-size: 12px;
      color: #666;
    }
    .list-meta a {
      color: #1a1a1a;
      text-decoration: none;
    }
    .keywords {
      margin-top: 30px;
      padding: 20px;
      background: #f5f5f5;
    }
    .keywords-title {
      font-size: 12px;
      font-weight: 600;
      color: #666;
      margin-bottom: 12px;
    }
    .tag {
      display: inline-block;
      padding: 6px 12px;
      background: white;
      border: 1px solid #ddd;
      font-size: 13px;
      margin-right: 8px;
      margin-bottom: 8px;
    }
    footer {
      text-align: center;
      padding: 40px 0;
      margin-top: 40px;
      border-top: 1px solid #ddd;
      font-size: 13px;
      color: #666;
    }
    footer a {
      color: #1a1a1a;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="brand">XGo (xgo.ing)</div>
      <h1>TWITTER DIGEST</h1>
      <div class="date">${dateStr}</div>
      <div class="tagline">过去24小时推特圈最值得关注的动态</div>
    </header>

    <div class="section-title">HEADLINES 头条</div>
    <div class="headlines">
      ${headlineCards}
    </div>

    <div class="section-title">MORE STORIES 更多</div>
    <div class="list-section">
      ${listItems}
    </div>

    <div class="keywords">
      <div class="keywords-title">TRENDING TOPICS 热门话题</div>
      ${keywordTags}
    </div>

    <footer>
      <p>数据来源：XGo (xgo.ing) | 关注者 ${data.stats.following} 条 + 推荐 ${data.stats.recommendation} 条</p>
      <p style="margin-top: 8px;"><a href="digest-full.md">查看完整版</a></p>
    </footer>
  </div>
</body>
</html>`;

  fs.writeFileSync(path.join(outputDir, 'digest.html'), html);
  console.log('✅ 杂志风 HTML 已生成:', path.join(outputDir, 'digest.html'));
}

// ============ 5.4 信息图提示词 ============
function generateInfographicPrompt() {
  // 构建 Top 10 的信息图描述
  let prompt = `Create a modern, minimalist infographic poster for "Twitter Daily Digest ${date}".

Style: Clean editorial design with off-white/cream background (#FAF9F6), black and charcoal text, subtle geometric grid layout inspired by Monocle magazine and Kinfolk aesthetic.

Structure:
- Header: "TWITTER DIGEST" in bold sans-serif, date "${date}" below, small "XGo" branding
- Top 10 List: Numbered 1-10, each entry shows:
`;

  top10.forEach((t, i) => {
    const summary = summarizeTweet(t, i).substring(0, 60) + '...';
    prompt += `  ${i+1}. @${t.author.userName} - "${summary}" (Score: ${t.influenceScore})\n`;
  });

  // 提取热门关键词
  const allText = top10.map(t => t.text).join(' ').toLowerCase();
  const keywords = [];
  ['Claude', 'AI', 'OpenAI', 'Anthropic', 'Coding', 'Agent', 'Launch'].forEach(kw => {
    if (allText.includes(kw.toLowerCase())) keywords.push(kw);
  });

  prompt += `
- Footer: Keywords tags [${keywords.slice(0, 5).join(', ')}]

Design notes: Use a clear visual hierarchy with the top 3 headlines emphasized. Include subtle noise texture for paper-like quality. 9:16 vertical aspect ratio suitable for mobile viewing.`;

  fs.writeFileSync(path.join(outputDir, 'infographic-prompt.txt'), prompt);
  console.log('✅ 信息图提示词已生成:', path.join(outputDir, 'infographic-prompt.txt'));

  return prompt;
}

// 执行生成
generateDigest();
generateFullDigest();
generateHTML();
const prompt = generateInfographicPrompt();

console.log('\n📊 生成统计:');
console.log(`  - 总推文: ${data.stats.total}`);
console.log(`  - Top 20: ${top20.length}`);
console.log(`  - Top 10: ${top10.length}`);
console.log(`  - 分类数: ${categories.length}`);

// 输出信息图提示词（用于调用 image-gen）
console.log('\n🎨 信息图提示词（可用于 image-gen）:\n');
console.log(prompt);
