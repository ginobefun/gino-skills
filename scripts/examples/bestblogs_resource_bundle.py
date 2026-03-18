#!/usr/bin/env python3
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from scripts.shared.bestblogs_client import BestBlogsOpenClient
from scripts.shared.example_output import ExampleArgumentParser, print_failure, print_result


def parse_args() -> object:
    parser = ExampleArgumentParser(description="读取单条 BestBlogs 资源的 meta 与正文内容。")
    parser.add_argument("--resource-id", required=True)
    parser.add_argument("--resource-type", choices=["ARTICLE", "PODCAST", "VIDEO"], default="ARTICLE")
    return parser.parse_args()


def main() -> int:
    action = "bestblogs.resource_bundle"
    try:
        args = parse_args()
        client = BestBlogsOpenClient()
        meta = client.get_resource_meta(args.resource_id)
        if args.resource_type == "PODCAST":
            body = client.get_json("/openapi/v1/resource/podcast/content", params={"id": args.resource_id})
        else:
            body = client.get_resource_markdown(args.resource_id)
        print_result(
            action=action,
            items=[{"resourceId": args.resource_id, "resourceType": args.resource_type}],
            verify={"meta": meta, "body": body},
            meta={"resourceId": args.resource_id, "resourceType": args.resource_type},
        )
        return 0
    except Exception as exc:
        current_args = locals().get("args", None)
        print_failure(
            action=action,
            error=exc,
            meta={
                "resourceId": getattr(current_args, "resource_id", None),
                "resourceType": getattr(current_args, "resource_type", None),
            },
        )
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
