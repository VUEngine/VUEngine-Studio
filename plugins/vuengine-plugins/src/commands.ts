import { ExtensionContext } from "vscode";

import { init as initCommandPluginActivate } from "./commands/pluginActivate";
import { init as initCommandPluginDeactivate } from "./commands/pluginDeactivate";

export function init(context: ExtensionContext) {
  initCommandPluginActivate(context);
  initCommandPluginDeactivate(context);
}
