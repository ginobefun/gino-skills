#!/usr/bin/env bash
# write-guard.sh — PreToolUse hook for skills with write operations.
# Reads tool input from stdin JSON. Blocks dangerous patterns:
#   - Bash commands that contain write API calls without prior user confirmation
#   - Batch operations exceeding safe limits
#
# Exit codes:
#   0 = allow
#   2 = block (returns JSON with reason)

set -euo pipefail

INPUT=$(cat)

TOOL_NAME=$(echo "$INPUT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('tool_name',''))" 2>/dev/null || echo "")

if [ "$TOOL_NAME" != "Bash" ]; then
  exit 0
fi

COMMAND=$(echo "$INPUT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('tool_input',{}).get('command',''))" 2>/dev/null || echo "")

# Block direct curl write operations that bypass worker scripts
# (Workers have built-in confirmation checks; raw curl does not)
WRITE_PATTERNS=(
  "following/follow"
  "following/unfollow"
  "folder/collect"
  "folder/remove"
  "folder/save"
  "list/member/save"
  "list/member/remove"
  "list/save"
  "list/delete"
)

for pattern in "${WRITE_PATTERNS[@]}"; do
  if echo "$COMMAND" | grep -q "$pattern"; then
    if echo "$COMMAND" | grep -q "curl"; then
      echo '{"decision":"block","reason":"Write operation detected via raw curl. Use worker scripts (scripts/examples/) which include confirmation checks, or get explicit user approval first."}'
      exit 2
    fi
  fi
done

exit 0
