import * as React from '@theia/core/shared/react';
import { DisposableCollection, environment, isOSX } from '@theia/core';
import { injectable, inject } from '@theia/core/shared/inversify';
import { GettingStartedWidget } from '@theia/getting-started/lib/browser/getting-started-widget';
import { VesDocumentationCommands } from '../../documentation/browser/ves-documentation-commands';
import { VesProjectsCommands } from '../../projects/browser/ves-projects-commands';
import { codicon, PreferenceService } from '@theia/core/lib/browser';
import { VesBrandingPreferenceIds } from './ves-branding-preferences';

@injectable()
export class VesGettingStartedWidget extends GettingStartedWidget {
    @inject(PreferenceService)
    protected readonly preferenceService: PreferenceService;

    protected readonly toDispose = new DisposableCollection();

    protected openUrl = (url: string) => this.windowService.openNewWindow(url, { external: true });
    protected recentLimit = 10;
    protected async init(): Promise<void> {
        super.init();
        this.title.iconClass = 'codicon codicon-info';
        await this.preferenceService.ready;
        this.update();
    }

    protected render(): React.ReactNode {
        return <div className="ves-welcome-container">
            {this.renderHeader()}
            {this.renderOpen()}
            {this.renderRecentWorkspaces()}
            {this.renderHelp()}
            {this.renderSettings()}
            {this.renderLinks()}
            {this.renderPreferences()}
        </div >;
    }

    protected renderHeader(): React.ReactNode {
        return (
            <div className="ves-welcome-header">
                <h1>
                    {this.applicationName}
                    <span className="ves-welcome-sub-header">
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

        return <div className="ves-welcome-section">
            {newProject}
            {open}
            {/* openFile */}
            {openFolder}
            {openWorkspace}
            <br />
            <br />
        </div>;
    }

    protected renderHelp(): React.ReactNode {
        return (
            <div className="ves-welcome-section">
                <h3 className="ves-welcome-section-header">
                    <i className={codicon('question')}></i>
                    Help
                </h3>
                <div className="ves-welcome-action-container">
                    <a href="#" onClick={this.openHandbook}>
                        Show Documentation
                    </a>
                </div>
            </div>
        );
    }

    protected renderLinks(): React.ReactNode {
        return (
            <div className="ves-welcome-section">
                <h3 className="ves-welcome-section-header">
                    <i className={codicon('link')}></i>
                    Links
                </h3>
                <div className="ves-welcome-action-container">
                    <a href="#" onClick={() => this.openUrl('https://www.patreon.com/VUEngine')}>
                        Support Us on Patreon
                    </a>
                </div>
                <div className="ves-welcome-action-container">
                    <a href="#" onClick={() => this.openUrl('https://github.com/VUEngine/VUEngine-Studio')}>
                        Github
                    </a>
                </div>
                <div className="ves-welcome-action-container">
                    <a href="#" onClick={() => this.openUrl('https://www.vuengine.dev')}>
                        VUEngine Website
                    </a>
                </div>
                <div className="ves-welcome-action-container">
                    <a href="#" onClick={() => this.openUrl('https://www.virtual-boy.com')}>
                        Planet Virtual Boy
                    </a>
                </div>
            </div>
        );
    }

    protected renderPreferences(): React.ReactNode {
        return <div className="ves-welcome-section">
            <div className="ves-welcome-preference">
                <VesPreferences preferenceService={this.preferenceService}></VesPreferences>
            </div>
        </div>;
    }

    protected createNewProject = async () => this.commandRegistry.executeCommand(VesProjectsCommands.NEW.id);
    protected openHandbook = async () => this.commandRegistry.executeCommand(VesDocumentationCommands.OPEN_HANDBOOK.id);
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
