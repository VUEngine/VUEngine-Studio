import { commands, Event, EventEmitter, ExtensionContext, TreeDataProvider, TreeItem, window } from "vscode";
import { resolve } from "path";
import { projectsRegistry } from "../projects";
import { getWorkspaceRoot, getExtensionPath } from "../extension";

export function init(context: ExtensionContext) {
  const projectsProvider = new ProjectsProvider();
  const command = commands.registerCommand(
    "vuengine.projects.refresh",
    () => {
      projectsProvider.refresh();
    }
  );
  window.createTreeView("vuengine-studio-projects", {
    treeDataProvider: projectsProvider,
    showCollapseAll: false,
  });
  context.subscriptions.push(command);
}

class ProjectsProvider implements TreeDataProvider<Project> {
  private _onDidChangeTreeData: EventEmitter<
    Project | undefined
  > = new EventEmitter<Project | undefined>();
  readonly onDidChangeTreeData: Event<Project | undefined> = this
    ._onDidChangeTreeData.event;

  constructor() { }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: Project): TreeItem {
    return element;
  }

  getChildren(element?: Project): Thenable<Project[]> {
    const children = [];

    if (Object.keys(projectsRegistry).length) {
      for (const key in projectsRegistry) {
        children.push(new Project(key, projectsRegistry[key]));
      }

      children.sort(function (a, b) {
        return a.label && b.label ? a.label.localeCompare(b.label) : 0;
      });
    }

    return Promise.resolve(children);
  }
}

class Project extends TreeItem {
  private isCurrent: boolean;

  constructor(private projectFolder: string, projectConfig) {
    super(projectFolder);
    this.isCurrent =
      resolve(projectFolder) == resolve(getWorkspaceRoot());
    if (projectConfig && projectConfig.name) this.label = projectConfig.name;
    this.iconPath = this.isCurrent
      ? {
        dark:
          getExtensionPath() + "/img/icon/dark/folder-active.svg",
        light:
          getExtensionPath() + "/img/icon/light/folder-active.svg",
      }
      : {
        dark: getExtensionPath() + "/img/icon/dark/folder.svg",
        light: getExtensionPath() + "/img/icon/light/folder.svg",
      };
    this.contextValue = this.isCurrent ? "currentProject" : "project";
    this.command = this.isCurrent
      ? null
      : {
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
