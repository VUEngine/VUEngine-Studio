import { commands, ExtensionContext, window } from "vscode";
import { renameProject } from "../projects";

export function init(context: ExtensionContext) {
  const command = commands.registerCommand(
    "vuengine.projects.rename",
    (project) => {
      window
        .showInputBox({
          value: project.label,
          placeHolder: "Type a new name for the project",
        })
        .then((name) => {
          if (!name) {
            return;
          }

          renameProject(context, project.projectFolder, name);
        });
    }
  );
  context.subscriptions.push(command);
}
