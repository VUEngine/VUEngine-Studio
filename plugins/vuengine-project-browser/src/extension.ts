import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

import * as commands from "./commands";
import * as projects from "./projects";
import * as views from "./views";

export const isWorkspaceVUEngineProject = false;

export function activate(context: vscode.ExtensionContext) {
  projects.init(context);
  commands.init(context);
  views.init(context);
}

export function isVUEngineProject(folder: string) {
  return fs.existsSync(path.resolve(folder + "/.vuengine"));
}

export function getExtensionPath() {
  const extension = vscode.extensions.getExtension(
    "vuengine.vuengine-project-browser"
  );
  return extension ? path.resolve(extension.extensionPath) : "";
}

export function getWorkspaceRoot() {
  return vscode.workspace &&
    vscode.workspace.workspaceFolders &&
    vscode.workspace.workspaceFolders.length
    ? path.resolve(vscode.workspace.workspaceFolders[0]["uri"]["fsPath"])
    : "";
}

export function parseJson(file: string) {
  if (fs.existsSync(file)) {
    try {
      return JSON.parse(fs.readFileSync(file, "utf8"));
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
    keys.sort(function(a, b) {
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
