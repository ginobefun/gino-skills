#!/usr/bin/env python3
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from scripts.shared.example_output import print_failure, print_result
from scripts.shared.xgo_client import XGoClient


def main() -> int:
    try:
        client = XGoClient()
        items = client.list_all_folders()
        print_result(
            action="xgo.folder_overview",
            items=items,
            meta={"count": len(items)},
        )
        return 0
    except Exception as exc:
        print_failure(action="xgo.folder_overview", error=exc)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
