import { CommandRegistry, DisposableCollection, nls, Path } from '@theia/core';
import { codicon, CommonCommands, Key, KeyCode, LabelProvider, Message, PreferenceService, ReactWidget } from '@theia/core/lib/browser';
import { FrontendApplicationConfigProvider } from '@theia/core/lib/browser/frontend-application-config-provider';
import { WindowService } from '@theia/core/lib/browser/window/window-service';
import { ApplicationInfo, ApplicationServer } from '@theia/core/lib/common/application-protocol';
import { EnvVariablesServer } from '@theia/core/lib/common/env-variables';
import URI from '@theia/core/lib/common/uri';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import * as React from '@theia/core/shared/react';
import { KeymapsCommands } from '@theia/keymaps/lib/browser';
import { WorkspaceCommands, WorkspaceService } from '@theia/workspace/lib/browser';
import { VesCommonService } from '../../core/browser/ves-common-service';
import { VesDocumentationCommands } from '../../documentation/browser/ves-documentation-commands';
import { VesProjectCommands } from '../../project/browser/ves-project-commands';
import { VesProjectService } from '../../project/browser/ves-project-service';
import { VesGettingStartedPreferenceIds } from './ves-getting-started-preferences';

@injectable()
export class VesGettingStartedWidget extends ReactWidget {
    @inject(ApplicationServer)
    protected readonly appServer: ApplicationServer;
    @inject(CommandRegistry)
    protected readonly commandRegistry: CommandRegistry;
    @inject(EnvVariablesServer)
    protected readonly environments: EnvVariablesServer;
    @inject(LabelProvider)
    protected readonly labelProvider: LabelProvider;
    @inject(PreferenceService)
    protected readonly preferenceService: PreferenceService;
    @inject(VesCommonService)
    protected readonly vesCommonService: VesCommonService;
    @inject(VesProjectService)
    protected readonly vesProjectsService: VesProjectService;
    @inject(WindowService)
    protected readonly windowService: WindowService;
    @inject(WorkspaceService)
    protected readonly workspaceService: WorkspaceService;

    static readonly ID = 'vesGettingStartedWidget';
    static readonly LABEL = nls.localizeByDefault('Getting Started');

    protected applicationInfo: ApplicationInfo | undefined;
    protected applicationName = FrontendApplicationConfigProvider.get().applicationName;

    protected home: string | undefined;

    protected recentLimit = 10;
    protected recentWorkspaces: string[] = [];

    protected readonly toDispose = new DisposableCollection();
    protected vesRecentWorkspaces: Array<{ name: string, uri: URI, path: string }> = [];

    @postConstruct()
    protected async init(): Promise<void> {
        this.id = VesGettingStartedWidget.ID;
        this.title.label = VesGettingStartedWidget.LABEL;
        this.title.caption = VesGettingStartedWidget.LABEL;
        this.title.iconClass = 'codicon codicon-info';
        this.title.closable = true;

        this.applicationInfo = await this.appServer.getApplicationInfo();
        this.recentWorkspaces = await this.workspaceService.recentWorkspaces();
        this.home = new URI(await this.environments.getHomeDirUri()).path.toString();

        await this.preferenceService.ready;
        await this.vesGetRecentWorkspaces();
        this.update();
    }

    protected onActivateRequest(msg: Message): void {
        super.onActivateRequest(msg);
        const htmlElement = document.getElementById(this.id);
        if (htmlElement) {
            htmlElement.focus();
        }
    }

    protected render(): React.ReactNode {
        return <div className="gs-container">
            {this.renderHeader()}
            {this.renderOpen()}
            {this.vesRecentWorkspaces.length > 0 && this.renderRecentWorkspaces()}
            {this.renderHelp()}
            {this.renderSettings()}
            {this.renderLinks()}
            {this.renderPreferences()}
        </div>;
    }

    protected renderSettings(): React.ReactNode {
        return <div className='gs-section'>
            <h3 className='gs-section-header'>
                <i className={codicon('settings-gear')}></i>
                {nls.localizeByDefault('Settings')}
            </h3>
            <div className='gs-action-container'>
                <a
                    role={'button'}
                    tabIndex={0}
                    onClick={this.doOpenPreferences}
                    onKeyDown={this.doOpenPreferencesEnter}>
                    {nls.localizeByDefault('Open Settings')}
                </a>
            </div>
            <div className='gs-action-container'>
                <a
                    role={'button'}
                    tabIndex={0}
                    onClick={this.doOpenKeyboardShortcuts}
                    onKeyDown={this.doOpenKeyboardShortcutsEnter}>
                    {nls.localizeByDefault('Open Keyboard Shortcuts')}
                </a>
            </div>
        </div>;
    }

    protected doOpenWorkspace = () => this.commandRegistry.executeCommand(WorkspaceCommands.OPEN_WORKSPACE.id);
    protected doOpenWorkspaceEnter = (e: React.KeyboardEvent) => {
        if (this.isEnterKey(e)) {
            this.doOpenWorkspace();
        }
    };

    /**
     * Trigger the open recent workspace command.
     */
    protected doOpenRecentWorkspace = () => this.commandRegistry.executeCommand(WorkspaceCommands.OPEN_RECENT_WORKSPACE.id);
    protected doOpenRecentWorkspaceEnter = (e: React.KeyboardEvent) => {
        if (this.isEnterKey(e)) {
            this.doOpenRecentWorkspace();
        }
    };

    /**
     * Trigger the open preferences command.
     * Used to open the preferences widget.
     */
    protected doOpenPreferences = () => this.commandRegistry.executeCommand(CommonCommands.OPEN_PREFERENCES.id);
    protected doOpenPreferencesEnter = (e: React.KeyboardEvent) => {
        if (this.isEnterKey(e)) {
            this.doOpenPreferences();
        }
    };

    /**
     * Trigger the open keyboard shortcuts command.
     * Used to open the keyboard shortcuts widget.
     */
    protected doOpenKeyboardShortcuts = () => this.commandRegistry.executeCommand(KeymapsCommands.OPEN_KEYMAPS.id);
    protected doOpenKeyboardShortcutsEnter = (e: React.KeyboardEvent) => {
        if (this.isEnterKey(e)) {
            this.doOpenKeyboardShortcuts();
        }
    };

    /**
     * Open a workspace given its uri.
     * @param uri {URI} the workspace uri.
     */
    protected open = (uri: URI) => this.workspaceService.open(uri);
    protected openEnter = (e: React.KeyboardEvent, uri: URI) => {
        if (this.isEnterKey(e)) {
            this.open(uri);
        }
    };

    /**
     * Open a link in an external window.
     * @param url the link.
     */
    protected doOpenExternalLink = (url: string) => this.windowService.openNewWindow(url, { external: true });
    protected doOpenExternalLinkEnter = (e: React.KeyboardEvent, url: string) => {
        if (this.isEnterKey(e)) {
            this.doOpenExternalLink(url);
        }
    };

    protected isEnterKey(e: React.KeyboardEvent): boolean {
        return Key.ENTER.keyCode === KeyCode.createKeyCode(e.nativeEvent).key?.keyCode;
    }
    protected openUrl = (url: string) => this.windowService.openNewWindow(url, { external: true });

    protected renderHeader(): React.ReactNode {
        return (
            <div className="gs-header">
                <h1>
                    {this.applicationName}
                    <span className="gs-sub-header">
                        {this.applicationInfo && ` ${this.applicationInfo.version}`}
                    </span>
                </h1>
            </div>
        );
    }

    protected renderOpen(): React.ReactNode {
        const newProject = (
            <button className="theia-button large" onClick={this.createNewProject}>
                <i className="fa fa-plus"></i> {nls.localize('vuengine/projects/commands/newProject', 'New Project')}
            </button>
        );

        const openProject = <button
            className="theia-button large"
            tabIndex={0}
            onClick={this.doOpenWorkspace}
            onKeyDown={this.doOpenWorkspaceEnter}>
            <i className="fa fa-file-code-o"></i> {nls.localize('vuengine/projects/commands/openProject', 'Open Project...')}
        </button>;

        return <div className="gs-section">
            {openProject}
            {newProject}
            <br />
            <br />
        </div>;
    }

    /**
     * Render the recently used workspaces section.
     */
    protected renderRecentWorkspaces(): React.ReactNode {
        const content = this.vesRecentWorkspaces.map((item, index) =>
            <div className='gs-action-container' key={index}>
                <a
                    role={'button'}
                    tabIndex={0}
                    onClick={() => this.open(item.uri)}
                    onKeyDown={(e: React.KeyboardEvent) => this.openEnter(e, item.uri)}>
                    {item.name}
                </a>
                <span className='gs-action-details'>
                    {item.path}
                </span>
            </div>
        );

        // If the recently used workspaces list exceeds the limit,
        // display `More...` which triggers the recently used workspaces quick-open menu upon selection.
        const more = this.recentWorkspaces.length > this.recentLimit && <div className='gs-action-container'>
            <a
                role={'button'}
                tabIndex={0}
                onClick={this.doOpenRecentWorkspace}
                onKeyDown={this.doOpenRecentWorkspaceEnter}>
                {nls.localizeByDefault('More...')}
            </a>
        </div>;

        return <div className='gs-section'>
            <h3 className='gs-section-header'>
                <i className={codicon('history')}></i>{nls.localizeByDefault('Recent')}
            </h3>
            {this.vesRecentWorkspaces.length > 0 ? content : <p className='gs-no-recent'>{nls.localizeByDefault('No Recent Workspaces')}</p>}
            {more}
        </div >;
    }

    protected renderHelp(): React.ReactNode {
        return (
            <div className="gs-section">
                <h3 className="gs-section-header">
                    <i className={codicon('question')}></i>
                    {nls.localizeByDefault('Help')}
                </h3>
                <div className="gs-action-container">
                    <a href="#" onClick={this.openHandbook}>
                        {nls.localize('vuengine/gettingStarted/showDocumentation', 'Show Documentation')}
                    </a>
                </div>
            </div>
        );
    }

    protected renderLinks(): React.ReactNode {
        return (
            <div className="gs-section">
                <h3 className="gs-section-header">
                    <i className={codicon('link')}></i>
                    {nls.localize('vuengine/gettingStarted/links', 'Links')}
                </h3>
                <div className="gs-action-container">
                    <a href="#" onClick={() => this.openUrl('https://www.patreon.com/VUEngine')}>
                        {nls.localize('vuengine/gettingStarted/supportUsOnPatreon', 'Support Us on Patreon')}
                    </a>
                </div>
                <div className="gs-action-container">
                    <a href="#" onClick={() => this.openUrl('https://github.com/VUEngine/VUEngine-Studio')}>
                        Github
                    </a>
                </div>
                <div className="gs-action-container">
                    <a href="#" onClick={() => this.openUrl('https://www.vuengine.dev')}>
                        {nls.localize('vuengine/gettingStarted/vuengineWebsite', 'VUEngine Website')}
                    </a>
                </div>
                <div className="gs-action-container">
                    <a href="#" onClick={() => this.openUrl('https://www.virtual-boy.com')}>
                        Planet Virtual Boy
                    </a>
                </div>
            </div>
        );
    }

    protected renderPreferences(): React.ReactNode {
        return <div className="gs-section">
            <div className="gs-preference">
                <VesPreferences preferenceService={this.preferenceService}></VesPreferences>
            </div>
        </div>;
    }

    protected createNewProject = async () => this.commandRegistry.executeCommand(VesProjectCommands.NEW.id);
    protected openHandbook = async () => this.commandRegistry.executeCommand(VesDocumentationCommands.OPEN_HANDBOOK.id);

    protected async vesGetRecentWorkspaces(): Promise<void> {
        for (const workspace of this.recentWorkspaces.slice(0, this.recentLimit)) {
            const uri = new URI(workspace);
            const pathLabel = this.labelProvider.getLongName(uri);
            const path = this.vesCommonService.formatPath(this.home ? Path.tildify(pathLabel, this.home) : pathLabel);
            const name = await this.vesProjectsService.getProjectName(uri);

            this.vesRecentWorkspaces.push({
                name, uri, path
            });
        }
    }
}

export interface PreferencesProps {
    preferenceService: PreferenceService;
}

function VesPreferences(props: PreferencesProps): JSX.Element {
    const [alwaysShow, setAlwaysShow] = React.useState<boolean>(props.preferenceService.get(VesGettingStartedPreferenceIds.ALWAYS_SHOW_WELCOME_PAGE, true));
    React.useEffect(() => {
        const preflistener = props.preferenceService.onPreferenceChanged(change => {
            if (change.preferenceName === VesGettingStartedPreferenceIds.ALWAYS_SHOW_WELCOME_PAGE) {
                const prefValue: boolean = change.newValue;
                setAlwaysShow(prefValue);
            }
        });
        return () => preflistener.dispose();
    }, [props.preferenceService]);
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newChecked = e.target.checked;
        props.preferenceService.updateValue(VesGettingStartedPreferenceIds.ALWAYS_SHOW_WELCOME_PAGE, newChecked);
    };
    return <div className='ves-preference'>
        <input type="checkbox" className="theia-input" id="alwaysShow" onChange={handleChange} checked={alwaysShow}></input>
        <label htmlFor="alwaysShow">
            {nls.localize('vuengine/gettingStarted/alwaysShowThisPage', 'Always show this page when no project is opened.')}
        </label>
    </div>;
}
