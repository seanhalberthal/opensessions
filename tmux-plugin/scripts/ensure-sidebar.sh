#!/usr/bin/env bash
# Ensure the current window has a sidebar pane.
# Delegates to the server which tracks sidebar visibility state.

PORT="${OPENSESSIONS_PORT:-7391}"
HOST="${OPENSESSIONS_HOST:-127.0.0.1}"

curl -s -o /dev/null -X POST "http://${HOST}:${PORT}/ensure-sidebar"
