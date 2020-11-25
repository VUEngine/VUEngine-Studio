import * as vscode from "vscode";
import * as projects from "../projects";

export function init(context: vscode.ExtensionContext) {
  const command = vscode.commands.registerCommand(
    "vuengine.projects.rename",
    (project) => {
      vscode.window
        .showInputBox({
          value: project.label,
          placeHolder: "Type a new name for the project",
        })
        .then((name) => {
          if (!name) {
            return;
          }

          projects.renameProject(context, project.projectFolder, name);
        });
    }
  );
  context.subscriptions.push(command);
}
