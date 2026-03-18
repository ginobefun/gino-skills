from __future__ import annotations

import argparse
import json
from typing import Any

from scripts.shared.api_common import ApiError


def build_result(
    *,
    action: str,
    ok: bool = True,
    items: list[Any] | None = None,
    write: Any = None,
    verify: Any = None,
    note: str | None = None,
    meta: dict[str, Any] | None = None,
) -> dict[str, Any]:
    return {
        "ok": ok,
        "action": action,
        "items": items if items is not None else [],
        "write": write,
        "verify": verify,
        "note": note,
        "meta": meta or {},
    }


class ExampleUsageError(ValueError):
    pass


class ExampleArgumentParser(argparse.ArgumentParser):
    def error(self, message: str) -> None:
        raise ExampleUsageError(message)


def build_failure_result(
    *,
    action: str,
    error: Exception,
    items: list[Any] | None = None,
    meta: dict[str, Any] | None = None,
    note: str | None = None,
) -> dict[str, Any]:
    error_meta = {
        "type": type(error).__name__,
        "message": str(error),
    }
    if isinstance(error, ApiError):
        error_meta["service"] = error.service
        if error.status is not None:
            error_meta["status"] = error.status
        if error.code is not None:
            error_meta["code"] = error.code

    merged_meta = dict(meta or {})
    merged_meta["error"] = error_meta

    return build_result(
        action=action,
        ok=False,
        items=items,
        note=note or str(error),
        meta=merged_meta,
    )


def print_result(**kwargs: Any) -> None:
    print(json.dumps(build_result(**kwargs), ensure_ascii=False, indent=2))


def print_failure(
    *,
    action: str,
    error: Exception,
    items: list[Any] | None = None,
    meta: dict[str, Any] | None = None,
    note: str | None = None,
) -> None:
    print(json.dumps(build_failure_result(action=action, error=error, items=items, meta=meta, note=note), ensure_ascii=False, indent=2))
