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
    parser = ExampleArgumentParser(description="Look up an X user through XGo and return a stable JSON payload for downstream worker steps.")
    parser.add_argument("user_name")
    return parser.parse_args()


def main() -> int:
    action = "xgo.lookup_user"
    try:
        args = parse_args()
        client = XGoClient()
        payload = client.get_user_info(args.user_name)
        user = payload.get("data") if isinstance(payload, dict) else None
        items = [user] if isinstance(user, dict) else []
        print_result(
            action=action,
            items=items,
            verify=payload,
            meta={"userName": args.user_name},
        )
        return 0
    except Exception as exc:
        meta = {"userName": getattr(locals().get("args", None), "user_name", None)}
        print_failure(action=action, error=exc, meta=meta)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
