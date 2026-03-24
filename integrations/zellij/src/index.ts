import type { PluginAPI } from "@opensessions/core";
import { ZellijProvider } from "./provider";

export default function (api: PluginAPI): void {
  api.registerMux(new ZellijProvider());
}

export { ZellijProvider } from "./provider";
