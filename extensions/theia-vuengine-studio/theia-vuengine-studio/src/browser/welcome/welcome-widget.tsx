import { injectable, inject, postConstruct } from "inversify";
import * as React from "react";
import URI from "@theia/core/lib/common/uri";
import { ReactWidget } from "@theia/core/lib/browser/widgets/react-widget";
import { CommandRegistry, isOSX, environment, Path } from "@theia/core/lib/common";
import { WorkspaceCommands, WorkspaceService } from "@theia/workspace/lib/browser";
import { KeymapsCommands } from "@theia/keymaps/lib/browser";
import { CommonCommands, LabelProvider } from "@theia/core/lib/browser";
import { ApplicationInfo, ApplicationServer } from "@theia/core/lib/common/application-protocol";
import { FrontendApplicationConfigProvider } from "@theia/core/lib/browser/frontend-application-config-provider";
import { EnvVariablesServer } from "@theia/core/lib/common/env-variables";

@injectable()
export class WelcomeWidget extends ReactWidget {

    static readonly ID = "ves.welcome.widget";
    static readonly LABEL = "Welcome";

    protected applicationInfo: ApplicationInfo | undefined;
    protected applicationName = FrontendApplicationConfigProvider.get().applicationName;
    protected home: string | undefined;
    protected recentLimit = 5;
    protected recentWorkspaces: string[] = [];

    protected readonly documentationUrl = "https://www.theia-ide.org/docs/";
    protected readonly extensionUrl = "https://www.theia-ide.org/docs/authoring_extensions";
    protected readonly pluginUrl = "https://www.theia-ide.org/docs/authoring_plugins";

    @inject(ApplicationServer) protected readonly appServer: ApplicationServer;
    @inject(CommandRegistry) protected readonly commandRegistry: CommandRegistry;
    @inject(EnvVariablesServer) protected readonly environments: EnvVariablesServer;
    @inject(LabelProvider) protected readonly labelProvider: LabelProvider;
    @inject(WorkspaceService) protected readonly workspaceService: WorkspaceService;

    @postConstruct()
    protected async init(): Promise<void> {
        this.id = WelcomeWidget.ID;
        this.title.label = WelcomeWidget.LABEL;
        this.title.caption = WelcomeWidget.LABEL;
        this.title.closable = true;

        this.applicationInfo = await this.appServer.getApplicationInfo();
        this.recentWorkspaces = await this.workspaceService.recentWorkspaces();
        this.home = new URI(await this.environments.getHomeDirUri()).path.toString();
        this.update();
    }

    protected render(): React.ReactNode {
        return <div className="gs-container">
            {this.renderHeader()}
            <div className="flex-grid">
                <div className="col">
                    {this.renderOpen()}
                </div>
            </div>
            <div className="flex-grid">
                <div className="col">
                    {this.renderRecentWorkspaces()}
                </div>
            </div>
            <div className="flex-grid">
                <div className="col">
                    {this.renderSettings()}
                </div>
            </div>
            <div className="flex-grid">
                <div className="col">
                    {this.renderHelp()}
                </div>
            </div>
        </div>;
    }

    protected renderHeader(): React.ReactNode {
        return <div className="gs-header">
            <h1>
                {this.applicationName}
                <span className="gs-sub-header">
                    {this.applicationInfo ? ` ${this.applicationInfo.version}` : ""}
                </span>
            </h1>
        </div>;
    }

    protected renderOpen(): React.ReactNode {
        const requireSingleOpen = isOSX || !environment.electron.is();
        const open = requireSingleOpen && <div className="gs-action-container"><a href="#" onClick={this.doOpen}>Open</a></div>;
        const openFile = !requireSingleOpen && <div className="gs-action-container"><a href="#" onClick={this.doOpenFile}>Open File</a></div>;
        const openFolder = !requireSingleOpen && <div className="gs-action-container"><a href="#" onClick={this.doOpenFolder}>Open Folder</a></div>;
        const openWorkspace = <a href="#" onClick={this.doOpenWorkspace}>Open Workspace</a>;
        return <div className="gs-section">
            <h3 className="gs-section-header"><i className="fa fa-folder-open"></i>Open</h3>
            {open}
            {openFile}
            {openFolder}
            {openWorkspace}
        </div>;
    }

    protected renderRecentWorkspaces(): React.ReactNode {
        const items = this.recentWorkspaces;
        const paths = this.buildPaths(items);
        const content = paths.slice(0, this.recentLimit).map((item, index) =>
            <div className="gs-action-container" key={index}>
                <a href="#" onClick={a => this.open(new URI(items[index]))}>{new URI(items[index]).path.base}</a>
                <span className="gs-action-details">
                    {item}
                </span>
            </div>
        );
        const more = paths.length > this.recentLimit && <div className="gs-action-container"><a href="#" onClick={this.doOpenRecentWorkspace}>More...</a></div>;
        return <div className="gs-section">
            <h3 className="gs-section-header">
                <i className="fa fa-clock-o"></i>Recently Opened
            </h3>
            {items.length > 0 ? content : <p className="gs-no-recent">No Recent Workspaces</p>}
            {more}
        </div>;
    }

    protected renderSettings(): React.ReactNode {
        return <div className="gs-section">
            <h3 className="gs-section-header">
                <i className="fa fa-cog"></i>
                Settings
            </h3>
            <div className="gs-action-container">
                <a href="#" onClick={this.doOpenPreferences}>Open Preferences</a>
            </div>
            <div className="gs-action-container">
                <a href="#" onClick={this.doOpenKeyboardShortcuts}>Open Keyboard Shortcuts</a>
            </div>
        </div>;
    }

    protected renderHelp(): React.ReactNode {
        return <div className="gs-section">
            <h3 className="gs-section-header">
                <i className="fa fa-question-circle"></i>
                Help
            </h3>
            <div className="gs-action-container">
                <a href={this.documentationUrl} target="_blank">Documentation</a>
            </div>
        </div>;
    }

    protected buildPaths(workspaces: string[]): string[] {
        const paths: string[] = [];
        workspaces.forEach(workspace => {
            const uri = new URI(workspace);
            const pathLabel = this.labelProvider.getLongName(uri);
            const path = this.home ? Path.tildify(pathLabel, this.home) : pathLabel;
            paths.push(path);
        });
        return paths;
    }

    protected doOpen = () => this.commandRegistry.executeCommand(WorkspaceCommands.OPEN.id);
    protected doOpenFile = () => this.commandRegistry.executeCommand(WorkspaceCommands.OPEN_FILE.id);
    protected doOpenFolder = () => this.commandRegistry.executeCommand(WorkspaceCommands.OPEN_FOLDER.id);
    protected doOpenWorkspace = () => this.commandRegistry.executeCommand(WorkspaceCommands.OPEN_WORKSPACE.id);
    protected doOpenRecentWorkspace = () => this.commandRegistry.executeCommand(WorkspaceCommands.OPEN_RECENT_WORKSPACE.id);
    protected doOpenPreferences = () => this.commandRegistry.executeCommand(CommonCommands.OPEN_PREFERENCES.id);
    protected doOpenKeyboardShortcuts = () => this.commandRegistry.executeCommand(KeymapsCommands.OPEN_KEYMAPS.id);
    protected open = (uri: URI) => this.workspaceService.open(uri);
}
