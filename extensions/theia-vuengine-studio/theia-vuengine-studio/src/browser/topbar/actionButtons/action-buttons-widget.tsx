import * as React from 'react';
import { injectable, postConstruct, inject } from 'inversify';
import { ReactWidget } from '@theia/core/lib/browser/widgets/react-widget';
import { CommandService, MessageService } from '@theia/core';
import { KeybindingRegistry } from "@theia/core/lib/browser/keybinding";
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { VesBuildCleanCommand, VesBuildCommand, VesBuildExportCommand } from '../../build/commands';
import { VesStateModel } from '../../common/vesStateModel';
import { getOs } from '../../common';
import { PreferenceService } from '@theia/core/lib/browser';
import { BuildMode } from "../../build/types";
import { VesRunCommand } from '../../run/commands';
import { VesFlashCartsCommand } from '../../flash-carts/commands';
import { VesBuildModePreference } from '../../build/preferences';

@injectable()
export class VesTopbarActionButtonsWidget extends ReactWidget {

    static readonly ID = 'ves-topbar-action-buttons';
    static readonly LABEL = 'Topbar Action Buttons';

    @inject(CommandService) protected readonly commandService!: CommandService;
    @inject(FileService) protected readonly fileService!: FileService;
    @inject(KeybindingRegistry) protected readonly keybindingRegistry!: KeybindingRegistry;
    @inject(MessageService) protected readonly messageService!: MessageService;
    @inject(PreferenceService) protected readonly preferenceService!: PreferenceService;
    @inject(VesStateModel) protected readonly vesState: VesStateModel;

    @postConstruct()
    protected async init(): Promise<void> {
        this.id = VesTopbarActionButtonsWidget.ID;
        this.title.label = VesTopbarActionButtonsWidget.LABEL;
        this.title.caption = VesTopbarActionButtonsWidget.LABEL;
        this.title.closable = false;
        this.addClass(`os-${getOs()}`);
        this.vesState.onDidChangeIsCleaning(() => this.update());
        this.vesState.onDidChangeIsBuilding(() => this.update());
        this.vesState.onDidChangeIsExportQueued(() => this.update());
        this.vesState.onDidChangeIsFlashQueued(() => this.update());
        this.vesState.onDidChangeIsRunQueued(() => this.update());
        this.vesState.onDidChangeConnectedFlashCart(() => this.update());
        this.vesState.onDidChangeBuildFolder(() => this.update());
        this.vesState.onDidChangeOutputRomExists(() => this.update());
        this.keybindingRegistry.onKeybindingsChanged(() => this.update());
        this.update();
    }

    protected render(): React.ReactNode {
        const buildMode = this.preferenceService.get(VesBuildModePreference.id) as BuildMode;
        return <>
            <button
                className="theia-button secondary clean"
                title={this.vesState.isCleaning ? "Cleaning..." : `Clean${this.getKeybindingLabel(VesBuildCleanCommand.id)}`}
                disabled={!this.vesState.buildFolderExists[buildMode]}
                onClick={() => this.commandService.executeCommand(VesBuildCleanCommand.id)}
            >
                {this.vesState.isCleaning
                    ? <i className="fa fa-spinner fa-pulse"></i>
                    : <i className="fa fa-trash"></i>}
            </button>
            <button
                className="theia-button secondary build"
                title={this.vesState.isBuilding ? "Building..." : "Build"}
                onClick={() => this.commandService.executeCommand(VesBuildCommand.id)}
            >
                {this.vesState.isBuilding
                    ? <i className="fa fa-spinner fa-pulse"></i>
                    : <i className="fa fa-wrench"></i>}
            </button>
            <button
                className="theia-button secondary run"
                title={this.vesState.isRunQueued ? "Run Queued..." : "Run"}
                onClick={() => this.commandService.executeCommand(VesRunCommand.id)}
            >
                {this.vesState.isRunQueued
                    ? <i className="fa fa-hourglass-half"></i>
                    : <i className="fa fa-play"></i>}
            </button>
            <button
                className="theia-button secondary flash"
                title={!this.vesState.connectedFlashCart
                    ? "No Flash Cart Connected"
                    : this.vesState.isFlashQueued
                        ? `Flash to ${this.vesState.connectedFlashCart.name} Queued...`
                        : `Flash to ${this.vesState.connectedFlashCart.name}`}
                disabled={!this.vesState.connectedFlashCart}
                onClick={() => this.commandService.executeCommand(VesFlashCartsCommand.id)}
            >
                {this.vesState.isFlashQueued
                    ? <i className="fa fa-hourglass-half"></i>
                    : <i className="fa fa-usb"></i>}
            </button>
            <button
                className="theia-button secondary export"
                title={this.vesState.isExportQueued ? "Export Queued..." : "Export"}
                onClick={() => this.commandService.executeCommand(VesBuildExportCommand.id)}
            >
                {this.vesState.isExportQueued
                    ? <i className="fa fa-hourglass-half"></i>
                    : <i className="fa fa-share-square-o"></i>}
            </button>
        </>
    }

    protected getKeybindingLabel = (commandId: string) => {
        // TODO: this is initially not available
        const cleanKeybinding = this.keybindingRegistry.getKeybindingsForCommand(commandId).pop();
        const cleanKeybindingAccelerator = cleanKeybinding ? ` (${this.keybindingRegistry.acceleratorFor(cleanKeybinding, "+")})` : "";
        return cleanKeybindingAccelerator;
    };

    // protected updateIsBuilding = (e: React.ChangeEvent<HTMLInputElement>) => this.vesState.isBuilding = e.target.value === "dings";
}
