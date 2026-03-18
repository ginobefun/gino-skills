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
    parser = ExampleArgumentParser(description="Run the local digest render pipeline through a stable worker wrapper around generate-digest.js.")
    parser.add_argument("--digest-data", required=True)
    parser.add_argument("--output-dir", default=None)
    return parser.parse_args()


def main() -> int:
    action = "xgo.digest_render"
    try:
        args = parse_args()
        data_path = Path(args.digest_data)
        payload = json.loads(data_path.read_text("utf-8"))
        date = payload.get("date")
        output_dir = Path(args.output_dir) if args.output_dir else ROOT / "contents" / "twitter-digest" / str(date)

        env = os.environ.copy()
        env["XGO_DIGEST_DATA_PATH"] = str(data_path)
        env["XGO_DIGEST_OUTPUT_DIR"] = str(output_dir)

        completed = subprocess.run(
            ["node", str(ROOT / "scripts" / "generate-digest.js")],
            cwd=ROOT,
            env=env,
            capture_output=True,
            text=True,
            check=True,
        )

        generated_files = []
        for name in ("digest.md", "digest-full.md", "digest.html", "infographic-prompt.txt"):
            path = output_dir / name
            if path.exists():
                generated_files.append({"name": name, "path": str(path)})

        print_result(
            action=action,
            items=generated_files,
            verify={"date": date, "outputDir": str(output_dir)},
            meta={
                "digestData": str(data_path),
                "outputDir": str(output_dir),
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
                "digestData": getattr(current_args, "digest_data", None),
                "outputDir": getattr(current_args, "output_dir", None),
            },
        )
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
