from __future__ import annotations

from datetime import date
from pathlib import Path

from scripts.shared.content_runtime import content_runtime_paths


def _ensure_parent(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)


def _read_text(path: Path) -> str | None:
    if path.exists():
        return path.read_text("utf-8")
    return None


def load_style_profile_text(
    *,
    cwd: str | Path | None = None,
    env: dict[str, str] | None = None,
    home: str | Path | None = None,
    day: date | None = None,
) -> str | None:
    paths = content_runtime_paths(cwd=cwd, env=env, home=home, day=day)
    return _read_text(paths.style_profile) or _read_text(paths.legacy_style_profile)


def write_style_profile(
    content: str,
    *,
    cwd: str | Path | None = None,
    env: dict[str, str] | None = None,
    home: str | Path | None = None,
    day: date | None = None,
    sync_legacy: bool = False,
) -> Path:
    paths = content_runtime_paths(cwd=cwd, env=env, home=home, day=day)
    _ensure_parent(paths.style_profile)
    paths.style_profile.write_text(content, encoding="utf-8")

    if sync_legacy:
        _ensure_parent(paths.legacy_style_profile)
        paths.legacy_style_profile.write_text(content, encoding="utf-8")

    return paths.style_profile


def read_daily_plan_text(
    *,
    cwd: str | Path | None = None,
    env: dict[str, str] | None = None,
    home: str | Path | None = None,
    day: date | None = None,
) -> str | None:
    paths = content_runtime_paths(cwd=cwd, env=env, home=home, day=day)
    stable_plan = paths.daily_status_dir / "plan.md"
    workspace_plan = paths.daily_workspace_root / "plan.md"
    return _read_text(stable_plan) or _read_text(workspace_plan)


def write_daily_plan(
    content: str,
    *,
    cwd: str | Path | None = None,
    env: dict[str, str] | None = None,
    home: str | Path | None = None,
    day: date | None = None,
    sync_workspace: bool = False,
) -> Path:
    paths = content_runtime_paths(cwd=cwd, env=env, home=home, day=day)
    stable_plan = paths.daily_status_dir / "plan.md"
    _ensure_parent(stable_plan)
    stable_plan.write_text(content, encoding="utf-8")

    if sync_workspace:
        workspace_plan = paths.daily_workspace_root / "plan.md"
        _ensure_parent(workspace_plan)
        workspace_plan.write_text(content, encoding="utf-8")

    return stable_plan


def append_reading_note(
    note: str,
    *,
    cwd: str | Path | None = None,
    env: dict[str, str] | None = None,
    home: str | Path | None = None,
    day: date | None = None,
) -> Path:
    paths = content_runtime_paths(cwd=cwd, env=env, home=home, day=day)
    current_day = (day or date.today()).isoformat()
    note_path = paths.reading_memory_root / f"{current_day}.md"
    _ensure_parent(note_path)

    prefix = "" if not note_path.exists() or note_path.read_text("utf-8").endswith("\n") else "\n"
    with note_path.open("a", encoding="utf-8") as handle:
        handle.write(f"{prefix}{note}\n")

    return note_path


def read_reading_note_text(
    *,
    cwd: str | Path | None = None,
    env: dict[str, str] | None = None,
    home: str | Path | None = None,
    day: date | None = None,
) -> str | None:
    paths = content_runtime_paths(cwd=cwd, env=env, home=home, day=day)
    current_day = (day or date.today()).isoformat()
    note_path = paths.reading_memory_root / f"{current_day}.md"
    return _read_text(note_path)
