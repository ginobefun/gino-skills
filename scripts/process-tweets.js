#!/usr/bin/env node
/**
 * 处理推文数据，生成每日简报
 */

const fs = require('fs');
const path = require('path');

const sourceBundlePath = process.env.XGO_DIGEST_SOURCE_PATH;
const outputPath = process.env.XGO_DIGEST_OUTPUT_PATH || '/tmp/tweet_digest_data.json';

let listData = [];
let followingTweets = [];
let recommendationTweets = [];

if (sourceBundlePath) {
  const sourceBundle = JSON.parse(fs.readFileSync(sourceBundlePath, 'utf8'));
  listData = sourceBundle.lists || [];
  followingTweets = sourceBundle.followingTweets || [];
  recommendationTweets = sourceBundle.recommendationTweets || [];
} else {
  const listAll = JSON.parse(fs.readFileSync('/tmp/list_all.json', 'utf8'));
  const followingP1 = JSON.parse(fs.readFileSync('/tmp/following_p1.json', 'utf8'));
  const followingP2 = JSON.parse(fs.readFileSync('/tmp/following_p2.json', 'utf8'));
  const recommendP1 = JSON.parse(fs.readFileSync('/tmp/recommend_p1.json', 'utf8'));
  const recommendP2 = JSON.parse(fs.readFileSync('/tmp/recommend_p2.json', 'utf8'));

  if (!listAll.success || !followingP1.success || !followingP2.success || !recommendP1.success || !recommendP2.success) {
    console.error('API 返回错误');
    process.exit(1);
  }

  listData = listAll.data || [];
  followingTweets = [
    ...(followingP1.data?.data || []),
    ...(followingP2.data?.data || []),
  ];
  recommendationTweets = [
    ...(recommendP1.data?.data || []),
    ...(recommendP2.data?.data || []),
  ];
}

// 第二步：构建 author->list 映射
const authorToList = new Map();

listData.forEach(list => {
  const listName = list.name;
  const members = list.members || [];
  members.forEach(member => {
    const username = member.userName;
    if (username && !authorToList.has(username)) {
      authorToList.set(username, listName);
    }
  });
});

console.log(`构建了 ${authorToList.size} 个作者的列表映射`);

// 第三步：合并去重
const allTweets = [];
const tweetMap = new Map();

// 添加来源标记的辅助函数
function addTweets(tweets, source) {
  tweets.forEach(tweet => {
    if (!tweetMap.has(tweet.id)) {
      tweet.source = source;
      tweetMap.set(tweet.id, tweet);
      allTweets.push(tweet);
    } else {
      // 优先保留 following 来源
      const existing = tweetMap.get(tweet.id);
      if (source === 'following' && existing.source === 'recommendation') {
        existing.source = 'following';
      }
    }
  });
}

addTweets(followingTweets, 'following');
addTweets(recommendationTweets, 'recommendation');

console.log(`去重后共 ${allTweets.length} 条推文`);

// 第四步：分类
const categories = new Map();
const otherFollowing = [];
const otherRecommendation = [];

allTweets.forEach(tweet => {
  const username = tweet.author?.userName;
  const listName = authorToList.get(username);

  if (listName) {
    if (!categories.has(listName)) {
      categories.set(listName, []);
    }
    categories.get(listName).push(tweet);
  } else if (tweet.source === 'following') {
    otherFollowing.push(tweet);
  } else {
    otherRecommendation.push(tweet);
  }
});

// 添加"其他"分类
if (otherFollowing.length > 0) {
  categories.set('其他', otherFollowing);
}
if (otherRecommendation.length > 0) {
  categories.set('其他 (推荐)', otherRecommendation);
}

console.log(`分类结果:`);
categories.forEach((tweets, name) => {
  console.log(`  ${name}: ${tweets.length} 条`);
});

// 第五步：智能筛选与排序

// 定义权重配置
const SOURCE_WEIGHTS = {
  'headline_vendor': 5,      // 头部厂商官方
  'industry_leader': 3,      // 行业领袖
  'premium_media': 2,        // 高优媒体
  'builder': 1.5,            // Builder/独立开发者
  'default': 1
};

const TOPIC_WEIGHTS = {
  'ai_coding': 2,            // AI Coding
  'new_release': 1.8,        // 新发布/新产品
  'methodology': 1.3,        // 方法论/实践
  'default': 1
};

// 头部厂商官方账号（用户名或显示名匹配）
const HEADLINE_VENDORS = [
  'OpenAI', 'OpenAIDevs', 'ChatGPTapp',
  'AnthropicAI', 'claudeai', 'alexalbert__',
  'GoogleDeepMind', 'sundarpichai',
  'DeepSeek', 'Qwen', 'Kimi', '智谱', 'GLM', 'MiniMax',
  'AIatMeta', 'ylecun'
];

// 行业领袖
const INDUSTRY_LEADERS = [
  'karpathy', 'sama', 'AndrewYNg'
];

// 高优媒体/创作者
const PREMIUM_MEDIA = [
  'ycombinator', 'a16z', 'LennysPodcast', 'GergelyOrosz',
  'lexfridman', 'TheRundownAI', 'vista8', 'dotey', 'HiTw93',
  'xicilion', 'LatentSpace', 'FounderPark'
];

// Builder/独立开发者
const BUILDERS = [
  'levelsio', 'garrytan', 'pmarca', 'gregisenberg'
];

// 检测来源类型
function detectSourceType(tweet) {
  const username = tweet.author?.userName || '';
  const name = tweet.author?.name || '';
  const combined = `${username} ${name}`.toLowerCase();

  for (const vendor of HEADLINE_VENDORS) {
    if (combined.includes(vendor.toLowerCase())) return 'headline_vendor';
  }
  for (const leader of INDUSTRY_LEADERS) {
    if (username.toLowerCase() === leader.toLowerCase()) return 'industry_leader';
  }
  for (const media of PREMIUM_MEDIA) {
    if (username.toLowerCase() === media.toLowerCase()) return 'premium_media';
  }
  for (const builder of BUILDERS) {
    if (username.toLowerCase() === builder.toLowerCase()) return 'builder';
  }
  return 'default';
}

// 检测主题类型
function detectTopicType(tweet) {
  const text = (tweet.text || '').toLowerCase();

  // AI Coding
  const aiCodingKeywords = ['claude code', 'codex', 'cursor', 'windsurf', 'copilot', 'vibe coding', 'ai coding', 'agentic coding'];
  for (const kw of aiCodingKeywords) {
    if (text.includes(kw)) return 'ai_coding';
  }

  // 新发布
  const releaseKeywords = ['launching', 'introducing', 'announcing', 'releasing', 'now available', '发布', '上线', '开源'];
  for (const kw of releaseKeywords) {
    if (text.includes(kw)) return 'new_release';
  }

  // 方法论
  const methodKeywords = ['best practice', 'lesson learned', 'how i ', 'architecture', 'framework', '实践', '经验', '方法论'];
  for (const kw of methodKeywords) {
    if (text.includes(kw)) return 'methodology';
  }

  return 'default';
}

// 计算综合分数
function calculateScore(tweet) {
  const influenceScore = tweet.influenceScore || 0;
  const sourceType = detectSourceType(tweet);
  const topicType = detectTopicType(tweet);

  const sourceWeight = SOURCE_WEIGHTS[sourceType] || SOURCE_WEIGHTS.default;
  const topicWeight = TOPIC_WEIGHTS[topicType] || TOPIC_WEIGHTS.default;

  return influenceScore * sourceWeight * topicWeight;
}

// 为所有推文计算分数
allTweets.forEach(tweet => {
  tweet.compositeScore = calculateScore(tweet);
  tweet.sourceType = detectSourceType(tweet);
  tweet.topicType = detectTopicType(tweet);
});

// 按综合分数排序
allTweets.sort((a, b) => b.compositeScore - a.compositeScore);

// 选取 Top 20 用于简报
const top20 = allTweets.slice(0, 20);
const top10 = allTweets.slice(0, 10);

console.log('\nTop 20 推文:');
top20.forEach((t, i) => {
  console.log(`  ${i+1}. @${t.author.userName} - ${t.text.substring(0, 50)}... (score: ${Math.round(t.compositeScore)})`);
});

// 保存处理结果
const result = {
  date: new Date().toISOString().split('T')[0],
  stats: {
    total: allTweets.length,
    following: allTweets.filter(t => t.source === 'following').length,
    recommendation: allTweets.filter(t => t.source === 'recommendation').length,
    categories: Array.from(categories.entries()).map(([name, tweets]) => ({ name, count: tweets.length }))
  },
  authorMapping: Array.from(authorToList.entries()),
  top20: top20,
  top10: top10,
  allTweets: allTweets,
  categories: Array.from(categories.entries()).map(([name, tweets]) => ({ name, tweets }))
};

fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
console.log(`\n数据处理完成，已保存到 ${outputPath}`);
