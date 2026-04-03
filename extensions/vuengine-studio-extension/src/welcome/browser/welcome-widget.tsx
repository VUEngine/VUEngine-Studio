/* eslint-disable max-len */
import { CommandRegistry, nls, Path, URI } from '@theia/core';
import { CommonCommands, Key, KeyCode, LabelProvider, ReactWidget } from '@theia/core/lib/browser';
import { FrontendApplicationConfigProvider } from '@theia/core/lib/browser/frontend-application-config-provider';
import { WindowService } from '@theia/core/lib/browser/window/window-service';
import { ApplicationInfo, ApplicationServer } from '@theia/core/lib/common/application-protocol';
import { EnvVariablesServer } from '@theia/core/lib/common/env-variables';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { WorkspaceCommands, WorkspaceService } from '@theia/workspace/lib/browser';
import * as React from 'react';
import styled from 'styled-components';
import { VesCoreContribution } from '../../core/browser/ves-core-contribution';
import { VesProjectCommands } from '../../project/browser/ves-project-commands';
import { VesProjectService } from '../../project/browser/ves-project-service';
import { VUENGINE_WORKSPACE_EXT } from '../../project/browser/ves-project-types';

const StyledWelcomeContainer = styled.div`
    display: flex;
    flex-direction: row;
    height: 100%;
`;

const StyledLeftBar = styled.div`
    border-right: 1px solid var(--theia-secondaryButton-background);
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    gap: calc(4 * var(--theia-ui-padding));
    max-width: 240px;
    min-width: 240px;
    padding: calc(2 * var(--theia-ui-padding));
`;

const StyledApplicationAbout = styled.div`
    align-items: center;
    display: flex;
    flex-direction: column;
    gap: calc(2 * var(--theia-ui-padding));
`;

const StyledApplicationTitle = styled.div`
    font-size: 180%;
    font-weight: 400;
    text-align: center;
    width: 100%;
`;

const StyledApplicationLogo = styled.div`
    cursor: pointer;
    height: 200px;
    width: 200px;
`;

const StyledApplicationVersion = styled.span`
    opacity: .5;
    text-transform: capitalize;
`;

const StyledButtonsContainer = styled.div`
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    gap: var(--theia-ui-padding);

    div {
        display: flex;
        flex-direction: column;
        gap: var(--theia-ui-padding);

        &:first-child {
            flex-grow: 1;
        }
    }

    button {
        align-items: center;
        display: flex;
        gap: var(--theia-ui-padding);
        justify-content: start;
        margin: 0;
        width: 100%;
    }
`;

const StyledRightBar = styled.div`
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    gap: var(--theia-ui-padding);
    overflow: scroll;
    padding: calc(2 * var(--theia-ui-padding));
`;

const StyledRecentProjectsContainer = styled.div`
    display: flex;
    // flex-direction: row;
    flex-direction: column;
    flex-wrap: wrap;
    gap: calc(2 * var(--theia-ui-padding));
`;

const StyledRecentProjectItem = styled.a`
    border: 1px solid var(--theia-secondaryButton-background);
    border-radius: 2px;
    box-sizing: border-box;
    color: var(--theia-foreground-color);
    cursor: pointer;
    display: flex;
    flex-direction: row;
    gap: calc(2 * var(--theia-ui-padding));
    max-width: 640px;
    min-height: 70px;
    padding: var(--theia-ui-padding);
    width: 100%;

    &:hover,
    &:focus,
    &:active {
        background-color: var(--theia-secondaryButton-background);
        color: #fff;
        border-color: var(--theia-focusBorder);
        color: var(--theia-foreground-color);
    }

    &.center-icon {
        align-items: center;
        justify-content: center;

        i {
            opacity: .5;
        }
    }
`;

const StyledRecentProjectCartridge = styled.div`
    background-image: url('data:image/png;base64,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');
    background-position: center;
    background-repeat: no-repeat;
    background-size: contain;
    display: flex;
    height: 56px;
    justify-content: center;
    width: 58px;

    div {
        // background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAALIAAACQCAMAAACbMMFnAAAAwFBMVEXREB3KEB3NEh8nFBXyDyDpDyDiDx/eDx/aEB/PDx/cESDaESDSEB/QEB7PEB7NEB7GDx3FDx3ZESDYER/WER/UER/LEB7JEB3HEB7HEB3FEB3FEB7IER+9EB3JEh+eERyPEhtNFhofFxgRFRUYGxsaHBwYGRkAEA8NHRwAGRcDHhwBFhQBExEDHRoLFBMIGRcPExITFxYZHBseGhoZFhYbGBgUEhIXFRUbGRkQDw8cHBwaGhoXFxcWFhYVFRUSEhJObg6VAAAACXBIWXMAAAsTAAALEwEAmpwYAAAHsmlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNi4wLWMwMDYgNzkuMTY0NzUzLCAyMDIxLzAyLzE1LTExOjUyOjEzICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgMjIuMyAoTWFjaW50b3NoKSIgeG1wOkNyZWF0ZURhdGU9IjIwMjYtMDQtMDNUMTU6NDE6NDMrMDI6MDAiIHhtcDpNb2RpZnlEYXRlPSIyMDI2LTA0LTAzVDE2OjE0OjEwKzAyOjAwIiB4bXA6TWV0YWRhdGFEYXRlPSIyMDI2LTA0LTAzVDE2OjE0OjEwKzAyOjAwIiBkYzpmb3JtYXQ9ImltYWdlL3BuZyIgcGhvdG9zaG9wOkNvbG9yTW9kZT0iMiIgcGhvdG9zaG9wOklDQ1Byb2ZpbGU9InNSR0IgSUVDNjE5NjYtMi4xIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjUyYjY4ODgyLWYwYTEtNDFlNi05YTU1LTg4YTAyZGI3MTE5MiIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDo1MmI2ODg4Mi1mMGExLTQxZTYtOWE1NS04OGEwMmRiNzExOTIiIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDo1MmI2ODg4Mi1mMGExLTQxZTYtOWE1NS04OGEwMmRiNzExOTIiPiA8cGhvdG9zaG9wOkRvY3VtZW50QW5jZXN0b3JzPiA8cmRmOkJhZz4gPHJkZjpsaT5EMkZENkM0OERGNjE1MTRENjZENTQ3OTFEQjkyNzlFQzwvcmRmOmxpPiA8cmRmOmxpPmFkb2JlOmRvY2lkOnBob3Rvc2hvcDoxZWU5NGMwNS0wMjM4LWQ0NDQtOGU5NS1lMDg4OTVmODgzMWU8L3JkZjpsaT4gPHJkZjpsaT5hZG9iZTpkb2NpZDpwaG90b3Nob3A6MzQwOGE1ZjMtOTE4NS0xMWU3LTk3MGEtYTIxM2MzYmQ0YTBjPC9yZGY6bGk+IDxyZGY6bGk+YWRvYmU6ZG9jaWQ6cGhvdG9zaG9wOjVkZjIyNjkyLTkxNzEtMTFlNy1iMjAyLWY2NjY3NmZiM2ZhZjwvcmRmOmxpPiA8cmRmOmxpPmFkb2JlOmRvY2lkOnBob3Rvc2hvcDo2MGQyYTE0MC0zNjQyLTJmNDctYTVkYS0zMDkyZTk5Nzc3OWY8L3JkZjpsaT4gPHJkZjpsaT5hZG9iZTpkb2NpZDpwaG90b3Nob3A6OTI4MjAwYjAtNTRlYi1mOTQ5LTg2NzAtZDY3ZDEzNzgwMDk2PC9yZGY6bGk+IDxyZGY6bGk+YWRvYmU6ZG9jaWQ6cGhvdG9zaG9wOmE3YTBjNGU4LTkxODUtMTFlNy05NzBhLWEyMTNjM2JkNGEw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');
        background-position: center;
        background-repeat: no-repeat;
        background-size: cover;
        border-radius: 3%;
        height: 58%;
        margin-top: 8.5%;
        width: 69%;
    }
`;

const StyledRecentProjectDetails = styled.div`
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    justify-content: space-evenly;

    div {
        &:first-child {
            font-size: 140%;
        }

        &:last-child {
            line-height: 200%;
            opacity: .5;
        }
    }
`;
const StyledRecentProjectActions = styled.div`
    visibility: hidden;

    ${StyledRecentProjectItem}:hover & {
        visibility: visible;        
    }

    .codicon {
        border-radius: 2px;
        padding: 4px;

        &:hover {
            background-color: var(--theia-focusBorder);
            color: #fff;
        }
    }
`;

@injectable()
export class WelcomeWidget extends ReactWidget {
    @inject(ApplicationServer)
    protected readonly appServer: ApplicationServer;
    @inject(CommandRegistry)
    protected readonly commandRegistry: CommandRegistry;
    @inject(EnvVariablesServer)
    protected readonly environments: EnvVariablesServer;
    @inject(FileService)
    protected readonly fileService: FileService;
    @inject(LabelProvider)
    protected readonly labelProvider: LabelProvider;
    @inject(VesProjectService)
    protected readonly vesProjectService: VesProjectService;
    @inject(WindowService)
    protected readonly windowService: WindowService;
    @inject(WorkspaceService)
    protected readonly workspaceService: WorkspaceService;

    static readonly ID = 'welcomeWidget';
    static readonly LABEL = nls.localizeByDefault('Welcome');

    protected home: string | undefined;
    protected applicationInfo: ApplicationInfo | undefined;
    protected recentLimit = 20;
    protected recentWorkspaces: Array<{ name: string, uri: URI, path: string, label?: string }> = [];
    protected hasMoreRecentWorkspaces = false;

    @postConstruct()
    protected init(): void {
        this.doInit();
    }

    protected async doInit(): Promise<void> {
        this.id = WelcomeWidget.ID;
        this.title.label = WelcomeWidget.LABEL;
        this.title.caption = WelcomeWidget.LABEL;
        this.title.closable = false;

        this.applicationInfo = await this.appServer.getApplicationInfo();
        this.home = new URI(await this.environments.getHomeDirUri()).path.toString();

        await this.getRecentWorkspaces();

        this.update();
    }

    protected async getRecentWorkspaces(): Promise<void> {
        const recentWorkspaces = await this.workspaceService.recentWorkspaces();
        for (const workspace of recentWorkspaces.slice(0, this.recentLimit)) {
            const uri = new URI(workspace);
            const pathLabel = this.labelProvider.getLongName(uri);
            const path = this.home ? Path.tildify(pathLabel, this.home) : pathLabel;
            const name = await this.vesProjectService.getProjectName(uri);

            let label: string | undefined;
            let labelUri = uri.parent.resolve('label.png');
            if (uri.path.ext !== `.${VUENGINE_WORKSPACE_EXT}`) {
                labelUri = uri.resolve('label.png');
            }
            if (await this.fileService.exists(labelUri)) {
                label = `url(file://${labelUri.path.fsPath()})`;
            }

            this.recentWorkspaces.push({
                name, uri, path, label
            });
        }

        this.hasMoreRecentWorkspaces = recentWorkspaces.length > this.recentLimit;
    }

    protected render(): React.ReactNode {
        const applicationInfo = this.applicationInfo;
        const applicationName = FrontendApplicationConfigProvider.get().applicationName;

        return (
            <StyledWelcomeContainer>
                <StyledLeftBar>
                    <StyledApplicationAbout>
                        <StyledApplicationLogo
                            className="ves-about-logo"
                            onClick={this.doOpenAbout}
                        />
                        <StyledApplicationTitle>
                            {applicationName}
                            <StyledApplicationVersion>
                                {applicationInfo && ` ${applicationInfo.version}`}
                            </StyledApplicationVersion>
                        </StyledApplicationTitle>
                    </StyledApplicationAbout>
                    {this.renderActions()}
                </StyledLeftBar>
                <StyledRightBar>
                    {this.renderRecentWorkspaces()}
                </StyledRightBar>
            </StyledWelcomeContainer>
        );
    }

    protected renderActions(): React.ReactNode {
        const openWorkspace = (
            <button
                className="theia-button large"
                onClick={this.doOpenWorkspace}
            >
                <i className="codicon codicon-folder-library"></i> {nls.localizeByDefault('Open Workspace')}
            </button>
        );

        const openFolder = (
            <button
                className="theia-button large"
                onClick={this.doOpenFolder}
            >
                <i className="codicon codicon-folder"></i> {nls.localizeByDefault('Open Folder')}
            </button>
        );

        const newProject = (
            <button
                className="theia-button large"
                onClick={this.createNewProject}
            >
                <i className="codicon codicon-add"></i> {VesProjectCommands.NEW.label}
            </button>
        );

        const gitClone = (
            <button
                className="theia-button large"
                onClick={this.gitClone}
            >
                <i className="codicon codicon-repo-clone"></i> {nls.localize('vuengine/welcome/gitClone', 'Git: Clone')}
            </button>
        );

        const documentation = (
            <button
                className="theia-button secondary large"
                onClick={() => this.doOpenExternalLink(VesCoreContribution.DOCUMENTATION_URL)}
            >
                <i className="codicon codicon-book"></i> {nls.localize('vuengine/welcome/documentation', 'Documentation')}
            </button>
        );

        return <StyledButtonsContainer>
            <div>
                {openWorkspace}
                {openFolder}
                {gitClone}
                {newProject}
            </div>
            <div>
                {documentation}
            </div>
        </StyledButtonsContainer>;
    }

    protected renderRecentWorkspaces(): React.ReactNode {
        const content = this.recentWorkspaces.slice(0, this.recentLimit).map((item, index) =>
            <StyledRecentProjectItem
                key={index}
                role={'button'}
                tabIndex={0}
                onClick={() => this.open(item.uri)}
                onKeyDown={(e: React.KeyboardEvent) => this.openEnter(e, item.uri)}
            >
                <StyledRecentProjectCartridge>
                    <div style={{ backgroundImage: item.label }} />
                </StyledRecentProjectCartridge>
                <StyledRecentProjectDetails>
                    <div>{item.name}</div>
                    <div>{item.path}</div>
                </StyledRecentProjectDetails>
                <StyledRecentProjectActions
                    onClick={e => this.removeRecentWorkspace(e, item.uri)}
                >
                    <i className="codicon codicon-close" />
                </StyledRecentProjectActions>
            </StyledRecentProjectItem>
        );

        return <>
            <StyledRecentProjectsContainer>
                {this.recentWorkspaces.length > 0
                    ? content
                    : <StyledRecentProjectItem
                        role={'button'}
                        className='center-icon'
                        onClick={this.createNewProject}
                        title={VesProjectCommands.NEW.label}
                    >
                        <i className='codicon codicon-add' />
                    </StyledRecentProjectItem>
                }
                {this.hasMoreRecentWorkspaces &&
                    <StyledRecentProjectItem
                        role={'button'}
                        className='center-icon'
                        onClick={this.doOpenRecentWorkspace}
                    >
                        <i className='codicon codicon-ellipsis' />
                    </StyledRecentProjectItem>
                }
            </StyledRecentProjectsContainer>
        </>;
    }

    protected doOpenFolder = () => this.commandRegistry.executeCommand(WorkspaceCommands.OPEN_FOLDER.id);
    protected doOpenWorkspace = () => this.commandRegistry.executeCommand(WorkspaceCommands.OPEN_WORKSPACE.id);
    protected doOpenRecentWorkspace = () => this.commandRegistry.executeCommand(WorkspaceCommands.OPEN_RECENT_WORKSPACE.id);
    protected doOpenAbout = () => this.commandRegistry.executeCommand(CommonCommands.ABOUT_COMMAND.id);

    protected open = (uri: URI) => this.workspaceService.open(uri);
    protected openEnter = (e: React.KeyboardEvent, uri: URI) => {
        if (this.isEnterKey(e)) {
            this.open(uri);
        }
    };

    protected doOpenExternalLink = (url: string) => this.windowService.openNewWindow(url, { external: true });
    protected createNewProject = async () => this.commandRegistry.executeCommand(VesProjectCommands.NEW.id);
    protected gitClone = async () => this.commandRegistry.executeCommand('git.clone');

    protected removeRecentWorkspace = async (e: React.MouseEvent, resource: URI) => {
        e.stopPropagation();
        await this.workspaceService.removeRecentWorkspace(resource.toString());
        this.recentWorkspaces = this.recentWorkspaces.filter(w => !w.uri.isEqual(resource));
        this.update();
    };

    protected isEnterKey(e: React.KeyboardEvent): boolean {
        return Key.ENTER.keyCode === KeyCode.createKeyCode(e.nativeEvent).key?.keyCode;
    }
}
