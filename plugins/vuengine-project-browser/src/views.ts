import * as vscode from "vscode";
import * as viewProjects from "./views/projects";

export function init(context: vscode.ExtensionContext) {
  viewProjects.init(context);
}
