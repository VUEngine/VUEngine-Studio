import { inject, injectable, postConstruct } from "inversify";
import { Emitter } from "@theia/core/lib/common/event";
import { FileService } from "@theia/filesystem/lib/browser/file-service";
import { WorkspaceService } from "@theia/workspace/lib/browser";
import URI from "@theia/core/lib/common/uri";
import { FileChangesEvent } from "@theia/filesystem/lib/common/files";
import { BuildMode } from "../build/commands/setMode";

type BuildFolderFlags = {
    [key: string]: boolean
}

@injectable()
export class VesStateModel {

    @inject(FileService) protected fileService: FileService;
    @inject(WorkspaceService) protected workspaceService: WorkspaceService;

    @postConstruct()
    protected async init(): Promise<void> {
        for (const buildMode in BuildMode) {
            this.buildFolderExists[buildMode] = await this.fileService.exists(new URI(this.getReleaseFolder(buildMode)));
        }
        // TODO: watch only respective folders
        // const cleanPath = joinPath(getWorkspaceRoot(this.workspaceService), "build", "release")
        // const test = this.fileService.watch(new URI(cleanPath));
        this.fileService.onDidFilesChange(async (fileChangesEvent: FileChangesEvent) => {
            for (const buildMode in BuildMode) {
                if (fileChangesEvent.contains(new URI(this.getReleaseFolder(buildMode)))) {
                    this.buildFolderExists[buildMode] = await this.fileService.exists(new URI(this.getReleaseFolder(buildMode)));
                }
            }
            if (fileChangesEvent.contains(new URI(this.getReleaseFolder("output.vb")))) {
                this.outputRomExists = await this.fileService.exists(new URI(this.getReleaseFolder("output.vb")));
            }
        })
    }

    protected getReleaseFolder(buildMode: string) {
        // TODO: get project root dynamically
        return `/Users/chris/dev/vb/projects/vuengine-platformer-demo/build/${buildMode}`;
    }

    // build folder
    protected readonly onDidChangeBuildFolderEmitter = new Emitter<BuildFolderFlags>();
    readonly onDidChangeBuildFolder = this.onDidChangeBuildFolderEmitter.event;
    protected _buildFolderExists: BuildFolderFlags = {}
    set buildFolderExists(flags: BuildFolderFlags) {
        this._buildFolderExists = flags;
        this.onDidChangeBuildFolderEmitter.fire(this._buildFolderExists);
    }
    get buildFolderExists(): BuildFolderFlags {
        return this._buildFolderExists;
    }

    // output rom exists
    protected readonly onDidChangeOutputRomExistsEmitter = new Emitter<boolean>();
    readonly onDidChangeOutputRomExists = this.onDidChangeOutputRomExistsEmitter.event;
    protected _outputRomExists = false;
    set outputRomExists(flag: boolean) {
        this._outputRomExists = flag;
        this.onDidChangeOutputRomExistsEmitter.fire(this._outputRomExists);
    }
    get outputRomExists(): boolean {
        return this._outputRomExists;
    }

    // is cleaning
    protected _isCleaning = false;
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
    protected _isBuilding = false;
    protected readonly onDidChangeIsBuildingEmitter = new Emitter<boolean>();
    readonly onDidChangeIsBuilding = this.onDidChangeIsBuildingEmitter.event;
    set isBuilding(flag: boolean) {
        this._isBuilding = flag;
        this.onDidChangeIsBuildingEmitter.fire(this._isBuilding);
    }
    get isBuilding(): boolean {
        return this._isBuilding;
    }

    // flash cart connected
    protected _connectedFlashCart = "";
    protected readonly onDidChangeConnectedFlashCartEmitter = new Emitter<string>();
    readonly onDidChangeConnectedFlashCart = this.onDidChangeConnectedFlashCartEmitter.event;
    set connectedFlashCart(name: string) {
        this._connectedFlashCart = name;
        this.onDidChangeConnectedFlashCartEmitter.fire(this._connectedFlashCart);
    }
    get connectedFlashCart(): string {
        return this._connectedFlashCart;
    }

    // export queue
    protected _isExportQueued = false;
    protected readonly onDidChangeIsExportQueuedEmitter = new Emitter<boolean>();
    readonly onDidChangeIsExportQueued = this.onDidChangeIsExportQueuedEmitter.event;
    set isExportQueued(flag: boolean) {
        this._isExportQueued = flag;
    }
    get isExportQueued(): boolean {
        return this._isExportQueued;
    }

    // run queue
    protected _isRunQueued = false;
    protected readonly onDidChangeIsRunQueuedEmitter = new Emitter<boolean>();
    readonly onDidChangeIsRunQueued = this.onDidChangeIsRunQueuedEmitter.event;
    set isRunQueued(flag: boolean) {
        this._isRunQueued = flag;
    }
    get isRunQueued(): boolean {
        return this._isRunQueued;
    }

    // flash queue
    protected _isFlashQueued = false;
    protected readonly onDidChangeIsFlashQueuedEmitter = new Emitter<boolean>();
    readonly onDidChangeIsFlashQueued = this.onDidChangeIsFlashQueuedEmitter.event;
    set isFlashQueued(flag: boolean) {
        this._isFlashQueued = flag;
    }
    get isFlashQueued(): boolean {
        return this._isFlashQueued;
    }
}