import { startServer } from "./index";
import { PluginLoader } from "../plugins/loader";
import { loadConfig } from "../config";
import { join } from "path";

const config = loadConfig();
const loader = new PluginLoader();

// 1. Load the tmux plugin (built-in mux provider, lives outside core)
try {
  const tmuxPlugin = require("@opensessions/tmux");
  const factory = typeof tmuxPlugin.default === "function" ? tmuxPlugin.default : tmuxPlugin;
  factory({ registerMux: (p: any) => loader.registerMux(p), serverPort: 7391, serverHost: "127.0.0.1" });
} catch {
  // tmux plugin not installed — other mux plugins may provide coverage
}

// 2. Load local plugins from ~/.config/opensessions/plugins/
const home = process.env.HOME ?? process.env.USERPROFILE ?? "";
const pluginDir = join(home, ".config", "opensessions", "plugins");
const localPlugins = loader.loadDir(pluginDir);
if (localPlugins.length > 0) {
  console.log(`Loaded local plugins: ${localPlugins.join(", ")}`);
}

// 3. Load npm packages from config
if (config.plugins.length > 0) {
  const npmPlugins = loader.loadPackages(config.plugins);
  if (npmPlugins.length > 0) {
    console.log(`Loaded npm plugins: ${npmPlugins.join(", ")}`);
  }
}

// 4. Resolve mux provider (config override → env auto-detect)
const mux = loader.resolve(config.mux);
if (!mux) {
  console.error(
    "No terminal multiplexer detected.\n" +
    `Registered providers: ${loader.registry.list().join(", ") || "(none)"}\n` +
    "Are you running inside tmux or zellij?\n" +
    "Set 'mux' in ~/.config/opensessions/config.json to override.",
  );
  process.exit(1);
}

console.log(`Using mux provider: ${mux.name}`);
startServer(mux);
