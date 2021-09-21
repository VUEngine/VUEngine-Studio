import { join as joinPath } from 'path';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { CommandService, isWindows } from '@theia/core/lib/common';
import { ApplicationShell, OpenerService, PreferenceScope, PreferenceService, QuickPickItem, QuickPickOptions } from '@theia/core/lib/browser';
import URI from '@theia/core/lib/common/uri';
import { QuickPickService } from '@theia/core/lib/common/quick-pick-service';
import { Emitter } from '@theia/core/shared/vscode-languageserver-protocol';
import { VesBuildCommands } from '../../build/browser/ves-build-commands';
import { VesBuildService } from '../../build/browser/ves-build-service';
import { VesProjectsService } from '../../projects/browser/ves-projects-service';
import { VesProcessService, VesProcessType } from '../../process/common/ves-process-service-protocol';
import { VesEmulatorPreferenceIds } from './ves-emulator-preferences';
import { DEFAULT_EMULATOR, EmulatorConfig } from './ves-emulator-types';
import { VesCodegenService } from '../../codegen/browser/ves-codegen-service';

@injectable()
export class VesEmulatorService {
  @inject(ApplicationShell)
  protected readonly shell: ApplicationShell;
  @inject(CommandService)
  protected readonly commandService: CommandService;
  @inject(OpenerService)
  private readonly openerService: OpenerService;
  @inject(PreferenceService)
  private readonly preferenceService: PreferenceService;
  @inject(VesBuildService)
  private readonly vesBuildService: VesBuildService;
  @inject(VesCodegenService)
  protected readonly vesCodegenService: VesCodegenService;
  @inject(VesProcessService)
  private readonly vesProcessService: VesProcessService;
  @inject(VesProjectsService)
  protected readonly vesProjectsService: VesProjectsService;
  @inject(QuickPickService)
  private readonly quickPickService: QuickPickService;

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
  protected async init(): Promise<void> {
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
      title: 'Select default emulator configuration',
      placeholder: 'Which emulator configuration should be used to run compiled projects?',
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

      const selectedEmulator = (selection.id === emulatorConfigs[0].name) ? '' : selection.label;

      this.preferenceService.set(VesEmulatorPreferenceIds.DEFAULT_EMULATOR, selectedEmulator, PreferenceScope.User);
    });
  }

  async run(): Promise<void> {
    if (this.isQueued) {
      this.isQueued = false;
    } else if (this.vesBuildService.buildStatus.active) {
      this.isQueued = true;
    } else if (this.vesBuildService.outputRomExists) {
      this.runInEmulator();
    } else {
      this.isQueued = true;
      this.commandService.executeCommand(VesBuildCommands.BUILD.id, true);
    }
  }

  bindEvents(): void {
    this.vesBuildService.onDidBuildSucceed(() => {
      if (this.isQueued) {
        this.isQueued = false;
        this.run();
      }
    });
    this.vesBuildService.onDidBuildFail(() => {
      this.isQueued = false;
    });
  }

  async runInEmulator(): Promise<void> {
    const defaultEmulatorConfig = this.getDefaultEmulatorConfig();

    if (defaultEmulatorConfig === DEFAULT_EMULATOR) {
      const romUri = new URI(this.getRomPath());
      const opener = await this.openerService.getOpener(romUri);
      await opener.open(romUri);
    } else {
      const emulatorPath = defaultEmulatorConfig.path;
      const emulatorArgs = defaultEmulatorConfig.args.replace('%ROM%', this.getRomPath()).split(' ');

      if (!emulatorPath) {
        // TODO: error message
        return;
      }

      await this.fixPermissions(emulatorPath);

      await this.vesProcessService.launchProcess(VesProcessType.Raw, {
        command: emulatorPath,
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

  getRomPath(): string {
    return joinPath(this.vesProjectsService.getWorkspaceRoot(), 'build', 'output.vb');
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

  /**
   * Give executables respective permission on UNIX systems.
   * Must be executed before every run to ensure permissions are right,
   * even right after reconfiguring paths.
   */
  async fixPermissions(emulatorPath: string): Promise<void> {
    if (!isWindows && emulatorPath) {
      await this.vesProcessService.launchProcess(VesProcessType.Raw, {
        command: 'chmod',
        args: ['a+x', emulatorPath]
      });
    }
  }
}
