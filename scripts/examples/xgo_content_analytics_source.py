#!/usr/bin/env python3
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from scripts.shared.example_output import ExampleArgumentParser, print_failure, print_result
from scripts.shared.xgo_client import XGoClient


def parse_args() -> object:
    parser = ExampleArgumentParser(description="拉取内容分析所需的 XGo 源数据。")
    parser.add_argument("--page-size", type=int, default=100)
    parser.add_argument("--max-pages", type=int, default=2)
    parser.add_argument("--tweet-type", default="ALL")
    return parser.parse_args()


def main() -> int:
    action = "xgo.content_analytics_source"
    try:
        args = parse_args()
        client = XGoClient()
        recent = client.list_tweets(
            {
                "queryType": "user",
                "sortType": "recent",
                "tweetType": args.tweet_type,
                "currentPage": 1,
                "pageSize": args.page_size,
            },
            max_pages=args.max_pages,
        )
        influence = client.list_tweets(
            {
                "queryType": "user",
                "sortType": "influence",
                "tweetType": args.tweet_type,
                "currentPage": 1,
                "pageSize": args.page_size,
            },
            max_pages=1,
        )
        user_info = client.get_json("/openapi/v1/user/info")
        print_result(
            action=action,
            items=recent,
            verify={"influenceTweets": influence, "userInfo": user_info},
            meta={
                "pageSize": args.page_size,
                "maxPages": args.max_pages,
                "tweetType": args.tweet_type,
                "recentCount": len(recent),
                "influenceCount": len(influence),
            },
        )
        return 0
    except Exception as exc:
        current_args = locals().get("args", None)
        print_failure(
            action=action,
            error=exc,
            meta={
                "pageSize": getattr(current_args, "page_size", None),
                "maxPages": getattr(current_args, "max_pages", None),
                "tweetType": getattr(current_args, "tweet_type", None),
            },
        )
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
