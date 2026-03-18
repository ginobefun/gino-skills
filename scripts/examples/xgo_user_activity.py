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
    parser = ExampleArgumentParser(description="Fetch profile, recent originals, and influential originals for one X user through shared XGo workers.")
    parser.add_argument("user_name")
    parser.add_argument("--recent-size", type=int, default=5)
    parser.add_argument("--top-size", type=int, default=5)
    return parser.parse_args()


def main() -> int:
    action = "xgo.user_activity"
    try:
        args = parse_args()
        client = XGoClient()
        profile = client.get_user_info(args.user_name)
        recent = client.list_tweets(
            {
                "queryType": "user",
                "userName": args.user_name,
                "sortType": "recent",
                "tweetType": "ORIGINAL",
                "currentPage": 1,
                "pageSize": args.recent_size,
            },
            max_pages=1,
        )
        top = client.list_tweets(
            {
                "queryType": "user",
                "userName": args.user_name,
                "sortType": "influence",
                "tweetType": "ORIGINAL",
                "currentPage": 1,
                "pageSize": args.top_size,
            },
            max_pages=1,
        )

        print_result(
            action=action,
            items=recent,
            verify={"profile": profile, "topTweets": top},
            meta={"userName": args.user_name, "recentSize": args.recent_size, "topSize": args.top_size},
        )
        return 0
    except Exception as exc:
        current_args = locals().get("args", None)
        print_failure(
            action=action,
            error=exc,
            meta={
                "userName": getattr(current_args, "user_name", None),
                "recentSize": getattr(current_args, "recent_size", None),
                "topSize": getattr(current_args, "top_size", None),
            },
        )
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
