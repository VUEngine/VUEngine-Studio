import * as vscode from "vscode";

import * as commandClearRegistry from "./commands/clearRegistry";
import * as commandListProjectsToOpen from "./commands/listProjectsToOpen";
import * as commandOpenProject from "./commands/openProject";
import * as commandOpenProjectInNewWindow from "./commands/openProjectInNewWindow";
import * as commandRemoveFromRegistry from "./commands/removeFromRegistry";
import * as commandRename from "./commands/rename";
import * as commandScanForProjects from "./commands/scanForProjects";

export function init(context: vscode.ExtensionContext) {
  commandClearRegistry.init(context);
  commandListProjectsToOpen.init(context);
  commandOpenProject.init(context);
  commandOpenProjectInNewWindow.init(context);
  commandRemoveFromRegistry.init(context);
  commandRename.init(context);
  commandScanForProjects.init(context);
}
