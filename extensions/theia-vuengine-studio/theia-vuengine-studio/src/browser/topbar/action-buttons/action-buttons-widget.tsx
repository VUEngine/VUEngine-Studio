import * as React from "react";
import { injectable, postConstruct, inject } from "inversify";
import { ReactWidget } from "@theia/core/lib/browser/widgets/react-widget";
import { CommandService, environment, isOSX, MessageService } from "@theia/core";
import { KeybindingRegistry } from "@theia/core/lib/browser/keybinding";
import { FileService } from "@theia/filesystem/lib/browser/file-service";
import { VesBuildCleanCommand, VesBuildCommand, VesBuildExportCommand } from "../../build/build-commands";
import { VesState } from "../../common/ves-state";
import { getKeybindingLabel, getOs } from "../../common/common-functions";
import { PreferenceService } from "@theia/core/lib/browser";
import { BuildMode } from "../../build/build-types";
import { VesRunCommand } from "../../run/commands";
import { VesFlashCartsCommand } from "../../flash-carts/flash-carts-commands";
import { VesBuildModePreference } from "../../build/build-preferences";
import { FrontendApplicationState, FrontendApplicationStateService } from "@theia/core/lib/browser/frontend-application-state";
import { WorkspaceCommands, WorkspaceService } from "@theia/workspace/lib/browser";
import { VesProjectsCommands } from "../../projects/projects-commands";

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
    @inject(VesState) protected readonly vesState: VesState;
    @inject(WorkspaceService) protected readonly workspaceService: WorkspaceService;

    @postConstruct()
    protected async init(): Promise<void> {
        this.id = VesTopbarActionButtonsWidget.ID;
        this.title.label = VesTopbarActionButtonsWidget.LABEL;
        this.title.caption = VesTopbarActionButtonsWidget.LABEL;
        this.title.closable = false;
        this.addClass(`os-${getOs()}`);

        this.vesState.onDidChangeIsCleaning(() => this.update());
        this.vesState.onDidChangeBuildStatus(() => this.update());
        this.vesState.onDidChangeIsExportQueued(() => this.update());
        this.vesState.onDidChangeIsFlashQueued(() => this.update());
        this.vesState.onDidChangeIsFlashing(() => this.update());
        this.vesState.onDidChangeIsRunQueued(() => this.update());
        this.vesState.onDidChangeConnectedFlashCarts(() => this.update());
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
                title={`Create New Project${getKeybindingLabel(this.keybindingRegistry, VesProjectsCommands.NEW.id, true)}`}
                onClick={() => this.commandService.executeCommand(VesProjectsCommands.NEW.id)}
            >
                <i className="fa fa-plus"></i>
            </button>
            <button
                className="theia-button secondary new-project"
                title={`Open Project${getKeybindingLabel(this.keybindingRegistry, openProjectId, true)}`}
                onClick={() => this.commandService.executeCommand(openProjectId)}
            >
                <i className="fa fa-folder-open"></i>
            </button>
            <button
                className="theia-button secondary new-project"
                title={`Open Workspace${getKeybindingLabel(this.keybindingRegistry, WorkspaceCommands.OPEN_WORKSPACE.id, true)}`}
                onClick={() => this.commandService.executeCommand(WorkspaceCommands.OPEN_WORKSPACE.id)}
            >
                <i className="fa fa-file-code-o"></i>
            </button>
        </>
            : <>
                <button
                    className={"theia-button secondary clean" + (this.vesState.isCleaning ? " active" : "")}
                    title={this.vesState.isCleaning ? "Cleaning..." : `${VesBuildCleanCommand.label}${getKeybindingLabel(this.keybindingRegistry, VesBuildCleanCommand.id, true)}`}
                    disabled={this.vesState.buildStatus.active || !this.vesState.buildFolderExists[buildMode]}
                    onClick={() => this.commandService.executeCommand(VesBuildCleanCommand.id)}
                >
                    {this.vesState.isCleaning
                        ? <i className="fa fa-refresh fa-spin"></i>
                        : <i className="fa fa-trash"></i>}
                </button>
                <button
                    className={"theia-button secondary build" + (this.vesState.buildStatus.active ? " active" : "")}
                    title={this.vesState.buildStatus.active ? "Building..." : `${VesBuildCommand.label}${getKeybindingLabel(this.keybindingRegistry, VesBuildCommand.id, true)}`}
                    onClick={() => this.commandService.executeCommand(VesBuildCommand.id)}
                >
                    {this.vesState.buildStatus.active
                        ? <i className="fa fa-cog fa-spin"></i>
                        : <i className="fa fa-wrench"></i>}
                </button>
                <button
                    className={"theia-button secondary run" + (this.vesState.isRunQueued ? " active" : "")}
                    title={this.vesState.isRunQueued ? "Run Queued..." : `${VesRunCommand.label}${getKeybindingLabel(this.keybindingRegistry, VesRunCommand.id, true)}`}
                    onClick={() => this.commandService.executeCommand(VesRunCommand.id)}
                >
                    {this.vesState.isRunQueued
                        ? <i className="fa fa-hourglass-half"></i>
                        : <i className="fa fa-play"></i>}

                </button>
                <button
                    className={"theia-button secondary flash" + (this.vesState.isFlashQueued || this.vesState.isFlashing ? " active" : "")}
                    title={this.vesState.isFlashQueued ? "Flash Queued..." : `${VesFlashCartsCommand.label}${getKeybindingLabel(this.keybindingRegistry, VesFlashCartsCommand.id, true)}`}
                    disabled={!this.vesState.connectedFlashCarts}
                    onClick={() => this.commandService.executeCommand(VesFlashCartsCommand.id)}
                >
                    {this.vesState.isFlashQueued
                        ? <i className="fa fa-hourglass-half"></i>
                        : this.vesState.isFlashing
                            ? <i className="fa fa-refresh fa-spin"></i>
                            : <i className="fa fa-usb"></i>}
                </button>
                <button
                    className={"theia-button secondary export" + (this.vesState.isExportQueued ? " active" : "")}
                    title={this.vesState.isExportQueued ? "Export Queued..." : `${VesBuildExportCommand.label}${getKeybindingLabel(this.keybindingRegistry, VesBuildExportCommand.id, true)}`}
                    onClick={() => this.commandService.executeCommand(VesBuildExportCommand.id)}
                >
                    {this.vesState.isExportQueued
                        ? <i className="fa fa-hourglass-half"></i>
                        : <i className="fa fa-share-square-o"></i>}
                </button>
            </>
    }
}
