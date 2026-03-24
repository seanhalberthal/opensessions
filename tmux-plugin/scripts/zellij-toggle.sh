#!/usr/bin/env bash
# Toggle opensessions TUI sidebar in zellij — left pane, fixed width.
# Mimics the tmux sidebar: Ctrl-a s toggles on/off.

set -euo pipefail

OPENSESSIONS_DIR="${OPENSESSIONS_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"
TUI_DIR="$OPENSESSIONS_DIR/packages/tui"
BUN_PATH="${BUN_PATH:-$(command -v bun 2>/dev/null || echo "$HOME/.bun/bin/bun")}"

# Check if an opensessions pane already exists
EXISTING=$(zellij action list-panes --command 2>/dev/null | grep "index.tsx" | awk '{print $1}' || true)

if [[ -n "$EXISTING" ]]; then
    # Sidebar exists — close it
    zellij action close-pane --pane-id "$EXISTING" 2>/dev/null || true
else
    # Create left pane with the TUI
    zellij action new-pane \
        --direction "Left" \
        --name "opensessions" \
        --close-on-exit \
        --cwd "$TUI_DIR" \
        -- "$BUN_PATH" run src/index.tsx 2>/dev/null

    # Refocus the main (right) pane
    zellij action move-focus "Right" 2>/dev/null || true
fi
