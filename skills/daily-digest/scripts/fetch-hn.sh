#!/bin/bash
# Fetch Hacker News top stories

OUTPUT_DIR="${1:-./output}"
mkdir -p "$OUTPUT_DIR"

# Fetch HN front page via browser snapshot
# This will be called by the main script

echo "Fetching Hacker News..."
echo "Output: $OUTPUT_DIR/hn-raw.json"

# The actual fetching will be done via browser tool in the main script
# This script is a placeholder for the workflow
