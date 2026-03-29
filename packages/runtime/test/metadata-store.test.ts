import { describe, it, expect } from "bun:test";
import { SessionMetadataStore } from "../src/server/metadata-store";

describe("SessionMetadataStore", () => {
  it("returns null for unknown session", () => {
    const store = new SessionMetadataStore();
    expect(store.get("unknown")).toBeNull();
  });

  it("set and get status", () => {
    const store = new SessionMetadataStore();
    store.setStatus("api", { text: "Indexing", tone: "info" });
    const meta = store.get("api")!;
    expect(meta.status).not.toBeNull();
    expect(meta.status!.text).toBe("Indexing");
    expect(meta.status!.tone).toBe("info");
    expect(meta.status!.ts).toBeGreaterThan(0);
  });

  it("clear status with null", () => {
    const store = new SessionMetadataStore();
    store.setStatus("api", { text: "Indexing" });
    store.setStatus("api", null);
    // Should be null because everything is empty
    expect(store.get("api")).toBeNull();
  });

  it("set and get progress", () => {
    const store = new SessionMetadataStore();
    store.setProgress("api", { current: 3, total: 10, label: "files" });
    const meta = store.get("api")!;
    expect(meta.progress).not.toBeNull();
    expect(meta.progress!.current).toBe(3);
    expect(meta.progress!.total).toBe(10);
    expect(meta.progress!.label).toBe("files");
  });

  it("set progress with percent", () => {
    const store = new SessionMetadataStore();
    store.setProgress("api", { percent: 0.75 });
    const meta = store.get("api")!;
    expect(meta.progress!.percent).toBe(0.75);
  });

  it("clear progress with null", () => {
    const store = new SessionMetadataStore();
    store.setProgress("api", { current: 3, total: 10 });
    store.setProgress("api", null);
    expect(store.get("api")).toBeNull();
  });

  it("append and get logs", () => {
    const store = new SessionMetadataStore();
    store.appendLog("api", { message: "Build started", source: "ci", tone: "info" });
    store.appendLog("api", { message: "Tests passed", tone: "success" });
    const meta = store.get("api")!;
    expect(meta.logs).toHaveLength(2);
    expect(meta.logs[0].message).toBe("Build started");
    expect(meta.logs[0].source).toBe("ci");
    expect(meta.logs[0].tone).toBe("info");
    expect(meta.logs[1].message).toBe("Tests passed");
    expect(meta.logs[1].tone).toBe("success");
  });

  it("caps logs at 50", () => {
    const store = new SessionMetadataStore();
    for (let i = 0; i < 60; i++) {
      store.appendLog("api", { message: `log ${i}` });
    }
    const meta = store.get("api")!;
    expect(meta.logs).toHaveLength(50);
    expect(meta.logs[0].message).toBe("log 10");
    expect(meta.logs[49].message).toBe("log 59");
  });

  it("truncates long messages", () => {
    const store = new SessionMetadataStore();
    const longMsg = "x".repeat(600);
    store.appendLog("api", { message: longMsg });
    const meta = store.get("api")!;
    expect(meta.logs[0].message.length).toBe(500);
    expect(meta.logs[0].message.endsWith("…")).toBe(true);
  });

  it("truncates long status text", () => {
    const store = new SessionMetadataStore();
    const longText = "x".repeat(200);
    store.setStatus("api", { text: longText });
    const meta = store.get("api")!;
    expect(meta.status!.text.length).toBe(100);
    expect(meta.status!.text.endsWith("…")).toBe(true);
  });

  it("clearLogs removes all logs", () => {
    const store = new SessionMetadataStore();
    store.appendLog("api", { message: "log 1" });
    store.appendLog("api", { message: "log 2" });
    store.clearLogs("api");
    expect(store.get("api")).toBeNull();
  });

  it("pruneSessions removes stale metadata", () => {
    const store = new SessionMetadataStore();
    store.setStatus("api", { text: "running" });
    store.setStatus("web", { text: "building" });
    store.pruneSessions(new Set(["api"]));
    expect(store.get("api")).not.toBeNull();
    expect(store.get("web")).toBeNull();
  });

  it("returns null when all fields are empty", () => {
    const store = new SessionMetadataStore();
    store.setStatus("api", { text: "test" });
    store.setStatus("api", null);
    expect(store.get("api")).toBeNull();
  });

  it("combined status + progress + logs", () => {
    const store = new SessionMetadataStore();
    store.setStatus("api", { text: "Deploying", tone: "warn" });
    store.setProgress("api", { percent: 0.5, label: "containers" });
    store.appendLog("api", { message: "Starting deploy", source: "cd" });
    const meta = store.get("api")!;
    expect(meta.status!.text).toBe("Deploying");
    expect(meta.progress!.percent).toBe(0.5);
    expect(meta.logs).toHaveLength(1);
  });
});
