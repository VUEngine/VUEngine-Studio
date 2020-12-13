import * as React from 'react';
import { injectable, postConstruct, inject } from 'inversify';
import { ReactWidget } from '@theia/core/lib/browser/widgets/react-widget';
import { CommandService, MessageService } from '@theia/core';
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

    @inject(VesStateModel)
    protected readonly vesStateModel: VesStateModel;
    @inject(MessageService)
    protected readonly messageService!: MessageService;
    @inject(CommandService)
    protected readonly commandService!: CommandService;
    @inject(WorkspaceService)
    protected readonly workspaceService!: WorkspaceService;

    @postConstruct()
    protected async init(): Promise<void> {
        this.id = VesTopbarActionButtonsWidget.ID;
        this.title.label = VesTopbarActionButtonsWidget.LABEL;
        this.title.caption = VesTopbarActionButtonsWidget.LABEL;
        this.title.closable = false;
        this.vesStateModel.onDidChangeIsCleaning(() => this.update());
        this.vesStateModel.onDidChangeIsBuilding(() => this.update());
        this.vesStateModel.onDidChangeIsFlashQueued(() => this.update());
        this.vesStateModel.onDidChangeConnectedFlashCart(() => this.update());
        this.vesStateModel.onDidChangeIsRunQueued(() => this.update());
        this.vesStateModel.onDidChangeIsExportQueued(() => this.update());
        this.update();
    }

    protected render(): React.ReactNode {
        // TODO: on initial render, the workspace root can not be determined
        const buildFolderExists = existsSync(joinPath(getWorkspaceRoot(this.workspaceService), "build"));
        return <>
            <button
                className={this.vesStateModel.isCleaning ? "theia-button" : "theia-button secondary"}
                title={this.vesStateModel.isCleaning ? "Cleaning..." : "Clean"}
                disabled={!buildFolderExists}
                onClick={this.handleCleanOnClick}
            >
                {this.vesStateModel.isCleaning
                    ? <i className="fa fa-spinner fa-pulse"></i>
                    : <i className="fa fa-trash"></i>}
            </button>
            <button
                className={this.vesStateModel.isBuilding ? "theia-button" : "theia-button secondary"}
                title={this.vesStateModel.isBuilding ? "Building..." : "Build"}
                onClick={this.handleBuildOnClick}
            >
                {this.vesStateModel.isBuilding
                    ? <i className="fa fa-spinner fa-pulse"></i>
                    : <i className="fa fa-wrench"></i>}
            </button>
            <button
                className={this.vesStateModel.isRunQueued ? "theia-button" : "theia-button secondary"}
                title={this.vesStateModel.isRunQueued ? "Run Queued..." : "Run"}
                onClick={this.handleRunOnClick}
            >
                {this.vesStateModel.isRunQueued
                    ? <i className="fa fa-hourglass-half"></i>
                    : <i className="fa fa-play"></i>}
            </button>
            <button
                className={this.vesStateModel.isFlashQueued ? "theia-button" : "theia-button secondary"}
                title={this.vesStateModel.connectedFlashCart === ""
                    ? "No Flash Cart Connected"
                    : this.vesStateModel.isFlashQueued
                        ? `Flash to ${this.vesStateModel.connectedFlashCart} Queued...`
                        : `Flash to ${this.vesStateModel.connectedFlashCart}`}
                disabled={this.vesStateModel.connectedFlashCart === ""}
                onClick={this.handleFlashOnClick}
            >
                {this.vesStateModel.isFlashQueued
                    ? <i className="fa fa-hourglass-half"></i>
                    : <i className="fa fa-usb"></i>}
            </button>
            <button
                className={this.vesStateModel.isExportQueued ? "theia-button" : "theia-button secondary"}
                title={this.vesStateModel.isExportQueued ? "Export Queued..." : "Export"}
                onClick={this.handleExportOnClick}
            >
                {this.vesStateModel.isExportQueued
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
        this.vesStateModel.isExportQueued
            ? this.vesStateModel.unqueueExport()
            : this.commandService.executeCommand(VesBuildExportCommand.id)
    };

    protected handleFlashOnClick = () => {
        this.vesStateModel.isFlashQueued
            ? this.vesStateModel.unqueueFlash()
            : this.commandService.executeCommand(VesFlashCartsCommand.id)
    };

    protected handleRunOnClick = () => {
        this.vesStateModel.isRunQueued
            ? this.vesStateModel.unqueueRun()
            : this.commandService.executeCommand(VesRunCommand.id)
    };

    // protected updateIsBuilding = (e: React.ChangeEvent<HTMLInputElement>) => this.vesStateModel.isBuilding = e.target.value === "dings";
}
