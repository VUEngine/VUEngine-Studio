import { ExtensionContext } from "vscode";

import { init as initCommandClearRegistry } from "./commands/clearRegistry";
import { init as initCommandCreateProject } from "./commands/CreateProject";
import { init as initCommandListProjectsToOpen } from "./commands/listProjectsToOpen";
import { init as initCommandOpenProject } from "./commands/openProject";
import { init as initCommandOpenProjectInNewWindow } from "./commands/openProjectInNewWindow";
import { init as initCommandRemoveFromRegistry } from "./commands/removeFromRegistry";
import { init as initCommandRename } from "./commands/rename";
import { init as initCommandScanForProjects } from "./commands/scanForProjects";

export function init(context: ExtensionContext) {
  initCommandClearRegistry(context);
  initCommandListProjectsToOpen(context);
  initCommandCreateProject(context);
  initCommandOpenProject(context);
  initCommandOpenProjectInNewWindow(context);
  initCommandRemoveFromRegistry(context);
  initCommandRename(context);
  initCommandScanForProjects(context);
}
