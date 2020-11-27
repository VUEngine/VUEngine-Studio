import { ExtensionContext } from "vscode";

import { init as initViewPlugins } from "./views/plugins";

export function init(context: ExtensionContext) {
  initViewPlugins(context);
}
