#!/usr/bin/env python3
from __future__ import annotations

import json
import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from scripts.shared.example_output import ExampleArgumentParser, print_failure, print_result


def parse_args() -> object:
    parser = ExampleArgumentParser(description="Run the local digest ranking pipeline through a stable worker wrapper around process-tweets.js.")
    parser.add_argument("--source-data", required=True)
    parser.add_argument("--output", default="/tmp/tweet_digest_data.json")
    return parser.parse_args()


def main() -> int:
    action = "xgo.digest_rank"
    try:
        args = parse_args()
        source_path = Path(args.source_data)
        output_path = Path(args.output)
        env = os.environ.copy()
        env["XGO_DIGEST_SOURCE_PATH"] = str(source_path)
        env["XGO_DIGEST_OUTPUT_PATH"] = str(output_path)

        completed = subprocess.run(
            ["node", str(ROOT / "scripts" / "process-tweets.js")],
            cwd=ROOT,
            env=env,
            capture_output=True,
            text=True,
            check=True,
        )

        payload = json.loads(output_path.read_text("utf-8"))
        print_result(
            action=action,
            items=payload.get("top20", []),
            verify=payload,
            meta={
                "sourceData": str(source_path),
                "output": str(output_path),
                "stdout": completed.stdout.strip(),
                "stderr": completed.stderr.strip(),
            },
        )
        return 0
    except Exception as exc:
        current_args = locals().get("args", None)
        print_failure(
            action=action,
            error=exc,
            meta={
                "sourceData": getattr(current_args, "source_data", None),
                "output": getattr(current_args, "output", None),
            },
        )
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
