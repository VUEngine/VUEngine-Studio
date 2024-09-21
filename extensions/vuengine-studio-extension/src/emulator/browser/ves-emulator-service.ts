import { ApplicationShell, ConfirmDialog, OpenerService, PreferenceScope, PreferenceService, QuickPickItem, QuickPickOptions } from '@theia/core/lib/browser';
import { CommandService, MessageService, isWindows, nls } from '@theia/core/lib/common';
import { QuickPickService } from '@theia/core/lib/common/quick-pick-service';
import URI from '@theia/core/lib/common/uri';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { Emitter } from '@theia/core/shared/vscode-languageserver-protocol';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import sanitize from 'sanitize-filename';
import { VesBuildCommands } from '../../build/browser/ves-build-commands';
import { VesBuildService } from '../../build/browser/ves-build-service';
import { VesProcessService, VesProcessType } from '../../process/common/ves-process-service-protocol';
import { VesProjectService } from '../../project/browser/ves-project-service';
import { VesSocketWatcher } from '../../socket/browser/ves-socket-service-watcher';
import { VesSocketService } from '../../socket/common/ves-socket-service-protocol';
import { VesEmulatorPreferenceIds } from './ves-emulator-preferences';
import {
  DEFAULT_EMULATOR_CONFIG,
  EmulatorConfig,
  RED_VIPER_CONFIG,
  RED_VIPER_VBLINK_CHUNK_SIZE_BYTES,
  RED_VIPER_VBLINK_PORT,
  VbLinkStatus,
  VbLinkStatusData,
} from './ves-emulator-types';

export const ROM_PLACEHOLDER = '%ROM%';

@injectable()
export class VesEmulatorService {
  @inject(ApplicationShell)
  protected readonly shell: ApplicationShell;
  @inject(CommandService)
  protected readonly commandService: CommandService;
  @inject(FileService)
  private readonly fileService: FileService;
  @inject(MessageService)
  private readonly messageService: MessageService;
  @inject(OpenerService)
  private readonly openerService: OpenerService;
  @inject(PreferenceService)
  private readonly preferenceService: PreferenceService;
  @inject(QuickPickService)
  private readonly quickPickService: QuickPickService;
  @inject(VesBuildService)
  private readonly vesBuildService: VesBuildService;
  @inject(VesProcessService)
  private readonly vesProcessService: VesProcessService;
  @inject(VesProjectService)
  protected readonly vesProjectsService: VesProjectService;
  @inject(VesSocketService)
  protected readonly vesSocketService: VesSocketService;
  @inject(VesSocketWatcher)
  protected readonly vesSocketWatcher: VesSocketWatcher;

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

  // vb link status
  protected _vbLinkStatus: VbLinkStatusData = {
    status: VbLinkStatus.idle,
    done: 0,
  };
  protected readonly onDidChangeVbLinkStatusEmitter = new Emitter<VbLinkStatusData>();
  readonly onDidChangeVbLinkStatus = this.onDidChangeVbLinkStatusEmitter.event;
  set vbLinkStatus(status: VbLinkStatusData) {
    this._vbLinkStatus = status;
    this.onDidChangeVbLinkStatusEmitter.fire(this._vbLinkStatus);
  }
  get vbLinkStatus(): VbLinkStatusData {
    return this._vbLinkStatus;
  }

  // default emulator
  protected readonly onDidChangeEmulatorEmitter = new Emitter<string>();
  readonly onDidChangeEmulator = this.onDidChangeEmulatorEmitter.event;

  // emulator configs
  protected readonly onDidChangeEmulatorConfigsEmitter = new Emitter<EmulatorConfig[]>();
  readonly onDidChangeEmulatorConfigs = this.onDidChangeEmulatorConfigsEmitter.event;

  @postConstruct()
  protected init(): void {
    this.bindEvents();
  }

  async selectEmulator(): Promise<void> {
    const quickPickOptions: QuickPickOptions<QuickPickItem> = {
      title: nls.localize('vuengine/emulator/selectDefaultEmulatorTitle', 'Select default emulator configuration'),
      placeholder: nls.localize('vuengine/emulator/selectDefaultEmulatorPlaceholder', 'Which emulator configuration should be used to run compiled projects?'),
    };
    const quickPickItems: QuickPickItem[] = [];

    const defaultEmulator = this.getDefaultEmulatorConfig().name;
    const emulatorConfigs = this.getEmulatorConfigs();

    for (const emulatorConfig of emulatorConfigs) {
      const detail = this.shorten(emulatorConfig.args, 98);
      quickPickItems.push({
        label: emulatorConfig.name,
        detail: (emulatorConfig.path || detail)
          ? `   ${emulatorConfig.path} ${detail}`
          : undefined,
        iconClasses: ['codicon', (emulatorConfig.name === defaultEmulator) ? 'codicon-pass-filled' : 'codicon-circle-large'],
      });
    }

    this.quickPickService.show<QuickPickItem>(quickPickItems, quickPickOptions).then(selection => {
      if (!selection) {
        return;
      }

      const selectedEmulator = (selection.label === DEFAULT_EMULATOR_CONFIG.name)
        ? ''
        : selection.label;

      this.preferenceService.set(VesEmulatorPreferenceIds.DEFAULT_EMULATOR, selectedEmulator, PreferenceScope.User);
    });
  }

  async run(): Promise<void> {
    if (this.isQueued) {
      this.isQueued = false;
    } else if (this.vesBuildService.buildStatus.active) {
      this.isQueued = true;
    } else if (await this.vesBuildService.outputRomExists()) {
      await this.runInEmulator();
    } else {
      this.isQueued = true;
      this.commandService.executeCommand(VesBuildCommands.BUILD.id, true);
    }
  }

  protected bindEvents(): void {
    // watch for preference changes
    this.preferenceService.onPreferenceChanged(
      ({ preferenceName, newValue }) => {
        switch (preferenceName) {
          case VesEmulatorPreferenceIds.EMULATORS:
            this.onDidChangeEmulatorConfigsEmitter.fire(
              this.getEmulatorConfigs()
            );
            break;
          case VesEmulatorPreferenceIds.DEFAULT_EMULATOR:
            this.onDidChangeEmulatorEmitter.fire(
              this.getDefaultEmulatorConfig().name
            );
            break;
        }
      }
    );

    // is queued
    this.vesBuildService.onDidSucceedBuild(async () => {
      if (this.isQueued) {
        this.isQueued = false;
        this.run();
      }
    });
    this.vesBuildService.onDidFailBuild(() => {
      this.isQueued = false;
    });

    // red viper vblink
    // once connected, send (u32) filename length, filename and (u32) ROM size in kilobytes
    this.vesSocketWatcher.onDidConnect(async () => {
      if (this.vbLinkStatus.status !== VbLinkStatus.connect) {
        return;
      }

      const romUri = await this.vesBuildService.getDefaultRomUri();
      const filename = await this.getRomName();
      const filenameLength = filename.length;
      const romData = await this.fileService.readFile(romUri);
      const deflatedRomData = window.electronVesCore.zlibDeflate(Buffer.from(romData.value.buffer));
      const romSizeBytes = romData.value.byteLength;

      this.vbLinkStatus = {
        status: VbLinkStatus.initiate,
        done: 0,
        data: Buffer.from(deflatedRomData),
      };
      this.vesSocketService.write(this.numberToU32Buffer(filenameLength));
      this.vesSocketService.write(filename);
      this.vesSocketService.write(this.numberToU32Buffer(romSizeBytes));
    });
    // on success, Red Viper replies with (u32) 0
    this.vesSocketWatcher.onDidReceiveData(({ data }) => {
      if (this.vbLinkStatus.status !== VbLinkStatus.initiate && this.vbLinkStatus.status !== VbLinkStatus.transfer) {
        return;
      }

      if (data.length === 4 && data.reduce((a, b) => a + b) === 0) {
        if (this.vbLinkStatus.status === VbLinkStatus.initiate) {
          // headers sent successful, we can now transfer the ROM file
          this.vbLinkStatus = {
            ...this.vbLinkStatus,
            status: VbLinkStatus.transfer,
          };

          if (this.vbLinkStatus.data) {
            // write zlib deflated ROM file in chunks
            this.vesSocketService.writeChunked(this.vbLinkStatus.data, RED_VIPER_VBLINK_CHUNK_SIZE_BYTES);
          }
        } else if (this.vbLinkStatus.status === VbLinkStatus.transfer) {
          // ROM sent successful
          this.vbLinkStatus = {
            ...this.vbLinkStatus,
            status: VbLinkStatus.idle,
          };
        }
      }
    });
    this.vesSocketWatcher.onDidReceiveError(({ error }) => {
      if (error?.startsWith && error.startsWith('Error: write EPIPE')) {
        return;
      }

      switch (this.vbLinkStatus.status) {
        case VbLinkStatus.connect:
          return this.messageService.error(
            nls.localize('vuengine/emulator/redViper/connectError', 'Could not connect to 3DS.')
          );
        case VbLinkStatus.initiate:
          return this.messageService.error(
            nls.localize('vuengine/emulator/redViper/initError', 'There was an error initiating the ROM transfer to 3DS.')
          );
        case VbLinkStatus.transfer:
          return this.messageService.error(
            nls.localize('vuengine/emulator/redViper/transferError', 'There was an error while transferring the ROM to 3DS.')
          );
      }
    });
    this.vesSocketWatcher.onDidClose(() => {
      this.vbLinkStatus = {
        ...this.vbLinkStatus,
        status: VbLinkStatus.idle,
      };
    });
    this.vesSocketWatcher.onDidTransferChunk(() => {
      if (this.vbLinkStatus.status === VbLinkStatus.transfer) {
        this.vbLinkStatus = {
          ...this.vbLinkStatus,
          done: this.vbLinkStatus.done + 1,
        };
      }
    });
  }

  async cancelRedViperTransfer(): Promise<void> {
    const dialog = new ConfirmDialog({
      title: nls.localize('vuengine/emulator/redViper/cancelTransfer', 'Cancel Transfer'),
      msg: nls.localize(
        'vuengine/emulator/redViper/areYouSureYouWantToCancelTranfer',
        'Are you sure you want to cancel the file transfer to Red Viper?'
      ),
    });
    const confirmed = await dialog.open();
    if (confirmed) {
      this.vesSocketService.destroy();
    }
  }

  async runInEmulator(): Promise<void> {
    const defaultEmulatorConfig = this.getDefaultEmulatorConfig();
    const romUri = await this.vesBuildService.getDefaultRomUri();
    if (defaultEmulatorConfig.name === DEFAULT_EMULATOR_CONFIG.name) {
      return this.runInBuiltInEmulator(romUri);
    } else if (defaultEmulatorConfig.name === RED_VIPER_CONFIG.name) {
      return this.runInRedViper();
    } else {
      const emulatorPath = isWindows && !defaultEmulatorConfig.path.startsWith('/')
        ? `/${defaultEmulatorConfig.path}`
        : defaultEmulatorConfig.path;
      const emulatorUri = new URI(emulatorPath).withScheme('file');
      const romPath = await this.fileService.fsPath(romUri);
      const emulatorArgs = defaultEmulatorConfig.args.replace(ROM_PLACEHOLDER, romPath).split(' ');

      if (emulatorUri.isEqual(new URI('').withScheme('file')) || !await this.fileService.exists(emulatorUri)) {
        this.messageService.error(
          nls.localize('vuengine/emulator/emulatorPathDoesNotExist', `Emulator Path "${emulatorPath}" does not exist.`)
        );
        return;
      }

      await this.vesProcessService.launchProcess(VesProcessType.Raw, {
        command: await this.fileService.fsPath(emulatorUri),
        args: emulatorArgs,
      });
    }
  }

  async runInBuiltInEmulator(romUri: URI): Promise<void> {
    const opener = await this.openerService.getOpener(romUri);
    await opener.open(romUri);
  }

  async runInRedViper(): Promise<void> {
    if (this.vbLinkStatus.status !== VbLinkStatus.idle) {
      return;
    }

    this.vbLinkStatus = {
      ...this.vbLinkStatus,
      status: VbLinkStatus.connect,
    };
    const ip = this.preferenceService.get(VesEmulatorPreferenceIds.EMULATOR_RED_VIPER_3DS_IP_ADDRESS, '');
    this.vesSocketService.connect(RED_VIPER_VBLINK_PORT, ip);
  }

  protected async getRomName(): Promise<string> {
    const projectName = await this.vesProjectsService.getProjectName();
    const romName = projectName ?? 'output';

    return `${sanitize(romName)}.vb`;
  }

  shorten(word: string, length: number): string {
    if (word.length <= length) {
      return word;
    };

    return word.slice(0, length) + '…';
  }

  getDefaultEmulatorConfig(): EmulatorConfig {
    const emulatorConfigs: EmulatorConfig[] = this.getEmulatorConfigs();
    const defaultEmulatorName: string = this.preferenceService.get(VesEmulatorPreferenceIds.DEFAULT_EMULATOR) as string;

    let defaultEmulatorConfig = DEFAULT_EMULATOR_CONFIG;
    for (const emulatorConfig of emulatorConfigs) {
      if (emulatorConfig.name === defaultEmulatorName) {
        defaultEmulatorConfig = emulatorConfig;
      }
    }

    return defaultEmulatorConfig;
  }

  getEmulatorConfigs(): EmulatorConfig[] {
    const customEmulatorConfigs: EmulatorConfig[] = this.preferenceService.get(VesEmulatorPreferenceIds.EMULATORS) ?? [];

    const emulatorConfigs = [
      DEFAULT_EMULATOR_CONFIG,
      {
        ...RED_VIPER_CONFIG,
        path: this.preferenceService.get(VesEmulatorPreferenceIds.EMULATOR_RED_VIPER_3DS_IP_ADDRESS, ''),
      },
      ...customEmulatorConfigs,
    ];

    return emulatorConfigs;
  }

  protected numberToU32Buffer(num: number): Buffer {
    const byte1 = 0xff & num;
    const byte2 = 0xff & (num >> 8);
    const byte3 = 0xff & (num >> 16);
    const byte4 = 0xff & (num >> 24);
    return Buffer.from([byte1, byte2, byte3, byte4]);
  }
}
