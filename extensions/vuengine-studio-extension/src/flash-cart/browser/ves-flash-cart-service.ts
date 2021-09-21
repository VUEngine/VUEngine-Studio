import { dirname, join as joinPath } from 'path';
// TODO: refactor to use fileservice
import { createWriteStream, readFileSync, unlinkSync } from 'fs';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { CommandService, isOSX, isWindows, MessageService } from '@theia/core/lib/common';
import URI from '@theia/core/lib/common/uri';
import { ApplicationShell, PreferenceService } from '@theia/core/lib/browser';
import { Emitter } from '@theia/core/shared/vscode-languageserver-protocol';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { FrontendApplicationState, FrontendApplicationStateService } from '@theia/core/lib/browser/frontend-application-state';
import { EnvVariablesServer } from '@theia/core/lib/common/env-variables';
import { VesBuildCommands } from '../../build/browser/ves-build-commands';
import { VesBuildService } from '../../build/browser/ves-build-service';
import { VesProcessService, VesProcessType } from '../../process/common/ves-process-service-protocol';
import { VesProcessWatcher } from '../../process/browser/ves-process-service-watcher';
import { VesProjectsService } from '../../projects/browser/ves-projects-service';
import { VesBuildPreferenceIds } from '../../build/browser/ves-build-preferences';
import { VesFlashCartPreferenceIds, VesFlashCartPreferenceSchema } from './ves-flash-cart-preferences';
import { ConnectedFlashCart, FlashCartConfig } from './ves-flash-cart-types';
import { VesFlashCartUsbService } from '../common/ves-flash-cart-usb-service-protocol';
import { VesFlashCartUsbWatcher } from './ves-flash-cart-usb-watcher';
import { IMAGE_FLASHBOY_PLUS } from './images/flashboy-plus';
import { IMAGE_HYPERFLASH32 } from './images/hyperflash32';
import { VesFlashCartCommands } from './ves-flash-cart-commands';

export const PROG_VB_PLACEHOLDER = '%PROGVB%';
export const HFCLI_PLACEHOLDER = '%HFCLI%';
export const ROM_PLACEHOLDER = '%ROM%';
export const FLASHBOY_PLUS_IMAGE_PLACEHOLDER = '%FBP_IMG%';
export const HYPERFLASH32_IMAGE_PLACEHOLDER = '%HF32_IMG%';

@injectable()
export class VesFlashCartService {
  @inject(ApplicationShell)
  protected readonly shell: ApplicationShell;
  @inject(CommandService)
  protected commandService: CommandService;
  @inject(EnvVariablesServer)
  protected readonly envVariablesServer: EnvVariablesServer;
  @inject(FileService)
  protected fileService: FileService;
  @inject(FrontendApplicationStateService)
  protected readonly frontendApplicationStateService: FrontendApplicationStateService;
  @inject(MessageService)
  protected readonly messageService: MessageService;
  @inject(PreferenceService)
  protected readonly preferenceService: PreferenceService;
  @inject(VesBuildService)
  protected readonly vesBuildService: VesBuildService;
  @inject(VesFlashCartUsbService)
  protected readonly vesFlashCartUsbService: VesFlashCartUsbService;
  @inject(VesFlashCartUsbWatcher)
  protected readonly vesFlashCartUsbWatcher: VesFlashCartUsbWatcher;
  @inject(VesProcessService)
  protected readonly vesProcessService: VesProcessService;
  @inject(VesProcessWatcher)
  protected readonly vesProcessWatcher: VesProcessWatcher;
  @inject(VesProjectsService)
  protected readonly vesProjectsService: VesProjectsService;

  // is queued
  protected _isQueued: boolean = false;
  protected readonly onDidChangeIsQueuedEmitter = new Emitter<boolean>();
  readonly onDidChangeIsQueued = this.onDidChangeIsQueuedEmitter.event;
  set isQueued(flag: boolean) {
    this._isQueued = flag;
    this.onDidChangeIsQueuedEmitter.fire(this._isQueued);
  }
  get isQueued(): boolean {
    return this._isQueued;
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

  @postConstruct()
  protected async init(): Promise<void> {
    this.frontendApplicationStateService.onStateChanged(
      async (state: FrontendApplicationState) => {
        if (state === 'attached_shell') {
          this.detectConnectedFlashCarts();
        }
      }
    );

    // watch for preference changes
    this.preferenceService.onPreferenceChanged(
      ({ preferenceName, newValue }) => {
        switch (preferenceName) {
          case VesFlashCartPreferenceIds.FLASH_CARTS:
            this.detectConnectedFlashCarts();
            break;
        }
      }
    );

    // watch for flash cart attach/detach
    this.vesFlashCartUsbWatcher.onAttach(async () =>
      this.detectConnectedFlashCarts()
    );
    this.vesFlashCartUsbWatcher.onDetach(async () =>
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

    this.bindEvents();
  }

  async doFlash(): Promise<void> {
    if (this.isQueued) {
      this.isQueued = false;
    } else if (this.vesBuildService.buildStatus.active) {
      this.isQueued = true;
    } else if (this.vesBuildService.outputRomExists && (this.isFlashing || this.connectedFlashCarts.length === 0)) {
      this.commandService.executeCommand(VesFlashCartCommands.OPEN_WIDGET.id);
    } else {
      if (this.vesBuildService.outputRomExists) {
        this.flash();
      } else {
        this.isQueued = true;
        this.commandService.executeCommand(VesBuildCommands.BUILD.id, true);
      }
    }
  }

  async flash(): Promise<void> {
    if (this.connectedFlashCarts.length === 0) {
      return;
    }

    for (const connectedFlashCart of this.connectedFlashCarts) {
      const flasherPath = await this.replaceFlasherPath(connectedFlashCart.config.path);

      if (!flasherPath) {
        this.messageService.error(
          `No path to flasher software provided for cart '${connectedFlashCart.config.name}'`
        );
        continue;
      }

      if (!await this.fileService.exists(new URI(dirname(flasherPath)))) {
        this.messageService.error(
          `Flasher software does not exist at '${flasherPath}'`
        );
        continue;
      }

      /* const flasherEnvPath = this.convertoToEnvPath(flasherPath);

      const enableWsl = this.preferenceService.get(VesBuildPreferenceIds.ENABLE_WSL);
      if (isWindows && enableWsl) {
        flasherEnvPath.replace(/\.[^/.]+$/, '');
      } */

      const romPath = connectedFlashCart.config.padRom &&
        await this.padRom(connectedFlashCart.config.size)
        ? this.getPaddedRomPath()
        : this.getRomPath();

      const flasherArgs = connectedFlashCart.config.args
        ? connectedFlashCart.config.args
          .replace(ROM_PLACEHOLDER, romPath)
          .split(' ')
        : [];

      await this.fixPermissions();

      const { processManagerId } = await this.vesProcessService.launchProcess(VesProcessType.Terminal, {
        command: flasherPath,
        args: flasherArgs,
      });

      connectedFlashCart.status = {
        ...connectedFlashCart.status,
        step: (connectedFlashCart.config.name === VesFlashCartPreferenceSchema.properties[VesFlashCartPreferenceIds.FLASH_CARTS].default[0].name) // FlashBoy
          ? 'Erasing'
          : 'Flashing',
        processId: processManagerId,
        progress: 0,
        log: '',
      };

      // trigger change event
      this.connectedFlashCarts = this.connectedFlashCarts;
    }

    this.isFlashing = true;
    // this.commandService.executeCommand(VesFlashCartCommands.OPEN_WIDGET.id, true);
  }

  abort(): void {
    for (const connectedFlashCart of this.connectedFlashCarts) {
      this.vesProcessService.killProcess(connectedFlashCart.status.processId);
      connectedFlashCart.status.progress = -1;
    }

    // trigger change event
    this.connectedFlashCarts = this.connectedFlashCarts;

    this.isFlashing = false;
    this.flashingProgress = -1;
  }

  /**
   * Give executables respective permission on UNIX systems.
   * Must be executed before every run to ensure permissions are right,
   * even right after reconfiguring paths.
   */
  protected async fixPermissions(): Promise<void> {
    if (isWindows) {
      return;
    }

    for (const connectedFlashCart of this.connectedFlashCarts) {
      const flasherPath = await this.replaceFlasherPath(connectedFlashCart.config.path);
      await this.vesProcessService.launchProcess(VesProcessType.Raw, {
        command: 'chmod',
        args: ['a+x', flasherPath]
      });
    }
  }

  protected bindEvents(): void {
    this.vesBuildService.onDidBuildSucceed(() => {
      if (this.isQueued) {
        this.isQueued = false;
        this.doFlash();
      }
    });
    this.vesBuildService.onDidBuildFail(() => {
      this.isQueued = false;
    });

    this.vesProcessWatcher.onExit(({ pId }) => {
      // console.log('exit', pId);
      for (const connectedFlashCart of this.connectedFlashCarts) {
        if (connectedFlashCart.status.processId === pId) {
          // TODO: differenciate between done and error
          connectedFlashCart.status.progress = -1;

          // trigger change event
          this.connectedFlashCarts = this.connectedFlashCarts;

          let finished = 0;
          for (const entry of this.connectedFlashCarts) {
            if (entry.status.progress === -1 || entry.status.progress === 100) {
              finished++;
            }
          }

          if (finished === this.connectedFlashCarts.length) {
            this.isFlashing = false;
          }
        }
      }
    });

    this.vesProcessWatcher.onOutputStreamData(({ pId, data }) => {
      // console.log('data', pId, data);
      this.processStreamData(pId, data);
    });

    this.vesProcessWatcher.onErrorStreamData(({ pId, data }) => {
      // console.log('error data', pId, data);
      this.processStreamData(pId, data);
    });
  }

  protected processStreamData(pId: number, data: any): void { /* eslint-disable-line */
    for (const connectedFlashCart of this.connectedFlashCarts) {
      if (connectedFlashCart.status.processId === pId) {
        connectedFlashCart.status.log += data;

        switch (connectedFlashCart.config.path) {
          case PROG_VB_PLACEHOLDER:
            this.parseStreamDataProgVb(connectedFlashCart, data);
            break;
          case HFCLI_PLACEHOLDER:
            this.parseStreamDataHyperFlasherCli32(connectedFlashCart, data);
            break;
        }
      }
    }

    // trigger change event
    this.connectedFlashCarts = this.connectedFlashCarts;
  }

  protected async replaceFlasherPath(flasherPath: string): Promise<string> {
    return flasherPath
      .replace(HFCLI_PLACEHOLDER, await this.getHfCliPath())
      .replace(PROG_VB_PLACEHOLDER, await this.getProgVbPath());
  }

  protected async padRom(size: number): Promise<boolean> {
    const romPath = this.getRomPath();
    const paddedRomPath = this.getPaddedRomPath();

    if (!this.vesBuildService.outputRomExists) {
      return false;
    }

    const targetSize = size * 128;
    const romContent = readFileSync(romPath);
    const romSize = romContent.length / 1024;
    const timesToMirror = targetSize / romSize;

    if (romSize >= targetSize) {
      return false;
    }

    if (await this.fileService.exists(new URI(paddedRomPath))) {
      unlinkSync(paddedRomPath);
    }

    const stream = createWriteStream(paddedRomPath, { flags: 'a' });
    [...Array(timesToMirror)].forEach(function (): void {
      stream.write(romContent);
    });
    stream.end();

    return true;
  }

  protected getPaddedRomPath(): string {
    return this.getRomPath().replace('output.vb', 'outputPadded.vb');
  }

  protected async parseStreamDataHyperFlasherCli32(connectedFlashCart: ConnectedFlashCart, data: any): Promise<void> { /* eslint-disable-line */
    if (connectedFlashCart.config.name === VesFlashCartPreferenceSchema.properties[VesFlashCartPreferenceIds.FLASH_CARTS].default[1].name) {
      /* Number of # is only fixed (to 20) on HF32 firmware version 1.9 and above.
        On lower firmwares, the number of # depends on file size.
        TODO: support older firmwares as well? Can the firmware be detected? */

      if (data.includes('Transmitting:')) {
        connectedFlashCart.status = {
          ...connectedFlashCart.status,
          step: 'Transmitting',
          progress: Math.floor(data.split('Transmitting: ')[1].length * 2.5),
        };
      } else if (data.includes('Flashing:')) {
        connectedFlashCart.status = {
          ...connectedFlashCart.status,
          step: 'Flashing',
          progress: 50 + Math.floor(data.split('Flashing: ')[1].length * 2.5),
        };
      }
    }
  }

  protected async parseStreamDataProgVb(connectedFlashCart: ConnectedFlashCart, data: any): Promise<void> { /* eslint-disable-line */
    if (connectedFlashCart.config.name === VesFlashCartPreferenceSchema.properties[VesFlashCartPreferenceIds.FLASH_CARTS].default[0].name) {
      if (data.includes('/2048')) {
        const packetsWritten = parseInt(data.substring(data.lastIndexOf(']') + 2, data.lastIndexOf('/')));
        connectedFlashCart.status = {
          ...connectedFlashCart.status,
          step: 'Flashing',
          progress: Math.round(packetsWritten * 100 / 2048),
        };
      }
    }
  }

  async detectConnectedFlashCarts(): Promise<void> {
    const flashCartConfigs: FlashCartConfig[] = this.getFlashCartConfigs();
    this.connectedFlashCarts = await this.vesFlashCartUsbService.detectFlashCarts(
      ...flashCartConfigs
    );
  };

  getFlashCartConfigs(): FlashCartConfig[] {
    const flashCartConfigs: FlashCartConfig[] = this.preferenceService.get(VesFlashCartPreferenceIds.FLASH_CARTS) ?? [];

    const effectiveFlashCartConfigs = flashCartConfigs.length > 0
      ? flashCartConfigs
      : VesFlashCartPreferenceSchema.properties[VesFlashCartPreferenceIds.FLASH_CARTS].default;

    return effectiveFlashCartConfigs.map((flashCartConfig: FlashCartConfig) => ({
      ...flashCartConfig,
      image: flashCartConfig.image
        .replace(FLASHBOY_PLUS_IMAGE_PLACEHOLDER, IMAGE_FLASHBOY_PLUS)
        .replace(HYPERFLASH32_IMAGE_PLACEHOLDER, IMAGE_HYPERFLASH32),
    }));
  }

  async getProgVbPath(): Promise<string> {
    return joinPath(
      await this.getResourcesPath(),
      'binaries',
      'vuengine-studio-tools',
      this.getOs(),
      'prog-vb',
      isWindows ? 'prog-vb.exe' : 'prog-vb'
    );
  }

  async getHfCliPath(): Promise<string> {
    return joinPath(
      await this.getResourcesPath(),
      'binaries',
      'vuengine-studio-tools',
      this.getOs(),
      'hf-cli',
      isWindows ? 'hfcli.exe' : 'hfcli'
    );
  }

  getRomPath(): string {
    return joinPath(this.vesProjectsService.getWorkspaceRoot(), 'build', 'output.vb');
  }

  async getResourcesPath(): Promise<string> {
    const envVar = await this.envVariablesServer.getValue('THEIA_APP_PROJECT_PATH');
    const applicationPath = envVar && envVar.value ? envVar.value : '';
    return applicationPath;
  }

  getOs(): string {
    return isWindows ? 'win' : isOSX ? 'osx' : 'linux';
  }

  convertoToEnvPath(path: string): string {
    const enableWsl = this.preferenceService.get(VesBuildPreferenceIds.ENABLE_WSL);
    let envPath = path.replace(/\\/g, '/').replace(/^[a-zA-Z]:\//, function (x): string {
      return `/${x.substr(0, 1).toLowerCase()}/`;
    });

    if (isWindows && enableWsl) {
      envPath = '/mnt/' + envPath;
    }

    return envPath;
  }
}
