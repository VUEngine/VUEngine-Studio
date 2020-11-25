import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
//import * as logger from './logger';
import * as extension from "./extension";

type ProjectsRegistry = {
  [key: string]: {
    name: string;
  };
};

export let projectsRegistry: ProjectsRegistry;

export function init(context: vscode.ExtensionContext) {
  getProjectRegistry(context);
  addCurrentToProjectsRegistry(context);
  cleanProjectsRegistry(context);
}

function getProjectRegistry(context: vscode.ExtensionContext) {
  projectsRegistry =
    context.globalState.get("vuengine.projects.registry") || {};
}

function setProjectRegistry(context: vscode.ExtensionContext) {
  context.globalState.update("vuengine.projects.registry", projectsRegistry);
}

export function addCurrentToProjectsRegistry(context: vscode.ExtensionContext) {
  if (
    !vscode.workspace
      .getConfiguration("vuengine.projects")
      .get("autoAddToRegistry")
  ) {
    return;
  }

  const workspaceRoot = extension.getWorkspaceRoot();
  if (extension.isWorkspaceVUEngineProject) {
    addToProjectsRegistry(context, workspaceRoot);
  }
}

// remove no longer existing projects from registry
export function cleanProjectsRegistry(context: vscode.ExtensionContext) {
  if (
    !vscode.workspace
      .getConfiguration("vuengine.projects")
      .get("autoCleanRegistry")
  ) {
    return;
  }

  const cleanedProjectsRegistry = {};
  for (const key in projectsRegistry) {
    if (extension.isVUEngineProject(key)) {
      cleanedProjectsRegistry[key] = projectsRegistry[key];
    }
  }

  if ((projectsRegistry = cleanedProjectsRegistry)) {
    projectsRegistry = cleanedProjectsRegistry;
    setProjectRegistry(context);
  }
}

export function addToProjectsRegistry(
  context: vscode.ExtensionContext,
  projectFolder: string
) {
  let success = false;

  const normalizedProjectFolder = path.resolve(projectFolder);
  if (!projectsRegistry[normalizedProjectFolder]) {
    let name = path.basename(normalizedProjectFolder);
    const configFilePath = projectFolder + "/.vuengine/project.json";
    if (fs.existsSync(configFilePath)) {
      const configFilePathData = extension.parseJson(configFilePath);
      if (configFilePathData && configFilePathData["name"]) {
        name = configFilePathData["name"];
      }
    }
    projectsRegistry[normalizedProjectFolder] = {
      name,
    };
    setProjectRegistry(context);

    success = true;
    //logger.logInfo('Added project to registry', normalizedProjectFolder);
  }

  return success;
}

export function removeFromProjectsRegistry(
  context: vscode.ExtensionContext,
  projectFolder: string
) {
  if (projectsRegistry[projectFolder]) {
    delete projectsRegistry[projectFolder];
    setProjectRegistry(context);
    vscode.commands.executeCommand("vuengine.projects.refresh");
  }
}

export function renameProject(
  context: vscode.ExtensionContext,
  projectFolder: string,
  newName: string
) {
  if (projectsRegistry[projectFolder]) {
    projectsRegistry[projectFolder].name = newName;
    setProjectRegistry(context);
    vscode.commands.executeCommand("vuengine.projects.refresh");
  }
}
