from __future__ import annotations

import json
import os
from typing import Any

from scripts.shared.api_common import JsonApiClient, collect_paginated, compact_dict, get_path, write_and_verify


XGO_API_BASE_URL = "https://api.xgo.ing"


def _require_api_key() -> str:
    value = os.getenv("XGO_API_KEY", "").strip()
    if not value:
        raise RuntimeError("Missing required environment variable: XGO_API_KEY")
    return value


class XGoClient(JsonApiClient):
    def __init__(self, *, api_key: str | None = None, timeout: float = 30.0) -> None:
        key = api_key or _require_api_key()
        super().__init__(
            service="xgo-openapi",
            base_url=XGO_API_BASE_URL,
            default_headers={"X-API-KEY": key, "Content-Type": "application/json"},
            timeout=timeout,
        )

    def list_tweets(self, payload: dict[str, Any], *, max_pages: int = 10) -> list[dict[str, Any]]:
        base_payload = compact_dict(payload)
        start_page = int(base_payload.get("currentPage", 1))

        return collect_paginated(
            lambda page: self.post_json("/openapi/v1/tweet/list", {**base_payload, "currentPage": page}),
            extract_items=lambda body: get_path(body, ("data", "data"), []),
            extract_total_pages=lambda body: get_path(body, ("data", "totalPage")),
            start_page=start_page,
            max_pages=max_pages,
        )

    def list_followings(self, *, page_size: int = 100, max_pages: int = 10) -> list[dict[str, Any]]:
        return collect_paginated(
            lambda page: self.get_json("/openapi/v1/following/list", params={"page": page, "size": page_size}),
            extract_items=lambda body: get_path(body, ("data", "data"), []),
            extract_total_pages=lambda body: get_path(body, ("data", "totalPage")),
            start_page=1,
            max_pages=max_pages,
        )

    def list_all_lists(self) -> list[dict[str, Any]]:
        body = self.get_json("/openapi/v1/list/all")
        return list(get_path(body, ("data",), []))

    def list_all_folders(self) -> list[dict[str, Any]]:
        body = self.get_folder_all()
        return list(get_path(body, ("data",), []))

    def search_tweets(self, query: str, *, query_type: str = "Top", max_results: int = 30) -> Any:
        return self.post_json(
            "/openapi/v1/tweet/search",
            {"query": query, "queryType": query_type, "maxResults": max_results},
        )

    def get_user_info(self, user_name: str) -> Any:
        return self.get_json("/openapi/v1/user/info", params={"userName": user_name})

    def get_user_details(
        self,
        *,
        user_id: str | None = None,
        feed_id: str | None = None,
        user_name: str | None = None,
    ) -> Any:
        return self.get_json(
            "/openapi/v1/user/details",
            params=compact_dict({"userId": user_id, "feedId": feed_id, "userName": user_name}),
        )

    def get_latest_tweets(self, user_name: str, *, max_pages: int = 3) -> Any:
        return self.get_json(
            "/openapi/v1/tweet/latest",
            params={"userName": user_name, "maxPages": max_pages},
        )

    def get_following_stats(self) -> Any:
        return self.get_json("/openapi/v1/following/stats")

    def refresh_followings(self) -> Any:
        return self.post_json("/openapi/v1/following/refresh", {})

    def get_following_tags(self) -> Any:
        return self.get_json("/openapi/v1/following/tags")

    def get_following_suggestions(self, *, unfollow: bool = False) -> Any:
        path = "/openapi/v1/following/suggest-unfollow" if unfollow else "/openapi/v1/following/suggest-follow"
        return self.get_json(path)

    def get_following_status(self, user_name: str) -> Any:
        return self.get_json("/openapi/v1/following/status", params={"targetUserName": user_name})

    def get_folder_all(self) -> Any:
        return self.get_json("/openapi/v1/folder/all")

    def save_folder(self, payload: dict[str, Any]) -> Any:
        return self.post_json("/openapi/v1/folder/save", compact_dict(payload))

    def collect_bookmark(self, payload: dict[str, Any]) -> Any:
        return self.post_json("/openapi/v1/folder/collect", payload)

    def remove_bookmark(self, payload: dict[str, Any]) -> Any:
        return self.post_json("/openapi/v1/folder/remove", payload)

    def get_list_detail(self, list_id: str) -> Any:
        return self.get_json("/openapi/v1/list/get", params={"listId": list_id})

    def save_list(self, payload: dict[str, Any]) -> Any:
        return self.post_json("/openapi/v1/list/save", compact_dict(payload))

    def add_list_member(self, payload: dict[str, Any]) -> Any:
        return self.post_json("/openapi/v1/list/addMember", payload)

    def remove_list_member(self, payload: dict[str, Any]) -> Any:
        return self.post_json("/openapi/v1/list/removeMember", payload)

    def follow_user(self, user_name: str) -> Any:
        return self.post_json(f"/openapi/v1/following/follow?targetUserName={user_name}", {})

    def unfollow_user(self, user_name: str) -> Any:
        return self.post_json(f"/openapi/v1/following/unfollow?targetUserName={user_name}", {})


def verify_follow_action(client: XGoClient, *, user_name: str, follow: bool) -> tuple[Any, Any]:
    action = "follow" if follow else "unfollow"
    write_call = lambda: client.follow_user(user_name) if follow else client.unfollow_user(user_name)
    return write_and_verify(
        write_call,
        lambda: client.get_following_status(user_name),
        service="xgo-openapi",
        action=action,
        verifier=lambda body: bool(get_path(body, ("data", "following"))) is follow,
    )


def verify_list_member_action(
    client: XGoClient,
    *,
    list_id: str,
    member_id: str,
    payload: dict[str, Any],
    add: bool,
) -> tuple[Any, Any]:
    action = "addMember" if add else "removeMember"
    write_call = lambda: client.add_list_member(payload) if add else client.remove_list_member(payload)
    return write_and_verify(
        write_call,
        lambda: client.get_list_detail(list_id),
        service="xgo-openapi",
        action=action,
        verifier=lambda body: (
            any(str(member.get("id")) == str(member_id) for member in get_path(body, ("data", "members"), []))
            if add
            else all(str(member.get("id")) != str(member_id) for member in get_path(body, ("data", "members"), []))
        ),
    )


def verify_bookmark_action(
    client: XGoClient,
    *,
    folder_id: str | None,
    tweet_id: str,
    payload: dict[str, Any],
    collect: bool,
) -> tuple[Any, Any]:
    action = "collectBookmark" if collect else "removeBookmark"
    write_call = lambda: client.collect_bookmark(payload) if collect else client.remove_bookmark(payload)

    def verify_call() -> Any:
        query = {"queryType": "bookmark", "sortType": "recent", "currentPage": 1, "pageSize": 100}
        if folder_id:
            query["folderId"] = folder_id
        return {"success": True, "data": {"tweets": client.list_tweets(query, max_pages=2)}}

    return write_and_verify(
        write_call,
        verify_call,
        service="xgo-openapi",
        action=action,
        verifier=lambda body: (
            any(str(tweet.get("id")) == str(tweet_id) for tweet in get_path(body, ("data", "tweets"), []))
            if collect
            else all(str(tweet.get("id")) != str(tweet_id) for tweet in get_path(body, ("data", "tweets"), []))
        ),
    )


def verify_saved_list(
    client: XGoClient,
    *,
    payload: dict[str, Any],
) -> tuple[Any, Any]:
    def verify_call() -> Any:
        list_id = payload.get("id")
        if list_id:
            return client.get_list_detail(str(list_id))
        return client.get_json("/openapi/v1/list/all")

    return write_and_verify(
        lambda: client.save_list(payload),
        verify_call,
        service="xgo-openapi",
        action="saveList",
        verifier=lambda body: (
            payload.get("name") in json.dumps(body, ensure_ascii=False)
            if payload.get("name")
            else True
        ),
    )


def verify_saved_folder(
    client: XGoClient,
    *,
    payload: dict[str, Any],
) -> tuple[Any, Any]:
    return write_and_verify(
        lambda: client.save_folder(payload),
        lambda: client.get_folder_all(),
        service="xgo-openapi",
        action="saveFolder",
        verifier=lambda body: (
            payload.get("name") in json.dumps(body, ensure_ascii=False)
            if payload.get("name")
            else True
        ),
    )
