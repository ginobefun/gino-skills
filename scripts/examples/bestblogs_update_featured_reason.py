#!/usr/bin/env python3
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from scripts.shared.bestblogs_client import BestBlogsAdminClient, BestBlogsOpenClient
from scripts.shared.example_output import ExampleArgumentParser, print_failure, print_result


def parse_args() -> object:
    parser = ExampleArgumentParser(
        description="Update BestBlogs featured reason. Read-back is best-effort because current open references do not document featured-reason fields in resource meta."
    )
    parser.add_argument("--id", required=True, dest="resource_id")
    parser.add_argument("--zh-text", required=True)
    parser.add_argument("--en-text", required=True)
    return parser.parse_args()


def main() -> int:
    action = "bestblogs.update_featured_reason"
    try:
        args = parse_args()
        admin_client = BestBlogsAdminClient()
        open_client = BestBlogsOpenClient()
        write_payload = admin_client.update_featured_reason(
            args.resource_id,
            zh_text=args.zh_text,
            en_text=args.en_text,
        )
        verify_payload = open_client.get_resource_meta(args.resource_id)
        print_result(
            action=action,
            items=[{"id": args.resource_id}],
            write=write_payload,
            verify=verify_payload,
            note="Current references do not document zhFeaturedReason/enFeaturedReason read-back fields. Review the returned meta payload before treating this as a strong verification.",
        )
        return 0
    except Exception as exc:
        current_args = locals().get("args", None)
        print_failure(
            action=action,
            error=exc,
            items=[{"id": getattr(current_args, "resource_id", None)}],
            note="Featured-reason verification remains best-effort because the read-back fields are undocumented.",
        )
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
