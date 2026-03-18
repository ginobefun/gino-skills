#!/usr/bin/env python3
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from scripts.shared.bestblogs_client import BestBlogsAdminClient, BestBlogsOpenClient, verify_added_rss_url
from scripts.shared.example_output import ExampleArgumentParser, print_failure, print_result


def parse_args() -> object:
    parser = ExampleArgumentParser(description="Add an RSS source and verify it appears in BestBlogs source list.")
    parser.add_argument("--rss-url", required=True)
    return parser.parse_args()


def main() -> int:
    action = "bestblogs.add_rss_source"
    try:
        args = parse_args()
        admin_client = BestBlogsAdminClient()
        open_client = BestBlogsOpenClient()
        write_payload, verify_payload = verify_added_rss_url(
            admin_client,
            open_client,
            rss_url=args.rss_url,
        )
        print_result(
            action=action,
            items=[{"rssUrl": args.rss_url}],
            write=write_payload,
            verify=verify_payload,
        )
        return 0
    except Exception as exc:
        print_failure(action=action, error=exc, items=[{"rssUrl": getattr(locals().get("args", None), "rss_url", None)}])
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
