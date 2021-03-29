import { inject, injectable, postConstruct } from "inversify";
import { Emitter } from "@theia/core/lib/common/event";
import { FileService } from "@theia/filesystem/lib/browser/file-service";
import URI from "@theia/core/lib/common/uri";
import { PreferenceService } from "@theia/core/lib/browser";
import { FileChangesEvent } from "@theia/filesystem/lib/common/files";
import {
  FrontendApplicationState,
  FrontendApplicationStateService,
} from "@theia/core/lib/browser/frontend-application-state";
import {
  ConnectedFlashCart,
  FlashCartConfig,
  getFlashCartConfigs,
} from "../flash-carts/commands/flash";
import { getBuildPath, getRomPath } from "./functions";
import { VesBuildModePreference } from "../build/preferences";
import {
  VesRunDefaultEmulatorPreference,
  VesRunEmulatorConfigsPreference,
} from "../run/preferences";
import {
  getDefaultEmulatorConfig,
  getEmulatorConfigs,
} from "../run/commands/runInEmulator";
import { EmulatorConfig } from "../run/types";
import { VesFlashCartWatcher } from "../services/flash-cart-service/flash-cart-watcher";
import { BuildLogLine, BuildMode, BuildStatus } from "../build/types";
import { VesFlashCartService } from "../../common/flash-cart-service-protocol";
import { VesFlashCartsPreference } from "../flash-carts/preferences";

type BuildFolderFlags = {
  [key: string]: boolean;
};

@injectable()
export class VesStateModel {
  @inject(FileService) protected fileService: FileService;
  @inject(FrontendApplicationStateService)
  protected readonly frontendApplicationStateService: FrontendApplicationStateService;
  @inject(PreferenceService)
  protected readonly preferenceService: PreferenceService;
  @inject(VesFlashCartService)
  protected readonly vesFlashCartService: VesFlashCartService;
  @inject(VesFlashCartWatcher)
  protected readonly vesFlashCartWatcher: VesFlashCartWatcher;

  @postConstruct()
  protected async init(): Promise<void> {
    // init flags
    this.frontendApplicationStateService.onStateChanged(
      async (state: FrontendApplicationState) => {
        if (state === "attached_shell") {
          for (const buildMode in BuildMode) {
            this.fileService
              .exists(new URI(getBuildPath(buildMode)))
              .then((exists: boolean) => {
                this.setBuildFolderExists(buildMode, exists);
              });
          }

          // TODO: fileService.exists does not seem to work on Windows
          this.fileService
            .exists(new URI(getRomPath()))
            .then((exists: boolean) => {
              this.outputRomExists = exists;
            });

          this.detectConnectedFlashCarts();
        }
      }
    );

    this.resetBuildStatus();

    // watch for file changes
    // TODO: watch only respective folders
    // const cleanPath = joinPath(getWorkspaceRoot(), "build", BuildMode.Release)
    // const test = this.fileService.watch(new URI(cleanPath));
    this.fileService.onDidFilesChange((fileChangesEvent: FileChangesEvent) => {
      for (const buildMode in BuildMode) {
        if (fileChangesEvent.contains(new URI(getBuildPath(buildMode)))) {
          this.fileService
            .exists(new URI(getBuildPath(buildMode)))
            .then((exists: boolean) => {
              this.setBuildFolderExists(buildMode, exists);
            });
        }
      }

      if (fileChangesEvent.contains(new URI(getRomPath()))) {
        this.fileService
          .exists(new URI(getRomPath()))
          .then((exists: boolean) => {
            this.outputRomExists = exists;
          });
      }
    });

    // watch for preference changes
    this.preferenceService.onPreferenceChanged(
      ({ preferenceName, newValue }) => {
        switch (preferenceName) {
          case VesBuildModePreference.id:
            this.onDidChangeBuildModeEmitter.fire(newValue);
            this.onDidChangeBuildFolderEmitter.fire(this._buildFolderExists);
            break;
          case VesRunEmulatorConfigsPreference.id:
            this.onDidChangeEmulatorConfigsEmitter.fire(
              getEmulatorConfigs(this.preferenceService)
            );
            break;
          case VesRunDefaultEmulatorPreference.id:
            this.onDidChangeEmulatorEmitter.fire(
              getDefaultEmulatorConfig(this.preferenceService).name
            );
            break;
          case VesFlashCartsPreference.id:
            this.detectConnectedFlashCarts();
            break;
        }
      }
    );

    // watch for flash cart attach/detach
    this.vesFlashCartWatcher.onAttach(async () =>
      this.detectConnectedFlashCarts()
    );
    this.vesFlashCartWatcher.onDetach(async () =>
      this.detectConnectedFlashCarts()
    );

    // compute overall flashing progress
    this.onDidChangeConnectedFlashCarts(() => {
      let activeCarts = 0;
      let activeCartsProgress = 0;
      for (const connectedFlashCart of this.connectedFlashCarts) {
        if (connectedFlashCart.status.progress > -1) {
          activeCarts++;
          activeCartsProgress += connectedFlashCart.status.progress;
        }
      }
      if (activeCarts > 0) {
        const overallProgress = Math.floor(activeCartsProgress / activeCarts);
        if (this.flashingProgress !== overallProgress) {
          this.flashingProgress = overallProgress;
        }
      }
    });
  }

  detectConnectedFlashCarts = async () => {
    const flashCartConfigs: FlashCartConfig[] = getFlashCartConfigs(
      this.preferenceService
    );
    this.connectedFlashCarts = await this.vesFlashCartService.detectFlashCarts(
      ...flashCartConfigs
    );
  };

  // emulator configs
  protected readonly onDidChangeEmulatorConfigsEmitter = new Emitter<
    EmulatorConfig[]
  >();
  readonly onDidChangeEmulatorConfigs = this.onDidChangeEmulatorConfigsEmitter
    .event;

  // default emulator
  protected readonly onDidChangeEmulatorEmitter = new Emitter<string>();
  readonly onDidChangeEmulator = this.onDidChangeEmulatorEmitter.event;

  // build mode
  protected readonly onDidChangeBuildModeEmitter = new Emitter<BuildMode>();
  readonly onDidChangeBuildMode = this.onDidChangeBuildModeEmitter.event;

  // build folder
  protected readonly onDidChangeBuildFolderEmitter = new Emitter<
    BuildFolderFlags
  >();
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
  readonly onDidChangeOutputRomExists = this.onDidChangeOutputRomExistsEmitter
    .event;
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

  // build status
  protected _buildStatus: BuildStatus = {
    active: false,
    processManagerId: -1,
    processId: -1,
    progress: -1,
    log: [],
    buildMode: BuildMode.Beta,
    step: "",
    plugins: 0,
    stepsDone: -1,
  };
  protected readonly onDidChangeBuildStatusEmitter = new Emitter<BuildStatus>();
  readonly onDidChangeBuildStatus = this.onDidChangeBuildStatusEmitter.event;
  set buildStatus(status: BuildStatus) {
    this._buildStatus = status;
    this.onDidChangeBuildStatusEmitter.fire(this._buildStatus);
  }
  get buildStatus(): BuildStatus {
    return this._buildStatus;
  }
  public resetBuildStatus(step?: string) {
    const newBuildStatus = {
      ...this.buildStatus,
      active: false,
    };

    if (step) {
      newBuildStatus.step = step;
    }

    this.buildStatus = newBuildStatus;

    this.isExportQueued = false;
    this.isRunQueued = false;
    this.isFlashQueued = false;
  }
  public pushBuildLogLine(buildLogLine: BuildLogLine) {
    this._buildStatus.log.push(buildLogLine);
    this.onDidChangeBuildStatusEmitter.fire(this._buildStatus);
  }

  // export queue
  protected _isExportQueued: boolean = false;
  protected readonly onDidChangeIsExportQueuedEmitter = new Emitter<boolean>();
  readonly onDidChangeIsExportQueued = this.onDidChangeIsExportQueuedEmitter
    .event;
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

  // connected flash carts
  protected _connectedFlashCarts: ConnectedFlashCart[] = [];
  protected readonly onDidChangeConnectedFlashCartsEmitter = new Emitter<
    ConnectedFlashCart[]
  >();
  readonly onDidChangeConnectedFlashCarts = this
    .onDidChangeConnectedFlashCartsEmitter.event;
  set connectedFlashCarts(connectedFlashCart: ConnectedFlashCart[]) {
    this._connectedFlashCarts = connectedFlashCart;
    this.onDidChangeConnectedFlashCartsEmitter.fire(this._connectedFlashCarts);
  }
  get connectedFlashCarts(): ConnectedFlashCart[] {
    return this._connectedFlashCarts;
  }

  // flash queue
  protected _isFlashQueued: boolean = false;
  protected readonly onDidChangeIsFlashQueuedEmitter = new Emitter<boolean>();
  readonly onDidChangeIsFlashQueued = this.onDidChangeIsFlashQueuedEmitter
    .event;
  set isFlashQueued(flag: boolean) {
    this._isFlashQueued = flag;
    this.onDidChangeIsFlashQueuedEmitter.fire(this._isFlashQueued);
  }
  get isFlashQueued(): boolean {
    return this._isFlashQueued;
  }

  // is flashing
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

  // flashing progress
  protected _flashingProgress: number = -1;
  protected readonly onDidChangeFlashingProgressEmitter = new Emitter<number>();
  readonly onDidChangeFlashingProgress = this.onDidChangeFlashingProgressEmitter
    .event;
  set flashingProgress(progress: number) {
    this._flashingProgress = progress;
    this.onDidChangeFlashingProgressEmitter.fire(this._flashingProgress);
  }
  get flashingProgress(): number {
    return this._flashingProgress;
  }
}
