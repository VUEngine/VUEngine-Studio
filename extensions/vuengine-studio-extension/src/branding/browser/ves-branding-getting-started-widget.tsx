import { DisposableCollection, environment, isOSX, nls, Path } from '@theia/core';
import { codicon, PreferenceService } from '@theia/core/lib/browser';
import URI from '@theia/core/lib/common/uri';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import * as React from '@theia/core/shared/react';
import { GettingStartedWidget } from '@theia/getting-started/lib/browser/getting-started-widget';
import { VesDocumentationCommands } from '../../documentation/browser/ves-documentation-commands';
import { VesProjectsCommands } from '../../projects/browser/ves-projects-commands';
import { VesProjectsService } from '../../projects/browser/ves-projects-service';
import { VesBrandingPreferenceIds } from './ves-branding-preferences';

@injectable()
export class VesGettingStartedWidget extends GettingStartedWidget {
    @inject(PreferenceService)
    protected readonly preferenceService: PreferenceService;
    @inject(VesProjectsService)
    protected readonly vesProjectsService: VesProjectsService;

    protected readonly toDispose = new DisposableCollection();
    protected vesRecentWorkspaces: Array<{ name: string, uri: URI, path: string }> = [];

    protected openUrl = (url: string) => this.windowService.openNewWindow(url, { external: true });
    protected recentLimit = 10;

    @postConstruct()
    protected async init(): Promise<void> {
        await super.init();

        this.title.iconClass = 'codicon codicon-info';
        await this.preferenceService.ready;
        await this.vesGetRecentWorkspaces();
        this.update();
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
        const requireSingleOpen = isOSX || !environment.electron.is();

        const newProject = (
            <button className="theia-button large" onClick={this.createNewProject}>
                <i className="fa fa-plus"></i> Create New Project
            </button>
        );

        const open = requireSingleOpen && <button
            className="theia-button large"
            tabIndex={0}
            onClick={this.doOpen}
            onKeyDown={this.doOpenEnter}>
            <i className="fa fa-folder-open"></i> Open Folder
        </button>;

        /* const openFile = !requireSingleOpen && <button
            className="theia-button large"
            tabIndex={0}
            onClick={this.doOpenFile}
            onKeyDown={this.doOpenFileEnter}>
            <i className="fa fa-file-o"></i> Open File
        </button>; */

        const openFolder = !requireSingleOpen && <button
            className="theia-button large"
            tabIndex={0}
            onClick={this.doOpenFolder}
            onKeyDown={this.doOpenFolderEnter}>
            <i className="fa fa-folder-open"></i> Open Folder
        </button>;

        const openWorkspace = <button
            className="theia-button large"
            tabIndex={0}
            onClick={this.doOpenWorkspace}
            onKeyDown={this.doOpenWorkspaceEnter}>
            <i className="fa fa-file-code-o"></i> Open Workspace
        </button>;

        return <div className="gs-section">
            {newProject}
            {open}
            {/* openFile */}
            {openFolder}
            {openWorkspace}
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
                    Help
                </h3>
                <div className="gs-action-container">
                    <a href="#" onClick={this.openHandbook}>
                        Show Documentation
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
                    Links
                </h3>
                <div className="gs-action-container">
                    <a href="#" onClick={() => this.openUrl('https://www.patreon.com/VUEngine')}>
                        Support Us on Patreon
                    </a>
                </div>
                <div className="gs-action-container">
                    <a href="#" onClick={() => this.openUrl('https://github.com/VUEngine/VUEngine-Studio')}>
                        Github
                    </a>
                </div>
                <div className="gs-action-container">
                    <a href="#" onClick={() => this.openUrl('https://www.vuengine.dev')}>
                        VUEngine Website
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

    protected createNewProject = async () => this.commandRegistry.executeCommand(VesProjectsCommands.NEW.id);
    protected openHandbook = async () => this.commandRegistry.executeCommand(VesDocumentationCommands.OPEN_HANDBOOK.id);

    protected async vesGetRecentWorkspaces(): Promise<void> {
        for (const workspace of this.recentWorkspaces.slice(0, this.recentLimit)) {
            const uri = new URI(workspace);
            const pathLabel = this.labelProvider.getLongName(uri);
            const path = this.home ? Path.tildify(pathLabel, this.home) : pathLabel;
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
    const [alwaysShowWelcomePage, setAlwaysShowWelcomePage] = React.useState<boolean>(props.preferenceService.get(VesBrandingPreferenceIds.ALWAYS_SHOW_WELCOME_PAGE, true));
    React.useEffect(() => {
        const preflistener = props.preferenceService.onPreferenceChanged(change => {
            if (change.preferenceName === VesBrandingPreferenceIds.ALWAYS_SHOW_WELCOME_PAGE) {
                const prefValue: boolean = change.newValue;
                setAlwaysShowWelcomePage(prefValue);
            }
        });
        return () => preflistener.dispose();
    }, [props.preferenceService]);
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newChecked = e.target.checked;
        props.preferenceService.updateValue(VesBrandingPreferenceIds.ALWAYS_SHOW_WELCOME_PAGE, newChecked);
    };
    return <div className='ves-preference'>
        <input type="checkbox" className="theia-input" id="alwaysShowWelcomePage" onChange={handleChange} checked={alwaysShowWelcomePage}></input>
        <label htmlFor="alwaysShowWelcomePage">Always show this page when no workspace is loaded.</label>
    </div>;
}
