import json
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

from scripts.shared.api_common import (
    ApiError,
    VerificationError,
    collect_paginated,
    ensure_expected_ids,
    ensure_success,
    write_and_verify,
)
from scripts.shared.bestblogs_client import (
    BestBlogsAdminClient,
    BestBlogsOpenClient,
    parse_analysis_result,
    verify_added_rss_url,
    verify_saved_analysis,
    verify_updated_content,
)
from scripts.shared.cli_worker import CliWorkerError, run_cli_worker
from scripts.shared.example_output import build_failure_result, build_result
from scripts.shared.runtime_paths import skill_runtime_paths
from scripts.shared.xgo_client import XGoClient, verify_follow_action, verify_saved_folder, verify_saved_list


class SharedApiClientTests(unittest.TestCase):
    def test_ensure_success_raises_on_false_boolean(self) -> None:
        with self.assertRaises(ApiError):
            ensure_success({"success": False, "message": "bad request", "code": "x-1"}, service="demo")

    def test_ensure_success_accepts_true_string(self) -> None:
        payload = {"success": "true", "data": {"ok": True}}
        self.assertEqual(ensure_success(payload, service="demo"), payload)

    def test_collect_paginated_stops_at_total_pages(self) -> None:
        pages = {
            1: {"data": {"items": [1, 2], "totalPage": 2}},
            2: {"data": {"items": [3], "totalPage": 2}},
        }

        items = collect_paginated(
            lambda page: pages[page],
            extract_items=lambda body: body["data"]["items"],
            extract_total_pages=lambda body: body["data"]["totalPage"],
        )

        self.assertEqual(items, [1, 2, 3])

    def test_ensure_expected_ids_detects_mismatch(self) -> None:
        with self.assertRaises(VerificationError):
            ensure_expected_ids(["a", "b"], ["a", "c"], context="saveTweetAnalysisResult")

    def test_write_and_verify_raises_when_verifier_fails(self) -> None:
        with self.assertRaises(VerificationError):
            write_and_verify(
                lambda: {"success": True, "data": {"id": "ok"}},
                lambda: {"success": True, "data": {"visible": False}},
                service="demo",
                action="bookmark write",
                verifier=lambda body: bool(body["data"]["visible"]),
            )

    def test_bestblogs_admin_list_articles_aggregates_pages(self) -> None:
        class FakeBestBlogsAdminClient(BestBlogsAdminClient):
            def __init__(self) -> None:
                pass

            def post_json(self, path, payload, *, headers=None):  # type: ignore[override]
                page = payload["currentPage"]
                return {
                    "success": True,
                    "data": {
                        "dataList": [{"id": f"RAW_{page}_1"}, {"id": f"RAW_{page}_2"}],
                        "totalPage": 2,
                    },
                }

        client = FakeBestBlogsAdminClient()
        items = client.list_articles({"currentPage": 1, "pageSize": 2}, max_pages=5)
        self.assertEqual([item["id"] for item in items], ["RAW_1_1", "RAW_1_2", "RAW_2_1", "RAW_2_2"])

    def test_xgo_tweet_list_aggregates_pages(self) -> None:
        class FakeXGoClient(XGoClient):
            def __init__(self) -> None:
                pass

            def post_json(self, path, payload, *, headers=None):  # type: ignore[override]
                page = payload["currentPage"]
                return {
                    "success": True,
                    "data": {
                        "data": [{"id": f"T{page}a"}, {"id": f"T{page}b"}],
                        "totalPage": 3,
                    },
                }

        client = FakeXGoClient()
        items = client.list_tweets({"currentPage": 1, "pageSize": 2}, max_pages=5)
        self.assertEqual([item["id"] for item in items], ["T1a", "T1b", "T2a", "T2b", "T3a", "T3b"])

    def test_parse_analysis_result_handles_json_string(self) -> None:
        parsed = parse_analysis_result({"analysisResult": '{"summary":"ok","tags":["a"]}'})
        self.assertEqual(parsed["summary"], "ok")
        self.assertEqual(parsed["tags"], ["a"])

    def test_verify_saved_analysis_round_trips_summary(self) -> None:
        class FakeAdmin(BestBlogsAdminClient):
            def __init__(self) -> None:
                pass

            def save_analysis_result(self, resource_id: str, payload: dict[str, object]):  # type: ignore[override]
                return {"success": True, "data": True, "resource_id": resource_id, "payload": payload}

        class FakeOpen(BestBlogsOpenClient):
            def __init__(self) -> None:
                pass

            def get_dify_resource_markdown(self, resource_id: str, *, language: str = "zh"):  # type: ignore[override]
                return {
                    "success": "true",
                    "analysisResult": '{"summary":"done","tags":["tag1"]}',
                    "totalScore": 88,
                }

        write_payload, verify_payload = verify_saved_analysis(
            FakeAdmin(),
            FakeOpen(),
            resource_id="RAW_1",
            payload={"summary": "done", "tags": ["tag1"], "score": 88},
        )
        self.assertTrue(write_payload["success"])
        self.assertEqual(verify_payload["totalScore"], 88)

    def test_verify_follow_action_checks_following_status(self) -> None:
        class FakeXGo(XGoClient):
            def __init__(self) -> None:
                pass

            def follow_user(self, user_name: str):  # type: ignore[override]
                return {"success": True, "data": True, "user_name": user_name}

            def unfollow_user(self, user_name: str):  # type: ignore[override]
                return {"success": True, "data": True, "user_name": user_name}

            def get_following_status(self, user_name: str):  # type: ignore[override]
                return {"success": True, "data": {"following": True, "userName": user_name}}

        write_payload, verify_payload = verify_follow_action(FakeXGo(), user_name="elonmusk", follow=True)
        self.assertTrue(write_payload["success"])
        self.assertTrue(verify_payload["data"]["following"])

    def test_verify_added_rss_url_scans_source_list(self) -> None:
        class FakeAdmin(BestBlogsAdminClient):
            def __init__(self) -> None:
                pass

            def add_rss_url(self, rss_url: str):  # type: ignore[override]
                return {"success": True, "data": {"rssUrl": rss_url}}

        class FakeOpen(BestBlogsOpenClient):
            def __init__(self) -> None:
                pass

            def list_sources(self, payload):  # type: ignore[override]
                return {"success": True, "data": {"dataList": [{"rssUrl": "https://example.com/feed"}]}}

        write_payload, verify_payload = verify_added_rss_url(
            FakeAdmin(),
            FakeOpen(),
            rss_url="https://example.com/feed",
        )
        self.assertTrue(write_payload["success"])
        self.assertIn("dataList", verify_payload["data"])

    def test_verify_saved_list_looks_up_name(self) -> None:
        class FakeXGo(XGoClient):
            def __init__(self) -> None:
                pass

            def save_list(self, payload):  # type: ignore[override]
                return {"success": True, "data": {"id": "LIST_1"}}

            def get_json(self, path, *, params=None, headers=None):  # type: ignore[override]
                return {"success": True, "data": [{"id": "LIST_1", "name": "AI Researchers"}]}

        write_payload, verify_payload = verify_saved_list(
            FakeXGo(),
            payload={"name": "AI Researchers"},
        )
        self.assertTrue(write_payload["success"])
        self.assertEqual(verify_payload["data"][0]["name"], "AI Researchers")

    def test_verify_saved_folder_looks_up_name(self) -> None:
        class FakeXGo(XGoClient):
            def __init__(self) -> None:
                pass

            def save_folder(self, payload):  # type: ignore[override]
                return {"success": True, "data": {"id": "FOLDER_1"}}

            def get_folder_all(self):  # type: ignore[override]
                return {"success": True, "data": [{"id": "FOLDER_1", "name": "AI Papers"}]}

        write_payload, verify_payload = verify_saved_folder(
            FakeXGo(),
            payload={"name": "AI Papers"},
        )
        self.assertTrue(write_payload["success"])
        self.assertEqual(verify_payload["data"][0]["name"], "AI Papers")

    def test_verify_updated_content_checks_excerpt(self) -> None:
        class FakeAdmin(BestBlogsAdminClient):
            def __init__(self) -> None:
                pass

            def update_content(self, resource_id: str, *, markdown_content: str):  # type: ignore[override]
                return {"success": True, "data": {"id": resource_id, "length": len(markdown_content)}}

        class FakeOpen(BestBlogsOpenClient):
            def __init__(self) -> None:
                pass

            def get_dify_resource_markdown(self, resource_id: str, *, language: str = "zh"):  # type: ignore[override]
                return {"success": "true", "markdown": "Updated body with enough text to confirm excerpt matching."}

        write_payload, verify_payload = verify_updated_content(
            FakeAdmin(),
            FakeOpen(),
            resource_id="RR_1",
            markdown_content="Updated body with enough text to confirm excerpt matching.",
        )
        self.assertTrue(write_payload["success"])
        self.assertEqual(verify_payload["markdown"], "Updated body with enough text to confirm excerpt matching.")

    def test_build_result_returns_full_contract_with_defaults(self) -> None:
        result = build_result(action="bestblogs.fetch_pending", items=[{"id": "RAW_1"}])

        self.assertEqual(
            result,
            {
                "ok": True,
                "action": "bestblogs.fetch_pending",
                "items": [{"id": "RAW_1"}],
                "write": None,
                "verify": None,
                "note": None,
                "meta": {},
            },
        )

    def test_build_result_passes_optional_fields_through(self) -> None:
        result = build_result(
            action="xgo.follow",
            ok=False,
            write={"success": True},
            verify={"data": {"following": False}},
            note="best-effort verification",
            meta={"batch": 1},
        )

        self.assertFalse(result["ok"])
        self.assertEqual(result["write"], {"success": True})
        self.assertEqual(result["verify"], {"data": {"following": False}})
        self.assertEqual(result["note"], "best-effort verification")
        self.assertEqual(result["meta"], {"batch": 1})

    def test_build_failure_result_wraps_api_error(self) -> None:
        error = ApiError("xgo-openapi", "rate limited", status=429, code="xgo-429")

        result = build_failure_result(action="xgo.following_refresh", error=error, meta={"batch": 2})

        self.assertFalse(result["ok"])
        self.assertEqual(result["action"], "xgo.following_refresh")
        self.assertEqual(result["note"], "xgo-openapi status=429 code=xgo-429: rate limited")
        self.assertEqual(result["meta"]["batch"], 2)
        self.assertEqual(result["meta"]["error"]["service"], "xgo-openapi")
        self.assertEqual(result["meta"]["error"]["status"], 429)
        self.assertEqual(result["meta"]["error"]["code"], "xgo-429")

    def test_run_cli_worker_parses_json_stdout(self) -> None:
        payload = run_cli_worker(
            command=[sys.executable, "-c", "import json; print(json.dumps({'ok': True, 'id': 1}))"],
            action="cli.test",
        )

        self.assertEqual(payload["action"], "cli.test")
        self.assertEqual(payload["items"], [{"ok": True, "id": 1}])
        self.assertEqual(payload["meta"]["returnCode"], 0)

    def test_run_cli_worker_raises_on_non_zero_exit(self) -> None:
        with self.assertRaises(CliWorkerError):
            run_cli_worker(
                command=[sys.executable, "-c", "import sys; sys.stderr.write('boom'); sys.exit(2)"],
                action="cli.fail",
            )

    @unittest.skipIf(shutil.which("node") is None, "node is required for digest worker wrappers")
    def test_xgo_digest_rank_and_render_workers_wrap_node_scripts(self) -> None:
        root = Path(__file__).resolve().parents[1]

        with tempfile.TemporaryDirectory() as tmpdir:
            tmp_path = Path(tmpdir)
            source_path = tmp_path / "source.json"
            ranked_path = tmp_path / "ranked.json"
            render_dir = tmp_path / "rendered"

            source_payload = {
                "lists": [
                    {
                        "id": "LIST_1",
                        "name": "AI",
                        "members": [{"id": "1", "userName": "alice"}],
                    }
                ],
                "followingTweets": [
                    {
                        "id": "T1",
                        "text": "Claude Code launch for AI coding workflows",
                        "url": "https://x.com/alice/status/1",
                        "influenceScore": 100,
                        "author": {"userName": "alice", "name": "Alice", "profileImageUrl": "https://example.com/a.png"},
                    }
                ],
                "recommendationTweets": [
                    {
                        "id": "T2",
                        "text": "New AI launch for agents",
                        "url": "https://x.com/bob/status/2",
                        "influenceScore": 80,
                        "author": {"userName": "bob", "name": "Bob", "profileImageUrl": "https://example.com/b.png"},
                    }
                ],
                "params": {"timeRange": "LAST_24H", "sortType": "influence", "tweetType": "NO_RETWEET", "pageSize": 50, "maxPages": 2},
            }
            source_path.write_text(json.dumps(source_payload), "utf-8")

            rank_result = subprocess.run(
                [
                    sys.executable,
                    str(root / "scripts" / "examples" / "xgo_digest_rank.py"),
                    "--source-data",
                    str(source_path),
                    "--output",
                    str(ranked_path),
                ],
                cwd=root,
                check=True,
                capture_output=True,
                text=True,
            )
            rank_payload = json.loads(rank_result.stdout)
            self.assertTrue(rank_payload["ok"])
            self.assertEqual(rank_payload["action"], "xgo.digest_rank")
            self.assertTrue(ranked_path.exists())

            render_result = subprocess.run(
                [
                    sys.executable,
                    str(root / "scripts" / "examples" / "xgo_digest_render.py"),
                    "--digest-data",
                    str(ranked_path),
                    "--output-dir",
                    str(render_dir),
                ],
                cwd=root,
                check=True,
                capture_output=True,
                text=True,
            )
            render_payload = json.loads(render_result.stdout)
            self.assertTrue(render_payload["ok"])
            self.assertEqual(render_payload["action"], "xgo.digest_render")
            generated_names = {item["name"] for item in render_payload["items"]}
            self.assertEqual(generated_names, {"digest.md", "digest-full.md", "digest.html", "infographic-prompt.txt"})

    def test_skill_runtime_paths_use_plugin_data_when_available(self) -> None:
        paths = skill_runtime_paths(
            "image-gen",
            cwd="/repo",
            home="/home/demo",
            env={"CLAUDE_PLUGIN_DATA": "/stable"},
        )

        self.assertEqual(paths.project_config, Path("/repo/.gino-skills/image-gen/config.json"))
        self.assertEqual(paths.user_config, Path("/home/demo/.gino-skills/image-gen/config.json"))
        self.assertEqual(paths.stable_root, Path("/stable/gino-skills/image-gen"))

    def test_skill_runtime_paths_fall_back_to_repo_data_root(self) -> None:
        paths = skill_runtime_paths(
            "read-deeply",
            cwd="/repo",
            home="/home/demo",
            env={},
        )

        self.assertEqual(paths.stable_root, Path("/repo/.gino-skills/data/read-deeply"))
        self.assertEqual(paths.memory_dir, Path("/repo/.gino-skills/data/read-deeply/memory"))


if __name__ == "__main__":
    unittest.main()
