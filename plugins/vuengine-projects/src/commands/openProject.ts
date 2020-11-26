import { commands, ExtensionContext, Uri } from "vscode";
import { sync } from "glob";

export function init(context: ExtensionContext) {
  const command = commands.registerCommand(
    "vuengine.projects.openProject",
    (projectFolder) => {
      const workspaceFiles = sync(projectFolder + "/*.code-workspace");
      const workspaceFile =
        workspaceFiles[0] != undefined ? workspaceFiles[0] : projectFolder;

      commands.executeCommand(
        "vscode.openFolder",
        Uri.file(workspaceFile),
        false
      );
    }
  );
  context.subscriptions.push(command);
}
