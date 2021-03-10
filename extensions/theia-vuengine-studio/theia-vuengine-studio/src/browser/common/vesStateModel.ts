import { inject, injectable, postConstruct } from "inversify";
import { Emitter } from "@theia/core/lib/common/event";
import { FileService } from "@theia/filesystem/lib/browser/file-service";
import URI from "@theia/core/lib/common/uri";
import { PreferenceService } from "@theia/core/lib/browser";
import { FileChangesEvent } from "@theia/filesystem/lib/common/files";
import { FrontendApplicationState, FrontendApplicationStateService } from "@theia/core/lib/browser/frontend-application-state";
import { ConnectedFlashCart, FlashCartConfig, FlashingProgress, getFlashCartConfigs } from "../flash-carts/commands/flash";
import { getBuildPath, getRomPath } from "./functions";
import { VesBuildModePreference } from "../build/preferences";
import { VesRunDefaultEmulatorPreference, VesRunEmulatorConfigsPreference } from "../run/preferences";
import { getDefaultEmulatorConfig, getEmulatorConfigs } from "../run/commands/run";
import { EmulatorConfig } from "../run/types";
import { VesFlashCartWatcher } from "../services/flash-cart-service/flash-cart-watcher";
import { BuildMode } from "../build/types";
import { VesFlashCartService } from "../../common/flash-cart-service-protocol";

type BuildFolderFlags = {
    [key: string]: boolean
}

@injectable()
export class VesStateModel {

    @inject(FileService) protected fileService: FileService;
    @inject(FrontendApplicationStateService) protected readonly frontendApplicationStateService: FrontendApplicationStateService;
    @inject(PreferenceService) protected readonly preferenceService: PreferenceService;
    @inject(VesFlashCartService) protected readonly vesFlashCartService: VesFlashCartService;
    @inject(VesFlashCartWatcher) protected readonly vesFlashCartWatcher: VesFlashCartWatcher;

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

                // TODO: fileService.exists does not seem to work on Windows
                this.fileService.exists(new URI(getRomPath())).then((exists: boolean) => {
                    this.outputRomExists = exists;
                });

                this.detectConnectedFlashCart();
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

        // watch for flash cart attach/detach
        this.vesFlashCartWatcher.onAttach(async () => this.detectConnectedFlashCart());
        this.vesFlashCartWatcher.onDetach(async () => this.detectConnectedFlashCart());
    }

    protected detectConnectedFlashCart = async () => {
        const flashCartConfigs: FlashCartConfig[] = getFlashCartConfigs(this.preferenceService);
        this.connectedFlashCart = await this.vesFlashCartService.detectFlashCart(...flashCartConfigs);
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
    protected _buildFolderExists: BuildFolderFlags = {};
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
    protected _isBuilding: number = 0;
    protected readonly onDidChangeIsBuildingEmitter = new Emitter<number>();
    readonly onDidChangeIsBuilding = this.onDidChangeIsBuildingEmitter.event;
    set isBuilding(processManagerId: number) {
        this._isBuilding = processManagerId;
        this.onDidChangeIsBuildingEmitter.fire(this._isBuilding);
    }
    get isBuilding(): number {
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

    // is running
    protected _isRunning: number = 0;
    protected readonly onDidChangeIsRunningEmitter = new Emitter<number>();
    readonly onDidChangeIsRunning = this.onDidChangeIsRunningEmitter.event;
    set isRunning(processManagerId: number) {
        this._isRunning = processManagerId;
        this.onDidChangeIsRunningEmitter.fire(this._isRunning);
    }
    get isRunning(): number {
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

    // is flashing
    protected _isFlashing: number = 0;
    protected readonly onDidChangeIsFlashingEmitter = new Emitter<number>();
    readonly onDidChangeIsFlashing = this.onDidChangeIsFlashingEmitter.event;
    set isFlashing(processManagerId: number) {
        this._isFlashing = processManagerId;
        this.onDidChangeIsFlashingEmitter.fire(this._isFlashing);
    }
    get isFlashing(): number {
        return this._isFlashing;
    }

    // flashing progress
    protected _flashingProgress: FlashingProgress = {
        step: "Initial",
        progress: -1,
    };
    protected readonly onDidChangeFlashingProgressEmitter = new Emitter<FlashingProgress>();
    readonly onDidChangeFlashingProgress = this.onDidChangeFlashingProgressEmitter.event;
    set flashingProgress(progress: FlashingProgress) {
        this._flashingProgress = progress;
        this.onDidChangeFlashingProgressEmitter.fire(this._flashingProgress);
    }
    get flashingProgress(): FlashingProgress {
        return this._flashingProgress;
    }
}