#!/usr/bin/env python3
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from scripts.shared.bestblogs_client import BestBlogsAdminClient, BestBlogsOpenClient, verify_updated_content
from scripts.shared.example_output import ExampleArgumentParser, print_failure, print_result


def parse_args() -> object:
    parser = ExampleArgumentParser(description="Update BestBlogs markdown content and verify the resource stays readable.")
    parser.add_argument("--id", required=True, dest="resource_id")
    parser.add_argument("--markdown-file", required=True)
    parser.add_argument("--language", default="zh")
    parser.add_argument("--strip-leading-h1", action="store_true")
    return parser.parse_args()


def _load_markdown(path: str, *, strip_leading_h1: bool) -> str:
    content = Path(path).read_text("utf-8")
    if not strip_leading_h1:
        return content

    lines = content.splitlines()
    if lines and lines[0].startswith("# "):
        content = "\n".join(lines[1:]).lstrip()
    return content


def main() -> int:
    action = "bestblogs.update_content"
    try:
        args = parse_args()
        markdown_content = _load_markdown(args.markdown_file, strip_leading_h1=args.strip_leading_h1)
        admin_client = BestBlogsAdminClient()
        open_client = BestBlogsOpenClient()
        write_payload, verify_payload = verify_updated_content(
            admin_client,
            open_client,
            resource_id=args.resource_id,
            markdown_content=markdown_content,
            language=args.language,
        )
        print_result(
            action=action,
            items=[{"id": args.resource_id, "markdownFile": args.markdown_file}],
            write=write_payload,
            verify=verify_payload,
            note="Verification is best-effort. It confirms the updated resource remains readable and includes an excerpt of the uploaded markdown.",
            meta={"stripLeadingH1": args.strip_leading_h1},
        )
        return 0
    except Exception as exc:
        current_args = locals().get("args", None)
        meta = {
            "resourceId": getattr(current_args, "resource_id", None),
            "markdownFile": getattr(current_args, "markdown_file", None),
            "stripLeadingH1": getattr(current_args, "strip_leading_h1", None),
        }
        print_failure(action=action, error=exc, meta=meta)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
