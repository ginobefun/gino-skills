#!/usr/bin/env python3

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

ALLOWED_FRONTMATTER_FIELDS = {"name", "description"}
DESCRIPTION_PREFIX = "Use when"
DESCRIPTION_MAX_CHARS = 500
FRONTMATTER_MAX_CHARS = 1024
NAME_PATTERN = re.compile(r"^[a-z0-9][a-z0-9-]*$")
REQUIRED_SECTION_TITLES = (
    "## When to Use",
    "## When Not to Use",
    "## Gotchas",
    "## Related Skills",
)
TARGETED_SECTION_PATHS = {
    Path("skills/daily-content-management/SKILL.md").as_posix(),
    Path("skills/daily-content-curator/SKILL.md").as_posix(),
    Path("skills/content-synthesizer/SKILL.md").as_posix(),
    Path("skills/reading-workflow/SKILL.md").as_posix(),
    Path("skills/deep-reading/SKILL.md").as_posix(),
    Path("skills/post-to-x/SKILL.md").as_posix(),
    Path("skills/post-to-wechat/SKILL.md").as_posix(),
    Path("skills/xgo-fetch-tweets/SKILL.md").as_posix(),
    Path("skills/xgo-search-tweets/SKILL.md").as_posix(),
}
TARGETED_SECTION_PREFIXES = (
    "skills/bestblogs-",
    "skills/xgo-",
)
INVENTORY_PHRASES = (
    "适用场景",
    "触发短语",
    "triggered by phrases",
    "trigger phrase",
    "trigger phrases",
)
FRONTMATTER_PATTERN = re.compile(r"\A---\n(?P<body>.*?)\n---\n?", re.DOTALL)


def parse_frontmatter(text: str) -> tuple[dict[str, str], list[str]]:
    match = FRONTMATTER_PATTERN.match(text)
    if not match:
        return {}, ["missing YAML frontmatter at the top of the file"]

    raw_body = match.group("body")
    violations: list[str] = []
    if len(raw_body) > FRONTMATTER_MAX_CHARS:
        violations.append(
            f"frontmatter exceeds {FRONTMATTER_MAX_CHARS} characters ({len(raw_body)})"
        )

    data: dict[str, str] = {}
    for line in raw_body.splitlines():
        if not line.strip():
            continue
        if ":" not in line:
            violations.append(f"invalid frontmatter line: {line}")
            continue
        key, value = line.split(":", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if key not in ALLOWED_FRONTMATTER_FIELDS:
            violations.append(f"unsupported frontmatter field: {key}")
            continue
        data[key] = value

    return data, violations


def lint_skill_text(text: str, rel_path: str | None = None) -> list[str]:
    frontmatter, violations = parse_frontmatter(text)

    name = frontmatter.get("name", "")
    if not name:
        violations.append("missing required frontmatter field: name")
    elif not NAME_PATTERN.fullmatch(name):
        violations.append("name must use lowercase letters, numbers, and hyphens only")

    description = frontmatter.get("description", "")
    if not description:
        violations.append("missing required frontmatter field: description")
    else:
        if not description.startswith(DESCRIPTION_PREFIX):
            violations.append("description must start with 'Use when'")
        if len(description) > DESCRIPTION_MAX_CHARS:
            violations.append(
                f"description exceeds {DESCRIPTION_MAX_CHARS} characters ({len(description)})"
            )
        lower_description = description.lower()
        for phrase in INVENTORY_PHRASES:
            if phrase.lower() in lower_description:
                violations.append(
                    f"description must not include inventory phrase: {phrase}"
                )

    normalized_path = rel_path.replace("\\", "/") if rel_path else None
    if normalized_path and "/skills/" in normalized_path:
        normalized_path = normalized_path.split("/skills/", 1)[1]
        normalized_path = f"skills/{normalized_path}"
    is_targeted = bool(
        normalized_path
        and (
            any(normalized_path.endswith(target) for target in TARGETED_SECTION_PATHS)
            or any(normalized_path.startswith(prefix) for prefix in TARGETED_SECTION_PREFIXES)
        )
    )
    if is_targeted:
        for section_title in REQUIRED_SECTION_TITLES:
            if section_title not in text:
                violations.append(f"missing required section: {section_title}")

    return violations


def lint_skill_file(path: Path) -> list[str]:
    return lint_skill_text(
        path.read_text(encoding="utf-8"), rel_path=path.as_posix()
    )


def iter_skill_files(args_paths: list[str]) -> list[Path]:
    if args_paths:
        return [Path(item) for item in args_paths]
    return sorted(Path("skills").glob("*/SKILL.md"))


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Lint repository SKILL.md files.")
    parser.add_argument("paths", nargs="*", help="Optional SKILL.md paths to lint")
    args = parser.parse_args(argv)

    skill_files = iter_skill_files(args.paths)
    if not skill_files:
        print("No SKILL.md files found.", file=sys.stderr)
        return 1

    total_violations = 0
    for path in skill_files:
        violations = lint_skill_file(path)
        if not violations:
            continue
        total_violations += len(violations)
        print(f"{path}:")
        for violation in violations:
            print(f"  - {violation}")

    if total_violations:
        print(f"\nFound {total_violations} violation(s).", file=sys.stderr)
        return 1

    print(f"Linted {len(skill_files)} skill file(s): 0 violations.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
