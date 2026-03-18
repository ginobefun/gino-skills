#!/usr/bin/env python3
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from scripts.shared.content_runtime import content_runtime_paths
from scripts.shared.content_state import load_style_profile_text, write_style_profile
from scripts.shared.example_output import ExampleArgumentParser, print_failure, print_result


def parse_args() -> object:
    parser = ExampleArgumentParser(description="Read or write the stable style-profile artifact.")
    subparsers = parser.add_subparsers(dest="command", required=True)

    subparsers.add_parser("paths")
    subparsers.add_parser("read")

    write_parser = subparsers.add_parser("write")
    write_parser.add_argument("--from-file", required=True)
    write_parser.add_argument("--sync-legacy", action="store_true")

    return parser.parse_args()


def main() -> int:
    action = "content.style_profile_state"
    try:
        args = parse_args()
        paths = content_runtime_paths()

        if args.command == "paths":
            items = [
                {
                    "stablePath": str(paths.style_profile),
                    "legacyPath": str(paths.legacy_style_profile),
                }
            ]
            print_result(action=action, items=items, meta={"command": "paths"})
            return 0

        if args.command == "read":
            content = load_style_profile_text()
            items = [{"content": content}] if content is not None else []
            print_result(action=action, items=items, meta={"command": "read", "found": content is not None})
            return 0

        source_path = Path(args.from_file).resolve()
        content = source_path.read_text("utf-8")
        written_path = write_style_profile(content, sync_legacy=args.sync_legacy)
        print_result(
            action=action,
            items=[{"stablePath": str(written_path), "bytes": len(content.encode("utf-8"))}],
            write={"path": str(written_path), "syncLegacy": args.sync_legacy},
            meta={"command": "write", "sourcePath": str(source_path)},
        )
        return 0
    except Exception as exc:
        current_args = locals().get("args", None)
        print_failure(action=action, error=exc, meta={"command": getattr(current_args, "command", None)})
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
