#!/usr/bin/env python3
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from scripts.shared.xgo_client import XGoClient, verify_bookmark_action
from scripts.shared.example_output import ExampleArgumentParser, print_failure, print_result


def parse_args() -> object:
    parser = ExampleArgumentParser(description="Collect or remove a bookmark with read-after-write verification.")
    parser.add_argument("--action", choices=["collect", "remove"], required=True)
    parser.add_argument("--tweet-id", required=True)
    parser.add_argument("--folder-id", default=None)
    parser.add_argument("--author-id", default=None)
    return parser.parse_args()


def main() -> int:
    try:
        args = parse_args()
        action = f"xgo.bookmark_{args.action}"
        client = XGoClient()
        if args.action == "collect":
            payload = {
                "folderId": args.folder_id,
                "tweet": {
                    "tweetId": args.tweet_id,
                    "authorId": args.author_id,
                },
            }
        else:
            payload = {
                "folderId": args.folder_id,
                "tweetId": args.tweet_id,
            }

        write_payload, verify_payload = verify_bookmark_action(
            client,
            folder_id=args.folder_id,
            tweet_id=args.tweet_id,
            payload=payload,
            collect=args.action == "collect",
        )
        print_result(
            action=action,
            items=[{"tweetId": args.tweet_id, "folderId": args.folder_id}],
            write=write_payload,
            verify=verify_payload,
        )
        return 0
    except Exception as exc:
        current_args = locals().get("args", None)
        action = f"xgo.bookmark_{getattr(current_args, 'action', 'unknown')}"
        print_failure(
            action=action,
            error=exc,
            items=[{"tweetId": getattr(current_args, "tweet_id", None), "folderId": getattr(current_args, "folder_id", None)}],
        )
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
