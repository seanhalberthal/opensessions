#!/usr/bin/env bash
# opensessions.tmux — TPM entry point
# Registers keybindings and bootstraps the TUI if needed.
#
# Install:
#   1. Add to .tmux.conf:  set -g @plugin 'palanikannan1437/opensessions'
#   2. Press prefix + I to install
#   3. Requires: bun (https://bun.sh)
#
# Options (set before TPM init):
#   @opensessions-key       "s"    — prefix + key to toggle sidebar
#   @opensessions-width     "26"   — sidebar width in columns

CURRENT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPTS_DIR="$CURRENT_DIR/tmux-plugin/scripts"

# --- Read user options with defaults ---

get_option() {
  local option="$1"
  local default="$2"
  local value
  value=$(tmux show-option -gqv "$option" 2>/dev/null)
  echo "${value:-$default}"
}

KEY=$(get_option "@opensessions-key" "s")
WIDTH=$(get_option "@opensessions-width" "26")

# Export so scripts can read them
tmux set-environment -g OPENSESSIONS_DIR "$CURRENT_DIR"
tmux set-environment -g OPENSESSIONS_WIDTH "$WIDTH"

# --- Bootstrap: install deps if needed ---
if [ ! -d "$CURRENT_DIR/packages/tui/node_modules" ]; then
  BUN_PATH="$(command -v bun 2>/dev/null || echo "$HOME/.bun/bin/bun")"
  if [ -x "$BUN_PATH" ]; then
    (cd "$CURRENT_DIR" && "$BUN_PATH" install --frozen-lockfile 2>/tmp/opensessions-install.log) &
  fi
fi

# --- Bind prefix + KEY to toggle via server ---
tmux bind-key "$KEY" run-shell "$SCRIPTS_DIR/toggle.sh"
