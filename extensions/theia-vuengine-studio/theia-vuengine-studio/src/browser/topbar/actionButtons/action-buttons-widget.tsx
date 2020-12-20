import * as React from 'react';
import { injectable, postConstruct, inject } from 'inversify';
import { ReactWidget } from '@theia/core/lib/browser/widgets/react-widget';
import { CommandService, MessageService } from '@theia/core';
import { KeybindingRegistry } from "@theia/core/lib/browser/keybinding";
import { existsSync } from "fs";
import { join as joinPath } from "path";
import { VesFlashCartsCommand } from "../../flash-carts/commands";
import { VesBuildCleanCommand, VesBuildCommand, VesBuildExportCommand } from '../../build/commands';
import { VesStateModel } from '../../common/vesStateModel';
import { getWorkspaceRoot } from '../../common';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import { VesRunCommand } from '../../run/commands';

@injectable()
export class VesTopbarActionButtonsWidget extends ReactWidget {

    static readonly ID = 'ves-topbar-action-buttons';
    static readonly LABEL = 'Topbar Action Buttons';

    @inject(VesStateModel) protected readonly vesState: VesStateModel;
    @inject(MessageService) protected readonly messageService!: MessageService;
    @inject(KeybindingRegistry) protected readonly keybindingRegistry!: KeybindingRegistry;
    @inject(CommandService) protected readonly commandService!: CommandService;
    @inject(WorkspaceService) protected readonly workspaceService!: WorkspaceService;

    @postConstruct()
    protected async init(): Promise<void> {
        this.id = VesTopbarActionButtonsWidget.ID;
        this.title.label = VesTopbarActionButtonsWidget.LABEL;
        this.title.caption = VesTopbarActionButtonsWidget.LABEL;
        this.title.closable = false;
        this.vesState.onDidChangeIsCleaning(() => this.update());
        this.vesState.onDidChangeIsBuilding(() => this.update());
        this.vesState.onDidChangeIsFlashQueued(() => this.update());
        this.vesState.onDidChangeConnectedFlashCart(() => this.update());
        this.vesState.onDidChangeIsRunQueued(() => this.update());
        this.vesState.onDidChangeIsExportQueued(() => this.update());
        this.keybindingRegistry.onKeybindingsChanged(() => this.update());
        this.update();
    }

    protected render(): React.ReactNode {
        // TODO: on initial render, the workspace root can not be determined
        const buildFolderExists = existsSync(joinPath(getWorkspaceRoot(this.workspaceService), "build"));
        // TODO: this is initially not available
        const cleanKeybinding = this.keybindingRegistry.getKeybindingsForCommand(VesBuildCleanCommand.id).pop()?.keybinding;
        return <>
            <button
                className={this.vesState.isCleaning ? "theia-button" : "theia-button secondary"}
                title={this.vesState.isCleaning ? "Cleaning..." : `Clean (${cleanKeybinding})`}
                disabled={!buildFolderExists}
                onClick={this.handleCleanOnClick}
            >
                {this.vesState.isCleaning
                    ? <i className="fa fa-spinner fa-pulse"></i>
                    : <i className="fa fa-trash"></i>}
            </button>
            <button
                className={this.vesState.isBuilding ? "theia-button" : "theia-button secondary"}
                title={this.vesState.isBuilding ? "Building..." : "Build"}
                onClick={this.handleBuildOnClick}
            >
                {this.vesState.isBuilding
                    ? <i className="fa fa-spinner fa-pulse"></i>
                    : <i className="fa fa-wrench"></i>}
            </button>
            <button
                className={this.vesState.isRunQueued ? "theia-button" : "theia-button secondary"}
                title={this.vesState.isRunQueued ? "Run Queued..." : "Run"}
                onClick={this.handleRunOnClick}
            >
                {this.vesState.isRunQueued
                    ? <i className="fa fa-hourglass-half"></i>
                    : <i className="fa fa-play"></i>}
            </button>
            <button
                className={this.vesState.isFlashQueued ? "theia-button" : "theia-button secondary"}
                title={this.vesState.connectedFlashCart === ""
                    ? "No Flash Cart Connected"
                    : this.vesState.isFlashQueued
                        ? `Flash to ${this.vesState.connectedFlashCart} Queued...`
                        : `Flash to ${this.vesState.connectedFlashCart}`}
                disabled={this.vesState.connectedFlashCart === ""}
                onClick={this.handleFlashOnClick}
            >
                {this.vesState.isFlashQueued
                    ? <i className="fa fa-hourglass-half"></i>
                    : <i className="fa fa-usb"></i>}
            </button>
            <button
                className={this.vesState.isExportQueued ? "theia-button" : "theia-button secondary"}
                title={this.vesState.isExportQueued ? "Export Queued..." : "Export"}
                onClick={this.handleExportOnClick}
            >
                {this.vesState.isExportQueued
                    ? <i className="fa fa-hourglass-half"></i>
                    : <i className="fa fa-share-square"></i>}
            </button>
        </>
    }

    protected handleCleanOnClick = () => {
        this.commandService.executeCommand(VesBuildCleanCommand.id);
    };

    protected handleBuildOnClick = () => {
        this.commandService.executeCommand(VesBuildCommand.id);
    };

    protected handleExportOnClick = () => {
        this.vesState.isExportQueued
            ? this.vesState.unqueueExport()
            : this.commandService.executeCommand(VesBuildExportCommand.id)
    };

    protected handleFlashOnClick = () => {
        this.vesState.isFlashQueued
            ? this.vesState.unqueueFlash()
            : this.commandService.executeCommand(VesFlashCartsCommand.id)
    };

    protected handleRunOnClick = () => {
        this.vesState.isRunQueued
            ? this.vesState.unqueueRun()
            : this.commandService.executeCommand(VesRunCommand.id)
    };

    // protected updateIsBuilding = (e: React.ChangeEvent<HTMLInputElement>) => this.vesState.isBuilding = e.target.value === "dings";
}
