import { commands, ExtensionContext } from "vscode";
import { removeFromProjectsRegistry } from "../projects";

export function init(context: ExtensionContext) {
  const command = commands.registerCommand(
    "vuengine.projects.removeFromRegistry",
    (project) => {
      removeFromProjectsRegistry(context, project.projectFolder);
      commands.executeCommand("vuengine.projects.refresh");
    }
  );
  context.subscriptions.push(command);
}
