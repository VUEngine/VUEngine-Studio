import * as React from 'react';
import { Message, PreferenceService, codicon } from '@theia/core/lib/browser';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { GettingStartedWidget } from '@theia/getting-started/lib/browser/getting-started-widget';
import { VSXEnvironment } from '@theia/vsx-registry/lib/common/vsx-environment';
import { WindowService } from '@theia/core/lib/browser/window/window-service';
import { nls } from '@theia/core';
import { VesProjectCommands } from '../../project/browser/ves-project-commands';

@injectable()
export class VesGettingStartedWidget extends GettingStartedWidget {

    @inject(VSXEnvironment)
    protected readonly environment: VSXEnvironment;

    @inject(WindowService)
    protected readonly windowService: WindowService;

    @inject(PreferenceService)
    protected readonly preferenceService: PreferenceService;

    protected recentLimit = 10;

    @postConstruct()
    protected init(): void {
        super.init();
        this.title.iconClass = codicon('info');
    }

    protected async doInit(): Promise<void> {
        super.doInit();
        await this.preferenceService.ready;
        this.update();
    }

    protected onActivateRequest(msg: Message): void {
        super.onActivateRequest(msg);
        const htmlElement = document.getElementById('alwaysShowWelcomePage');
        if (htmlElement) {
            htmlElement.focus();
        }
    }

    protected createNewProject = async () => this.commandRegistry.executeCommand(VesProjectCommands.NEW.id);

    protected render(): React.ReactNode {
        return <>
            <div className='gs-content-container'>
                {this.renderHeader()}
                <hr className='gs-hr' />
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
        return <>
            <div className='flex-grid'>
                <div className='col'>
                    {this.renderOpen()}
                </div>
            </div>
            <div className='flex-grid'>
                <div className='col'>
                    {this.renderRecentWorkspaces()}
                </div>
            </div>
            <div className='flex-grid'>
                <div className='col'>
                    {this.renderHelp()}
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
        </>;
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

    protected renderVersion(): React.ReactNode {
        return <span className='gs-sub-header' >
            {' Preview'}
            {/* this.applicationInfo ? ` ${this.applicationInfo.version} (Preview)` : ' (Preview)' */}
        </span>;
    }

    protected renderHelp(): React.ReactNode {
        const documentationUrl = 'https://www.vuengine.dev/documentation/';
        return <div className='gs-section'>
            <h3 className='gs-section-header'>
                <i className={codicon('question')}></i>
                {nls.localizeByDefault('Help')}
            </h3>
            <div className='gs-action-container'>
                <a
                    role={'button'}
                    tabIndex={0}
                    onClick={() => this.doOpenExternalLink(documentationUrl)}
                    onKeyDown={(e: React.KeyboardEvent) => this.doOpenExternalLinkEnter(e, documentationUrl)}>
                    {nls.localizeByDefault('Documentation')}
                </a>
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
