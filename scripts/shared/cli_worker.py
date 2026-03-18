from __future__ import annotations

import json
import subprocess
from pathlib import Path
from typing import Any


class CliWorkerError(RuntimeError):
    pass


def _maybe_parse_json(text: str) -> Any:
    stripped = text.strip()
    if not stripped:
        return None
    try:
        return json.loads(stripped)
    except json.JSONDecodeError:
        return None


def run_cli_worker(
    *,
    command: list[str],
    action: str,
    cwd: str | None = None,
    parse_json: bool = True,
    extra_meta: dict[str, Any] | None = None,
) -> dict[str, Any]:
    completed = subprocess.run(
        command,
        cwd=cwd,
        text=True,
        capture_output=True,
        check=False,
    )

    stdout_text = completed.stdout.strip()
    stderr_text = completed.stderr.strip()
    parsed_stdout = _maybe_parse_json(stdout_text) if parse_json else None

    meta = {
        "command": command,
        "cwd": str(Path(cwd).resolve()) if cwd else None,
        "returnCode": completed.returncode,
        "stderr": stderr_text or None,
        **(extra_meta or {}),
    }

    if completed.returncode != 0:
        raise CliWorkerError(
            f"Command failed for {action}: return code {completed.returncode}"
            + (f" | stderr: {stderr_text}" if stderr_text else "")
        )

    items: list[Any]
    if isinstance(parsed_stdout, list):
        items = parsed_stdout
    elif parsed_stdout is None:
        items = [{"stdout": stdout_text}] if stdout_text else []
    else:
        items = [parsed_stdout]

    return {
        "action": action,
        "items": items,
        "meta": meta,
    }
