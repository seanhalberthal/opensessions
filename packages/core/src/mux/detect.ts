import type { MuxProvider } from "../contracts/mux";
import { MuxRegistry } from "./registry";

/**
 * Auto-detect the terminal multiplexer from environment variables.
 * Uses the registry to find matching providers.
 *
 * Detection order:
 * 1. $TMUX → provider named "tmux"
 * 2. $ZELLIJ_SESSION_NAME → provider named "zellij"
 *
 * Users can override by passing their own MuxProvider.
 */
export function detectMux(registry?: MuxRegistry): MuxProvider | null {
  if (!registry) return null;

  if (process.env.TMUX) {
    return registry.get("tmux");
  }

  if (process.env.ZELLIJ_SESSION_NAME) {
    return registry.get("zellij");
  }

  return null;
}
