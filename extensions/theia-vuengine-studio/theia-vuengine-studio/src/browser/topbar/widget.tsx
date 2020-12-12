import * as React from 'react';
import { injectable, postConstruct, inject } from 'inversify';
import { ReactWidget } from '@theia/core/lib/browser/widgets/react-widget';
import { FrontendApplicationConfigProvider } from '@theia/core/lib/browser/frontend-application-config-provider';
import { CommandService, MessageService } from '@theia/core';

import { VesFlashCartsCommand } from "../flash-carts/commands";
import { VesBuildCleanCommand, VesBuildCommand, VesBuildExportCommand } from '../build/commands';
import { VesStateModel } from '../common/vesStateModel';

declare var window: any;

@injectable()
export class VesTopbarWidget extends ReactWidget {

    static readonly ID = 'ves-topbar';
    static readonly LABEL = 'Topbar';

    @inject(VesStateModel)
    protected readonly vesStateModel: VesStateModel;
    @inject(MessageService)
    protected readonly messageService!: MessageService;
    @inject(CommandService)
    protected readonly commandService!: CommandService;

    @postConstruct()
    protected async init(): Promise<void> {
        this.id = VesTopbarWidget.ID;
        this.title.label = VesTopbarWidget.LABEL;
        this.title.caption = VesTopbarWidget.LABEL;
        this.title.closable = false;
        this.vesStateModel.onDidChangeIsCleaning(() => this.update());
        this.vesStateModel.onDidChangeIsBuilding(() => this.update());
        this.vesStateModel.onDidChangeIsFlashQueued(() => this.update());
        this.vesStateModel.onDidChangeIsRunQueued(() => this.update());
        this.vesStateModel.onDidChangeIsExportQueued(() => this.update());
        this.update();
    }

    protected render(): React.ReactNode {
        const { applicationName } = FrontendApplicationConfigProvider.get();
        return <>
            <div className="topbar-buttons">
                <button
                    className={this.vesStateModel.isCleaning ? "theia-button" : "theia-button secondary"}
                    title={this.vesStateModel.isCleaning ? "Cleaning..." : "Clean"}
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
                    title={this.vesStateModel.isFlashQueued ? "Flash Queued..." : "Flash"}
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
            </div>
            <div id="application-title">[Current Project] — {applicationName}</div>
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
            ? this.vesStateModel.isExportQueued = false
            : this.commandService.executeCommand(VesBuildExportCommand.id)
    };

    protected handleFlashOnClick = () => {
        this.vesStateModel.isFlashQueued
            ? this.vesStateModel.isFlashQueued = false
            : this.commandService.executeCommand(VesFlashCartsCommand.id)
    };

    protected handleRunOnClick = () => {
        // this.vesStateModel.isRunQueued
        //     ? this.vesStateModel.isRunQueued = false
        //     : this.commandService.executeCommand(VesRunCommand.id)
    };

    // protected updateIsBuilding = (e: React.ChangeEvent<HTMLInputElement>) => this.vesStateModel.isBuilding = e.target.value === "dings";
}
