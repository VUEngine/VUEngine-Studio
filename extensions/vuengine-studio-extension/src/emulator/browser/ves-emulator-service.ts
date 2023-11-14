import { ApplicationShell, OpenerService, PreferenceScope, PreferenceService, QuickPickItem, QuickPickOptions } from '@theia/core/lib/browser';
import { CommandService, MessageService, nls } from '@theia/core/lib/common';
import { QuickPickService } from '@theia/core/lib/common/quick-pick-service';
import URI from '@theia/core/lib/common/uri';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { Emitter } from '@theia/core/shared/vscode-languageserver-protocol';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { VesBuildCommands } from '../../build/browser/ves-build-commands';
import { VesBuildService } from '../../build/browser/ves-build-service';
import { VesProcessService, VesProcessType } from '../../process/common/ves-process-service-protocol';
import { VesProjectService } from '../../project/browser/ves-project-service';
import { VesEmulatorPreferenceIds } from './ves-emulator-preferences';
import { DEFAULT_EMULATOR, EmulatorConfig } from './ves-emulator-types';

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

  // default emulator
  protected readonly onDidChangeEmulatorEmitter = new Emitter<string>();
  readonly onDidChangeEmulator = this.onDidChangeEmulatorEmitter.event;

  // emulator configs
  protected readonly onDidChangeEmulatorConfigsEmitter = new Emitter<EmulatorConfig[]>();
  readonly onDidChangeEmulatorConfigs = this.onDidChangeEmulatorConfigsEmitter.event;

  @postConstruct()
  protected init(): void {
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
        description: emulatorConfig.path,
        detail: detail ? `   ${detail} ` : '',
        iconClasses: (emulatorConfig.name === defaultEmulator) ? ['fa', 'fa-check-square-o'] : ['fa', 'fa-square-o'],
      });
    }

    this.quickPickService.show<QuickPickItem>(quickPickItems, quickPickOptions).then(selection => {
      if (!selection) {
        return;
      }

      const selectedEmulator = (selection.label === DEFAULT_EMULATOR.name)
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
    this.vesBuildService.onDidSucceedBuild(async () => {
      if (this.isQueued) {
        this.isQueued = false;
        this.run();
      }
    });
    this.vesBuildService.onDidFailBuild(() => {
      this.isQueued = false;
    });
  }

  async runInEmulator(): Promise<void> {
    const defaultEmulatorConfig = this.getDefaultEmulatorConfig();
    const romUri = await this.vesBuildService.getDefaultRomUri();
    if (defaultEmulatorConfig === DEFAULT_EMULATOR) {
      const opener = await this.openerService.getOpener(romUri);
      await opener.open(romUri);
    } else {
      const emulatorUri = new URI(defaultEmulatorConfig.path).withScheme('file');
      const romPath = await this.fileService.fsPath(romUri);
      const emulatorArgs = defaultEmulatorConfig.args.replace(ROM_PLACEHOLDER, romPath).split(' ');

      if (emulatorUri.isEqual(new URI('').withScheme('file')) || !await this.fileService.exists(emulatorUri)) {
        this.messageService.error(
          nls.localize('vuengine/emulator/emulatorPathDoesNotExist', `Emulator Path "${defaultEmulatorConfig.path}" does not exist.`)
        );
        return;
      }

      await this.vesProcessService.launchProcess(VesProcessType.Raw, {
        command: await this.fileService.fsPath(emulatorUri),
        args: emulatorArgs,
      });
    }
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

    let defaultEmulatorConfig = DEFAULT_EMULATOR;
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
      DEFAULT_EMULATOR,
      ...customEmulatorConfigs,
    ];

    return emulatorConfigs;
  }
}
