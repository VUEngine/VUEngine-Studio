import { commands, ExtensionContext, workspace } from "vscode";
import { existsSync } from "fs";
import { basename, resolve } from "path";
//import { logInfo } from './logger';
import { getWorkspaceRoot, isWorkspaceVUEngineProject, isVUEngineProject, parseJson } from "./extension";

type ProjectsRegistry = {
  [key: string]: {
    name: string;
  };
};

export let projectsRegistry: ProjectsRegistry;

export function init(context: ExtensionContext) {
  getProjectRegistry(context);
  addCurrentToProjectsRegistry(context);
  cleanProjectsRegistry(context);
}

function getProjectRegistry(context: ExtensionContext) {
  projectsRegistry =
    context.globalState.get("vuengine.projects.registry") || {};
}

function setProjectRegistry(context: ExtensionContext) {
  context.globalState.update("vuengine.projects.registry", projectsRegistry);
}

export function clearProjectRegistry(context: ExtensionContext) {
  projectsRegistry = {};
  setProjectRegistry(context);
}

export function addCurrentToProjectsRegistry(context: ExtensionContext) {
  console.log('AUTO ADD?', 'setting', workspace
    .getConfiguration("vuengine.projects")
    .get("autoAddToRegistry"), 'isWorkspaceVUEngineProject', isWorkspaceVUEngineProject, "workspaceRoot", getWorkspaceRoot());
  if (
    !workspace
      .getConfiguration("vuengine.projects")
      .get("autoAddToRegistry")
  ) {
    return;
  }

  const workspaceRoot = getWorkspaceRoot();
  if (isWorkspaceVUEngineProject) {
    addToProjectsRegistry(context, workspaceRoot);
  }
}

// remove no longer existing projects from registry
export function cleanProjectsRegistry(context: ExtensionContext) {
  if (
    !workspace
      .getConfiguration("vuengine.projects")
      .get("autoCleanRegistry")
  ) {
    return;
  }

  const cleanedProjectsRegistry = {};
  for (const key in projectsRegistry) {
    if (isVUEngineProject(key)) {
      cleanedProjectsRegistry[key] = projectsRegistry[key];
    }
  }

  if ((projectsRegistry = cleanedProjectsRegistry)) {
    projectsRegistry = cleanedProjectsRegistry;
    setProjectRegistry(context);
  }
}

export function addToProjectsRegistry(
  context: ExtensionContext,
  projectFolder: string
) {
  let success = false;

  const normalizedProjectFolder = resolve(projectFolder);
  if (!projectsRegistry[normalizedProjectFolder]) {
    let name = basename(normalizedProjectFolder);
    const configFilePath = projectFolder + "/.vuengine/project.json";
    if (existsSync(configFilePath)) {
      const configFilePathData = parseJson(configFilePath);
      if (configFilePathData && configFilePathData["name"]) {
        name = configFilePathData["name"];
      }
    }
    projectsRegistry[normalizedProjectFolder] = {
      name,
    };
    setProjectRegistry(context);

    success = true;
    //logInfo('Added project to registry', normalizedProjectFolder);
  }

  return success;
}

export function removeFromProjectsRegistry(
  context: ExtensionContext,
  projectFolder: string
) {
  if (projectsRegistry[projectFolder]) {
    delete projectsRegistry[projectFolder];
    setProjectRegistry(context);
    commands.executeCommand("vuengine.projects.refresh");
  }
}

export function renameProject(
  context: ExtensionContext,
  projectFolder: string,
  newName: string
) {
  if (projectsRegistry[projectFolder]) {
    projectsRegistry[projectFolder].name = newName;
    setProjectRegistry(context);
    commands.executeCommand("vuengine.projects.refresh");
  }
}
