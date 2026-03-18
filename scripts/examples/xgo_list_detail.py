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
    parser = ExampleArgumentParser(description="Fetch a single X list detail payload for downstream list-member workflows.")
    parser.add_argument("--list-id", required=True)
    return parser.parse_args()


def main() -> int:
    action = "xgo.list_detail"
    try:
        args = parse_args()
        client = XGoClient()
        payload = client.get_list_detail(args.list_id)
        items = [payload.get("data")] if isinstance(payload, dict) and isinstance(payload.get("data"), dict) else []
        print_result(
            action=action,
            items=items,
            verify=payload,
            meta={"listId": args.list_id},
        )
        return 0
    except Exception as exc:
        current_args = locals().get("args", None)
        print_failure(action=action, error=exc, meta={"listId": getattr(current_args, "list_id", None)})
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
