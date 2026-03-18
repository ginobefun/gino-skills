import json
import tempfile
import unittest
from datetime import date
from pathlib import Path

from scripts.shared.content_state import (
    append_reading_note,
    load_style_profile_text,
    read_reading_note_text,
    read_daily_plan_text,
    write_daily_plan,
    write_style_profile,
)
from scripts.shared.content_runtime import content_runtime_paths


class RuntimeConventionTests(unittest.TestCase):
    def test_content_runtime_paths_use_stable_roots(self) -> None:
        paths = content_runtime_paths(
            cwd="/repo",
            home="/home/demo",
            env={"CLAUDE_PLUGIN_DATA": "/plugin-data"},
            day=date(2026, 3, 18),
        )

        self.assertEqual(paths.style_profile, Path("/plugin-data/gino-skills/manage-daily-content/memory/style-profile.md"))
        self.assertEqual(paths.reading_memory_root, Path("/plugin-data/gino-skills/guide-reading/memory"))
        self.assertEqual(paths.article_cache_root, Path("/plugin-data/gino-skills/read-deeply/cache/article-details"))
        self.assertEqual(paths.daily_status_dir, Path("/plugin-data/gino-skills/manage-daily-content/state/daily/2026-03-18"))
        self.assertEqual(paths.legacy_style_profile, Path("/repo/contents/style-profile.md"))

    def test_high_frequency_schema_files_are_valid_json_objects(self) -> None:
        schema_paths = [
            Path("/Users/gino/Documents/Github/gino-skills/skills/image-gen/config.schema.json"),
            Path("/Users/gino/Documents/Github/gino-skills/skills/post-to-wechat/config.schema.json"),
            Path("/Users/gino/Documents/Github/gino-skills/skills/post-to-x/config.schema.json"),
            Path("/Users/gino/Documents/Github/gino-skills/skills/daily-content-management/config.schema.json"),
            Path("/Users/gino/Documents/Github/gino-skills/skills/reading-workflow/config.schema.json"),
            Path("/Users/gino/Documents/Github/gino-skills/skills/content-synthesizer/config.schema.json"),
            Path("/Users/gino/Documents/Github/gino-skills/skills/cover-image/config.schema.json"),
            Path("/Users/gino/Documents/Github/gino-skills/skills/article-illustrator/config.schema.json"),
        ]

        for schema_path in schema_paths:
            with self.subTest(schema_path=schema_path):
                data = json.loads(schema_path.read_text("utf-8"))
                self.assertIsInstance(data, dict)
                self.assertEqual(data.get("type"), "object")
                self.assertFalse(data.get("additionalProperties", True))
                self.assertIn("$schema", data)
                self.assertIn("properties", data)

    def test_write_style_profile_prefers_stable_path_and_can_sync_legacy(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            content = "# Style Profile\n\nStable version."

            stable_path = write_style_profile(
                content,
                cwd=root,
                home=root / "home",
                env={"CLAUDE_PLUGIN_DATA": str(root / "plugin-data")},
                sync_legacy=True,
            )

            self.assertEqual(stable_path, root / "plugin-data" / "gino-skills" / "manage-daily-content" / "memory" / "style-profile.md")
            self.assertEqual(stable_path.read_text("utf-8"), content)
            self.assertEqual((root / "contents" / "style-profile.md").read_text("utf-8"), content)
            self.assertEqual(
                load_style_profile_text(cwd=root, home=root / "home", env={"CLAUDE_PLUGIN_DATA": str(root / "plugin-data")}),
                content,
            )

    def test_write_daily_plan_can_sync_workspace_copy(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            content = "# Daily Plan\n\n- Topic A"

            stable_path = write_daily_plan(
                content,
                cwd=root,
                home=root / "home",
                env={"CLAUDE_PLUGIN_DATA": str(root / "plugin-data")},
                day=date(2026, 3, 18),
                sync_workspace=True,
            )

            self.assertEqual(
                stable_path,
                root / "plugin-data" / "gino-skills" / "manage-daily-content" / "state" / "daily" / "2026-03-18" / "plan.md",
            )
            self.assertEqual(read_daily_plan_text(cwd=root, home=root / "home", env={"CLAUDE_PLUGIN_DATA": str(root / "plugin-data")}, day=date(2026, 3, 18)), content)
            self.assertEqual((root / "contents" / "tmp" / "workspace" / "2026-03-18" / "plan.md").read_text("utf-8"), content)

    def test_append_reading_note_writes_stable_memory_file(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            first = append_reading_note(
                "First note",
                cwd=root,
                home=root / "home",
                env={"CLAUDE_PLUGIN_DATA": str(root / "plugin-data")},
                day=date(2026, 3, 18),
            )
            second = append_reading_note(
                "Second note",
                cwd=root,
                home=root / "home",
                env={"CLAUDE_PLUGIN_DATA": str(root / "plugin-data")},
                day=date(2026, 3, 18),
            )

            self.assertEqual(first, second)
            content = second.read_text("utf-8")
            self.assertIn("First note", content)
            self.assertIn("Second note", content)
            self.assertEqual(
                read_reading_note_text(
                    cwd=root,
                    home=root / "home",
                    env={"CLAUDE_PLUGIN_DATA": str(root / "plugin-data")},
                    day=date(2026, 3, 18),
                ),
                content,
            )
