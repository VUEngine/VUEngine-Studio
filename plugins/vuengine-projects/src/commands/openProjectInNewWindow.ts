import { commands, ExtensionContext, Uri } from "vscode";
import { sync } from "glob";

export function init(context: ExtensionContext) {
  const command = commands.registerCommand(
    "vuengine.projects.openProjectInNewWindow",
    (projectFolder) => {
      const workspaceFiles = sync(projectFolder + "/*.code-workspace");
      const workspaceFile =
        workspaceFiles[0] != undefined ? workspaceFiles[0] : projectFolder;

      commands.executeCommand(
        "vscode.openFolder",
        Uri.file(workspaceFile),
        true
      );
    }
  );
  context.subscriptions.push(command);
}
