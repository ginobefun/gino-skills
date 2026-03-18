from __future__ import annotations

import json
from typing import Any, Callable, Iterable, Sequence
from urllib import error, parse, request


JsonDict = dict[str, Any]


class ApiError(RuntimeError):
    def __init__(
        self,
        service: str,
        message: str,
        *,
        status: int | None = None,
        code: str | None = None,
        payload: Any = None,
    ) -> None:
        self.service = service
        self.status = status
        self.code = code
        self.payload = payload

        details: list[str] = [service]
        if status is not None:
            details.append(f"status={status}")
        if code:
            details.append(f"code={code}")

        prefix = " ".join(details)
        super().__init__(f"{prefix}: {message}")


class VerificationError(ApiError):
    pass


def _extract_code(payload: Any) -> str | None:
    if not isinstance(payload, dict):
        return None
    for key in ("code", "errcode", "errorCode"):
        value = payload.get(key)
        if value not in (None, ""):
            return str(value)
    return None


def _extract_message(payload: Any, default: str) -> str:
    if isinstance(payload, dict):
        for key in ("message", "errmsg", "error", "detail"):
            value = payload.get(key)
            if isinstance(value, str) and value.strip():
                return value.strip()
    if isinstance(payload, str) and payload.strip():
        return payload.strip()
    return default


def compact_dict(data: dict[str, Any] | None) -> dict[str, Any]:
    if not data:
        return {}
    return {key: value for key, value in data.items() if value is not None}


def request_json(
    method: str,
    url: str,
    *,
    headers: dict[str, str] | None = None,
    payload: Any = None,
    timeout: float = 30.0,
) -> Any:
    body: bytes | None = None
    request_headers = dict(headers or {})

    if payload is not None:
        body = json.dumps(payload).encode("utf-8")
        request_headers.setdefault("Content-Type", "application/json")

    req = request.Request(url=url, data=body, headers=request_headers, method=method.upper())

    try:
        with request.urlopen(req, timeout=timeout) as response:
            raw = response.read().decode("utf-8")
            return json.loads(raw) if raw else None
    except error.HTTPError as exc:
        raw = exc.read().decode("utf-8")
        try:
            parsed = json.loads(raw) if raw else None
        except json.JSONDecodeError:
            parsed = raw
        raise ApiError(
            "http",
            _extract_message(parsed, exc.reason or "HTTP request failed"),
            status=exc.code,
            code=_extract_code(parsed),
            payload=parsed,
        ) from exc
    except error.URLError as exc:
        raise ApiError("http", str(exc.reason or exc), payload=None) from exc


def ensure_success(payload: Any, *, service: str) -> Any:
    if not isinstance(payload, dict) or "success" not in payload:
        return payload

    success = payload.get("success")
    if isinstance(success, str):
        normalized = success.strip().lower()
        if normalized == "true":
            return payload
        if normalized == "false":
            raise ApiError(
                service,
                _extract_message(payload, "API returned success=false"),
                code=_extract_code(payload),
                payload=payload,
            )

    if success is False:
        raise ApiError(
            service,
            _extract_message(payload, "API returned success=false"),
            code=_extract_code(payload),
            payload=payload,
        )

    return payload


def get_path(payload: Any, path: Sequence[str], default: Any = None) -> Any:
    current = payload
    for segment in path:
        if not isinstance(current, dict):
            return default
        current = current.get(segment)
        if current is None:
            return default
    return current


def collect_paginated(
    fetch_page: Callable[[int], Any],
    *,
    extract_items: Callable[[Any], Iterable[Any]],
    extract_total_pages: Callable[[Any], int | None] | None = None,
    start_page: int = 1,
    max_pages: int = 20,
) -> list[Any]:
    if max_pages < 1:
        return []

    items: list[Any] = []
    current_page = start_page
    total_pages: int | None = None

    while current_page < start_page + max_pages:
        payload = fetch_page(current_page)
        page_items = list(extract_items(payload))
        items.extend(page_items)

        if extract_total_pages is not None and total_pages is None:
            total_pages = extract_total_pages(payload)

        if total_pages is not None and current_page >= total_pages:
            break

        if not page_items and total_pages is None:
            break

        current_page += 1

    return items


def ensure_expected_ids(expected_ids: Iterable[str], actual_ids: Iterable[str], *, context: str) -> None:
    expected = list(expected_ids)
    actual = list(actual_ids)
    if expected == actual:
        return

    raise VerificationError(
        "verification",
        f"{context}: expected ids {expected!r}, got {actual!r}",
        payload={"expected_ids": expected, "actual_ids": actual},
    )


def write_and_verify(
    write_call: Callable[[], Any],
    verify_call: Callable[[], Any],
    *,
    service: str,
    action: str,
    verifier: Callable[[Any], bool],
) -> tuple[Any, Any]:
    write_payload = ensure_success(write_call(), service=service)
    verify_payload = ensure_success(verify_call(), service=service)

    if not verifier(verify_payload):
        raise VerificationError(
            service,
            f"{action}: write call succeeded but verification check failed",
            payload={"write": write_payload, "verify": verify_payload},
        )

    return write_payload, verify_payload


class JsonApiClient:
    def __init__(
        self,
        *,
        service: str,
        base_url: str,
        default_headers: dict[str, str] | None = None,
        timeout: float = 30.0,
    ) -> None:
        self.service = service
        self.base_url = base_url.rstrip("/")
        self.default_headers = default_headers or {}
        self.timeout = timeout

    def _url(self, path: str, params: dict[str, Any] | None = None) -> str:
        url = f"{self.base_url}{path}"
        query = compact_dict(params)
        if query:
            return f"{url}?{parse.urlencode(query)}"
        return url

    def get_json(self, path: str, *, params: dict[str, Any] | None = None, headers: dict[str, str] | None = None) -> Any:
        payload = request_json(
            "GET",
            self._url(path, params),
            headers={**self.default_headers, **(headers or {})},
            timeout=self.timeout,
        )
        return ensure_success(payload, service=self.service)

    def post_json(self, path: str, payload: Any, *, headers: dict[str, str] | None = None) -> Any:
        response = request_json(
            "POST",
            self._url(path),
            headers={**self.default_headers, **(headers or {})},
            payload=payload,
            timeout=self.timeout,
        )
        return ensure_success(response, service=self.service)
