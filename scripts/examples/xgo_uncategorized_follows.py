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
    parser = ExampleArgumentParser(description="Find uncategorized follows by comparing following/list with list/all through the shared XGo client.")
    parser.add_argument("--page-size", type=int, default=100)
    parser.add_argument("--max-pages", type=int, default=10)
    return parser.parse_args()


def main() -> int:
    action = "xgo.uncategorized_follows"
    try:
        args = parse_args()
        client = XGoClient()
        lists = client.list_all_lists()
        follows = client.list_followings(page_size=args.page_size, max_pages=args.max_pages)

        categorized = {
            str(member.get("userName")).strip().lower()
            for item in lists
            for member in item.get("members", [])
            if isinstance(member, dict) and member.get("userName")
        }
        uncategorized = [
            user for user in follows if str(user.get("userName", "")).strip().lower() not in categorized
        ]

        print_result(
            action=action,
            items=uncategorized,
            verify={"lists": lists},
            meta={
                "pageSize": args.page_size,
                "maxPages": args.max_pages,
                "totalFollowings": len(follows),
                "categorizedCount": len(categorized),
                "uncategorizedCount": len(uncategorized),
                "listCount": len(lists),
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
            },
        )
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
