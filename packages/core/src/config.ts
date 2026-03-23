import { existsSync, readFileSync } from "fs";
import { join } from "path";

export interface OpensessionsConfig {
  /** Explicit mux provider name (overrides auto-detect) */
  mux?: string;
  /** Custom server port */
  port?: number;
  /** Community plugin package names to load (e.g. ["opensessions-mux-zellij"]) */
  plugins: string[];
}

const DEFAULTS: OpensessionsConfig = {
  plugins: [],
};

/**
 * Load config from ~/.config/opensessions/config.json
 * @param homeDir — override home directory (for testing)
 */
export function loadConfig(homeDir?: string): OpensessionsConfig {
  const home = homeDir ?? process.env.HOME ?? process.env.USERPROFILE ?? "";
  const configPath = join(home, ".config", "opensessions", "config.json");

  if (!existsSync(configPath)) {
    return { ...DEFAULTS };
  }

  try {
    const raw = readFileSync(configPath, "utf-8");
    const parsed = JSON.parse(raw) as Partial<OpensessionsConfig>;
    return {
      ...DEFAULTS,
      ...parsed,
      plugins: parsed.plugins ?? DEFAULTS.plugins,
    };
  } catch {
    return { ...DEFAULTS };
  }
}
