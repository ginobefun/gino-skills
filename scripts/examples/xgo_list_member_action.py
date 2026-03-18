#!/usr/bin/env python3
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from scripts.shared.xgo_client import XGoClient, verify_list_member_action
from scripts.shared.example_output import ExampleArgumentParser, print_failure, print_result


def parse_args() -> object:
    parser = ExampleArgumentParser(description="Add or remove an X list member with read-after-write verification.")
    parser.add_argument("--action", choices=["add", "remove"], required=True)
    parser.add_argument("--list-id", required=True)
    parser.add_argument("--member-id", required=True)
    parser.add_argument("--user-name", required=True)
    parser.add_argument("--name", default=None)
    return parser.parse_args()


def main() -> int:
    try:
        args = parse_args()
        action = f"xgo.list_member_{args.action}"
        client = XGoClient()
        payload = {
            "listId": args.list_id,
            "member": {
                "id": args.member_id,
                "userName": args.user_name,
                "name": args.name,
            },
        }
        write_payload, verify_payload = verify_list_member_action(
            client,
            list_id=args.list_id,
            member_id=args.member_id,
            payload=payload,
            add=args.action == "add",
        )
        print_result(
            action=action,
            items=[{"listId": args.list_id, "memberId": args.member_id, "userName": args.user_name}],
            write=write_payload,
            verify=verify_payload,
        )
        return 0
    except Exception as exc:
        current_args = locals().get("args", None)
        action = f"xgo.list_member_{getattr(current_args, 'action', 'unknown')}"
        print_failure(
            action=action,
            error=exc,
            items=[
                {
                    "listId": getattr(current_args, "list_id", None),
                    "memberId": getattr(current_args, "member_id", None),
                    "userName": getattr(current_args, "user_name", None),
                }
            ],
        )
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
