#!/usr/bin/env bash
# skill-usage-tracker.sh — PostToolUse hook for tracking skill invocations.
# Appends a log entry each time a skill is invoked.
#
# Log format: YYYY-MM-DDTHH:MM:SS | skill_name | session_id
# Log location: ${CLAUDE_PLUGIN_DATA}/gino-skills/logs/skill-usage.log
#               or ~/.gino-skills/logs/skill-usage.log as fallback

set -euo pipefail

INPUT=$(cat)

TOOL_NAME=$(echo "$INPUT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('tool_name',''))" 2>/dev/null || echo "")

# Only track Skill tool invocations
if [ "$TOOL_NAME" != "Skill" ]; then
  exit 0
fi

SKILL_NAME=$(echo "$INPUT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('tool_input',{}).get('skill',''))" 2>/dev/null || echo "unknown")
SESSION_ID="${CLAUDE_SESSION_ID:-unknown}"

# Determine log directory
LOG_DIR="${CLAUDE_PLUGIN_DATA:-$HOME/.gino-skills}/logs"
mkdir -p "$LOG_DIR"

LOG_FILE="$LOG_DIR/skill-usage.log"

TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%S")
echo "$TIMESTAMP | $SKILL_NAME | $SESSION_ID" >> "$LOG_FILE"

exit 0
