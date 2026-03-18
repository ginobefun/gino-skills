#!/usr/bin/env python3
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from scripts.shared.cli_worker import run_cli_worker
from scripts.shared.example_output import ExampleArgumentParser, print_failure, print_result


def parse_args() -> object:
    parser = ExampleArgumentParser(description="通过统一 worker 执行 xiaohongshu-cli 写操作命令。")
    parser.add_argument("--subcommand", required=True, help="例如 post、like、favorite、comment、follow。")
    known, passthrough = parser.parse_known_args()
    known.args = passthrough
    return known


def main() -> int:
    action = "xhs.action"
    try:
        args = parse_args()
        payload = run_cli_worker(
            command=["xhs", args.subcommand, *args.args, "--json"],
            action=f"{action}.{args.subcommand}",
        )
        print_result(
            action=payload["action"],
            items=payload["items"],
            write={"confirmed": True},
            meta=payload["meta"],
        )
        return 0
    except Exception as exc:
        current_args = locals().get("args", None)
        print_failure(
            action=f"{action}.{getattr(current_args, 'subcommand', 'unknown')}",
            error=exc,
            meta={"args": getattr(current_args, "args", None)},
        )
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
