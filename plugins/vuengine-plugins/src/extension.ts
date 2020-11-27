import { ExtensionContext } from "vscode";
import { extensions, workspace } from "vscode";
import { existsSync, fstat, readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

import { init as initCommands } from "./commands";
import { init as initViews } from "./views";

export let isWorkspaceVUEngineProject = false;

export function activate(context: ExtensionContext) {
  isWorkspaceVUEngineProject = isVUEngineProject(getWorkspaceRoot());

  initCommands(context);
  initViews(context);
}

export function isVUEngineProject(folder: string) {
  return existsSync(resolve(folder + "/.vuengine"));
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

export function parseJson(file: string) {
  if (existsSync(file)) {
    try {
      return JSON.parse(readFileSync(file, "utf8"));
    } catch (e) {
      //logger.logError('JSON parse file', file);
      return {};
    }
  } else {
    //logger.logInfo('JSON file does not exist', file);
    return {};
  }
}

export function sortObject(object: {}, key?: string) {
  if (typeof object != "object" || object instanceof Array || !object) {
    return object;
  }
  const keys = Object.keys(object);

  if (key) {
    keys.sort(function (a, b) {
      return object[a][key] - object[b][key];
    });
  } else {
    keys.sort();
  }

  const sortedObject = {};
  for (let i = 0; i < keys.length; i++) {
    sortedObject[keys[i]] = sortObject(object[keys[i]], key);
  }

  return sortedObject;
}

export function getConfig(...categories): any {
  // TODO
  const configFilePath = getWorkspaceRoot() + '/.vuengine/plugins.json';
  return { project: { plugins: parseJson(configFilePath) } };
}

export function setConfig(category: string, value: any) {
  const configFilePath = getWorkspaceRoot() + '/.vuengine/' + category + '.json';
  writeFileSync(configFilePath, JSON.stringify(value, null, '\t'));
}