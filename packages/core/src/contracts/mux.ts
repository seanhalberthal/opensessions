export interface MuxSessionInfo {
  name: string;
  createdAt: number;
  dir: string;
  windows: number;
}

export interface MuxProvider {
  readonly name: string;

  listSessions(): MuxSessionInfo[];
  switchSession(name: string, clientTty?: string): void;
  getCurrentSession(): string | null;
  getSessionDir(name: string): string;
  getPaneCount(name: string): number;
  getClientTty(): string;
  createSession(name?: string, dir?: string): void;
  killSession(name: string): void;
  setupHooks(serverHost: string, serverPort: number): void;
  cleanupHooks(): void;

  // Sidebar operations (optional — providers that don't support sidebars can return empty/noop)
  listSidebarPanes?(sessionName?: string): { paneId: string; sessionName: string; windowId: string }[];
  spawnSidebar?(sessionName: string, windowId: string, width: number, position: "left" | "right", scriptsDir: string): string | null;
  hideSidebar?(paneId: string): void;
  killSidebarPane?(paneId: string): void;
  resizeSidebarPane?(paneId: string, width: number): void;
}
