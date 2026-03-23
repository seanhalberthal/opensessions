# PLUGINS.md — Creating & Publishing Plugins

opensessions uses a factory-based plugin system inspired by [pi-mono](https://github.com/badlogic/pi-mono). A plugin is a TypeScript file that exports a single default function.

## Plugin Contract

Every plugin exports one function:

```typescript
import type { PluginAPI } from "@opensessions/core";

export default function (api: PluginAPI) {
  // Register a mux provider, or do other setup
}
```

The `PluginAPI` gives you:

| Method / Property | Description |
|---|---|
| `api.registerMux(provider)` | Register a `MuxProvider` implementation |
| `api.serverPort` | The server port (default: `7391`) |
| `api.serverHost` | The server host (default: `127.0.0.1`) |

---

## How Plugins Are Discovered

opensessions loads plugins in order:

1. **Builtins** — `TmuxProvider` is always registered
2. **Local plugins** — `~/.config/opensessions/plugins/*.ts` (scanned one level deep)
3. **npm packages** — listed in `~/.config/opensessions/config.json` under `"plugins"`

### Local Plugin Directory

Drop a `.ts` or `.js` file into `~/.config/opensessions/plugins/`:

```
~/.config/opensessions/
├── config.json
└── plugins/
    ├── my-zellij.ts          ← loaded directly
    └── my-custom-mux/
        └── index.ts          ← loaded as entry point
```

### npm Packages

Add package names to your config:

```json
{
  "plugins": ["opensessions-mux-zellij", "opensessions-mux-screen"]
}
```

These are loaded via `require()` — install them first with `bun add -g <package>`.

---

## Config File

`~/.config/opensessions/config.json`

```json
{
  "mux": "tmux",
  "plugins": [],
  "port": 7391
}
```

| Field | Type | Description |
|---|---|---|
| `mux` | `string?` | Override auto-detect. Use a registered provider name. |
| `plugins` | `string[]` | npm package names to load |
| `port` | `number?` | Custom server port (default: `7391`) |

If `mux` is omitted, opensessions auto-detects from environment:
- `$TMUX` → tmux
- `$ZELLIJ_SESSION_NAME` → zellij (if a provider is registered)

---

## Creating a Mux Provider Plugin

### 1. Scaffold

```bash
mkdir opensessions-mux-zellij && cd opensessions-mux-zellij
bun init
bun add @opensessions/core
```

### 2. Implement

```typescript
// index.ts
import type { PluginAPI, MuxProvider, MuxSessionInfo } from "@opensessions/core";

class ZellijProvider implements MuxProvider {
  readonly name = "zellij";

  listSessions(): MuxSessionInfo[] {
    const result = Bun.spawnSync(["zellij", "list-sessions", "-s"], {
      stdout: "pipe", stderr: "pipe",
    });
    const raw = result.stdout.toString().trim();
    if (!raw) return [];
    return raw.split("\n").map((name) => ({
      name: name.trim(),
      createdAt: 0,
      dir: "",
      windows: 1,
    }));
  }

  switchSession(name: string): void {
    Bun.spawnSync(["zellij", "attach", name]);
  }

  getCurrentSession(): string | null {
    return process.env.ZELLIJ_SESSION_NAME ?? null;
  }

  getSessionDir(_name: string): string {
    return process.cwd();
  }

  getPaneCount(_name: string): number {
    return 1;
  }

  getClientTty(): string {
    return "";
  }

  setupHooks(serverHost: string, serverPort: number): void {
    // Set up zellij event hooks that POST to the server
  }

  cleanupHooks(): void {
    // Remove hooks
  }
}

export default function (api: PluginAPI) {
  api.registerMux(new ZellijProvider());
}
```

### 3. Configure `package.json`

```json
{
  "name": "opensessions-mux-zellij",
  "version": "1.0.0",
  "type": "module",
  "main": "index.ts",
  "opensessions": {
    "type": "mux-provider"
  },
  "peerDependencies": {
    "@opensessions/core": ">=0.1.0"
  }
}
```

### 4. Test locally

Drop it in your plugins directory:

```bash
# Symlink for development
ln -s $(pwd) ~/.config/opensessions/plugins/opensessions-mux-zellij
```

Or add to config:

```json
{
  "plugins": ["./path/to/opensessions-mux-zellij"]
}
```

### 5. Publish

```bash
npm publish
# Users install with:
bun add -g opensessions-mux-zellij
```

Then add to their config:

```json
{
  "mux": "zellij",
  "plugins": ["opensessions-mux-zellij"]
}
```

---

## Naming Conventions

| Type | Pattern | Example |
|---|---|---|
| Mux provider | `opensessions-mux-<name>` | `opensessions-mux-zellij` |
| Agent bridge | `opensessions-agent-<name>` | `opensessions-agent-aider` |
| Theme | `opensessions-theme-<name>` | `opensessions-theme-nord` |

---

## Setup Guide

### tmux + opensessions

opensessions works with tmux out of the box — no plugin needed:

```bash
# Inside a tmux session:
cd opensessions && bun install
cd packages/tui && bun run start
```

The server auto-detects tmux from the `$TMUX` environment variable, registers session hooks via `tmux set-hook`, and starts broadcasting state over WebSocket.

### Connecting an AI Agent

Agents report status by POSTing JSON to the server. No code changes to opensessions needed.

#### Amp

Copy the plugin to your Amp config:

```bash
cp examples/amp-plugin.ts ~/.config/amp/plugins/opensessions.ts
```

Or create `~/.config/amp/plugins/opensessions.ts`:

```typescript
import type { PluginAPI } from "@ampcode/plugin";
import { appendFileSync } from "fs";

const SERVER_URL = "http://127.0.0.1:7391/event";
const EVENTS_FILE = "/tmp/opensessions-events.jsonl";

async function getTmuxSession($: PluginAPI["$"]): Promise<string> {
  try {
    const result = await $`tmux display-message -p '#S'`;
    return result.stdout.trim();
  } catch {
    return "unknown";
  }
}

async function writeEvent(agent: string, session: string, status: string): Promise<void> {
  const payload = JSON.stringify({ agent, session, status, ts: Date.now() });
  try {
    await fetch(SERVER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
    });
  } catch {
    try { appendFileSync(EVENTS_FILE, payload + "\n"); } catch {}
  }
}

export default function (amp: PluginAPI) {
  let sessionName: string | null = null;

  getTmuxSession(amp.$).then((name) => {
    sessionName = name;
  });

  amp.on("agent.start", async (_event, _ctx) => {
    if (!sessionName) sessionName = await getTmuxSession(amp.$);
    await writeEvent("amp", sessionName, "running");
    return {};
  });

  amp.on("agent.end", async (event, _ctx) => {
    if (!sessionName) sessionName = await getTmuxSession(amp.$);
    await writeEvent("amp", sessionName, event.status);
    return undefined;
  });

  amp.on("tool.call", async (_event, _ctx) => {
    if (sessionName) await writeEvent("amp", sessionName, "running");
    return { action: "allow" };
  });
}
```

#### Claude Code

Add hooks to `~/.claude/settings.json`. See [CONTRACTS.md](./CONTRACTS.md#claude-code-hooks).

#### Any Agent (curl)

```bash
curl -s -X POST http://127.0.0.1:7391/event \
  -H 'Content-Type: application/json' \
  -d '{"agent":"my-agent","session":"'"$(tmux display-message -p '#S')"'","status":"running","ts":'"$(date +%s000)"'}'
```

See [CONTRACTS.md](./CONTRACTS.md) for full examples.
