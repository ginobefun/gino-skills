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
    parser = ExampleArgumentParser(description="Search tweets with the shared XGo client.")
    parser.add_argument("query")
    parser.add_argument("--query-type", default="Top")
    parser.add_argument("--max-results", type=int, default=30)
    return parser.parse_args()


def main() -> int:
    action = "xgo.search_tweets"
    try:
        args = parse_args()
        client = XGoClient()
        payload = client.search_tweets(args.query, query_type=args.query_type, max_results=args.max_results)
        items = payload.get("data") if isinstance(payload, dict) else payload
        if not isinstance(items, list):
            items = []
        print_result(
            action=action,
            items=items,
            meta={"query": args.query, "queryType": args.query_type, "maxResults": args.max_results},
            verify=payload,
        )
        return 0
    except Exception as exc:
        current_args = locals().get("args", None)
        print_failure(
            action=action,
            error=exc,
            meta={
                "query": getattr(current_args, "query", None),
                "queryType": getattr(current_args, "query_type", None),
                "maxResults": getattr(current_args, "max_results", None),
            },
        )
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
