#!/usr/bin/env python3
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from scripts.shared.bestblogs_client import BestBlogsAdminClient, BestBlogsOpenClient, verify_saved_analysis
from scripts.shared.example_output import ExampleArgumentParser, print_failure, print_result


def parse_args() -> object:
    parser = ExampleArgumentParser(description="Save BestBlogs analysis result and verify by reading it back.")
    parser.add_argument("--id", required=True, dest="resource_id")
    parser.add_argument("--json", required=True, dest="json_path")
    parser.add_argument("--language", default="zh")
    return parser.parse_args()


def main() -> int:
    action = "bestblogs.save_analysis"
    try:
        args = parse_args()
        payload = json.loads(Path(args.json_path).read_text("utf-8"))
        admin_client = BestBlogsAdminClient()
        open_client = BestBlogsOpenClient()
        write_payload, verify_payload = verify_saved_analysis(
            admin_client,
            open_client,
            resource_id=args.resource_id,
            payload=payload,
            language=args.language,
        )
        print_result(
            action=action,
            items=[{"id": args.resource_id}],
            write=write_payload,
            verify=verify_payload,
        )
        return 0
    except Exception as exc:
        current_args = locals().get("args", None)
        print_failure(
            action=action,
            error=exc,
            items=[{"id": getattr(current_args, "resource_id", None)}],
            meta={"language": getattr(current_args, "language", None), "jsonPath": getattr(current_args, "json_path", None)},
        )
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
