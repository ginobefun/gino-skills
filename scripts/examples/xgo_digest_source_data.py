#!/usr/bin/env python3
from __future__ import annotations

import json
import sys
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from scripts.shared.example_output import ExampleArgumentParser, print_failure, print_result
from scripts.shared.xgo_client import XGoClient


def parse_args() -> object:
    parser = ExampleArgumentParser(description="Fetch XGo digest source data through shared workers and optionally persist the bundle for downstream ranking/render steps.")
    parser.add_argument("--time-range", default="LAST_24H")
    parser.add_argument("--sort-type", default="influence")
    parser.add_argument("--tweet-type", default="NO_RETWEET")
    parser.add_argument("--page-size", type=int, default=50)
    parser.add_argument("--max-pages", type=int, default=2)
    parser.add_argument("--output", default=None)
    return parser.parse_args()


def main() -> int:
    action = "xgo.digest_source_data"
    try:
        args = parse_args()
        client = XGoClient()
        lists = client.list_all_lists()

        following = client.list_tweets(
            {
                "queryType": "following",
                "timeRange": args.time_range,
                "sortType": args.sort_type,
                "tweetType": args.tweet_type,
                "currentPage": 1,
                "pageSize": args.page_size,
            },
            max_pages=args.max_pages,
        )
        recommendation = client.list_tweets(
            {
                "queryType": "recommendation",
                "timeRange": args.time_range,
                "sortType": args.sort_type,
                "tweetType": args.tweet_type,
                "currentPage": 1,
                "pageSize": args.page_size,
            },
            max_pages=args.max_pages,
        )

        bundle = {
            "generatedAt": datetime.utcnow().isoformat() + "Z",
            "lists": lists,
            "followingTweets": following,
            "recommendationTweets": recommendation,
            "params": {
                "timeRange": args.time_range,
                "sortType": args.sort_type,
                "tweetType": args.tweet_type,
                "pageSize": args.page_size,
                "maxPages": args.max_pages,
            },
        }

        if args.output:
            output_path = Path(args.output)
            output_path.parent.mkdir(parents=True, exist_ok=True)
            output_path.write_text(json.dumps(bundle, ensure_ascii=False, indent=2), "utf-8")

        print_result(
            action=action,
            items=following + recommendation,
            verify={"lists": lists},
            meta={
                "output": args.output,
                "listCount": len(lists),
                "followingCount": len(following),
                "recommendationCount": len(recommendation),
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
                "output": getattr(current_args, "output", None),
                "timeRange": getattr(current_args, "time_range", None),
                "sortType": getattr(current_args, "sort_type", None),
                "tweetType": getattr(current_args, "tweet_type", None),
                "pageSize": getattr(current_args, "page_size", None),
                "maxPages": getattr(current_args, "max_pages", None),
            },
        )
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
