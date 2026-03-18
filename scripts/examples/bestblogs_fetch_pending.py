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
    parser = ExampleArgumentParser(description="Fetch BestBlogs pending queue items with the shared admin client.")
    parser.add_argument("--type", default="ARTICLE", choices=["ARTICLE", "PODCAST", "VIDEO", "TWITTER"])
    parser.add_argument("--flow-status", default="WAIT_ANALYSIS")
    parser.add_argument("--page-size", type=int, default=50)
    parser.add_argument("--max-pages", type=int, default=4)
    parser.add_argument("--start-date", default=None)
    parser.add_argument("--end-date", default=None)
    return parser.parse_args()


def main() -> int:
    action = "bestblogs.fetch_pending"
    try:
        args = parse_args()
        client = BestBlogsAdminClient()
        items = client.list_articles(
            {
                "currentPage": 1,
                "pageSize": args.page_size,
                "type": args.type,
                "flowStatusFilter": args.flow_status,
                "startDate": args.start_date,
                "endDate": args.end_date,
            },
            max_pages=args.max_pages,
        )
        print_result(
            action=action,
            items=items,
            meta={
                "type": args.type,
                "flowStatus": args.flow_status,
                "pageSize": args.page_size,
                "maxPages": args.max_pages,
            },
        )
        return 0
    except Exception as exc:
        current_args = locals().get("args", None)
        print_failure(
            action=action,
            error=exc,
            meta={
                "type": getattr(current_args, "type", None),
                "flowStatus": getattr(current_args, "flow_status", None),
                "pageSize": getattr(current_args, "page_size", None),
                "maxPages": getattr(current_args, "max_pages", None),
            },
        )
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
