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
    parser = ExampleArgumentParser(description="Fetch XGo follow or unfollow suggestions with a stable JSON output contract.")
    parser.add_argument("--action", choices=["follow", "unfollow"], default="follow")
    return parser.parse_args()


def main() -> int:
    action = "xgo.following_suggestions"
    try:
        args = parse_args()
        client = XGoClient()
        payload = client.get_following_suggestions(unfollow=args.action == "unfollow")
        items = payload.get("data") if isinstance(payload, dict) else []
        if not isinstance(items, list):
            items = []
        print_result(
            action=action,
            items=items,
            verify=payload,
            meta={"suggestAction": args.action},
        )
        return 0
    except Exception as exc:
        meta = {"suggestAction": getattr(locals().get("args", None), "action", None)}
        print_failure(action=action, error=exc, meta=meta)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
