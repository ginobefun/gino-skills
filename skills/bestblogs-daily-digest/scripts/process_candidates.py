#!/usr/bin/env python3
"""
BestBlogs Daily Digest — 候选内容处理脚本

功能：
  1. 解析 7 个 API 响应 JSON 文件
  2. 过滤 score >= threshold、URL 去重
  3. 计算加权分（订阅源优先级 + 高优来源 + AI Coding + 头部厂商 + 产品设计/访谈）
  4. 读取历史日报索引，标记已覆盖主题
  5. 输出结构化候选池 JSON，供 AI 做最终 Top 10 筛选

用法：
  python3 process_candidates.py \
    --input-dir <存放 7 个 JSON 文件的目录> \
    --history-dir <contents/bestblogs-digest/> \
    --date 2026-03-20 \
    --threshold 85 \
    --output <输出文件路径>

输入文件命名约定（--input-dir 下）：
  ai.json, prog.json, biz.json, prod.json, video.json, podcast.json, tweet.json

输出 JSON 结构：
  {
    "date": "2026-03-20",
    "total_raw": 512,
    "total_filtered": 368,
    "total_candidates": 45,
    "history_topics": ["GPT-5.4 发布", ...],
    "candidates": [
      {
        "rank": 1,
        "id": "RAW_xxx",
        "title": "...",
        "summary": "...",
        "full_summary": "...",
        "score": 93,
        "weighted_score": 98.2,
        "url": "...",
        "readUrl": "...",
        "sourceName": "...",
        "type": "ARTICLE",
        "tweetAuthor": "",
        "days_ago": 0.5,
        "tags": [...],
        "boosts": ["high_source", "ai_coding"],
        "history_overlap": false
      },
      ...
    ]
  }
"""

import argparse
import json
import os
import re
import sys
from datetime import datetime, timezone


# ── 高优来源列表 ──────────────────────────────────────────────

HIGH_PRIORITY_SOURCES = {
    # 国际文章/博客
    "Latent Space", "Simon Willison's Weblog", "LangChain Blog",
    "deeplearning.ai", "The GitHub Blog", "InfoQ",
    "The Cloudflare Blog", "Google Developers Blog", "freeCodeCamp.org",
    "Spring Blog", "Elevate", "The Pragmatic Engineer", "OpenClaw Blog",
    "Cursor Blog", "Martin Fowler", "ByteByteGo Newsletter",
    "Hugging Face Blog", "Next.js Blog",
    # 国内文章/博客
    "机器之心", "新智元", "量子位", "赛博禅心", "数字生命卡兹克",
    "十字路口 Crossing", "歸藏的 AI 工具箱", "Founder Park",
    "腾讯科技", "腾讯技术工程", "InfoQ 中文", "阮一峰的网络日志",
    "宝玉的分享", "SuperTechFans", "Datawhale", "魔搭 ModelScope 社区",
    "阿里技术", "阿里云开发者", "腾讯云开发者", "大淘宝技术", "前端早读课",
    # 国际播客/视频
    "Lenny's Podcast", "Y Combinator", "a16z", "AI Engineer",
    # 国内播客/视频
    "张小珺 Jùn｜商业访谈录", "晚点 LatePost",
}

HIGH_PRIORITY_TWEET_AUTHORS = {
    # 厂商官方
    "OpenAI", "OpenAIDevs", "AnthropicAI", "GoogleDeepMind", "GeminiApp",
    "cursor_ai", "LangChainAI", "github",
    # 行业领袖
    "sama", "gdb", "karpathy", "AndrewYNg", "demishassabis",
    "OfficialLoganK", "satyanadella", "sundarpichai",
    # 投资人/创业者
    "pmarca", "paulg", "naval", "lennysan", "hwchase17",
    # 中文圈
    "dotey", "lexfridman",
}

# ── 头部厂商关键词（产品发布 + 模型 + 工程实践）─────────────────

MAJOR_VENDOR_KEYWORDS = [
    # 国际头部厂商
    "OpenAI", "GPT-5", "GPT-4", "o1", "o3", "Codex",
    "Anthropic", "Claude",
    "Google", "Gemini", "DeepMind",
    "Meta AI", "Llama", "Engineering at Meta",
    "NVIDIA", "GTC",
    "Apple Intelligence",
    "Microsoft", "Azure AI", "Copilot",
    "AWS", "Bedrock", "Amazon",
    "Netflix",
    # 国内头部厂商
    "阿里巴巴", "通义", "Qwen",
    "腾讯", "混元",
    "字节跳动", "豆包",
    "美团",
    "华为", "昇腾", "盘古",
    "DeepSeek",
    "Kimi", "月之暗面", "Moonshot",
    "MiniMax",
    "智谱", "GLM", "ChatGLM",
]

# ── AI Coding 关键词 ──────────────────────────────────────────

AI_CODING_KEYWORDS = [
    "Claude Code", "Codex", "Cursor", "Windsurf", "Copilot", "Devin",
    "AI 编程", "AI Coding", "AI coding", "编码 Agent", "Coding Agent",
    "coding agent", "MCP", "Agent 开发",
    "Composer", "SWE-bench", "OpenClaw",
    "Harness Engineering", "AGENTS.md",
]

# ── 产品设计 / 深度访谈关键词 ────────────────────────────────────

PRODUCT_INTERVIEW_KEYWORDS = [
    # 产品设计
    "产品设计", "Product Design", "用户体验", "UX", "产品管理",
    "Product Management", "设计系统", "Design System",
    # 深度访谈/播客
    "深度访谈", "对话", "对谈", "专访", "访谈录",
    "播客", "Podcast", "podcast",
]


def parse_resource_item(item):
    """解析 resource/list 接口返回的单条资源"""
    score = item.get("score") or 0
    return {
        "id": item.get("id", ""),
        "title": item.get("title", ""),
        "summary": item.get("oneSentenceSummary") or "",
        "full_summary": (item.get("summary") or "")[:500],
        "score": score,
        "url": item.get("url", ""),
        "readUrl": item.get("readUrl", ""),
        "sourceName": item.get("sourceName", ""),
        "type": item.get("resourceType", "ARTICLE"),
        "priority": item.get("priority", "LOW"),
        "tweetAuthor": "",
        "publishTimeStamp": item.get("publishTimeStamp", 0),
        "tags": item.get("tags", []),
        "duration": item.get("duration", 0),
        "language": item.get("language", ""),
        "category": item.get("category", ""),
    }


def parse_tweet_item(item):
    """解析 tweet/list 接口返回的单条推文"""
    rm = item.get("resourceMeta", {})
    score = rm.get("score") or 0
    tweet_author = item.get("tweet", {}).get("author", {}).get("userName", "")
    return {
        "id": rm.get("id", ""),
        "title": rm.get("title", ""),
        "summary": rm.get("oneSentenceSummary") or "",
        "full_summary": (rm.get("summary") or "")[:500],
        "score": score,
        "url": rm.get("url", ""),
        "readUrl": rm.get("readUrl", ""),
        "sourceName": rm.get("sourceName", ""),
        "type": "TWEET",
        "priority": rm.get("priority", "MEDIUM"),
        "tweetAuthor": tweet_author,
        "publishTimeStamp": rm.get("publishTimeStamp", 0),
        "tags": rm.get("tags", []),
        "duration": 0,
        "language": rm.get("language", ""),
        "category": rm.get("category", ""),
    }


def compute_days_ago(publish_ts, now_ts):
    """计算发布时间距今天数（仅用于展示，不参与评分）"""
    if not publish_ts:
        return 2.0
    pub = datetime.fromtimestamp(publish_ts / 1000, tz=timezone.utc)
    now = datetime.fromtimestamp(now_ts / 1000, tz=timezone.utc)
    return round((now - pub).total_seconds() / 86400, 1)


def _text_contains(text, keywords):
    """检查文本是否包含任一关键词（大小写不敏感）"""
    text_lower = text.lower()
    for kw in keywords:
        if kw.lower() in text_lower:
            return True
    return False


def check_major_vendor(title, tags, source_name):
    """检查是否涉及头部厂商（产品发布 + 工程实践）"""
    text = title + " " + " ".join(tags) + " " + source_name
    return _text_contains(text, MAJOR_VENDOR_KEYWORDS)


def check_ai_coding(title, tags):
    """检查是否涉及 AI Coding 主题"""
    return _text_contains(title + " " + " ".join(tags), AI_CODING_KEYWORDS)


def check_product_interview(title, tags, item_type, category):
    """检查是否为优秀产品设计或深度访谈内容"""
    text = title + " " + " ".join(tags)
    if _text_contains(text, PRODUCT_INTERVIEW_KEYWORDS):
        return True
    # 播客/视频类型天然倾向于访谈内容，给予适当加分
    if item_type in ("PODCAST", "VIDEO") and category in ("Product_Development",):
        return True
    return False


def check_named_source(source_name, tweet_author):
    """检查是否为命名的高优来源（SKILL.md 中维护的列表）"""
    if source_name in HIGH_PRIORITY_SOURCES:
        return True
    for hs in HIGH_PRIORITY_SOURCES:
        if hs in source_name:
            return True
    if tweet_author in HIGH_PRIORITY_TWEET_AUTHORS:
        return True
    return False


def compute_weighted_score(item):
    """
    计算加权分数。

    设计哲学：内容深度（score）为第一优先级，来源为核心参考，
    主题分类、指导意义、观点启发性等为辅助因素。

    基础分 = score（0-100，反映内容深度和质量）
    加权项（叠加，幅度克制，避免来源压过内容质量）：
      - 订阅源优先级：HIGH +3, MEDIUM +0, LOW -3
      - 命名高优来源（额外加分）：+2
      - 头部厂商（产品 + 工程实践）：+2
      - AI Coding 专题：+2
      - 产品设计 / 深度访谈：+1

    不做时效性衰减——3 天窗口内的内容都有足够时效性。
    """
    base = item["score"]
    boosts = []

    # 订阅源优先级（API 的 priority 字段）
    priority = item.get("priority", "LOW")
    if priority == "HIGH":
        base += 3
        boosts.append("src_high")
    elif priority == "MEDIUM":
        pass  # 不加不减
    else:  # LOW
        base -= 3
        boosts.append("src_low")

    adjusted = base

    # 命名高优来源（在 HIGH_PRIORITY_SOURCES / TWEET_AUTHORS 列表中）
    if check_named_source(item["sourceName"], item.get("tweetAuthor", "")):
        adjusted += 2
        boosts.append("named_source")

    # 头部厂商（产品发布 + 工程实践）
    if check_major_vendor(item["title"], item.get("tags", []), item.get("sourceName", "")):
        adjusted += 2
        boosts.append("major_vendor")

    # AI Coding
    if check_ai_coding(item["title"], item.get("tags", [])):
        adjusted += 2
        boosts.append("ai_coding")

    # 产品设计 / 深度访谈
    if check_product_interview(
        item["title"], item.get("tags", []),
        item.get("type", ""), item.get("category", "")
    ):
        adjusted += 1
        boosts.append("product_interview")

    return round(adjusted, 1), boosts


def load_history_index(history_dir, target_date, lookback_days=3):
    """
    读取历史日报索引文件（digest-index.json），构建已覆盖主题列表。
    如果索引文件不存在，回退到读取 digest.txt 提取标题。
    """
    topics = []
    urls = set()
    target = datetime.strptime(target_date, "%Y-%m-%d")

    for i in range(1, lookback_days + 1):
        d = target.replace(day=target.day - i)
        date_str = d.strftime("%Y-%m-%d")
        day_dir = os.path.join(history_dir, date_str)

        # 优先读取 digest-index.json
        index_path = os.path.join(day_dir, "digest-index.json")
        if os.path.exists(index_path):
            try:
                with open(index_path) as f:
                    idx = json.load(f)
                for entry in idx.get("items", []):
                    topics.append(entry.get("title", ""))
                    topics.extend(entry.get("keywords", []))
                    if entry.get("url"):
                        urls.add(entry["url"])
                    if entry.get("readUrl"):
                        urls.add(entry["readUrl"])
            except (json.JSONDecodeError, KeyError):
                pass
            continue

        # 回退：从 digest.txt 提取标题
        txt_path = os.path.join(day_dir, "digest.txt")
        if os.path.exists(txt_path):
            try:
                with open(txt_path) as f:
                    for line in f:
                        # 匹配 [N] 标题 格式
                        m = re.match(r"^\[(\d+)\]\s+(.+)$", line.strip())
                        if m:
                            topics.append(m.group(2))
                        # 匹配 URL 行
                        if line.strip().startswith("https://www.bestblogs.dev/"):
                            urls.add(line.strip())
            except IOError:
                pass

    return topics, urls


def main():
    parser = argparse.ArgumentParser(description="BestBlogs Daily Digest 候选处理")
    parser.add_argument("--input-dir", required=True, help="存放 7 个 API 响应 JSON 的目录")
    parser.add_argument("--history-dir", required=True, help="历史日报根目录 (contents/bestblogs-digest/)")
    parser.add_argument("--date", required=True, help="目标日期 YYYY-MM-DD")
    parser.add_argument("--threshold", type=int, default=85, help="score 过滤阈值 (默认 85)")
    parser.add_argument("--output", required=True, help="输出 JSON 文件路径")
    parser.add_argument("--top", type=int, default=40, help="输出候选数量上限 (默认 40)")
    args = parser.parse_args()

    # 计算当前时间戳
    target_dt = datetime.strptime(args.date, "%Y-%m-%d").replace(
        hour=8, tzinfo=timezone.utc  # 假设北京时间上午
    )
    now_ts = int(target_dt.timestamp() * 1000)

    # 文件名映射
    file_map = {
        "ai": "ai.json",
        "prog": "prog.json",
        "biz": "biz.json",
        "prod": "prod.json",
        "video": "video.json",
        "podcast": "podcast.json",
        "tweet": "tweet.json",
    }

    # ── 阶段一：解析 + 过滤 + URL 去重 ──
    all_items = []
    seen_urls = set()
    total_raw = 0
    stats = {}

    for key, fname in file_map.items():
        fpath = os.path.join(args.input_dir, fname)
        if not os.path.exists(fpath):
            stats[key] = {"raw": 0, "filtered": 0, "error": "file not found"}
            continue

        try:
            with open(fpath) as f:
                data = json.load(f)
        except json.JSONDecodeError:
            stats[key] = {"raw": 0, "filtered": 0, "error": "invalid JSON"}
            continue

        if not data.get("success"):
            stats[key] = {"raw": 0, "filtered": 0, "error": f"API error: {data.get('message')}"}
            continue

        items = data["data"]["dataList"]
        raw_count = len(items)
        total_raw += raw_count
        filtered_count = 0

        for it in items:
            if key == "tweet":
                entry = parse_tweet_item(it)
            else:
                entry = parse_resource_item(it)

            if entry["score"] < args.threshold:
                continue
            if entry["url"] in seen_urls:
                continue
            seen_urls.add(entry["url"])

            entry["days_ago"] = compute_days_ago(entry["publishTimeStamp"], now_ts)
            entry["weighted_score"], entry["boosts"] = compute_weighted_score(entry)

            all_items.append(entry)
            filtered_count += 1

        stats[key] = {"raw": raw_count, "filtered": filtered_count}

    # ── 阶段 1.5：历史去重标记 ──
    history_topics, history_urls = load_history_index(args.history_dir, args.date)

    for item in all_items:
        # URL 精确匹配
        if item["url"] in history_urls or item["readUrl"] in history_urls:
            item["history_overlap"] = True
            continue

        # 标题模糊匹配（标题包含已覆盖主题关键词）
        item["history_overlap"] = False
        title_lower = item["title"].lower()
        for topic in history_topics:
            if len(topic) > 4 and topic.lower() in title_lower:
                item["history_overlap"] = True
                break

    # ── 排序：加权分降序 ──
    all_items.sort(key=lambda x: x["weighted_score"], reverse=True)

    # 截取 top N
    candidates = all_items[: args.top]

    # 添加排名
    for i, item in enumerate(candidates):
        item["rank"] = i + 1
        # 清理不需要输出的字段
        item.pop("publishTimeStamp", None)
        item.pop("duration", None)
        item.pop("language", None)
        item.pop("category", None)

    # ── 输出 ──
    output = {
        "date": args.date,
        "total_raw": total_raw,
        "total_filtered": len(all_items),
        "total_candidates": len(candidates),
        "stats": stats,
        "history_topics_count": len(history_topics),
        "history_urls_count": len(history_urls),
        "candidates": candidates,
    }

    with open(args.output, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    # 打印摘要到 stdout
    print(f"日期: {args.date}")
    print(f"原始数据: {total_raw} 条")
    print(f"过滤后 (score>={args.threshold} + URL 去重): {len(all_items)} 条")
    print(f"历史主题: {len(history_topics)} 个, 历史 URL: {len(history_urls)} 个")
    print(f"输出候选: {len(candidates)} 条")
    print(f"\n各分类统计:")
    for k, v in stats.items():
        err = f" ({v['error']})" if v.get("error") else ""
        print(f"  {k}: {v['raw']} → {v['filtered']}{err}")
    print(f"\nTop 10 候选:")
    for item in candidates[:10]:
        overlap = " ⚠️历史重复" if item.get("history_overlap") else ""
        boosts_str = f" [{', '.join(item['boosts'])}]" if item.get("boosts") else ""
        print(f"  {item['rank']}. [{item['weighted_score']}] {item['title'][:60]}{boosts_str}{overlap}")
    print(f"\n输出文件: {args.output}")


if __name__ == "__main__":
    main()
