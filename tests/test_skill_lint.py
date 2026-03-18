import textwrap
import unittest
from pathlib import Path
from tempfile import TemporaryDirectory

from scripts.lint_skills import lint_skill_file


class SkillLintTests(unittest.TestCase):
    def lint_text(self, text: str, rel_path: str = "skills/demo-skill/SKILL.md"):
        with TemporaryDirectory() as tmpdir:
            skill_file = Path(tmpdir) / rel_path
            skill_file.parent.mkdir(parents=True)
            skill_file.write_text(textwrap.dedent(text).lstrip(), encoding="utf-8")
            return lint_skill_file(skill_file)

    def test_valid_skill_frontmatter_passes(self):
        violations = self.lint_text(
            """
            ---
            name: demo-skill
            description: Use when the user wants a concise demo skill for repository lint verification.
            ---

            # Demo Skill

            ## Overview

            Example.
            """
        )
        self.assertEqual([], violations)

    def test_description_must_start_with_use_when(self):
        violations = self.lint_text(
            """
            ---
            name: demo-skill
            description: Generates demo output for tests.
            ---
            """
        )
        self.assertTrue(any("must start with 'Use when'" in item for item in violations))

    def test_only_name_and_description_frontmatter_fields_are_allowed(self):
        violations = self.lint_text(
            """
            ---
            name: demo-skill
            description: Use when the user wants to test unsupported frontmatter fields.
            tags: [demo]
            ---
            """
        )
        self.assertTrue(any("unsupported frontmatter field" in item for item in violations))

    def test_description_must_not_exceed_limit(self):
        long_description = "Use when " + ("very " * 130) + "long."
        violations = self.lint_text(
            f"""
            ---
            name: demo-skill
            description: {long_description}
            ---
            """
        )
        self.assertTrue(any("description exceeds" in item for item in violations))

    def test_description_must_not_contain_inventory_phrases(self):
        violations = self.lint_text(
            """
            ---
            name: demo-skill
            description: Use when the user wants a demo skill. 适用场景：测试。触发短语：demo。
            ---
            """
        )
        self.assertTrue(any("inventory phrase" in item for item in violations))

    def test_targeted_skills_require_navigation_sections(self):
        violations = self.lint_text(
            """
            ---
            name: manage-daily-content
            description: Use when the user wants an end-to-end daily content workflow.
            ---

            # Manage Daily Content

            ## Overview

            Example.
            """,
            rel_path="skills/daily-content-management/SKILL.md",
        )
        self.assertTrue(any("missing required section" in item for item in violations))

    def test_targeted_skills_pass_when_navigation_sections_exist(self):
        violations = self.lint_text(
            """
            ---
            name: manage-daily-content
            description: Use when the user wants an end-to-end daily content workflow.
            ---

            # Manage Daily Content

            ## Overview

            Example.

            ## When to Use

            Example.

            ## When Not to Use

            Example.

            ## Gotchas

            Example.

            ## Related Skills

            Example.
            """,
            rel_path="skills/daily-content-management/SKILL.md",
        )
        self.assertEqual([], violations)

    def test_bestblogs_family_requires_navigation_sections(self):
        violations = self.lint_text(
            """
            ---
            name: bestblogs-fetcher
            description: Use when the user wants to fetch BestBlogs content.
            ---

            # BestBlogs Fetcher
            """,
            rel_path="skills/bestblogs-fetcher/SKILL.md",
        )
        self.assertTrue(any("missing required section" in item for item in violations))

    def test_xgo_family_requires_navigation_sections(self):
        violations = self.lint_text(
            """
            ---
            name: xgo-view-profile
            description: Use when the user wants to inspect an X profile.
            ---

            # XGo View Profile
            """,
            rel_path="skills/xgo-view-profile/SKILL.md",
        )
        self.assertTrue(any("missing required section" in item for item in violations))

    def test_bestblogs_worker_skill_passes_with_navigation_sections(self):
        violations = self.lint_text(
            """
            ---
            name: bestblogs-fetch-pending-content
            description: Use when the user wants to fetch pending BestBlogs items and their raw content before later analysis or translation steps.
            ---

            # BestBlogs Fetch Pending Content

            ## When to Use

            Example.

            ## When Not to Use

            Example.

            ## Gotchas

            Example.

            ## Related Skills

            Example.
            """,
            rel_path="skills/bestblogs-fetch-pending-content/SKILL.md",
        )
        self.assertEqual([], violations)


if __name__ == "__main__":
    unittest.main()
