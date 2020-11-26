import { ExtensionContext } from "vscode";

import { init as initViewProjects } from "./views/projects";

export function init(context: ExtensionContext) {
  initViewProjects(context);
}
