import { commands, ExtensionContext, window } from "vscode";
import { clearProjectRegistry } from "../projects";

export function init(context: ExtensionContext) {
  const command = commands.registerCommand(
    "vuengine.projects.clearRegistry",
    () => {
      clearProjectRegistry(context);
      commands.executeCommand("vuengine.projects.refresh");
      window.showInformationMessage(
        "Projects registry cleared."
      );
    }
  );
  context.subscriptions.push(command);
}
