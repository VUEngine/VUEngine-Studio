import { PreferenceService } from '@theia/core/lib/browser';
import { CommandService, MessageService, isWindows, nls } from '@theia/core/lib/common';
import { BinaryBufferWriteableStream } from '@theia/core/lib/common/buffer';
import URI from '@theia/core/lib/common/uri';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { Emitter } from '@theia/core/shared/vscode-languageserver-protocol';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import IMAGE_HYPERBOY from '../../../src/flash-cart/browser/images/HyperBoy.png';
import IMAGE_FLASHBOY_PLUS from '../../../src/flash-cart/browser/images/flashboy-plus.png';
import IMAGE_HYPERFLASH32 from '../../../src/flash-cart/browser/images/hyperflash32-with-label.png';
import { VesBuildCommands } from '../../build/browser/ves-build-commands';
import { VesBuildService } from '../../build/browser/ves-build-service';
import { VesCommonService } from '../../core/browser/ves-common-service';
import { VesProcessWatcher } from '../../process/browser/ves-process-service-watcher';
import { VesProcessService, VesProcessType } from '../../process/common/ves-process-service-protocol';
import { VesProjectService } from '../../project/browser/ves-project-service';
import { VesFlashCartCommands } from './ves-flash-cart-commands';
import { VesFlashCartPreferenceIds } from './ves-flash-cart-preferences';
import {
  BUILT_IN_FLASH_CART_CONFIGS,
  ConnectedFlashCart,
  FLASHBOY_PLUS_IMAGE_PLACEHOLDER,
  FlashCartConfig,
  HBCLI_PLACEHOLDER,
  HFCLI_PLACEHOLDER,
  HYPERBOY_IMAGE_PLACEHOLDER,
  HYPERFLASH32_IMAGE_PLACEHOLDER,
  NAME_NO_SPACES_PLACEHOLDER,
  NAME_PLACEHOLDER,
  PORT_PLACEHOLDER,
  PROG_VB_PLACEHOLDER,
  ROM_PLACEHOLDER
} from './ves-flash-cart-types';

@injectable()
export class VesFlashCartService {
  @inject(CommandService)
  protected commandService: CommandService;
  @inject(FileService)
  protected fileService: FileService;
  @inject(MessageService)
  protected readonly messageService: MessageService;
  @inject(PreferenceService)
  protected readonly preferenceService: PreferenceService;
  @inject(VesBuildService)
  protected readonly vesBuildService: VesBuildService;
  @inject(VesCommonService)
  protected readonly vesCommonService: VesCommonService;
  @inject(VesProcessService)
  protected readonly vesProcessService: VesProcessService;
  @inject(VesProcessWatcher)
  protected readonly vesProcessWatcher: VesProcessWatcher;
  @inject(VesProjectService)
  protected readonly vesProjectsService: VesProjectService;
  @inject(WorkspaceService)
  private readonly workspaceService: WorkspaceService;

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

  // at least one of the connected flash carts can hold the rom
  protected _atLeastOneCanHoldRom: boolean = false;
  protected readonly onDidChangeAtLeastOneCanHoldRomEmitter = new Emitter<boolean>();
  readonly onDidChangeAtLeastOneCanHoldRom = this.onDidChangeAtLeastOneCanHoldRomEmitter.event;
  set atLeastOneCanHoldRom(flag: boolean) {
    this._atLeastOneCanHoldRom = flag;
    this.onDidChangeAtLeastOneCanHoldRomEmitter.fire(this._atLeastOneCanHoldRom);
  }
  get atLeastOneCanHoldRom(): boolean {
    return this._atLeastOneCanHoldRom;
  }

  // connected flash carts
  protected _connectedFlashCarts: ConnectedFlashCart[] = [];
  protected readonly onDidChangeConnectedFlashCartsEmitter = new Emitter<
    ConnectedFlashCart[]
  >();
  readonly onDidChangeConnectedFlashCarts = this.onDidChangeConnectedFlashCartsEmitter.event;
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

  protected readonly onDidStartFlashingEmitter = new Emitter<void>();
  readonly onDidStartFlashing = this.onDidStartFlashingEmitter.event;
  protected readonly onDidFailFlashingEmitter = new Emitter<void>();
  readonly onDidFailFlashing = this.onDidFailFlashingEmitter.event;
  protected readonly onDidSucceedFlashingEmitter = new Emitter<void>();
  readonly onDidSucceedFlashing = this.onDidSucceedFlashingEmitter.event;

  @postConstruct()
  protected init(): void {
    this.bindEvents();
  }

  async doFlash(): Promise<void> {
    const outputRomExists = await this.vesBuildService.outputRomExists();
    if (this.isQueued) {
      this.isQueued = false;
    } else if (this.vesBuildService.buildStatus.active) {
      this.isQueued = true;
    } else if (outputRomExists && (this.isFlashing ||
      !this.atLeastOneCanHoldRom || this.connectedFlashCarts.length === 0)) {
      this.commandService.executeCommand(VesFlashCartCommands.WIDGET_TOGGLE.id);
    } else {
      if (outputRomExists) {
        this.flash();
      } else {
        this.isQueued = true;
        this.commandService.executeCommand(VesBuildCommands.BUILD.id, true);
      }
    }
  }

  async flash(): Promise<void> {
    if (!this.atLeastOneCanHoldRom || this.connectedFlashCarts.length === 0) {
      return;
    }

    this.connectedFlashCarts = await Promise.all(this.connectedFlashCarts.map(async connectedFlashCart => {
      if (!connectedFlashCart.canHoldRom) {
        return connectedFlashCart;
      }

      const flasherPath = await this.replaceFlasherPath(connectedFlashCart.config.path);

      if (!flasherPath) {
        this.messageService.error(
          nls.localize('vuengine/flashCarts/noPathToFlasherSoftwareProvided', 'No path to flasher software provided for cart {0}', connectedFlashCart.config.name)
        );
        return connectedFlashCart;
      }

      if (!await this.fileService.exists(new URI(flasherPath).withScheme('file'))) {
        this.messageService.error(
          nls.localize('vuengine/flashCarts/flasherSoftwareDoesNotExist', 'Flasher software does not exist at {0}', flasherPath)
        );
        return connectedFlashCart;
      }

      const defaultRomUri = await this.vesBuildService.getDefaultRomUri();
      const romUri = connectedFlashCart.config.padRom &&
        await this.padRom(connectedFlashCart.config.size)
        ? await this.getPaddedRomUri(connectedFlashCart.config.size)
        : defaultRomUri;

      const projectName = await this.vesProjectsService.getProjectName();

      const flasherArgs = connectedFlashCart.config.args
        ? connectedFlashCart.config.args
          .replace(NAME_PLACEHOLDER, projectName)
          .replace(NAME_NO_SPACES_PLACEHOLDER, projectName.replace(/ /g, ''))
          .replace(ROM_PLACEHOLDER, await this.fileService.fsPath(romUri))
          .replace(PORT_PLACEHOLDER, connectedFlashCart.port)
          .split(' ')
        : [];

      await this.fixFilePermissions();

      const { processManagerId } = await this.vesProcessService.launchProcess(VesProcessType.Terminal, {
        command: flasherPath,
        args: flasherArgs,
      });

      return {
        ...connectedFlashCart,
        status: {
          ...connectedFlashCart.status,
          step: 'Preparing',
          processId: processManagerId,
          progress: 0,
          log: [],
        }
      };
    }));

    this.isFlashing = true;
    this.onDidStartFlashingEmitter.fire();
    // this.commandService.executeCommand(VesFlashCartCommands.WIDGET_TOGGLE.id, true);
  }

  abort(): void {
    for (const connectedFlashCart of this.connectedFlashCarts) {
      this.vesProcessService.killProcess(connectedFlashCart.status.processId);
      connectedFlashCart.status.progress = -1;
    }

    // trigger change event
    this.connectedFlashCarts = this.connectedFlashCarts;

    this.isFlashing = false;
    this.onDidFailFlashingEmitter.fire();
    this.flashingProgress = -1;
  }

  /**
   * Give executables respective permission on UNIX systems.
   * Must be executed before every run to ensure permissions are right,
   * even right after reconfiguring paths.
   */
  protected async fixFilePermissions(): Promise<void> {
    let command = 'chmod';
    let args = ['-R', 'a+x'];

    if (isWindows) {
      if (this.vesCommonService.isWslInstalled) {
        command = 'wsl.exe';
        args = ['chmod'].concat(args);
      } else {
        return;
      }
    }

    this.connectedFlashCarts.forEach(async connectedFlashCart => {
      const flasherPath = await this.replaceFlasherPath(connectedFlashCart.config.path);
      await this.vesProcessService.launchProcess(VesProcessType.Raw, {
        command,
        args: args.concat(flasherPath),
      });
    });
  }

  protected bindEvents(): void {
    // watch for preference changes
    this.preferenceService.onPreferenceChanged(
      ({ preferenceName }) => {
        switch (preferenceName) {
          case VesFlashCartPreferenceIds.FLASH_CARTS:
            this.detectConnectedFlashCarts();
            break;
        }
      }
    );

    // watch for flash cart attach/detach
    window.electronVesCore.onUsbDeviceChange(() => this.detectConnectedFlashCarts());

    this.vesBuildService.onDidSucceedBuild(async () => {
      if (this.isQueued) {
        this.isQueued = false;
        this.doFlash();
      }
    });
    this.vesBuildService.onDidFailBuild(() => {
      this.isQueued = false;
    });

    this.vesBuildService.onDidChangeRomSize(() => {
      this.determineAtLeastOneCanHoldRom();
    });

    this.vesProcessWatcher.onDidExitProcess(({ pId, event }) => {
      this.connectedFlashCarts.forEach(connectedFlashCart => {
        if (connectedFlashCart.status.processId === pId) {
          this.flashingProgress = -1;

          const successful = (event.code === 0);
          connectedFlashCart.status.progress = successful ? 100 : -1;

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
            this.onDidSucceedFlashingEmitter.fire();
          }
        }
      });
    });

    this.vesProcessWatcher.onDidReceiveOutputStreamData(({ pId, data }) => {
      this.processStreamData(pId, data);
    });

    this.vesProcessWatcher.onDidReceiveErrorStreamData(({ pId, data }) => {
      this.processStreamData(pId, data);
    });
  }

  protected processStreamData(pId: number, data: any): void {
    let flashCartStream = false;

    this.connectedFlashCarts.forEach(connectedFlashCart => {
      if (connectedFlashCart.status.processId === pId) {
        flashCartStream = true;
        const trimmedData = data.trim();

        connectedFlashCart.status.log.push({
          timestamp: Date.now(),
          text: trimmedData
        });

        this.parseStreamDataProgVb(connectedFlashCart, trimmedData);
        this.parseStreamDataHyperFlasherCli32(connectedFlashCart, trimmedData);
        this.parseStreamDataHyperBoyCli(connectedFlashCart, trimmedData);
      }
    });

    if (flashCartStream) {
      this.computeFlashingProgress();

      // trigger change event
      this.connectedFlashCarts = this.connectedFlashCarts;
    }
  }

  protected computeFlashingProgress(): void {
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
  }

  protected async replaceFlasherPath(flasherPath: string): Promise<string> {
    return flasherPath
      .replace(HBCLI_PLACEHOLDER, await this.fileService.fsPath(await this.getHbCliUri()))
      .replace(HFCLI_PLACEHOLDER, await this.fileService.fsPath(await this.getHfCliUri()))
      .replace(PROG_VB_PLACEHOLDER, await this.fileService.fsPath(await this.getProgVbUri()))
      .replace(/\\/g, '/');
  }

  protected async padRom(size: number): Promise<boolean> {
    const romUri = await this.vesBuildService.getDefaultRomUri();
    const paddedRomUri = await this.getPaddedRomUri(size);
    if (!await this.vesBuildService.outputRomExists()) {
      return false;
    }

    const targetSize = size * 128;
    const romContent = await this.fileService.readFile(romUri);
    const romSize = romContent.size / 1024;
    const timesToMirror = targetSize / romSize;

    if (romSize >= targetSize) {
      return false;
    }

    const paddedRomBuffer = BinaryBufferWriteableStream.create();
    [...Array(timesToMirror)].forEach(function (): void {
      paddedRomBuffer.write(romContent.value);
    });
    paddedRomBuffer.end();
    await this.fileService.writeFile(paddedRomUri, paddedRomBuffer);

    return true;
  }

  protected async getPaddedRomUri(size: number): Promise<URI> {
    await this.workspaceService.ready;
    const workspaceRootUri = this.workspaceService.tryGetRoots()[0]?.resource;
    return workspaceRootUri.resolve('build').resolve(`outputPadded${size}.vb`);
  }

  protected async parseStreamDataHyperFlasherCli32(connectedFlashCart: ConnectedFlashCart, data: any): Promise<void> {
    if (connectedFlashCart.config.path === HFCLI_PLACEHOLDER) {
      /* - Number of # is only fixed (to 20) on HF32 firmware version 1.9 and above.
        On lower firmwares, the number of # depends on file size.
        - Direct-to-flash (-x option) is only supported on HF32 firmware version 2.2 and above.
        TODO: support older firmwares as well? Can the firmware be detected? */

      if (data.startsWith('Sending file')) {
        connectedFlashCart.status = {
          ...connectedFlashCart.status,
          step: 'Erasing',
        };
      } else if (data.startsWith('Flash Cleared')) {
        connectedFlashCart.status = {
          ...connectedFlashCart.status,
          step: 'Flashing',
        };
      } else if (data.startsWith('#')) {
        connectedFlashCart.status = {
          ...connectedFlashCart.status,
          step: 'Flashing',
          progress: connectedFlashCart.status.progress + 5,
        };
      }
    }
  }

  protected async parseStreamDataHyperBoyCli(connectedFlashCart: ConnectedFlashCart, data: any): Promise<void> {
    if (connectedFlashCart.config.path === HBCLI_PLACEHOLDER) {
      if (data.startsWith('> Clearing')) {
        connectedFlashCart.status = {
          ...connectedFlashCart.status,
          step: 'Erasing',
        };
      } else if (data.startsWith('> Setting file size')) {
        connectedFlashCart.status = {
          ...connectedFlashCart.status,
          step: 'Flashing',
          progress: 0,
        };
      } else if (data.startsWith('#')) {
        connectedFlashCart.status = {
          ...connectedFlashCart.status,
          step: 'Flashing',
          progress: connectedFlashCart.status.progress + 5,
        };
      }
    }
  }

  protected async parseStreamDataProgVb(connectedFlashCart: ConnectedFlashCart, data: any): Promise<void> {
    if (connectedFlashCart.config.path === PROG_VB_PLACEHOLDER) {
      if (data.startsWith('Erasing device')) {
        connectedFlashCart.status = {
          ...connectedFlashCart.status,
          step: 'Erasing',
        };
      } else if (data.includes('/2048')) {
        const packetsWritten = parseInt(data.substring(data.lastIndexOf(']') + 2, data.lastIndexOf('/')));
        connectedFlashCart.status = {
          ...connectedFlashCart.status,
          step: 'Flashing',
          progress: Math.round(packetsWritten * 100 / 2048),
        };
      }
    }
  }

  protected async matchFlashCart(device: USBDevice, flashCartConfigs: FlashCartConfig[]): Promise<ConnectedFlashCart | undefined> {
    for (const flashCartConfig of flashCartConfigs) {
      for (const deviceCodes of flashCartConfig.deviceCodes) {
        if (device.vendorId === deviceCodes.vid &&
          device.productId === deviceCodes.pid &&
          device.productName === deviceCodes.product &&
          device.manufacturerName === deviceCodes.manufacturer) {
          return {
            config: flashCartConfig,
            deviceCodes,
            port: device.serialNumber || '',
            status: {
              processId: -1,
              step: '',
              progress: -1,
              log: [],
            },
            canHoldRom: await this.determineCanHoldRom(flashCartConfig.size),
          };
        }
      }
    }
  }

  async detectConnectedFlashCarts(): Promise<void> {
    navigator.usb.requestDevice({ filters: [] }).catch(() => { });
    const devices: USBDevice[] = await navigator.usb.getDevices();
    console.log('USB devices found', devices);
    if (devices.length > 0) {
      const flashCartConfigs: FlashCartConfig[] = this.getFlashCartConfigs();
      const connectedFlashCarts: ConnectedFlashCart[] = [];
      for (const device of devices) {
        const matchedFlashCart = await this.matchFlashCart(device, flashCartConfigs);
        if (matchedFlashCart) {
          // look for matches in already known carts to prevent losing status when another USB device is dis/connected
          const known = this.connectedFlashCarts.find(cfc =>
            cfc.port === matchedFlashCart.port &&
            JSON.stringify(cfc.config) === JSON.stringify(matchedFlashCart.config)
          );
          connectedFlashCarts.push(known ? known : matchedFlashCart);
        }
      }
      this.connectedFlashCarts = connectedFlashCarts;
      this.determineAtLeastOneCanHoldRom();
    }
  };

  getFlashCartConfigs(): FlashCartConfig[] {
    const flashCartConfigs: FlashCartConfig[] = this.preferenceService.get(VesFlashCartPreferenceIds.FLASH_CARTS) ?? [];
    const mergedFlashCartConfigs = flashCartConfigs.concat(BUILT_IN_FLASH_CART_CONFIGS);

    return mergedFlashCartConfigs.map((flashCartConfig: FlashCartConfig) => ({
      ...flashCartConfig,
      image: flashCartConfig.image
        .replace(FLASHBOY_PLUS_IMAGE_PLACEHOLDER, IMAGE_FLASHBOY_PLUS)
        .replace(HYPERFLASH32_IMAGE_PLACEHOLDER, IMAGE_HYPERFLASH32)
        .replace(HYPERBOY_IMAGE_PLACEHOLDER, IMAGE_HYPERBOY),
    }));
  }

  async getProgVbUri(): Promise<URI> {
    const resourcesUri = await this.vesCommonService.getResourcesUri();
    return resourcesUri
      .resolve('binaries')
      .resolve('vuengine-studio-tools')
      .resolve(this.vesCommonService.getOs())
      .resolve('prog-vb')
      .resolve(isWindows ? 'prog-vb.exe' : 'prog-vb');
  }

  async getHbCliUri(): Promise<URI> {
    const resourcesUri = await this.vesCommonService.getResourcesUri();
    return resourcesUri
      .resolve('binaries')
      .resolve('vuengine-studio-tools')
      .resolve(this.vesCommonService.getOs())
      .resolve('hb-cli')
      .resolve(isWindows ? 'hbcli.exe' : 'hbcli');
  }

  async getHfCliUri(): Promise<URI> {
    const resourcesUri = await this.vesCommonService.getResourcesUri();
    return resourcesUri
      .resolve('binaries')
      .resolve('vuengine-studio-tools')
      .resolve(this.vesCommonService.getOs())
      .resolve('hf-cli')
      .resolve(isWindows ? 'hfcli.exe' : 'hfcli');
  }

  protected async determineCanHoldRom(flashSize: number): Promise<boolean> {
    await this.vesBuildService.ready;
    return flashSize >= this.vesBuildService.bytesToMbit(this.vesBuildService.romSize);
  }

  protected determineAtLeastOneCanHoldRom(): void {
    let atLeastOneCanHoldRom = false;
    this.connectedFlashCarts.forEach((connectedFlashCart: ConnectedFlashCart) => {
      if (connectedFlashCart.canHoldRom) {
        atLeastOneCanHoldRom = true;
      }
    });

    this.atLeastOneCanHoldRom = atLeastOneCanHoldRom;
  }
}
