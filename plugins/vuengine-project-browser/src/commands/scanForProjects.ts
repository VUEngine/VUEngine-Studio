import * as vscode from "vscode";
import * as glob from "glob";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

import * as projects from "../projects";
import * as extension from "../extension";

let isScanning = false;

export function init(context: vscode.ExtensionContext) {
  const command = vscode.commands.registerCommand(
    "vuengine.projects.scanForProjects",
    (project) => {
      if (!isScanning) {
        let projectsFolder: string | undefined = vscode.workspace.getConfiguration("vuengine.projects").get("path");
        if (projectsFolder) {
          projectsFolder = projectsFolder.replace('%HOME%', path.resolve(os.homedir()));
        }
        if (projectsFolder && fs.existsSync(projectsFolder)) {
          isScanning = true;
          vscode.window.withProgress(
            {
              location: vscode.ProgressLocation.Notification,
              title: "Projects",
            },
            (p) => {
              return new Promise((resolve, reject) => {
                p.report({
                  message:
                    "Scanning for unregistered projects in projects folder " +
                    projectsFolder +
                    ".",
                });

                glob(projectsFolder + "/**/.vuengine/", {}, function (
                  error,
                  matches
                ) {
                  if (!error) {
                    let addedProjects = 0;
                    for (const match of matches) {
                      if (
                        projects.addToProjectsRegistry(
                          context,
                          path.resolve(match + "..")
                        )
                      ) {
                        addedProjects++;
                      }
                    }

                    resolve();
                    isScanning = false;

                    if (addedProjects) {
                      const message =
                        addedProjects == 1
                          ? "Found and registered 1 project."
                          : "Found and registered " +
                          addedProjects +
                          " projects.";
                      vscode.window.showInformationMessage(message);
                      vscode.commands.executeCommand(
                        "vuengine.projects.refresh"
                      );
                    } else {
                      vscode.window.showInformationMessage(
                        "No unregistered projects found."
                      );
                    }
                  }
                });
              });
            }
          );
        } else {
          vscode.window.showErrorMessage(
            'Directory "' +
            projectsFolder +
            '" does not exist. Please check your config.'
          );
        }
      }
    }
  );
  context.subscriptions.push(command);
}
