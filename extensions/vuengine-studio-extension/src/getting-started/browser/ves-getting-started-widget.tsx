import { Path, URI, nls } from '@theia/core';
import { PreferenceService, codicon } from '@theia/core/lib/browser';
import { WindowService } from '@theia/core/lib/browser/window/window-service';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { GettingStartedWidget } from '@theia/getting-started/lib/browser/getting-started-widget';
import { VSXEnvironment } from '@theia/vsx-registry/lib/common/vsx-environment';
import * as React from 'react';
import { VesCoreContribution } from '../../core/browser/ves-core-contribution';
import HContainer from '../../editors/browser/components/Common/HContainer';
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
                        {this.renderLinks()}
                    </div>
                </div>
                <div className='flex-grid'>
                    <div className='col'>
                        {this.renderHelp()}
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
                {this.applicationName}
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
        const newProject = (
            <button className="theia-button large" onClick={this.createNewProject}>
                <i className="codicon codicon-add"></i> {nls.localize('vuengine/projects/commands/newProject', 'New Project')}
            </button>
        );

        const openWorkspace = <button
            className="theia-button large"
            tabIndex={0}
            onClick={this.doOpenWorkspace}
            onKeyDown={this.doOpenWorkspaceEnter}>
            <i className="codicon codicon-file-code"></i> {nls.localize('vuengine/projects/commands/openWorkspace', 'Open Workspace...')}
        </button>;

        const openFolder = <button
            className="theia-button large"
            tabIndex={0}
            onClick={this.doOpenFolder}
            onKeyDown={this.doOpenFolderEnter}>
            <i className="codicon codicon-folder"></i> {nls.localize('vuengine/projects/commands/openFolder', 'Open Folder...')}
        </button>;

        return <div className="gs-section">
            {openWorkspace}
            {openFolder}
            {newProject}
            <br />
            <br />
        </div>;
    }

    protected renderVersion(): React.ReactNode {
        return <span className='gs-sub-header' >
            {' Preview'}
            {/* this.applicationInfo ? ` ${this.applicationInfo.version} (Preview)` : ' (Preview)' */}
        </span>;
    }

    protected renderHelp(): React.ReactNode {
        return <div className='gs-section'>
            <h3 className='gs-section-header'>
                <i className={codicon('question')}></i>
                {nls.localizeByDefault('Help')}
            </h3>
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
                    'vuengine/gettingStarted/showcaseIntroduction',
                    // eslint-disable-next-line max-len
                    'New to VUEngine? Create a new project based on VUEngine Showcase and dig into the sources to learn about the engine\'s concepts and capabilities. Various sample states expose you to key aspects of the engine step by step through cleanly written and properly commented code.'
                )}
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
}
