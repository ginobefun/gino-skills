from __future__ import annotations

from dataclasses import dataclass
from datetime import date
from pathlib import Path

from scripts.shared.runtime_paths import repo_root, skill_runtime_paths


@dataclass(frozen=True)
class ContentRuntimePaths:
    style_profile: Path
    legacy_style_profile: Path
    reading_memory_root: Path
    reading_cache_root: Path
    article_cache_root: Path
    daily_state_root: Path
    daily_status_dir: Path
    daily_workspace_root: Path


def content_runtime_paths(
    *,
    cwd: str | Path | None = None,
    env: dict[str, str] | None = None,
    home: str | Path | None = None,
    day: date | None = None,
) -> ContentRuntimePaths:
    daily_paths = skill_runtime_paths("manage-daily-content", cwd=cwd, env=env, home=home, day=day)
    reading_paths = skill_runtime_paths("guide-reading", cwd=cwd, env=env, home=home, day=day)
    deep_reading_paths = skill_runtime_paths("read-deeply", cwd=cwd, env=env, home=home, day=day)
    root = repo_root(cwd)
    current_day = (day or date.today()).isoformat()

    return ContentRuntimePaths(
        style_profile=daily_paths.memory_dir / "style-profile.md",
        legacy_style_profile=root / "contents" / "style-profile.md",
        reading_memory_root=reading_paths.memory_dir,
        reading_cache_root=reading_paths.cache_dir / "article-details",
        article_cache_root=deep_reading_paths.cache_dir / "article-details",
        daily_state_root=daily_paths.state_dir / "daily",
        daily_status_dir=daily_paths.state_dir / "daily" / current_day,
        daily_workspace_root=daily_paths.workspace_root,
    )
