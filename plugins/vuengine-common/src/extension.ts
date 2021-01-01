import { ExtensionContext, workspace } from "vscode";
import { resolve as resolvePath } from "path";
import { existsSync, readFileSync } from "fs";

export let isWorkspaceVUEngineProject = false;

export function activate(context: ExtensionContext) {
  isWorkspaceVUEngineProject = isVUEngineProject(getWorkspaceRoot());
}

export function isVUEngineProject(folder: string) {
  return existsSync(resolvePath(folder + "/.vuengine"));
}

export function getWorkspaceRoot(): string {
  return workspace &&
    workspace.workspaceFolders &&
    workspace.workspaceFolders.length
    ? resolvePath(workspace.workspaceFolders[0]["uri"]["fsPath"])
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