#!/usr/bin/env python3
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from scripts.shared.bestblogs_client import BestBlogsOpenClient
from scripts.shared.example_output import ExampleArgumentParser, print_failure, print_result


def parse_args() -> object:
    parser = ExampleArgumentParser(description="Fetch BestBlogs public resources with the shared client.")
    parser.add_argument("--type", default="ARTICLE", choices=["ARTICLE", "PODCAST", "VIDEO"])
    parser.add_argument("--category", default=None)
    parser.add_argument("--keyword", default=None)
    parser.add_argument("--time-filter", default="3d")
    parser.add_argument("--sort-type", default="score_desc")
    parser.add_argument("--page-size", type=int, default=100)
    parser.add_argument("--max-pages", type=int, default=2)
    parser.add_argument("--language", default="zh_CN")
    return parser.parse_args()


def main() -> int:
    action = "bestblogs.fetch_resources"
    try:
        args = parse_args()
        client = BestBlogsOpenClient()
        items = client.list_resources(
            {
                "currentPage": 1,
                "timeFilter": args.time_filter,
                "sortType": args.sort_type,
                "userLanguage": args.language,
                "pageSize": args.page_size,
                "type": args.type,
                "category": args.category,
                "keyword": args.keyword,
            },
            max_pages=args.max_pages,
        )
        print_result(
            action=action,
            items=items,
            meta={
                "type": args.type,
                "category": args.category,
                "keyword": args.keyword,
                "timeFilter": args.time_filter,
                "sortType": args.sort_type,
                "pageSize": args.page_size,
                "maxPages": args.max_pages,
            },
        )
        return 0
    except Exception as exc:
        current_args = locals().get("args", None)
        print_failure(
            action=action,
            error=exc,
            meta={
                "type": getattr(current_args, "type", None),
                "category": getattr(current_args, "category", None),
                "keyword": getattr(current_args, "keyword", None),
                "timeFilter": getattr(current_args, "time_filter", None),
                "sortType": getattr(current_args, "sort_type", None),
            },
        )
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
