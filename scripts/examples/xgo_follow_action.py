#!/usr/bin/env python3
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from scripts.shared.xgo_client import XGoClient, verify_follow_action
from scripts.shared.example_output import ExampleArgumentParser, print_failure, print_result


def parse_args() -> object:
    parser = ExampleArgumentParser(description="Follow or unfollow a user with read-after-write verification.")
    parser.add_argument("--action", choices=["follow", "unfollow"], required=True)
    parser.add_argument("--user-name", required=True)
    return parser.parse_args()


def main() -> int:
    try:
        args = parse_args()
        action = f"xgo.{args.action}"
        client = XGoClient()
        write_payload, verify_payload = verify_follow_action(
            client,
            user_name=args.user_name,
            follow=args.action == "follow",
        )
        print_result(
            action=action,
            items=[{"userName": args.user_name}],
            write=write_payload,
            verify=verify_payload,
        )
        return 0
    except Exception as exc:
        current_args = locals().get("args", None)
        action = f"xgo.{getattr(current_args, 'action', 'follow_action')}"
        print_failure(
            action=action,
            error=exc,
            items=[{"userName": getattr(current_args, "user_name", None)}],
        )
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
