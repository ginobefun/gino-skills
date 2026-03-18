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
    parser = ExampleArgumentParser(description="Check follow status for a target user through a stable JSON worker output.")
    parser.add_argument("user_name")
    return parser.parse_args()


def main() -> int:
    action = "xgo.following_status"
    try:
        args = parse_args()
        client = XGoClient()
        payload = client.get_following_status(args.user_name)
        data = payload.get("data") if isinstance(payload, dict) and isinstance(payload.get("data"), dict) else None
        items = [data] if data else []
        print_result(
            action=action,
            items=items,
            verify=payload,
            meta={"userName": args.user_name},
        )
        return 0
    except Exception as exc:
        current_args = locals().get("args", None)
        print_failure(action=action, error=exc, meta={"userName": getattr(current_args, "user_name", None)})
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
