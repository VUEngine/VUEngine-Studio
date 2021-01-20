import { inject, injectable, postConstruct } from "inversify";
import { Emitter } from "@theia/core/lib/common/event";
import { FileService } from "@theia/filesystem/lib/browser/file-service";
import URI from "@theia/core/lib/common/uri";
import { FileChangesEvent } from "@theia/filesystem/lib/common/files";
import { BuildMode } from "../build/types";
import { ConnectedFlashCart, FlashCartConfig, getFlashCartConfigs } from "../flash-carts/commands/flash";
import { getBuildPath, getRomPath } from "./functions";
import { PreferenceService } from "@theia/core/lib/browser";
import { VesBuildModePreference } from "../build/preferences";
import { VesRunDefaultEmulatorPreference, VesRunEmulatorConfigsPreference } from "../run/preferences";
import { getDefaultEmulatorConfig, getEmulatorConfigs } from "../run/commands/run";
import { FrontendApplicationState, FrontendApplicationStateService } from "@theia/core/lib/browser/frontend-application-state";
import { EmulatorConfig } from "../run/types";
import { VesUsbService } from "../../common/usb-service-protocol";

type BuildFolderFlags = {
    [key: string]: boolean
}

@injectable()
export class VesStateModel {

    @inject(FileService) protected fileService: FileService;
    @inject(FrontendApplicationStateService) protected readonly frontendApplicationStateService: FrontendApplicationStateService;
    @inject(PreferenceService) protected readonly preferenceService: PreferenceService;
    @inject(VesUsbService) protected readonly vesUsbService: VesUsbService;

    @postConstruct()
    protected async init(): Promise<void> {
        // init flags
        this.frontendApplicationStateService.onStateChanged(async (state: FrontendApplicationState) => {
            if (state === 'attached_shell') {
                for (const buildMode in BuildMode) {
                    this.fileService.exists(new URI(getBuildPath(buildMode))).then((exists: boolean) => {
                        this.setBuildFolderExists(buildMode, exists);
                    });
                }

                this.fileService.exists(new URI(getRomPath())).then((exists: boolean) => {
                    this.outputRomExists = exists;
                });

                const flashCartConfigs: FlashCartConfig[] = getFlashCartConfigs(this.preferenceService);
                this.connectedFlashCart = await this.vesUsbService.detectFlashCart(...flashCartConfigs);
            }
        });

        // watch for file changes
        // TODO: watch only respective folders
        // const cleanPath = joinPath(getWorkspaceRoot(), "build", BuildMode.Release)
        // const test = this.fileService.watch(new URI(cleanPath));
        this.fileService.onDidFilesChange((fileChangesEvent: FileChangesEvent) => {
            for (const buildMode in BuildMode) {
                if (fileChangesEvent.contains(new URI(getBuildPath(buildMode)))) {
                    this.fileService.exists(new URI(getBuildPath(buildMode))).then((exists: boolean) => {
                        this.setBuildFolderExists(buildMode, exists);
                    });
                }
            }

            if (fileChangesEvent.contains(new URI(getRomPath()))) {
                this.fileService.exists(new URI(getRomPath())).then((exists: boolean) => {
                    this.outputRomExists = exists;
                });
            }
        });

        // watch for preference changes
        this.preferenceService.onPreferenceChanged(({ preferenceName, newValue }) => {
            switch (preferenceName) {
                case VesBuildModePreference.id:
                    this.onDidChangeBuildModeEmitter.fire(newValue);
                    this.onDidChangeBuildFolderEmitter.fire(this._buildFolderExists);
                    break;
                case VesRunEmulatorConfigsPreference.id:
                    this.onDidChangeEmulatorConfigsEmitter.fire(getEmulatorConfigs(this.preferenceService));
                    break;
                case VesRunDefaultEmulatorPreference.id:
                    this.onDidChangeEmulatorEmitter.fire(getDefaultEmulatorConfig(this.preferenceService).name);
                    break;
            }
        });
    }

    // emulator configs
    protected readonly onDidChangeEmulatorConfigsEmitter = new Emitter<EmulatorConfig[]>();
    readonly onDidChangeEmulatorConfigs = this.onDidChangeEmulatorConfigsEmitter.event;

    // default emulator
    protected readonly onDidChangeEmulatorEmitter = new Emitter<string>();
    readonly onDidChangeEmulator = this.onDidChangeEmulatorEmitter.event;

    // build mode
    protected readonly onDidChangeBuildModeEmitter = new Emitter<BuildMode>();
    readonly onDidChangeBuildMode = this.onDidChangeBuildModeEmitter.event;

    // build folder
    protected readonly onDidChangeBuildFolderEmitter = new Emitter<BuildFolderFlags>();
    readonly onDidChangeBuildFolder = this.onDidChangeBuildFolderEmitter.event;
    protected _buildFolderExists: BuildFolderFlags = {

    };
    setBuildFolderExists(buildMode: string, flag: boolean) {
        this._buildFolderExists[buildMode] = flag;
        this.onDidChangeBuildFolderEmitter.fire(this._buildFolderExists);
    }
    get buildFolderExists(): BuildFolderFlags {
        return this._buildFolderExists;
    }

    // output rom exists
    protected readonly onDidChangeOutputRomExistsEmitter = new Emitter<boolean>();
    readonly onDidChangeOutputRomExists = this.onDidChangeOutputRomExistsEmitter.event;
    protected _outputRomExists: boolean = false;
    set outputRomExists(flag: boolean) {
        this._outputRomExists = flag;
        this.onDidChangeOutputRomExistsEmitter.fire(this._outputRomExists);
    }
    get outputRomExists(): boolean {
        return this._outputRomExists;
    }

    // is cleaning
    protected _isCleaning: boolean = false;
    protected readonly onDidChangeIsCleaningEmitter = new Emitter<boolean>();
    readonly onDidChangeIsCleaning = this.onDidChangeIsCleaningEmitter.event;
    set isCleaning(flag: boolean) {
        this._isCleaning = flag;
        this.onDidChangeIsCleaningEmitter.fire(this._isCleaning);
    }
    get isCleaning(): boolean {
        return this._isCleaning;
    }

    // is building
    protected _isBuilding: boolean = false;
    protected readonly onDidChangeIsBuildingEmitter = new Emitter<boolean>();
    readonly onDidChangeIsBuilding = this.onDidChangeIsBuildingEmitter.event;
    set isBuilding(flag: boolean) {
        this._isBuilding = flag;
        this.onDidChangeIsBuildingEmitter.fire(this._isBuilding);
    }
    get isBuilding(): boolean {
        return this._isBuilding;
    }

    // connected flash cart
    protected _connectedFlashCart: ConnectedFlashCart | undefined = undefined;
    protected readonly onDidChangeConnectedFlashCartEmitter = new Emitter<ConnectedFlashCart | undefined>();
    readonly onDidChangeConnectedFlashCart = this.onDidChangeConnectedFlashCartEmitter.event;
    set connectedFlashCart(connectedFlashCart: ConnectedFlashCart | undefined) {
        this._connectedFlashCart = connectedFlashCart;
        this.onDidChangeConnectedFlashCartEmitter.fire(this._connectedFlashCart);
    }
    get connectedFlashCart(): ConnectedFlashCart | undefined {
        return this._connectedFlashCart;
    }

    // export queue
    protected _isExportQueued: boolean = false;
    protected readonly onDidChangeIsExportQueuedEmitter = new Emitter<boolean>();
    readonly onDidChangeIsExportQueued = this.onDidChangeIsExportQueuedEmitter.event;
    set isExportQueued(flag: boolean) {
        this._isExportQueued = flag;
        this.onDidChangeIsExportQueuedEmitter.fire(this._isExportQueued);
    }
    get isExportQueued(): boolean {
        return this._isExportQueued;
    }

    // run queue
    protected _isRunQueued: boolean = false;
    protected readonly onDidChangeIsRunQueuedEmitter = new Emitter<boolean>();
    readonly onDidChangeIsRunQueued = this.onDidChangeIsRunQueuedEmitter.event;
    set isRunQueued(flag: boolean) {
        this._isRunQueued = flag;
        this.onDidChangeIsRunQueuedEmitter.fire(this._isRunQueued);
    }
    get isRunQueued(): boolean {
        return this._isRunQueued;
    }

    // running
    protected _isRunning: boolean = false;
    protected readonly onDidChangeIsRunningEmitter = new Emitter<boolean>();
    readonly onDidChangeIsRunning = this.onDidChangeIsRunningEmitter.event;
    set isRunning(flag: boolean) {
        this._isRunning = flag;
        this.onDidChangeIsRunningEmitter.fire(this._isRunning);
    }
    get isRunning(): boolean {
        return this._isRunning;
    }

    // flash queue
    protected _isFlashQueued: boolean = false;
    protected readonly onDidChangeIsFlashQueuedEmitter = new Emitter<boolean>();
    readonly onDidChangeIsFlashQueued = this.onDidChangeIsFlashQueuedEmitter.event;
    set isFlashQueued(flag: boolean) {
        this._isFlashQueued = flag;
        this.onDidChangeIsFlashQueuedEmitter.fire(this._isFlashQueued);
    }
    get isFlashQueued(): boolean {
        return this._isFlashQueued;
    }

    // flashing
    protected _isFlashing: boolean = false;
    protected readonly onDidChangeIsFlashingEmitter = new Emitter<boolean>();
    readonly onDidChangeIsFlashing = this.onDidChangeIsFlashingEmitter.event;
    set isFlashing(flag: boolean) {
        this._isFlashing = flag;
        this.onDidChangeIsFlashingEmitter.fire(this._isFlashing);
    }
    get isFlashing(): boolean {
        return this._isFlashing;
    }
}