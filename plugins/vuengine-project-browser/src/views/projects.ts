import * as vscode from "vscode";
import * as path from "path";
import * as projects from "../projects";
import * as extension from "../extension";

export function init(context: vscode.ExtensionContext) {
  const projectsProvider = new ProjectsProvider();
  vscode.window.createTreeView("vuengine-studio-projects", {
    treeDataProvider: projectsProvider,
    showCollapseAll: false,
  });

  const command = vscode.commands.registerCommand(
    "vuengine.projects.refresh",
    () => {
      projectsProvider.refresh();
    }
  );
  context.subscriptions.push(command);
}

class ProjectsProvider implements vscode.TreeDataProvider<Project> {
  private _onDidChangeTreeData: vscode.EventEmitter<
    Project | undefined
  > = new vscode.EventEmitter<Project | undefined>();
  readonly onDidChangeTreeData: vscode.Event<Project | undefined> = this
    ._onDidChangeTreeData.event;

  constructor() {}

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: Project): vscode.TreeItem {
    return element;
  }

  getChildren(element?: Project): Thenable<Project[]> {
    const children = [];

    if (!Object.keys(projects.projectsRegistry).length) {
      children.push(new ProjectErrorNoProjectsFound());
    } else {
      for (const key in projects.projectsRegistry) {
        children.push(new Project(key, projects.projectsRegistry[key]));
      }

      children.sort(function(a, b) {
        return a.label && b.label ? a.label.localeCompare(b.label) : 0;
      });
    }

    return Promise.resolve(children);
  }
}

class Project extends vscode.TreeItem {
  private isCurrent: boolean;

  constructor(private projectFolder: string, projectConfig) {
    super(projectFolder);
    this.isCurrent =
      path.resolve(projectFolder) == path.resolve(extension.getWorkspaceRoot());
    if (projectConfig && projectConfig.name) this.label = projectConfig.name;
    this.iconPath = this.isCurrent
      ? {
          dark:
            extension.getExtensionPath() + "/img/icon/dark/folder-active.svg",
          light:
            extension.getExtensionPath() + "/img/icon/light/folder-active.svg",
        }
      : {
          dark: extension.getExtensionPath() + "/img/icon/dark/folder.svg",
          light: extension.getExtensionPath() + "/img/icon/light/folder.svg",
        };
    this.contextValue = this.isCurrent ? "currentProject" : "project";
    this.command = {
      command: "vuengine.projects.openProject",
      arguments: [projectFolder],
      title: "Open",
    };
  }

  get tooltip(): string {
    return this.projectFolder;
  }

  get description(): string {
    return this.isCurrent ? "(Current)" : "";
  }
}

class ProjectErrorNoProjectsFound extends Project {
  constructor() {
    super("", null);

    this.label = "No projects registered";
    this.iconPath = {
      dark: extension.getExtensionPath() + "/img/icon/dark/info.svg",
      light: extension.getExtensionPath() + "/img/icon/light/info.svg",
    };
    this.contextValue = "projectsErrorNoProjectsFound";
    this.command = undefined;
  }

  get tooltip(): string {
    return "";
  }

  get description(): string {
    return "";
  }
}
