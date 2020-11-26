import { commands, ExtensionContext, window } from "vscode";
import { clearProjectRegistry } from "../projects";

export function init(context: ExtensionContext) {
  const command = commands.registerCommand(
    "vuengine.projects.clearRegistry",
    () => {
      window.showInformationMessage(
        "Do you really want to delete all projects from the registry?",
        "Yes",
        "No"
      ).then((item) => {
        switch (item) {
          case "No":
            break;
          case "Yes":
            clearProjectRegistry(context);
            commands.executeCommand("vuengine.projects.refresh").then(() => {
              window.showInformationMessage(
                "Projects registry cleared."
              );
            });
            break;
        }
      });
    }
  );
  context.subscriptions.push(command);
}
