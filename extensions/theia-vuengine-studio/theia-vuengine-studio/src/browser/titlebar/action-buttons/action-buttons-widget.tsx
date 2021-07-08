import * as React from "react";
import { injectable, postConstruct, inject } from "inversify";
import { ReactWidget } from "@theia/core/lib/browser/widgets/react-widget";
import { CommandService, environment, isOSX, MessageService } from "@theia/core";
import { KeybindingRegistry } from "@theia/core/lib/browser/keybinding";
import { FileService } from "@theia/filesystem/lib/browser/file-service";
import { VesBuildCommands } from "../../build/build-commands";
import { VesState } from "../../common/ves-state";
import { VesCommonFunctions } from "../../common/common-functions";
import { PreferenceService } from "@theia/core/lib/browser";
import { BuildMode, BuildResult } from "../../build/build-types";
import { VesEmulatorCommands } from "../../emulator/emulator-commands";
import { VesFlashCartsCommands } from "../../flash-carts/flash-carts-commands";
import { VesBuildPrefs } from "../../build/build-preferences";
import { FrontendApplicationState, FrontendApplicationStateService } from "@theia/core/lib/browser/frontend-application-state";
import { WorkspaceCommands, WorkspaceService } from "@theia/workspace/lib/browser";
import { VesProjectsCommands } from "../../projects/projects-commands";

@injectable()
export class VesTitlebarActionButtonsWidget extends ReactWidget {

    static readonly ID = "ves-titlebar-action-buttons";
    static readonly LABEL = "Titlebar Action Buttons";

    @inject(CommandService) protected readonly commandService!: CommandService;
    @inject(FileService) protected readonly fileService!: FileService;
    @inject(FrontendApplicationStateService) protected readonly frontendApplicationStateService: FrontendApplicationStateService;
    @inject(KeybindingRegistry) protected readonly keybindingRegistry!: KeybindingRegistry;
    @inject(MessageService) protected readonly messageService!: MessageService;
    @inject(PreferenceService) protected readonly preferenceService!: PreferenceService;
    @inject(VesCommonFunctions) protected readonly commonFunctions: VesCommonFunctions;
    @inject(VesState) protected readonly vesState: VesState;
    @inject(WorkspaceService) protected readonly workspaceService: WorkspaceService;

    @postConstruct()
    protected async init(): Promise<void> {
        this.id = VesTitlebarActionButtonsWidget.ID;
        this.title.label = VesTitlebarActionButtonsWidget.LABEL;
        this.title.caption = VesTitlebarActionButtonsWidget.LABEL;
        this.title.closable = false;
        this.addClass(`os-${this.commonFunctions.getOs()}`);

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
        const buildMode = this.preferenceService.get(VesBuildPrefs.BUILD_MODE.id) as BuildMode;
        const requireSingleOpen = isOSX || !environment.electron.is();
        const openProjectId = requireSingleOpen ? WorkspaceCommands.OPEN.id : WorkspaceCommands.OPEN_FOLDER.id;
        return !this.workspaceService.opened ? <>
            <button
                className="theia-button secondary new-project"
                title={`Create New Project${this.commonFunctions.getKeybindingLabel(VesProjectsCommands.NEW.id, true)}`}
                onClick={() => this.commandService.executeCommand(VesProjectsCommands.NEW.id)}
            >
                <i className="fa fa-plus"></i>
            </button>
            <button
                className="theia-button secondary new-project"
                title={`Open Project${this.commonFunctions.getKeybindingLabel(openProjectId, true)}`}
                onClick={() => this.commandService.executeCommand(openProjectId)}
            >
                <i className="fa fa-folder-open"></i>
            </button>
            <button
                className="theia-button secondary new-project"
                title={`Open Workspace${this.commonFunctions.getKeybindingLabel(WorkspaceCommands.OPEN_WORKSPACE.id, true)}`}
                onClick={() => this.commandService.executeCommand(WorkspaceCommands.OPEN_WORKSPACE.id)}
            >
                <i className="fa fa-file-code-o"></i>
            </button>
        </>
            : <>
                <button
                    className={"theia-button secondary clean" + (this.vesState.isCleaning ? " active" : "")}
                    title={this.vesState.isCleaning ? "Cleaning..." : `${VesBuildCommands.CLEAN.label}${this.commonFunctions.getKeybindingLabel(VesBuildCommands.CLEAN.id, true)}`}
                    disabled={this.vesState.buildStatus.active || !this.vesState.buildFolderExists[buildMode]}
                    onClick={() => this.commandService.executeCommand(VesBuildCommands.CLEAN.id)}
                >
                    {this.vesState.isCleaning
                        ? <i className="fa fa-refresh fa-spin"></i>
                        : <i className="fa fa-trash"></i>}
                </button>
                <button
                    className={"theia-button secondary build" + (this.vesState.buildStatus.active ? " active" : (this.vesState.buildStatus.step == BuildResult.done as string && this.vesState.outputRomExists) ? " success" : (this.vesState.buildStatus.step == BuildResult.failed as string) ? " error" : "")}
                    style={this.vesState.buildStatus.active ? {
                        backgroundImage: "linear-gradient(90deg, var(--theia-progressBar-background) 0%, var(--theia-progressBar-background) " + this.vesState.buildStatus.progress + "%, var(--theia-titleBar-hoverButtonBackground) " + this.vesState.buildStatus.progress + "%)"
                    } : {}}
                    title={this.vesState.buildStatus.active
                        ? "Building... " + this.vesState.buildStatus.progress + "%"
                        : `${VesBuildCommands.BUILD.label}${this.commonFunctions.getKeybindingLabel(VesBuildCommands.BUILD.id, true)}`}
                    onClick={() => this.commandService.executeCommand(VesBuildCommands.BUILD.id)}
                >
                    {this.vesState.buildStatus.active
                        ? <i className="fa fa-cog fa-spin"></i>
                        : <i className="fa fa-wrench"></i>}
                </button>
                <button
                    className={"theia-button secondary run" + (this.vesState.isRunQueued ? " queued" : "")}
                    title={this.vesState.isRunQueued ? "Run Queued..." : `${VesEmulatorCommands.RUN.label}${this.commonFunctions.getKeybindingLabel(VesEmulatorCommands.RUN.id, true)}`}
                    onClick={() => this.commandService.executeCommand(VesEmulatorCommands.RUN.id)}
                >
                    {this.vesState.isRunQueued
                        ? <i className="fa fa-hourglass-half"></i>
                        : <i className="fa fa-play"></i>}
                </button>
                <button
                    className={"theia-button secondary flash" + (this.vesState.isFlashQueued ? " queued" : "") + (this.vesState.isFlashing ? " active" : "")}
                    style={this.vesState.isFlashing ? {
                        backgroundImage: "linear-gradient(90deg, var(--theia-progressBar-background) 0%, var(--theia-progressBar-background) " + this.vesState.flashingProgress + "%, var(--theia-titleBar-hoverButtonBackground) " + this.vesState.flashingProgress + "%)"
                    } : {}}
                    title={this.vesState.isFlashQueued
                        ? "Flashing Queued..."
                        : this.vesState.isFlashing
                            ? "Flashing... " + this.vesState.flashingProgress + "%"
                            : `${VesFlashCartsCommands.FLASH.label}${this.commonFunctions.getKeybindingLabel(VesFlashCartsCommands.FLASH.id, true)}`}
                    disabled={!this.vesState.connectedFlashCarts}
                    onClick={() => this.commandService.executeCommand(VesFlashCartsCommands.FLASH.id)}
                >
                    {this.vesState.isFlashQueued
                        ? <i className="fa fa-hourglass-half"></i>
                        : this.vesState.isFlashing
                            ? <i className="fa fa-refresh fa-spin"></i>
                            : <i className="fa fa-usb"></i>}
                </button>
                <button
                    className={"theia-button secondary export" + (this.vesState.isExportQueued ? " queued" : "")}
                    title={this.vesState.isExportQueued ? "Export Queued..." : `${VesBuildCommands.EXPORT.label} ${this.commonFunctions.getKeybindingLabel(VesBuildCommands.EXPORT.id, true)}`}
                    onClick={() => this.commandService.executeCommand(VesBuildCommands.EXPORT.id)}
                >
                    {this.vesState.isExportQueued
                        ? <i className="fa fa-hourglass-half"></i>
                        : <i className="fa fa-share-square-o"></i>}
                </button>
            </>
    }
}
