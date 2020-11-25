import * as vscode from "vscode";
import * as projects from "../projects";

export function init(context: vscode.ExtensionContext) {
  const command = vscode.commands.registerCommand(
    "vuengine.projects.removeFromRegistry",
    (project) => {
      projects.removeFromProjectsRegistry(context, project.projectFolder);
      vscode.commands.executeCommand("vuengine.projects.refresh");
    }
  );
  context.subscriptions.push(command);
}
