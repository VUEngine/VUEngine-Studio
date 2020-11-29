import { ExtensionContext } from "vscode";

import { init as initCommandFlash } from "./commands/flash";

export function init(context: ExtensionContext) {
  initCommandFlash(context);
}
