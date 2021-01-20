import * as React from "react";
import { injectable, postConstruct, inject } from "inversify";
import { ReactWidget } from "@theia/core/lib/browser/widgets/react-widget";
import { CommandService, environment, isOSX, MessageService } from "@theia/core";
import { KeybindingRegistry } from "@theia/core/lib/browser/keybinding";
import { FileService } from "@theia/filesystem/lib/browser/file-service";
import { VesBuildCleanCommand, VesBuildCommand, VesBuildExportCommand } from "../../build/commands";
import { VesStateModel } from "../../common/vesStateModel";
import { getOs } from "../../common/functions";
import { PreferenceService } from "@theia/core/lib/browser";
import { BuildMode } from "../../build/types";
import { VesRunCommand } from "../../run/commands";
import { VesFlashCartsCommand } from "../../flash-carts/commands";
import { VesBuildModePreference } from "../../build/preferences";
import { FrontendApplicationState, FrontendApplicationStateService } from "@theia/core/lib/browser/frontend-application-state";
import { WorkspaceCommands, WorkspaceService } from "@theia/workspace/lib/browser";
import { VesProjectsCommands } from "../../projects/commands";

@injectable()
export class VesTopbarActionButtonsWidget extends ReactWidget {

    static readonly ID = "ves-topbar-action-buttons";
    static readonly LABEL = "Topbar Action Buttons";

    @inject(CommandService) protected readonly commandService!: CommandService;
    @inject(FileService) protected readonly fileService!: FileService;
    @inject(FrontendApplicationStateService) protected readonly frontendApplicationStateService: FrontendApplicationStateService;
    @inject(KeybindingRegistry) protected readonly keybindingRegistry!: KeybindingRegistry;
    @inject(MessageService) protected readonly messageService!: MessageService;
    @inject(PreferenceService) protected readonly preferenceService!: PreferenceService;
    @inject(VesStateModel) protected readonly vesState: VesStateModel;
    @inject(WorkspaceService) protected readonly workspaceService: WorkspaceService;

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
        this.vesState.onDidChangeIsFlashing(() => this.update());
        this.vesState.onDidChangeIsRunQueued(() => this.update());
        this.vesState.onDidChangeIsRunning(() => this.update());
        this.vesState.onDidChangeConnectedFlashCart(() => this.update());
        this.vesState.onDidChangeBuildFolder(() => this.update());
        this.vesState.onDidChangeOutputRomExists(() => this.update());
        this.keybindingRegistry.onKeybindingsChanged(() => this.update());

        this.update();

        this.frontendApplicationStateService.onStateChanged((state: FrontendApplicationState) => {
            if (state === "attached_shell") this.update();
        });
    }

    protected render(): React.ReactNode {
        const buildMode = this.preferenceService.get(VesBuildModePreference.id) as BuildMode;
        const requireSingleOpen = isOSX || !environment.electron.is();
        const openProjectId = requireSingleOpen ? WorkspaceCommands.OPEN.id : WorkspaceCommands.OPEN_FOLDER.id;
        return !this.workspaceService.opened ? <>
            <button
                className="theia-button secondary new-project"
                title={`Create New Project${this.getKeybindingLabel(VesProjectsCommands.NEW.id)}`}
                onClick={() => this.commandService.executeCommand(VesProjectsCommands.NEW.id)}
            >
                <i className="fa fa-plus"></i>
            </button>
            <button
                className="theia-button secondary new-project"
                title={`Open Project${this.getKeybindingLabel(openProjectId)}`}
                onClick={() => this.commandService.executeCommand(openProjectId)}
            >
                <i className="fa fa-folder-open"></i>
            </button>
            <button
                className="theia-button secondary new-project"
                title={`Open Workspace${this.getKeybindingLabel(WorkspaceCommands.OPEN_WORKSPACE.id)}`}
                onClick={() => this.commandService.executeCommand(WorkspaceCommands.OPEN_WORKSPACE.id)}
            >
                <i className="fa fa-file-code-o"></i>
            </button>
        </>
            : <>
                <button
                    className={"theia-button secondary clean" + (this.vesState.isCleaning ? " active" : "")}
                    title={this.vesState.isCleaning ? "Cleaning..." : `${VesBuildCleanCommand.label}${this.getKeybindingLabel(VesBuildCleanCommand.id)}`}
                    disabled={this.vesState.isBuilding || !this.vesState.buildFolderExists[buildMode]}
                    onClick={() => this.commandService.executeCommand(VesBuildCleanCommand.id)}
                >
                    {this.vesState.isCleaning
                        ? <i className="fa fa-spinner fa-pulse"></i>
                        : <i className="fa fa-trash"></i>}
                </button>
                <button
                    className={"theia-button secondary build" + (this.vesState.isBuilding ? " active" : "")}
                    title={this.vesState.isBuilding ? "Building..." : `${VesBuildCommand.label}${this.getKeybindingLabel(VesBuildCommand.id)}`}
                    onClick={() => this.commandService.executeCommand(VesBuildCommand.id)}
                >
                    {this.vesState.isBuilding
                        ? <i className="fa fa-spinner fa-pulse"></i>
                        : <i className="fa fa-wrench"></i>}
                </button>
                <button
                    className={"theia-button secondary run" + (this.vesState.isRunQueued || this.vesState.isRunning ? " active" : "")}
                    title={this.vesState.isRunQueued ? "Run Queued..." : this.vesState.isBuilding ? "Running..." : `${VesRunCommand.label}${this.getKeybindingLabel(VesRunCommand.id)}`}
                    onClick={() => this.commandService.executeCommand(VesRunCommand.id)}
                >
                    {this.vesState.isRunQueued
                        ? <i className="fa fa-hourglass-half"></i>
                        : this.vesState.isRunning
                            ? <i className="fa fa-spinner fa-pulse"></i>
                            : <i className="fa fa-play"></i>}

                </button>
                <button
                    className={"theia-button secondary flash" + (this.vesState.isFlashQueued || this.vesState.isFlashing ? " active" : "")}
                    title={this.vesState.isFlashQueued ? "Flash Queued..." : `${VesFlashCartsCommand.label}${this.getKeybindingLabel(VesFlashCartsCommand.id)}`}
                    disabled={!this.vesState.connectedFlashCart}
                    onClick={() => this.commandService.executeCommand(VesFlashCartsCommand.id)}
                >
                    {this.vesState.isFlashQueued
                        ? <i className="fa fa-hourglass-half"></i>
                        : this.vesState.isFlashing
                            ? <i className="fa fa-spinner fa-pulse"></i>
                            : <i className="fa fa-usb"></i>}
                </button>
                <button
                    className={"theia-button secondary export" + (this.vesState.isExportQueued ? " active" : "")}
                    title={this.vesState.isExportQueued ? "Export Queued..." : `${VesBuildExportCommand.label}${this.getKeybindingLabel(VesBuildExportCommand.id)}`}
                    onClick={() => this.commandService.executeCommand(VesBuildExportCommand.id)}
                >
                    {this.vesState.isExportQueued
                        ? <i className="fa fa-hourglass-half"></i>
                        : <i className="fa fa-share-square-o"></i>}
                </button>
            </>
    }

    protected getKeybindingLabel = (commandId: string) => {
        const keybinding = this.keybindingRegistry.getKeybindingsForCommand(commandId)[0];
        const keybindingAccelerator = keybinding ? ` (${this.keybindingRegistry.acceleratorFor(keybinding, "+")})` : "";
        return keybindingAccelerator;
    };
}
