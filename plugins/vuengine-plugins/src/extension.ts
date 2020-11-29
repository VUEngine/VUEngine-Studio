import { ExtensionContext } from "vscode";
import { extensions } from "vscode";
import { writeFileSync } from "fs";
import { resolve as resolvePath } from "path";
import { getWorkspaceRoot, parseJson } from 'vuengine-common';
import { init as initCommands } from "./commands";
import { init as initViews } from "./views";

export function activate(context: ExtensionContext) {
  initCommands(context);
  initViews(context);
}

export function getExtensionPath() {
  const extension = extensions.getExtension(
    "vuengine.vuengine-plugins"
  );
  return extension ? resolvePath(extension.extensionPath) : "";
}

export function getConfig(): any {
  // TODO
  const configFilePath = getWorkspaceRoot() + '/.vuengine/plugins.json';
  return { project: { plugins: parseJson(configFilePath) } };
}

export function setConfig(value: any) {
  const configFilePath = getWorkspaceRoot() + '/.vuengine/plugins.json';
  writeFileSync(configFilePath, JSON.stringify(value, null, '\t'));
}