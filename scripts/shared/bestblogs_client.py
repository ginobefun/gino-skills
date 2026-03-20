from __future__ import annotations

import json
import os
from typing import Any

from scripts.shared.api_common import JsonApiClient, collect_paginated, compact_dict, get_path, write_and_verify


BESTBLOGS_API_BASE_URL = "https://api.bestblogs.dev"


def _require_env(name: str) -> str:
    value = os.getenv(name, "").strip()
    if not value:
        raise RuntimeError(f"Missing required environment variable: {name}")
    return value


class BestBlogsOpenClient(JsonApiClient):
    def __init__(self, *, api_key: str | None = None, timeout: float = 30.0) -> None:
        key = api_key or _require_env("BESTBLOGS_API_KEY")
        super().__init__(
            service="bestblogs-openapi",
            base_url=BESTBLOGS_API_BASE_URL,
            default_headers={"X-API-KEY": key, "Content-Type": "application/json"},
            timeout=timeout,
        )

    def list_resources(self, payload: dict[str, Any], *, max_pages: int = 10) -> list[dict[str, Any]]:
        base_payload = compact_dict(payload)
        start_page = int(base_payload.get("currentPage", 1))

        return collect_paginated(
            lambda page: self.post_json("/openapi/v1/resource/list", {**base_payload, "currentPage": page}),
            extract_items=lambda body: get_path(body, ("data", "dataList"), []),
            extract_total_pages=lambda body: get_path(body, ("data", "pageCount")),
            start_page=start_page,
            max_pages=max_pages,
        )

    def list_tweets(self, payload: dict[str, Any], *, max_pages: int = 10) -> list[dict[str, Any]]:
        base_payload = compact_dict(payload)
        start_page = int(base_payload.get("currentPage", 1))

        return collect_paginated(
            lambda page: self.post_json("/openapi/v1/tweet/list", {**base_payload, "currentPage": page}),
            extract_items=lambda body: get_path(body, ("data", "dataList"), []),
            extract_total_pages=lambda body: get_path(body, ("data", "pageCount")),
            start_page=start_page,
            max_pages=max_pages,
        )

    def get_resource_markdown(self, resource_id: str) -> Any:
        return self.get_json("/openapi/v1/resource/markdown", params={"id": resource_id})

    def get_resource_meta(self, resource_id: str) -> Any:
        return self.get_json("/openapi/v1/resource/meta", params={"id": resource_id})

    def list_newsletters(self, payload: dict[str, Any]) -> Any:
        return self.post_json("/openapi/v1/newsletter/list", compact_dict(payload))

    def get_newsletter_detail(self, newsletter_id: str, *, language: str = "zh_CN") -> Any:
        return self.get_json("/openapi/v1/newsletter/get", params={"id": newsletter_id, "language": language})

    def get_dify_resource_markdown(self, resource_id: str, *, language: str = "zh") -> Any:
        return self.get_json("/dify/resource/markdown", params={"id": resource_id, "language": language})

    def list_sources(self, payload: dict[str, Any]) -> Any:
        return self.post_json("/openapi/v1/source/list", compact_dict(payload))


class BestBlogsAdminClient(JsonApiClient):
    def __init__(
        self,
        *,
        user_id: str | None = None,
        jwt_token: str | None = None,
        timeout: float = 30.0,
    ) -> None:
        admin_user_id = user_id or _require_env("BESTBLOGS_ADMIN_USER_ID")
        token = jwt_token or _require_env("BESTBLOGS_ADMIN_JWT_TOKEN")
        super().__init__(
            service="bestblogs-admin",
            base_url=BESTBLOGS_API_BASE_URL,
            default_headers={
                "Authorization": f"Bearer {token}",
                "User-Id": admin_user_id,
                "Content-Type": "application/json",
            },
            timeout=timeout,
        )

    def list_articles(self, payload: dict[str, Any], *, max_pages: int = 10) -> list[dict[str, Any]]:
        base_payload = compact_dict(payload)
        start_page = int(base_payload.get("currentPage", 1))

        return collect_paginated(
            lambda page: self.post_json("/api/admin/article/list", {**base_payload, "currentPage": page}),
            extract_items=lambda body: get_path(body, ("data", "dataList"), []),
            extract_total_pages=lambda body: get_path(body, ("data", "pageCount")),
            start_page=start_page,
            max_pages=max_pages,
        )

    def save_analysis_result(self, resource_id: str, payload: dict[str, Any]) -> Any:
        return self.post_json(f"/api/admin/article/saveAnalysisResult?id={resource_id}", payload)

    def save_translate_result(self, resource_id: str, payload: dict[str, Any]) -> Any:
        return self.post_json(f"/api/admin/article/saveTranslateResult?id={resource_id}", payload)

    def save_podcast_content(self, resource_id: str, payload: dict[str, Any]) -> Any:
        return self.post_json(f"/api/admin/article/savePodcastContent?id={resource_id}", payload)

    def update_content(self, resource_id: str, *, markdown_content: str) -> Any:
        return self.post_json("/api/admin/article/updateContent", {"id": resource_id, "markdownContent": markdown_content})

    def get_podcast_content(self, resource_id: str) -> Any:
        return self.get_json("/api/admin/article/podcast/content", params={"id": resource_id})

    def update_featured_reason(self, resource_id: str, *, zh_text: str, en_text: str) -> Any:
        return self.post_json(
            "/api/admin/article/updateFeaturedReason",
            {"id": resource_id, "zhFeaturedReason": zh_text, "enFeaturedReason": en_text},
        )

    def mark_not_qualified(self, resource_id: str, *, adjust_score: int) -> Any:
        return self.post_json(
            f"/api/admin/article/markNotQualified?id={resource_id}&adjustScore={adjust_score}",
            {},
        )

    def add_rss_url(self, rss_url: str) -> Any:
        return self.post_json("/api/admin/source/addRssUrl", {"rssUrl": rss_url})

    def save_tweet_analysis_result(self, source_id: str, results: list[dict[str, Any]]) -> Any:
        return self.post_json("/api/admin/article/saveTweetAnalysisResult", {"sourceId": source_id, "results": results})


def parse_analysis_result(payload: Any) -> dict[str, Any]:
    raw = get_path(payload, ("analysisResult",))
    if isinstance(raw, str) and raw.strip():
        return json.loads(raw)
    if isinstance(raw, dict):
        return raw
    return {}


def verify_saved_analysis(
    admin_client: BestBlogsAdminClient,
    open_client: BestBlogsOpenClient,
    *,
    resource_id: str,
    payload: dict[str, Any],
    language: str = "zh",
) -> tuple[Any, Any]:
    expected_summary = payload.get("summary")
    expected_score = payload.get("score")
    expected_tags = payload.get("tags") or []

    return write_and_verify(
        lambda: admin_client.save_analysis_result(resource_id, payload),
        lambda: open_client.get_dify_resource_markdown(resource_id, language=language),
        service="bestblogs-admin",
        action="saveAnalysisResult",
        verifier=lambda body: (
            (
                not expected_summary
                or parse_analysis_result(body).get("summary") == expected_summary
            )
            and (
                expected_score is None
                or get_path(body, ("totalScore",), expected_score) == expected_score
            )
            and (
                not expected_tags
                or parse_analysis_result(body).get("tags") == expected_tags
            )
        ),
    )


def verify_saved_podcast_content(
    admin_client: BestBlogsAdminClient,
    *,
    resource_id: str,
    payload: dict[str, Any],
) -> tuple[Any, Any]:
    expected_summary = payload.get("podCastSummary")

    return write_and_verify(
        lambda: admin_client.save_podcast_content(resource_id, payload),
        lambda: admin_client.get_podcast_content(resource_id),
        service="bestblogs-admin",
        action="savePodcastContent",
        verifier=lambda body: (
            get_path(body, ("data", "podCastSummary")) == expected_summary
            if expected_summary is not None
            else bool(get_path(body, ("data",)))
        ),
    )


def verify_updated_content(
    admin_client: BestBlogsAdminClient,
    open_client: BestBlogsOpenClient,
    *,
    resource_id: str,
    markdown_content: str,
    language: str = "zh",
) -> tuple[Any, Any]:
    excerpt = markdown_content.strip()[:120]

    return write_and_verify(
        lambda: admin_client.update_content(resource_id, markdown_content=markdown_content),
        lambda: open_client.get_dify_resource_markdown(resource_id, language=language),
        service="bestblogs-admin",
        action="updateContent",
        verifier=lambda body: (not excerpt) or excerpt in json.dumps(body, ensure_ascii=False),
    )


def verify_added_rss_url(
    admin_client: BestBlogsAdminClient,
    open_client: BestBlogsOpenClient,
    *,
    rss_url: str,
) -> tuple[Any, Any]:
    return write_and_verify(
        lambda: admin_client.add_rss_url(rss_url),
        lambda: open_client.list_sources({"currentPage": 1, "pageSize": 100}),
        service="bestblogs-admin",
        action="addRssUrl",
        verifier=lambda body: rss_url in json.dumps(body, ensure_ascii=False),
    )
