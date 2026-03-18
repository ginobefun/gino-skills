#!/usr/bin/env python3
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from scripts.shared.xgo_client import XGoClient, verify_saved_folder
from scripts.shared.example_output import ExampleArgumentParser, print_failure, print_result


def parse_args() -> object:
    parser = ExampleArgumentParser(description="Create or update an X bookmark folder with best-effort read-after-write verification.")
    parser.add_argument("--name", required=True)
    parser.add_argument("--description", default=None)
    parser.add_argument("--folder-id", default=None)
    parser.add_argument("--default-folder", action="store_true")
    return parser.parse_args()


def main() -> int:
    action = "xgo.save_folder"
    try:
        args = parse_args()
        client = XGoClient()
        payload = {
            "id": args.folder_id,
            "name": args.name,
            "description": args.description,
            "defaultFolder": args.default_folder,
        }
        write_payload, verify_payload = verify_saved_folder(client, payload=payload)
        print_result(
            action=action,
            items=[payload],
            write=write_payload,
            verify=verify_payload,
        )
        return 0
    except Exception as exc:
        current_args = locals().get("args", None)
        print_failure(
            action=action,
            error=exc,
            items=[
                {
                    "id": getattr(current_args, "folder_id", None),
                    "name": getattr(current_args, "name", None),
                    "defaultFolder": getattr(current_args, "default_folder", None),
                }
            ],
        )
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
