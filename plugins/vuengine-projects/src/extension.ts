import { ExtensionContext } from "vscode";
import { extensions } from "vscode";
import { resolve } from "path";
import { init as initCommands } from "./commands";
import { init as initProjects } from "./projects";
import { init as initViews } from "./views";

export function activate(context: ExtensionContext) {
  initCommands(context);
  initProjects(context);
  initViews(context);
}

export function getExtensionPath() {
  const extension = extensions.getExtension(
    "vuengine.vuengine-projects"
  );
  return extension ? resolve(extension.extensionPath) : "";
}