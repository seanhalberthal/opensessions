import type { PluginAPI } from "@opensessions/core";
import { TmuxProvider } from "./provider";

export default function (api: PluginAPI): void {
  api.registerMux(new TmuxProvider());
}

export { TmuxProvider } from "./provider";
