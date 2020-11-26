import { commands, ExtensionContext, ProgressLocation, window, workspace } from "vscode";
import * as glob from "glob";
import { existsSync } from "fs";
import { resolve as resolvePath } from "path";
import { homedir } from "os";

import { addToProjectsRegistry } from "../projects";

let isScanning = false;

export function init(context: ExtensionContext) {
  const command = commands.registerCommand(
    "vuengine.projects.scanForProjects",
    (project) => {
      if (!isScanning) {
        let projectsFolder: string | undefined = workspace.getConfiguration("vuengine.projects").get("path");
        if (projectsFolder) {
          projectsFolder = projectsFolder.replace('%HOME%', resolvePath(homedir()));
        }
        if (projectsFolder && existsSync(projectsFolder)) {
          isScanning = true;
          window.withProgress(
            {
              location: ProgressLocation.Notification,
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
                        addToProjectsRegistry(
                          context,
                          resolvePath(match + "..")
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
                      window.showInformationMessage(message);
                      commands.executeCommand(
                        "vuengine.projects.refresh"
                      );
                    } else {
                      window.showInformationMessage(
                        "No unregistered projects found."
                      );
                    }
                  }
                });
              });
            }
          );
        } else {
          window.showErrorMessage(
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
