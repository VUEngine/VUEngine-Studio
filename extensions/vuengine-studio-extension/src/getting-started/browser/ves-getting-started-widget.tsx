import { Path, PreferenceService, URI, nls } from '@theia/core';
import { codicon } from '@theia/core/lib/browser';
import { WindowService } from '@theia/core/lib/browser/window/window-service';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { GettingStartedWidget, PreferencesProps } from '@theia/getting-started/lib/browser/getting-started-widget';
import { VSXEnvironment } from '@theia/vsx-registry/lib/common/vsx-environment';
import * as React from 'react';
import { VesCoreContribution } from '../../core/browser/ves-core-contribution';
import HContainer from '../../editors/browser/components/Common/Base/HContainer';
import { VesProjectCommands } from '../../project/browser/ves-project-commands';
import { VesProjectService } from '../../project/browser/ves-project-service';

@injectable()
export class VesGettingStartedWidget extends GettingStartedWidget {

    @inject(VSXEnvironment)
    protected readonly environment: VSXEnvironment;
    @inject(VesProjectService)
    protected readonly vesProjectService: VesProjectService;
    @inject(WindowService)
    protected readonly windowService: WindowService;
    @inject(PreferenceService)
    protected readonly preferenceService: PreferenceService;

    protected recentLimit = 10;
    protected vesRecentWorkspaces: Array<{ name: string, uri: URI, path: string }> = [];

    @postConstruct()
    protected init(): void {
        super.init();
        this.title.iconClass = codicon('info');
    }

    protected async doInit(): Promise<void> {
        await super.doInit();
        await this.preferenceService.ready;
        await this.vesGetRecentWorkspaces();
        this.update();
    }

    protected createNewProject = async () => this.commandRegistry.executeCommand(VesProjectCommands.NEW.id);

    protected async vesGetRecentWorkspaces(): Promise<void> {
        for (const workspace of this.recentWorkspaces.slice(0, this.recentLimit)) {
            const uri = new URI(workspace);
            const pathLabel = this.labelProvider.getLongName(uri);
            const path = this.home ? Path.tildify(pathLabel, this.home) : pathLabel;
            const name = await this.vesProjectService.getProjectName(uri);

            this.vesRecentWorkspaces.push({
                name, uri, path
            });
        }
    }

    protected render(): React.ReactNode {
        return <>
            <div className='gs-content-container'>
                {this.renderHeader()}
                <div className='flex-grid'>
                    <div className='col'>
                        {this.renderOpen()}
                    </div>
                </div>
                <div className='flex-grid'>
                    <div className='col'>
                        {this.renderActions()}
                    </div>
                </div>
            </div>
            <div className='gs-content-container'>
                {this.renderPreferences()}
            </div>
        </>;
    }

    protected renderActions(): React.ReactNode {
        return <HContainer alignItems='start' wrap='wrap'>
            <div style={{ paddingRight: 20 }}>
                <div className='flex-grid'>
                    <div className='col'>
                        {this.renderRecentWorkspaces()}
                    </div>
                </div>
                <div className='flex-grid'>
                    <div className='col'>
                        {this.renderSettings()}
                    </div>
                </div>
                <div className='flex-grid'>
                    <div className='col'>
                        {this.renderHelp()}
                    </div>
                </div>
                <div className='flex-grid'>
                    <div className='col'>
                        {this.renderLinks()}
                    </div>
                </div>
            </div>
            <div style={{ width: 384 }}>
                <div className='flex-grid'>
                    <div className='col'>
                        {this.renderLearn()}
                    </div>
                </div>
            </div>
        </HContainer>;
    }

    protected renderHeader(): React.ReactNode {
        return <div className='gs-header'>
            <h1>
                {this.applicationName}{' '}
                <span className="gs-sub-header">
                    {this.renderVersion()}
                </span>
            </h1>
        </div>;
    }

    protected renderRecentWorkspaces(): React.ReactNode {
        const content = this.vesRecentWorkspaces.map((item, index) =>
            <div className='gs-action-container' key={index}>
                <a
                    role={'button'}
                    tabIndex={0}
                    onClick={() => this.open(item.uri)}
                    onKeyDown={(e: React.KeyboardEvent) => this.openEnter(e, item.uri)}
                >
                    {item.name}
                </a>
                <span className='gs-action-details'>
                    {item.uri.path.fsPath()}
                </span>
            </div>
        );

        const more = this.vesRecentWorkspaces.length > this.recentLimit && <div className='gs-action-container'>
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
            {this.vesRecentWorkspaces.length > 0 ? content : <p className='gs-no-recent'>
                {nls.localize('vuengine/gettingStarted/noRecentlyOpenedProjects', 'You have no recently opened projects,') + ' '}
                <a
                    role={'button'}
                    tabIndex={0}
                    onClick={this.doOpenWorkspace}
                    onKeyDown={this.doOpenWorkspaceEnter}>
                    {nls.localize('vuengine/gettingStarted/openAProject', 'open a project')}
                </a>
                {' ' + nls.localizeByDefault('to start.')}
            </p>}
            {more}
        </div>;
    }

    protected renderOpen(): React.ReactNode {
        const openWorkspace = (
            <button
                className="theia-button large"
                onClick={this.doOpenWorkspace}
            >
                <i className="codicon codicon-folder-library"></i> {nls.localize('vuengine/projects/commands/openWorkspace', 'Open Workspace...')}
            </button>
        );

        const openFolder = (
            <button
                className="theia-button large"
                onClick={this.doOpenFolder}
            >
                <i className="codicon codicon-folder"></i> {nls.localize('vuengine/projects/commands/openFolder', 'Open Folder...')}
            </button>
        );

        const newProject = (
            <button
                className="theia-button large"
                onClick={this.createNewProject}
            >
                <i className="codicon codicon-add"></i> {nls.localize('vuengine/projects/commands/newProject', 'New Project')}
            </button>
        );
        const documentation = (
            <button
                className="theia-button secondary large"
                onClick={() => this.doOpenExternalLink(VesCoreContribution.DOCUMENTATION_URL)}
                style={{
                    minWidth: 'unset',
                    width: 52,
                }}
            >
                <i className="codicon codicon-book"></i>
            </button>
        );

        return <div className="gs-section">
            {openWorkspace}
            {openFolder}
            {newProject}
            {documentation}
            <br />
            <br />
        </div>;
    }

    protected renderVersion(): React.ReactNode {
        return <span className='gs-sub-header'>
            {this.applicationInfo && this.applicationInfo.version}
        </span>;
    }

    protected renderHelp(): React.ReactNode {
        return <div className='gs-section'>
            <h3 className='gs-section-header'>
                <i className={codicon('question')}></i>
                {nls.localizeByDefault('Help')}
            </h3>
            <div className="gs-action-container">
                <a
                    role={'button'}
                    tabIndex={0}
                    onClick={() => this.doOpenExternalLink(VesCoreContribution.TUTORIAL_URL)}
                    onKeyDown={(e: React.KeyboardEvent) => this.doOpenExternalLinkEnter(e, VesCoreContribution.TUTORIAL_URL)}>
                    {nls.localize('vuengine/gettingStarted/tutorial', 'Tutorial')}
                </a>
            </div>
            <div className='gs-action-container'>
                <a
                    role={'button'}
                    tabIndex={0}
                    onClick={() => this.doOpenExternalLink(VesCoreContribution.DOCUMENTATION_URL)}
                    onKeyDown={(e: React.KeyboardEvent) => this.doOpenExternalLinkEnter(e, VesCoreContribution.DOCUMENTATION_URL)}>
                    {nls.localizeByDefault('Documentation')}
                </a>
            </div>
        </div>;
    }

    protected renderLearn(): React.ReactNode {
        return <div className="gs-section">
            <h3 className="gs-section-header">
                <i className={codicon('lightbulb')}></i>
                {nls.localize('vuengine/gettingStarted/learn', 'Learn')}
            </h3>
            <div className="gs-action-container">
                {nls.localize(
                    'vuengine/gettingStarted/learnIntroduction',
                    "New to VUEngine? Check out our step-by-step tutorial (link on the left) that implements a simple game with VUEngine Studio. \
To dive deeper, check out the documentation's user guide, \
create a new project based on VUEngine Showcase and dig into the sources to learn about the engine's concepts and capabilities. \
Various sample states expose you to key aspects of the engine step by step through cleanly written and properly commented code."
                )}
            </div>
            <div className="gs-action-container">
                <div className="gs-learn-screenshot"></div>
            </div>
        </div>;
    }

    protected renderLinks(): React.ReactNode {
        return (
            <div className="gs-section">
                <h3 className="gs-section-header">
                    <i className={codicon('link')}></i>
                    {nls.localize('vuengine/gettingStarted/links', 'Links')}
                </h3>
                <div className="gs-action-container">
                    <a href="#" onClick={() => this.doOpenExternalLink('https://www.patreon.com/VUEngine')}>
                        {nls.localize('vuengine/gettingStarted/supportUsOnPatreon', 'Support Us on Patreon')}
                    </a>
                </div>
                <div className="gs-action-container">
                    <a href="#" onClick={() => this.doOpenExternalLink('https://github.com/VUEngine/VUEngine-Studio')}>
                        Github
                    </a>
                </div>
                <div className="gs-action-container">
                    <a href="#" onClick={() => this.doOpenExternalLink('https://www.vuengine.dev')}>
                        {nls.localize('vuengine/gettingStarted/vuengineWebsite', 'VUEngine Website')}
                    </a>
                </div>
                <div className="gs-action-container">
                    <a href="#" onClick={() => this.doOpenExternalLink('https://www.virtual-boy.com')}>
                        Planet Virtual Boy
                    </a>
                </div>
            </div>
        );
    }

    protected renderPreferences(): React.ReactNode {
        return <VesWelcomePreferences preferenceService={this.preferenceService}></VesWelcomePreferences>;
    }
}

function VesWelcomePreferences(props: PreferencesProps): React.JSX.Element {
    const [startupEditor, setStartupEditor] = React.useState<string>(
        props.preferenceService.get('workbench.startupEditor', 'welcomePageInEmptyWorkbench')
    );
    React.useEffect(() => {
        const prefListener = props.preferenceService.onPreferenceChanged(change => {
            if (change.preferenceName === 'workbench.startupEditor') {
                const prefValue = change.newValue;
                setStartupEditor(prefValue as string);
            }
        });
        return () => prefListener.dispose();
    }, [props.preferenceService]);
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.checked ? 'welcomePageInEmptyWorkbench' : 'none';
        props.preferenceService.updateValue('workbench.startupEditor', newValue);
    };
    return (
        <div className='gs-preference'>
            <input
                type="checkbox"
                className="theia-input"
                id="startupEditor"
                onChange={handleChange}
                checked={startupEditor === 'welcomePage' || startupEditor === 'welcomePageInEmptyWorkbench'}
            />
            <label htmlFor="startupEditor">
                {nls.localize('vuengine/gettingStarted/showOnStartup', 'Show welcome page on startup when no workspace is opened')}
            </label>
        </div>
    );
}
