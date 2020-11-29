import { ExtensionContext } from "vscode";
import { extensions, workspace } from "vscode";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

import { init as initCommands } from "./commands";

export function activate(context: ExtensionContext) {
  initCommands(context);
}

export function getExtensionPath() {
  const extension = extensions.getExtension(
    "vuengine.vuengine-plugins"
  );
  return extension ? resolve(extension.extensionPath) : "";
}

export function getWorkspaceRoot() {
  return workspace &&
    workspace.workspaceFolders &&
    workspace.workspaceFolders.length
    ? resolve(workspace.workspaceFolders[0]["uri"]["fsPath"])
    : "";
}