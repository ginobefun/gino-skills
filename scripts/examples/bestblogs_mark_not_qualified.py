#!/usr/bin/env python3
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from scripts.shared.bestblogs_client import BestBlogsAdminClient
from scripts.shared.example_output import ExampleArgumentParser, print_failure, print_result


def parse_args() -> object:
    parser = ExampleArgumentParser(description="Mark a BestBlogs item as not qualified.")
    parser.add_argument("--id", required=True, dest="resource_id")
    parser.add_argument("--adjust-score", required=True, type=int)
    return parser.parse_args()


def main() -> int:
    action = "bestblogs.mark_not_qualified"
    try:
        args = parse_args()
        admin_client = BestBlogsAdminClient()
        payload = admin_client.mark_not_qualified(args.resource_id, adjust_score=args.adjust_score)
        print_result(
            action=action,
            items=[{"id": args.resource_id, "adjustScore": args.adjust_score}],
            write=payload,
        )
        return 0
    except Exception as exc:
        current_args = locals().get("args", None)
        print_failure(
            action=action,
            error=exc,
            items=[{"id": getattr(current_args, "resource_id", None), "adjustScore": getattr(current_args, "adjust_score", None)}],
        )
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
