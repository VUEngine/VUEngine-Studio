import * as vscode from "vscode";
import * as projects from "../projects";
import * as extension from "../extension";

export function init(context: vscode.ExtensionContext) {
  const command = vscode.commands.registerCommand(
    "vuengine.projects.listToOpen",
    () => {
      const quickPickOptions = [];
      for (const projectPath in extension.sortObject(
        projects.projectsRegistry,
        "name"
      )) {
        quickPickOptions.push({
          label: projects.projectsRegistry[projectPath].name,
          detail: projectPath,
        });
      }

      vscode.window
        .showQuickPick(quickPickOptions, {
          matchOnDescription: true,
          matchOnDetail: true,
          canPickMany: false,
          placeHolder: "Select a project to open",
        })
        .then((project) => {
          if (!project) {
            return;
          }

          vscode.window
            .showQuickPick(
              [
                {
                  label: "Open in current window",
                },
                {
                  label: "Open in new window",
                },
              ],
              {
                matchOnDescription: true,
                matchOnDetail: true,
                canPickMany: false,
                placeHolder: "Where should the project be opened?",
              }
            )
            .then((window) => {
              if (!window) {
                return;
              }

              vscode.commands.executeCommand(
                window.label == "Open in new window"
                  ? "vuengine.projects.openProjectInNewWindow"
                  : "vuengine.projects.openProject",
                project["detail"]
              );
            });
        });
    }
  );
  context.subscriptions.push(command);

  const touchBarCommand = vscode.commands.registerCommand(
    "vuengine.touchBar.projects.listToOpen",
    () => {
      vscode.commands.executeCommand("vuengine.projects.listToOpen");
    }
  );
  context.subscriptions.push(touchBarCommand);
}
