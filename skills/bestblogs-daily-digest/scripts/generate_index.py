#!/usr/bin/env python3
"""
BestBlogs Daily Digest — 日报索引生成脚本

从 digest.txt 中提取结构化索引，保存为 digest-index.json。
用于后续历史去重，避免每次都要读取和解析完整日报文件。

用法：
  python3 generate_index.py --input <digest.txt 路径> --output <digest-index.json 路径>

  # 或自动推导（同目录下生成）
  python3 generate_index.py --input contents/bestblogs-digest/2026-03-20/digest.txt

输出 JSON 结构：
  {
    "date": "2026-03-20",
    "keywords": ["Composer 2", "LangSmith Fleet", "GTC 2026"],
    "items": [
      {
        "rank": 1,
        "title": "Cursor 发布 Composer 2：编程模型性能翻倍，定价重塑",
        "keywords": ["Cursor", "Composer 2", "AI Coding"],
        "source": "Cursor Blog",
        "score": 93,
        "url": "https://www.bestblogs.dev/article/67644639",
        "readUrl": "https://www.bestblogs.dev/article/67644639"
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


def parse_digest_txt(filepath):
    """从 digest.txt 解析出结构化索引"""
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    lines = content.split("\n")

    # 提取日期（第一行 "BestBlogs 早报 | YYYY-MM-DD"）
    date_match = re.search(r"(\d{4}-\d{2}-\d{2})", lines[0] if lines else "")
    date = date_match.group(1) if date_match else ""

    # 提取头部关键词（# keyword1 / keyword2 / ...）
    header_keywords = []
    for line in lines[1:5]:
        if line.startswith("# "):
            header_keywords = [kw.strip() for kw in line[2:].split("/")]
            break

    # 解析每条内容
    items = []
    current_item = None

    for line in lines:
        # 匹配条目标题行 "[N] 标题"
        rank_match = re.match(r"^\[(\d+)\]\s+(.+)$", line.strip())
        if rank_match:
            if current_item:
                items.append(current_item)
            current_item = {
                "rank": int(rank_match.group(1)),
                "title": rank_match.group(2),
                "keywords": [],
                "source": "",
                "score": 0,
                "url": "",
                "readUrl": "",
            }
            # 从标题提取关键词（英文词组 + 中文关键实体）
            # 提取大写开头的英文词组（产品名、公司名等）
            eng_keywords = re.findall(r"[A-Z][a-zA-Z0-9.+-]+(?:\s+[A-Z][a-zA-Z0-9.+-]+)*", current_item["title"])
            current_item["keywords"] = eng_keywords[:5]
            continue

        if not current_item:
            continue

        # 匹配来源行 "来源：sourceName | 评分：XX" 或 "来源: ..."
        source_match = re.match(r"^来源[：:]\s*(.+?)\s*[|｜]\s*评分[：:]\s*(\d+)", line.strip())
        if source_match:
            current_item["source"] = source_match.group(1)
            current_item["score"] = int(source_match.group(2))
            continue

        # 匹配 URL 行
        url_match = re.match(r"^(https://www\.bestblogs\.dev/\S+)", line.strip())
        if url_match:
            url = url_match.group(1)
            current_item["url"] = url
            current_item["readUrl"] = url
            continue

    # 最后一条
    if current_item:
        items.append(current_item)

    return {
        "date": date,
        "keywords": header_keywords,
        "items": items,
    }


def main():
    parser = argparse.ArgumentParser(description="生成日报索引文件")
    parser.add_argument("--input", required=True, help="digest.txt 文件路径")
    parser.add_argument("--output", default=None, help="输出 JSON 路径（默认同目录下 digest-index.json）")
    args = parser.parse_args()

    if not os.path.exists(args.input):
        print(f"错误: 文件不存在 {args.input}", file=sys.stderr)
        sys.exit(1)

    output_path = args.output
    if not output_path:
        output_path = os.path.join(os.path.dirname(args.input), "digest-index.json")

    index = parse_digest_txt(args.input)

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(index, f, ensure_ascii=False, indent=2)

    print(f"索引已生成: {output_path}")
    print(f"  日期: {index['date']}")
    print(f"  关键词: {index['keywords']}")
    print(f"  条目数: {len(index['items'])}")
    for item in index["items"]:
        print(f"    [{item['rank']}] {item['title'][:50]}... (src={item['source']}, score={item['score']})")


if __name__ == "__main__":
    main()
