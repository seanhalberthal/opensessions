import { describe, test, expect } from "bun:test";
import { ZellijProvider } from "../src/provider";
import type { MuxProvider } from "@opensessions/core";

describe("ZellijProvider", () => {
  test("implements MuxProvider interface", () => {
    const provider: MuxProvider = new ZellijProvider();
    expect(provider.name).toBe("zellij");
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

  test("getCurrentSession reads from ZELLIJ_SESSION_NAME env var", () => {
    const provider = new ZellijProvider();
    const session = provider.getCurrentSession();
    if (process.env.ZELLIJ_SESSION_NAME) {
      expect(session).toBe(process.env.ZELLIJ_SESSION_NAME);
    } else {
      expect(session).toBeNull();
    }
  });

  test("listSessions returns array (empty if zellij not running)", () => {
    const provider = new ZellijProvider();
    const sessions = provider.listSessions();
    expect(Array.isArray(sessions)).toBe(true);
    for (const s of sessions) {
      expect(typeof s.name).toBe("string");
      expect(typeof s.createdAt).toBe("number");
      expect(typeof s.dir).toBe("string");
      expect(typeof s.windows).toBe("number");
    }
  });

  test("getClientTty returns empty string (zellij has no TTY concept)", () => {
    const provider = new ZellijProvider();
    expect(provider.getClientTty()).toBe("");
  });

  test("setupHooks and cleanupHooks are no-ops", () => {
    const provider = new ZellijProvider();
    expect(() => provider.setupHooks("127.0.0.1", 7391)).not.toThrow();
    expect(() => provider.cleanupHooks()).not.toThrow();
  });
});
