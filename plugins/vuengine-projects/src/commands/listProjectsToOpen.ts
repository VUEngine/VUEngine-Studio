import { commands, ExtensionContext, window } from "vscode";
import { sortObject } from 'vuengine-common';
import { projectsRegistry } from "../projects";

export function init(context: ExtensionContext) {
  const command = commands.registerCommand(
    "vuengine.projects.listToOpen",
    () => {
      const quickPickOptions = [];
      for (const projectPath in sortObject(
        projectsRegistry,
        "name"
      )) {
        quickPickOptions.push({
          label: projectsRegistry[projectPath].name,
          detail: projectPath,
        });
      }

      window
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

          window
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

              commands.executeCommand(
                window.label == "Open in new window"
                  ? "vuengine.openProjectInNewWindow"
                  : "vuengine.projects.openProject",
                project["detail"]
              );
            });
        });
    }
  );
  context.subscriptions.push(command);

  const touchBarCommand = commands.registerCommand(
    "vuengine.touchBar.projects.listToOpen",
    () => {
      commands.executeCommand("vuengine.projects.listToOpen");
    }
  );
  context.subscriptions.push(touchBarCommand);
}
