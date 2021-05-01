import { injectable, inject, postConstruct } from "inversify";
import * as React from "react";
import URI from "@theia/core/lib/common/uri";
import { ReactWidget } from "@theia/core/lib/browser/widgets/react-widget";
import {
  CommandRegistry,
  isOSX,
  environment,
  Path,
} from "@theia/core/lib/common";
import {
  WorkspaceCommands,
  WorkspaceService,
} from "@theia/workspace/lib/browser";
import { KeymapsCommands } from "@theia/keymaps/lib/browser";
import { CommonCommands, LabelProvider } from "@theia/core/lib/browser";
import {
  ApplicationInfo,
  ApplicationServer,
} from "@theia/core/lib/common/application-protocol";
import { FrontendApplicationConfigProvider } from "@theia/core/lib/browser/frontend-application-config-provider";
import { EnvVariablesServer } from "@theia/core/lib/common/env-variables";
import { VesCommonFunctions } from "../../common/common-functions";
import { VesUrls } from "../../common/common-urls";
import { VesProjectsCommands } from "../../projects/projects-commands";

@injectable()
export class WelcomeWidget extends ReactWidget {
  static readonly ID = "vesWelcomeWidget";
  static readonly LABEL = "Welcome";

  protected applicationInfo: ApplicationInfo | undefined;
  protected applicationName = FrontendApplicationConfigProvider.get().applicationName;
  protected home: string | undefined;
  protected recentLimit = 10;
  protected recentWorkspaces: string[] = [];

  @inject(ApplicationServer) protected readonly appServer: ApplicationServer;
  @inject(CommandRegistry) protected readonly commandRegistry: CommandRegistry;
  @inject(EnvVariablesServer) protected readonly environments: EnvVariablesServer;
  @inject(LabelProvider) protected readonly labelProvider: LabelProvider;
  @inject(WorkspaceService) protected readonly workspaceService: WorkspaceService;
  @inject(VesCommonFunctions) protected readonly commonFunctions: VesCommonFunctions;

  @postConstruct()
  protected async init(): Promise<void> {
    this.id = WelcomeWidget.ID;
    this.title.label = WelcomeWidget.LABEL;
    this.title.iconClass = "fa fa-info-circle";
    this.title.caption = WelcomeWidget.LABEL;
    this.title.closable = true;

    this.applicationInfo = await this.appServer.getApplicationInfo();
    this.recentWorkspaces = await this.workspaceService.recentWorkspaces();
    this.home = new URI(
      await this.environments.getHomeDirUri()
    ).path.toString();
    this.update();
  }

  protected render(): React.ReactNode {
    return (
      <div className="ves-welcome-container">
        {this.renderHeader()}
        <div className="ves-welcome-flex-grid open">
          <div className="ves-welcome-col">{this.renderOpen()}</div>
        </div>
        <div className="ves-welcome-flex-grid emulated-flex-gap">
          <div className="ves-welcome-flex-grid-column">
            <div className="ves-welcome-flex-grid recent">
              <div className="ves-welcome-col">
                {this.renderRecentWorkspaces()}
              </div>
            </div>
            <div className="ves-welcome-flex-grid settings">
              <div className="ves-welcome-col">{this.renderSettings()}</div>
            </div>
            <div className="ves-welcome-flex-grid links">
              <div className="ves-welcome-col">{this.renderLinks()}</div>
            </div>
            <div className="ves-welcome-flex-grid links">
              <div className="ves-welcome-col">{this.renderExamples()}</div>
            </div>
          </div>
          <div className="ves-welcome-flex-grid-column">
            <div className="ves-welcome-flex-grid help">
              <div className="ves-welcome-col">{this.renderHelp()}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  protected renderHeader(): React.ReactNode {
    return (
      <div className="ves-welcome-header">
        <h1>
          {this.applicationName}
          <span className="ves-welcome-sub-header">
            {this.applicationInfo ? ` ${this.applicationInfo.version}` : ""}
          </span>
        </h1>
      </div>
    );
  }

  protected renderOpen(): React.ReactNode {
    const newProject = (
      <button className="theia-button large" onClick={this.newProject}>
        <i className="fa fa-plus"></i> Create New Project
      </button>
    );
    const openProject = (
      <button className="theia-button large" onClick={this.openProject}>
        <i className="fa fa-folder-open"></i> Open Project
      </button>
    );
    const openWorkspace = (
      <button className="theia-button large" onClick={this.openWorkspace}>
        <i className="fa fa-file-code-o"></i> Open Workspace
      </button>
    );

    return (
      <div className="ves-welcome-section">
        {newProject}
        {openProject}
        {openWorkspace}
      </div>
    );
  }

  protected renderRecentWorkspaces(): React.ReactNode {
    const items = this.recentWorkspaces;
    const paths = this.buildPaths(items);
    const content = paths.slice(0, this.recentLimit).map((item, index) => (
      <div className="ves-welcome-action-container" key={index}>
        <a
          href="#"
          onClick={(a) => this.openWorkspaceServiceUri(new URI(items[index]))}
        >
          {new URI(items[index]).path.base}
        </a>
        <span className="ves-welcome-action-details">{item}</span>
      </div>
    ));
    const more = paths.length > this.recentLimit && (
      <div className="ves-welcome-action-container">
        <a href="#" onClick={this.openRecentWorkspace}>
          More...
        </a>
      </div>
    );
    return (
      <div className="ves-welcome-section">
        <h3 className="ves-welcome-section-header">
          <i className="fa fa-clock-o"></i>Recently Opened
        </h3>
        {items.length > 0 ? (
          content
        ) : (
          <p className="ves-welcome-empty">No Recent Workspaces</p>
        )}
        {more}
      </div>
    );
  }

  protected renderSettings(): React.ReactNode {
    return (
      <div className="ves-welcome-section">
        <h3 className="ves-welcome-section-header">
          <i className="fa fa-cog"></i>
          Settings
        </h3>
        <div className="ves-welcome-action-container">
          <a href="#" onClick={this.openPreferences}>
            Open Preferences
          </a>
        </div>
        <div className="ves-welcome-action-container">
          <a href="#" onClick={this.openKeyboardShortcuts}>
            Open Keyboard Shortcuts
          </a>
        </div>
      </div>
    );
  }

  protected renderHelp(): React.ReactNode {
    return (
      <div className="ves-welcome-section">
        <h3 className="ves-welcome-section-header">
          <i className="fa fa-question-circle"></i>
          Help
        </h3>
        <div className="ves-welcome-action-container">
          <p className="ves-welcome-empty">Tutorials coming soon...</p>
        </div>
      </div>
    );
  }

  protected renderLinks(): React.ReactNode {
    return (
      <div className="ves-welcome-section">
        <h3 className="ves-welcome-section-header">
          <i className="fa fa-link"></i>
          Links
        </h3>
        <div className="ves-welcome-action-container">
          <a href="#" onClick={() => this.openUrl(VesUrls.PATREON)}>
            Support Us on Patreon
          </a>
        </div>
        <div className="ves-welcome-action-container">
          <a href="#" onClick={() => this.openUrl(VesUrls.GITHUB)}>
            Github
          </a>
        </div>
        <div className="ves-welcome-action-container">
          <a href="#" onClick={() => this.openUrl(VesUrls.VUENGINE)}>
            VUEngine Website
          </a>
        </div>
        <div className="ves-welcome-action-container">
          <a href="#" onClick={() => this.openUrl(VesUrls.VUENGINE)}>
            Planet Virtual Boy
          </a>
        </div>
      </div>
    );
  }

  protected renderExamples(): React.ReactNode {
    return (
      <div className="ves-welcome-section">
        <h3 className="ves-welcome-section-header">
          <i className="fa fa-star"></i>
          Made with VUEngine Studio
        </h3>
        <div className="ves-welcome-action-container">
          <p className="ves-welcome-empty">Examples coming soon...</p>
        </div>
      </div>
    );
  }

  protected buildPaths(workspaces: string[]): string[] {
    const paths: string[] = [];
    workspaces.forEach((workspace) => {
      const uri = new URI(workspace);
      const pathLabel = this.labelProvider.getLongName(uri);
      const path = this.home ? Path.tildify(pathLabel, this.home) : pathLabel;
      paths.push(path);
    });
    return paths;
  }

  protected openProject = () => {
    const requireSingleOpen = isOSX || !environment.electron.is();
    if (requireSingleOpen) {
      this.commandRegistry.executeCommand(WorkspaceCommands.OPEN.id);
    } else {
      this.commandRegistry.executeCommand(WorkspaceCommands.OPEN_FOLDER.id);
    }
  };
  protected openFile = () => this.commandRegistry.executeCommand(WorkspaceCommands.OPEN_FILE.id);
  protected openWorkspace = () => this.commandRegistry.executeCommand(WorkspaceCommands.OPEN_WORKSPACE.id);
  protected openRecentWorkspace = () => this.commandRegistry.executeCommand(WorkspaceCommands.OPEN_RECENT_WORKSPACE.id);
  protected openPreferences = () => this.commandRegistry.executeCommand(CommonCommands.OPEN_PREFERENCES.id);
  protected openKeyboardShortcuts = () => this.commandRegistry.executeCommand(KeymapsCommands.OPEN_KEYMAPS.id);
  protected openWorkspaceServiceUri = (uri: URI) => this.workspaceService.open(uri);
  protected openUrl = (url: string) => this.commonFunctions.openUrl(url);
  protected newProject = () => this.commandRegistry.executeCommand(VesProjectsCommands.NEW.id);
}
