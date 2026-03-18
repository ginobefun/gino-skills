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
    parser = ExampleArgumentParser(description="Fetch followings plus stats with stable JSON output for overview/report workflows.")
    parser.add_argument("--page-size", type=int, default=20)
    parser.add_argument("--max-pages", type=int, default=2)
    return parser.parse_args()


def main() -> int:
    action = "xgo.following_overview"
    try:
        args = parse_args()
        client = XGoClient()
        stats = client.get_following_stats()
        follows = client.list_followings(page_size=args.page_size, max_pages=args.max_pages)
        print_result(
            action=action,
            items=follows,
            meta={"stats": stats, "pageSize": args.page_size, "maxPages": args.max_pages},
        )
        return 0
    except Exception as exc:
        current_args = locals().get("args", None)
        print_failure(
            action=action,
            error=exc,
            meta={"pageSize": getattr(current_args, "page_size", None), "maxPages": getattr(current_args, "max_pages", None)},
        )
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
