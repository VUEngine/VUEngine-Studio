import { ExtensionContext } from "vscode";

import { init as initCommandBuild } from "./commands/build";
import { init as initCommandClean } from "./commands/clean";

export function init(context: ExtensionContext) {
  initCommandBuild(context);
  initCommandClean(context);
}
