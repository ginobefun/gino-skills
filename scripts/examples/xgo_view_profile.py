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
    parser = ExampleArgumentParser(description="Fetch profile and latest tweets with the shared XGo client.")
    parser.add_argument("user_name")
    parser.add_argument("--max-pages", type=int, default=3)
    return parser.parse_args()


def main() -> int:
    action = "xgo.view_profile"
    try:
        args = parse_args()
        client = XGoClient()
        profile = client.get_user_info(args.user_name)
        latest = client.get_latest_tweets(args.user_name, max_pages=args.max_pages)
        latest_items = latest.get("data") if isinstance(latest, dict) else []
        if not isinstance(latest_items, list):
            latest_items = []
        print_result(
            action=action,
            items=latest_items,
            verify={"profile": profile, "latest": latest},
            meta={"userName": args.user_name, "maxPages": args.max_pages},
        )
        return 0
    except Exception as exc:
        current_args = locals().get("args", None)
        print_failure(
            action=action,
            error=exc,
            meta={"userName": getattr(current_args, "user_name", None), "maxPages": getattr(current_args, "max_pages", None)},
        )
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
