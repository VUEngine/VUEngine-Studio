import { injectable } from 'inversify';
import * as React from 'react';

import { environment, isOSX } from '@theia/core';
import { GettingStartedWidget } from '@theia/getting-started/lib/browser/getting-started-widget';

import { VesProjectsCommands } from 'vuengine-studio-projects/lib/browser/ves-projects-commands';

@injectable()
export class VesGettingStartedWidget extends GettingStartedWidget {
    protected openUrl = (url: string) => this.windowService.openNewWindow(url, { external: true });

    protected render(): React.ReactNode {
        return <div className="ves-welcome-container">
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
                </div>
                <div className="ves-welcome-flex-grid-column">
                    <div className="ves-welcome-flex-grid help">
                        <div className="ves-welcome-col">{this.renderHelp()}</div>
                    </div>
                </div>
            </div>
        </div>;
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
            <button className="theia-button large" onClick={this.newProject}>
                <i className="fa fa-plus"></i> Create New Project
            </button>
        );

        const open = requireSingleOpen && <button
            className="theia-button large"
            tabIndex={0}
            onClick={this.doOpen}
            onKeyDown={this.doOpenEnter}>
            <i className="fa fa-folder-open"></i> Open Project
        </button>;

        const openFile = !requireSingleOpen && <button
            className="theia-button large"
            tabIndex={0}
            onClick={this.doOpenFile}
            onKeyDown={this.doOpenFileEnter}>
            <i className="fa fa-file-o"></i> Open File
        </button>;

        const openFolder = !requireSingleOpen && <button
            className="theia-button large"
            tabIndex={0}
            onClick={this.doOpenFolder}
            onKeyDown={this.doOpenFolderEnter}>
            <i className="fa fa-folder-open"></i> Open Project
        </button>;

        const openWorkspace = <button
            className="theia-button large"
            tabIndex={0}
            onClick={this.doOpenWorkspace}
            onKeyDown={this.doOpenWorkspaceEnter}>
            <i className="fa fa-file-code-o"></i> Open Workspace
        </button>;

        // TODO: New Project from GIT
        return <div className="ves-welcome-section">
            {newProject}
            {open}
            {openFile}
            {openFolder}
            {openWorkspace}
        </div>;
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

    protected newProject = () => this.commandRegistry.executeCommand(VesProjectsCommands.NEW.id);
}