#!/usr/bin/env python3
from __future__ import annotations

import sys
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from scripts.shared.content_runtime import content_runtime_paths
from scripts.shared.content_state import read_daily_plan_text, write_daily_plan
from scripts.shared.example_output import ExampleArgumentParser, print_failure, print_result


def parse_day(value: str | None) -> date | None:
    return date.fromisoformat(value) if value else None


def parse_args() -> object:
    parser = ExampleArgumentParser(description="Read or write stable daily plan state.")
    subparsers = parser.add_subparsers(dest="command", required=True)

    paths_parser = subparsers.add_parser("paths")
    paths_parser.add_argument("--day")

    read_parser = subparsers.add_parser("read")
    read_parser.add_argument("--day")

    write_parser = subparsers.add_parser("write")
    write_parser.add_argument("--day")
    write_parser.add_argument("--from-file", required=True)
    write_parser.add_argument("--sync-workspace", action="store_true")

    return parser.parse_args()


def main() -> int:
    action = "content.daily_plan_state"
    try:
        args = parse_args()
        requested_day = parse_day(getattr(args, "day", None))
        paths = content_runtime_paths(day=requested_day)

        if args.command == "paths":
            items = [
                {
                    "stablePlanPath": str(paths.daily_status_dir / "plan.md"),
                    "workspacePlanPath": str(paths.daily_workspace_root / "plan.md"),
                }
            ]
            print_result(action=action, items=items, meta={"command": "paths", "day": getattr(args, "day", None)})
            return 0

        if args.command == "read":
            content = read_daily_plan_text(day=requested_day)
            items = [{"content": content}] if content is not None else []
            print_result(action=action, items=items, meta={"command": "read", "found": content is not None, "day": getattr(args, "day", None)})
            return 0

        source_path = Path(args.from_file).resolve()
        content = source_path.read_text("utf-8")
        written_path = write_daily_plan(content, day=requested_day, sync_workspace=args.sync_workspace)
        print_result(
            action=action,
            items=[{"stablePlanPath": str(written_path)}],
            write={"path": str(written_path), "syncWorkspace": args.sync_workspace},
            meta={"command": "write", "day": getattr(args, "day", None), "sourcePath": str(source_path)},
        )
        return 0
    except Exception as exc:
        current_args = locals().get("args", None)
        print_failure(action=action, error=exc, meta={"command": getattr(current_args, "command", None)})
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
