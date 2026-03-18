#!/usr/bin/env python3
from __future__ import annotations

import sys
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from scripts.shared.content_runtime import content_runtime_paths
from scripts.shared.content_state import append_reading_note, read_reading_note_text
from scripts.shared.example_output import ExampleArgumentParser, print_failure, print_result


def parse_day(value: str | None) -> date | None:
    return date.fromisoformat(value) if value else None


def parse_args() -> object:
    parser = ExampleArgumentParser(description="Append stable guide-reading memory notes.")
    subparsers = parser.add_subparsers(dest="command", required=True)

    paths_parser = subparsers.add_parser("paths")
    paths_parser.add_argument("--day")

    read_parser = subparsers.add_parser("read")
    read_parser.add_argument("--day")

    append_parser = subparsers.add_parser("append")
    append_parser.add_argument("--day")
    append_parser.add_argument("--from-file")
    append_parser.add_argument("--text")

    return parser.parse_args()


def main() -> int:
    action = "content.reading_session_state"
    try:
        args = parse_args()
        requested_day = parse_day(getattr(args, "day", None))
        paths = content_runtime_paths(day=requested_day)

        if args.command == "paths":
            note_path = paths.reading_memory_root / f"{(requested_day or date.today()).isoformat()}.md"
            print_result(action=action, items=[{"stableNotePath": str(note_path)}], meta={"command": "paths", "day": getattr(args, "day", None)})
            return 0

        if args.command == "read":
            content = read_reading_note_text(day=requested_day)
            items = [{"content": content}] if content is not None else []
            print_result(action=action, items=items, meta={"command": "read", "found": content is not None, "day": getattr(args, "day", None)})
            return 0

        text = getattr(args, "text", None)
        if getattr(args, "from_file", None):
            text = Path(args.from_file).resolve().read_text("utf-8")
        if not text:
            raise ValueError("Either --text or --from-file is required for append.")

        note_path = append_reading_note(text, day=requested_day)
        print_result(
            action=action,
            items=[{"stableNotePath": str(note_path)}],
            write={"path": str(note_path)},
            meta={"command": "append", "day": getattr(args, "day", None)},
        )
        return 0
    except Exception as exc:
        current_args = locals().get("args", None)
        print_failure(action=action, error=exc, meta={"command": getattr(current_args, "command", None)})
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
