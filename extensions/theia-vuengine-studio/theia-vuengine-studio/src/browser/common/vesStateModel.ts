import { inject, injectable, postConstruct } from "inversify";
import { Emitter } from "@theia/core/lib/common/event";
import { FileService } from "@theia/filesystem/lib/browser/file-service";
import URI from "@theia/core/lib/common/uri";
import { FileChangesEvent } from "@theia/filesystem/lib/common/files";
import { BuildMode } from "../build/commands/setMode";
import { ConnectedFlashCart } from "../flash-carts/commands/flash";
import { getBuildPath, getRomPath } from ".";

type BuildFolderFlags = {
    [key: string]: boolean
}

@injectable()
export class VesStateModel {

    @inject(FileService) protected fileService: FileService;

    @postConstruct()
    protected async init(): Promise<void> {
        // init flags
        for (const buildMode in BuildMode) {
            this.setBuildFolderExists(buildMode, await this.fileService.exists(new URI(getBuildPath(buildMode))));
        }
        this.outputRomExists = await this.fileService.exists(new URI(getRomPath()));

        // watch for file changes
        // TODO: watch only respective folders
        // const cleanPath = joinPath(getWorkspaceRoot(), "build", "release")
        // const test = this.fileService.watch(new URI(cleanPath));
        this.fileService.onDidFilesChange(async (fileChangesEvent: FileChangesEvent) => {
            for (const buildMode in BuildMode) {
                if (fileChangesEvent.contains(new URI(getBuildPath(buildMode)))) {
                    this.setBuildFolderExists(buildMode, await this.fileService.exists(new URI(getBuildPath(buildMode))));
                }
            }
            if (fileChangesEvent.contains(new URI(getRomPath()))) {
                this.outputRomExists = await this.fileService.exists(new URI(getRomPath()));
            }
        })
    }

    // build folder
    protected readonly onDidChangeBuildFolderEmitter = new Emitter<BuildFolderFlags>();
    readonly onDidChangeBuildFolder = this.onDidChangeBuildFolderEmitter.event;
    protected _buildFolderExists: BuildFolderFlags = {}
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
}