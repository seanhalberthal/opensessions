import { describe, test, expect, beforeEach } from "bun:test";
import { loadConfig, type OpensessionsConfig } from "../src/config";
import { resolve, join } from "path";

describe("Config", () => {
  test("loadConfig returns defaults when no config file exists", () => {
    const config = loadConfig("/tmp/nonexistent-dir-" + Date.now());
    expect(config.mux).toBeUndefined();
    expect(config.port).toBeUndefined();
    expect(config.plugins).toEqual([]);
  });

  test("loadConfig reads from config file", async () => {
    const tmpDir = `/tmp/opensessions-test-${Date.now()}`;
    const configDir = join(tmpDir, ".config", "opensessions");
    await Bun.write(
      join(configDir, "config.json"),
      JSON.stringify({ mux: "zellij", plugins: ["opensessions-mux-zellij"] }),
    );

    const config = loadConfig(tmpDir);
    expect(config.mux).toBe("zellij");
    expect(config.plugins).toEqual(["opensessions-mux-zellij"]);

    // Cleanup
    const { rmSync } = require("fs");
    rmSync(tmpDir, { recursive: true, force: true });
  });

  test("loadConfig merges defaults for missing fields", async () => {
    const tmpDir = `/tmp/opensessions-test-${Date.now()}`;
    const configDir = join(tmpDir, ".config", "opensessions");
    await Bun.write(
      join(configDir, "config.json"),
      JSON.stringify({ mux: "tmux" }),
    );

    const config = loadConfig(tmpDir);
    expect(config.mux).toBe("tmux");
    expect(config.plugins).toEqual([]);

    const { rmSync } = require("fs");
    rmSync(tmpDir, { recursive: true, force: true });
  });
});
