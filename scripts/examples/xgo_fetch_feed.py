#!/usr/bin/env python3
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from scripts.shared.xgo_client import XGoClient
from scripts.shared.example_output import ExampleArgumentParser, print_failure, print_result


def parse_args() -> object:
    parser = ExampleArgumentParser(description="Fetch XGo feed tweets with the shared client.")
    parser.add_argument("--query-type", default="following")
    parser.add_argument("--time-range", default="LAST_24H")
    parser.add_argument("--sort-type", default="influence")
    parser.add_argument("--tweet-type", default="NO_RETWEET")
    parser.add_argument("--page-size", type=int, default=50)
    parser.add_argument("--max-pages", type=int, default=2)
    return parser.parse_args()


def main() -> int:
    action = "xgo.fetch_feed"
    try:
        args = parse_args()
        client = XGoClient()
        items = client.list_tweets(
            {
                "queryType": args.query_type,
                "timeRange": args.time_range,
                "sortType": args.sort_type,
                "tweetType": args.tweet_type,
                "currentPage": 1,
                "pageSize": args.page_size,
            },
            max_pages=args.max_pages,
        )
        print_result(
            action=action,
            items=items,
            meta={
                "queryType": args.query_type,
                "timeRange": args.time_range,
                "sortType": args.sort_type,
                "tweetType": args.tweet_type,
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
                "queryType": getattr(current_args, "query_type", None),
                "timeRange": getattr(current_args, "time_range", None),
                "sortType": getattr(current_args, "sort_type", None),
                "tweetType": getattr(current_args, "tweet_type", None),
            },
        )
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
