from __future__ import annotations

import os
from dataclasses import dataclass
from datetime import date
from pathlib import Path


@dataclass(frozen=True)
class SkillRuntimePaths:
    skill_name: str
    project_config: Path
    user_config: Path
    project_extend: Path
    user_extend: Path
    stable_root: Path
    state_dir: Path
    memory_dir: Path
    cache_dir: Path
    logs_dir: Path
    workspace_root: Path


def repo_root(cwd: str | Path | None = None) -> Path:
    return Path(cwd or os.getcwd()).resolve()


def workspace_root(*, cwd: str | Path | None = None, day: date | None = None) -> Path:
    current_day = day or date.today()
    return repo_root(cwd) / "contents" / "tmp" / "workspace" / current_day.isoformat()


def stable_skill_root(
    skill_name: str,
    *,
    cwd: str | Path | None = None,
    env: dict[str, str] | None = None,
    home: str | Path | None = None,
) -> Path:
    runtime_env = env or os.environ
    plugin_data = runtime_env.get("CLAUDE_PLUGIN_DATA", "").strip()
    if plugin_data:
        return Path(plugin_data) / "gino-skills" / skill_name

    return repo_root(cwd) / ".gino-skills" / "data" / skill_name


def skill_runtime_paths(
    skill_name: str,
    *,
    cwd: str | Path | None = None,
    env: dict[str, str] | None = None,
    home: str | Path | None = None,
    day: date | None = None,
) -> SkillRuntimePaths:
    root = repo_root(cwd)
    resolved_home = Path(home or Path.home()).expanduser()
    stable_root = stable_skill_root(skill_name, cwd=root, env=env, home=resolved_home)

    return SkillRuntimePaths(
        skill_name=skill_name,
        project_config=root / ".gino-skills" / skill_name / "config.json",
        user_config=resolved_home / ".gino-skills" / skill_name / "config.json",
        project_extend=root / ".gino-skills" / skill_name / "EXTEND.md",
        user_extend=resolved_home / ".gino-skills" / skill_name / "EXTEND.md",
        stable_root=stable_root,
        state_dir=stable_root / "state",
        memory_dir=stable_root / "memory",
        cache_dir=stable_root / "cache",
        logs_dir=stable_root / "logs",
        workspace_root=workspace_root(cwd=root, day=day),
    )
