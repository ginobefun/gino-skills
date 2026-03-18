#!/usr/bin/env python3
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from scripts.shared.bestblogs_client import BestBlogsAdminClient
from scripts.shared.example_output import ExampleArgumentParser, print_failure, print_result


def parse_args() -> object:
    parser = ExampleArgumentParser(description="Save grouped tweet analysis results for a BestBlogs source.")
    parser.add_argument("--source-id", required=True)
    parser.add_argument("--json", required=True, dest="json_path")
    return parser.parse_args()


def main() -> int:
    action = "bestblogs.save_tweet_analysis"
    try:
        args = parse_args()
        results = json.loads(Path(args.json_path).read_text("utf-8"))
        admin_client = BestBlogsAdminClient()
        payload = admin_client.save_tweet_analysis_result(args.source_id, results)
        print_result(
            action=action,
            items=results,
            write=payload,
            meta={"sourceId": args.source_id},
        )
        return 0
    except Exception as exc:
        current_args = locals().get("args", None)
        print_failure(
            action=action,
            error=exc,
            meta={"sourceId": getattr(current_args, "source_id", None), "jsonPath": getattr(current_args, "json_path", None)},
        )
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
