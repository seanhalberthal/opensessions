import { describe, test, expect } from "bun:test";
import { TmuxProvider } from "../src/provider";
import type { MuxProvider } from "@opensessions/core";

describe("TmuxProvider", () => {
  test("implements MuxProvider interface", () => {
    const provider: MuxProvider = new TmuxProvider();
    expect(provider.name).toBe("tmux");
    expect(typeof provider.listSessions).toBe("function");
    expect(typeof provider.switchSession).toBe("function");
    expect(typeof provider.getCurrentSession).toBe("function");
    expect(typeof provider.getSessionDir).toBe("function");
    expect(typeof provider.getPaneCount).toBe("function");
    expect(typeof provider.getClientTty).toBe("function");
    expect(typeof provider.createSession).toBe("function");
    expect(typeof provider.killSession).toBe("function");
    expect(typeof provider.setupHooks).toBe("function");
    expect(typeof provider.cleanupHooks).toBe("function");
  });

  test("listSessions returns MuxSessionInfo array", () => {
    const provider = new TmuxProvider();
    const sessions = provider.listSessions();
    expect(Array.isArray(sessions)).toBe(true);
    for (const s of sessions) {
      expect(typeof s.name).toBe("string");
      expect(typeof s.createdAt).toBe("number");
      expect(typeof s.dir).toBe("string");
      expect(typeof s.windows).toBe("number");
    }
  });

  test("getCurrentSession returns string or null", () => {
    const provider = new TmuxProvider();
    const session = provider.getCurrentSession();
    expect(session === null || typeof session === "string").toBe(true);
  });

  test("getClientTty returns string", () => {
    const provider = new TmuxProvider();
    const tty = provider.getClientTty();
    expect(typeof tty).toBe("string");
  });

  test("getPaneCount returns number >= 0 for any session name", () => {
    const provider = new TmuxProvider();
    const count = provider.getPaneCount("nonexistent-session-xyz");
    expect(typeof count).toBe("number");
    expect(count).toBeGreaterThanOrEqual(0);
  });
});
