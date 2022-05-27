import { CommandService, Emitter, environment, isOSX, MessageService, nls } from '@theia/core';
import { ApplicationShell, CommonCommands, PreferenceService, Widget } from '@theia/core/lib/browser';
import { FrontendApplicationState, FrontendApplicationStateService } from '@theia/core/lib/browser/frontend-application-state';
import { KeybindingRegistry } from '@theia/core/lib/browser/keybinding';
import { ReactWidget } from '@theia/core/lib/browser/widgets/react-widget';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import * as React from '@theia/core/shared/react';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { WorkspaceCommands, WorkspaceService } from '@theia/workspace/lib/browser';
import { VesBuildCommands } from '../../build/browser/ves-build-commands';
import { VesBuildPreferenceIds } from '../../build/browser/ves-build-preferences';
import { VesBuildService } from '../../build/browser/ves-build-service';
import { BuildMode, BuildResult } from '../../build/browser/ves-build-types';
import { VesEmulatorCommands } from '../../emulator/browser/ves-emulator-commands';
import { VesEmulatorService } from '../../emulator/browser/ves-emulator-service';
import { VesFlashCartCommands } from '../../flash-cart/browser/ves-flash-cart-commands';
import { VesFlashCartService } from '../../flash-cart/browser/ves-flash-cart-service';
import { VesProjectCommands } from '../../project/browser/ves-project-commands';

@injectable()
export class VesTitlebarActionButtonsWidget extends ReactWidget {

    static readonly ID = 'ves-titlebar-action-buttons';
    static readonly LABEL = 'Titlebar Action Buttons';

    @inject(ApplicationShell)
    protected applicationShell: ApplicationShell;
    @inject(CommandService)
    protected readonly commandService!: CommandService;
    @inject(FileService)
    protected readonly fileService!: FileService;
    @inject(FrontendApplicationStateService)
    protected readonly frontendApplicationStateService: FrontendApplicationStateService;
    @inject(KeybindingRegistry)
    protected readonly keybindingRegistry!: KeybindingRegistry;
    @inject(MessageService)
    protected readonly messageService!: MessageService;
    @inject(PreferenceService)
    protected readonly preferenceService!: PreferenceService;
    @inject(VesBuildService)
    protected readonly vesBuildService: VesBuildService;
    @inject(VesEmulatorService)
    protected readonly vesEmulatorService: VesEmulatorService;
    @inject(VesFlashCartService)
    protected readonly vesFlashCartService: VesFlashCartService;
    @inject(WorkspaceService)
    protected readonly workspaceService: WorkspaceService;

    protected _isMaximized: Widget | false = false;
    protected readonly onDidChangeIsMaximizedEmitter = new Emitter<Widget | false>();
    readonly onDidChangeIsMaximized = this.onDidChangeIsMaximizedEmitter.event;
    set isMaximized(flag: Widget | false) {
        this._isMaximized = flag;
        this.onDidChangeIsMaximizedEmitter.fire(this._isMaximized);
    }
    get isMaximized(): Widget | false {
        return this._isMaximized;
    }

    @postConstruct()
    protected async init(): Promise<void> {
        this.id = VesTitlebarActionButtonsWidget.ID;
        this.title.label = VesTitlebarActionButtonsWidget.LABEL;
        this.title.caption = VesTitlebarActionButtonsWidget.LABEL;
        this.title.closable = false;

        this.vesBuildService.onDidChangeIsCleaning(() => this.update());
        this.vesBuildService.onDidChangeIsQueued(() => this.update());
        this.vesBuildService.onDidChangeBuildStatus(() => this.update());
        this.vesBuildService.onDidChangeBuildFolder(() => this.update());
        this.vesFlashCartService.onDidChangeIsQueued(() => this.update());
        this.vesFlashCartService.onDidChangeIsFlashing(() => this.update());
        this.vesFlashCartService.onDidChangeConnectedFlashCarts(() => this.update());
        this.vesEmulatorService.onDidChangeIsQueued(() => this.update());
        this.keybindingRegistry.onKeybindingsChanged(() => this.update());
        this.onDidChangeIsMaximized(() => this.update());

        this.update();

        this.frontendApplicationStateService.onStateChanged((state: FrontendApplicationState) => {
            if (state === 'attached_shell') {
                this.update();
            };
        });

        this.applicationShell.mainPanel.onDidToggleMaximized(widget => this.handleToggleMaximized(widget));
        this.applicationShell.bottomPanel.onDidToggleMaximized(widget => this.handleToggleMaximized(widget));
        this.applicationShell.leftPanelHandler.dockPanel.onDidToggleMaximized(widget => this.handleToggleMaximized(widget));
        this.applicationShell.rightPanelHandler.dockPanel.onDidToggleMaximized(widget => this.handleToggleMaximized(widget));
    }

    protected handleToggleMaximized(widget: Widget): void {
        this.isMaximized = !this.isMaximized && widget;
    }

    protected getProgressBarColor(): string {
        return this.vesBuildService.getNumberOfWarnings() > 0
            ? 'var(--theia-editorWarning-foreground)'
            : 'var(--theia-progressBar-background)';
    }

    protected render(): React.ReactNode {
        const buildMode = this.preferenceService.get(VesBuildPreferenceIds.BUILD_MODE) as BuildMode;
        return !this.workspaceService.opened ? <>
            <button
                className='theia-button secondary new-project'
                title={nls.localize('vuengine/projects/commands/newProject', 'New Project') +
                    this.getKeybindingLabel(VesProjectCommands.NEW.id, true)}
                onClick={this.createNewProject}
                key='action-button-new-project'
            >
                <i className='fa fa-plus'></i>
            </button>
            <button
                className='theia-button secondary open-workspace'
                title={nls.localize('vuengine/projects/commands/openProject', 'Open Project...') +
                    this.getKeybindingLabel(WorkspaceCommands.OPEN_WORKSPACE.id, true)}
                onClick={this.openWorkspaceFile}
                key='action-button-open-workspace'
            >
                <i className='fa fa-file-code-o'></i>
            </button>
        </>
            : <>
                <button
                    className={'theia-button secondary build' + (this.vesBuildService.isQueued
                        ? ' queued'
                        : this.vesBuildService.buildStatus.active
                            ? ' active'
                            : (this.vesBuildService.buildStatus.step === BuildResult.done as string)
                                ? ' success'
                                : (this.vesBuildService.buildStatus.step === BuildResult.failed as string)
                                    ? ' error'
                                    : '')}
                    style={this.vesBuildService.buildStatus.active ? {
                        backgroundImage: `linear-gradient(
                            90deg, 
                            ${this.getProgressBarColor()} 0%, 
                            ${this.getProgressBarColor()} ${this.vesBuildService.buildStatus.progress}%, 
                            var(--theia-titleBar-hoverButtonBackground) ${this.vesBuildService.buildStatus.progress}%)`
                    } : {}}
                    title={this.vesBuildService.buildStatus.active
                        ? `${nls.localize('vuengine/build/building', 'Building')}... ${this.vesBuildService.buildStatus.progress}%`
                        : `${VesBuildCommands.BUILD.label}${this.getKeybindingLabel(VesBuildCommands.BUILD.id, true)}`}
                    onClick={this.build}
                    key='action-button-build'
                >
                    {this.vesBuildService.isQueued
                        ? <i className='fa fa-hourglass-half'></i>
                        : this.vesBuildService.buildStatus.active
                            ? <i className='fa fa-cog fa-spin'></i>
                            : <i className='fa fa-wrench'></i>}
                </button>
                <button
                    className={'theia-button secondary run' + (this.vesEmulatorService.isQueued ? ' queued' : '')}
                    title={this.vesEmulatorService.isQueued
                        ? `${nls.localize('vuengine/emulator/runQueued', 'Run Queued')}...`
                        : `${VesEmulatorCommands.RUN.label}${this.getKeybindingLabel(VesEmulatorCommands.RUN.id, true)}`}
                    onClick={this.run}
                    key='action-button-run'
                >
                    {this.vesEmulatorService.isQueued
                        ? <i className='fa fa-hourglass-half'></i>
                        : <i className='fa fa-play'></i>}
                </button>
                <button
                    className={'theia-button secondary flash' + (this.vesFlashCartService.isQueued ? ' queued' : '') + (this.vesFlashCartService.isFlashing ? ' active' : '')}
                    style={this.vesFlashCartService.isFlashing ? {
                        backgroundImage: 'linear-gradient(90deg, var(--theia-progressBar-background) 0%, var(--theia-progressBar-background) '
                            + this.vesFlashCartService.flashingProgress + '%, var(--theia-titleBar-hoverButtonBackground) ' + this.vesFlashCartService.flashingProgress + '%)'
                    } : {}}
                    title={this.vesFlashCartService.isQueued
                        ? `${nls.localize('vuengine/flashCarts/flashingQueued', 'Flashing Queued')}...`
                        : this.vesFlashCartService.isFlashing
                            ? `Flashing... ${this.vesFlashCartService.flashingProgress}%`
                            : `${VesFlashCartCommands.FLASH.label}${this.getKeybindingLabel(VesFlashCartCommands.FLASH.id, true)}`}
                    disabled={!this.vesFlashCartService.connectedFlashCarts}
                    onClick={this.flash}
                    key='action-button-flash'
                >
                    {this.vesFlashCartService.isQueued
                        ? <i className='fa fa-hourglass-half'></i>
                        : this.vesFlashCartService.isFlashing
                            ? <i className='fa fa-cog fa-spin'></i>
                            : <i className='fa fa-microchip'></i>}
                </button>
                <button
                    className={'theia-button secondary clean' + (this.vesBuildService.isCleaning ? ' active' : '')}
                    title={this.vesBuildService.isCleaning ? 'Cleaning...' : `${VesBuildCommands.CLEAN.label}${this.getKeybindingLabel(VesBuildCommands.CLEAN.id, true)}`}
                    disabled={this.vesBuildService.buildStatus.active || !this.vesBuildService.buildFolderExists[buildMode]}
                    onClick={this.clean}
                    key='action-button-clean'
                >
                    {this.vesBuildService.isCleaning
                        ? <i className='fa fa-cog fa-spin'></i>
                        : <i className='fa fa-trash'></i>}
                </button>
                {this.isMaximized &&
                    <button
                        className="theia-button secondary collapse active"
                        title={`${CommonCommands.TOGGLE_MAXIMIZED.label}${this.getKeybindingLabel(CommonCommands.TOGGLE_MAXIMIZED.id, true)}`}
                        onClick={this.collapse}
                        key='action-button-collapse'
                    >
                        <i className="fa fa-compress"></i>
                    </button>}
            </>;
    }

    protected getKeybindingLabel(
        commandId: string,
        wrapInBrackets: boolean = false
    ): string {
        const keybinding = this.keybindingRegistry.getKeybindingsForCommand(commandId)[0];
        let keybindingAccelerator = keybinding
            ? this.keybindingRegistry.acceleratorFor(keybinding, '+').join(', ')
            : '';

        keybindingAccelerator = keybindingAccelerator
            .replace(' ', nls.localize('vuengine/general/space', 'Space'));

        if (wrapInBrackets && keybindingAccelerator !== '') {
            keybindingAccelerator = ` (${keybindingAccelerator})`;
        }

        return keybindingAccelerator;
    }

    protected getOpenProjectCommandId(): string {
        const requireSingleOpen = isOSX || !environment.electron.is();
        return requireSingleOpen ? WorkspaceCommands.OPEN.id : WorkspaceCommands.OPEN_FOLDER.id;
    }
    protected createNewProject = async () => this.commandService.executeCommand(VesProjectCommands.NEW.id);
    protected openProject = async () => this.commandService.executeCommand(this.getOpenProjectCommandId());
    protected openWorkspaceFile = async () => this.commandService.executeCommand(WorkspaceCommands.OPEN_WORKSPACE.id);
    protected build = async () => this.commandService.executeCommand(VesBuildCommands.BUILD.id);
    protected run = async () => this.commandService.executeCommand(VesEmulatorCommands.RUN.id);
    protected flash = async () => this.commandService.executeCommand(VesFlashCartCommands.FLASH.id);
    protected clean = async () => this.commandService.executeCommand(VesBuildCommands.CLEAN.id);
    protected collapse = async () => this.commandService.executeCommand(CommonCommands.TOGGLE_MAXIMIZED.id, this.isMaximized);
}
