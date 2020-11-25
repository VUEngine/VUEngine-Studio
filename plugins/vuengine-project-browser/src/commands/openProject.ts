import * as vscode from "vscode";
import * as glob from "glob";

export function init(context: vscode.ExtensionContext) {
  const command = vscode.commands.registerCommand(
    "vuengine.projects.openProject",
    (projectFolder) => {
      const workspaceFiles = glob.sync(projectFolder + "/*.code-workspace");
      const workspaceFile =
        workspaceFiles[0] != undefined ? workspaceFiles[0] : projectFolder;

      vscode.commands.executeCommand(
        "vscode.openFolder",
        vscode.Uri.file(workspaceFile),
        false
      );
    }
  );
  context.subscriptions.push(command);
}
