import { inject, injectable, postConstruct } from 'inversify';
import { basename, dirname, join as joinPath, sep } from 'path';
import { CommandService, isWindows } from '@theia/core/lib/common';
import { ApplicationShell, OpenerService, PreferenceScope, PreferenceService } from '@theia/core/lib/browser';
import URI from '@theia/core/lib/common/uri';
import { QuickPickItem, QuickPickOptions, QuickPickService } from '@theia/core/lib/common/quick-pick-service';
import { Emitter } from '@theia/core/shared/vscode-languageserver-protocol';
import { VesBuildCommands } from 'vuengine-studio-build/lib/browser/ves-build-commands';
import { VesBuildService } from 'vuengine-studio-build/lib/browser/ves-build-service';
import { VesProcessService } from 'vuengine-studio-process/lib/common/ves-process-service-protocol';

import { VesEmulatorPreferenceIds } from './ves-emulator-preferences';
import { DEFAULT_EMULATOR, EmulatorConfig } from './ves-emulator-types';

@injectable()
export class VesEmulatorService {
  constructor(
    @inject(ApplicationShell)
    protected readonly shell: ApplicationShell,
    @inject(CommandService)
    protected readonly commandService: CommandService,
    @inject(OpenerService)
    private readonly openerService: OpenerService,
    @inject(PreferenceService)
    private readonly preferenceService: PreferenceService,
    @inject(VesBuildService)
    private readonly vesBuildService: VesBuildService,
    @inject(VesProcessService)
    private readonly vesProcessService: VesProcessService,
    @inject(QuickPickService)
    private readonly quickPickService: QuickPickService,
  ) { }

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
    const quickPickOptions: QuickPickOptions = {
      title: 'Select default emulator configuration',
      placeholder: 'Which emulator configuration should be used to run compiled projects?',
    };
    const quickPickItems: QuickPickItem<string>[] = [];

    const defaultEmulator = this.getDefaultEmulatorConfig().name;
    const emulatorConfigs = this.getEmulatorConfigs();

    for (const emulatorConfig of emulatorConfigs) {
      quickPickItems.push({
        label: emulatorConfig.name,
        value: emulatorConfig.name,
        description: emulatorConfig.path,
        detail: this.shorten(emulatorConfig.args, 98),
        iconClass: (emulatorConfig.name === defaultEmulator) ? 'fa fa-check' : '',
      });
    }

    this.quickPickService.show<string>(quickPickItems, quickPickOptions).then(selection => {
      if (!selection) {
        return;
      }

      const selectedEmulator = (selection === emulatorConfigs[0].name) ? '' : selection;

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
      this.commandService.executeCommand(VesBuildCommands.BUILD.id);
    }
  }

  bindEvents(): void {
    this.vesBuildService.onDidChangeOutputRomExists(outputRomExists => {
      if (outputRomExists && this.isQueued) {
        this.isQueued = false;
        this.run();
      }
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

      await this.vesProcessService.launchProcess({
        command: `.${sep}${basename(emulatorPath)}`,
        args: emulatorArgs,
        options: {
          cwd: dirname(emulatorPath),
        },
      });
    }
  }

  shorten(word: string, length: number): string {
    if (word.length <= length) {
      return word;
    };

    return word.slice(0, length) + '…';
  }

  getWorkspaceRoot(): string {
    const substrNum = isWindows ? 2 : 1;

    return window.location.hash.slice(-9) === 'workspace'
      ? dirname(window.location.hash.substring(substrNum))
      : window.location.hash.substring(substrNum);
  }

  getRomPath(): string {
    return joinPath(this.getWorkspaceRoot(), 'build', 'output.vb');
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
      await this.vesProcessService.launchProcess({
        command: 'chmod',
        args: ['a+x', emulatorPath]
      });
    }
  }
}
