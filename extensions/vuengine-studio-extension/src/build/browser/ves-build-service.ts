import { CommandRegistry, CommandService, isOSX, isWindows, nls } from '@theia/core';
import {
  ApplicationShell,
  ConfirmDialog,
  LabelProvider,
  LocalStorageService,
  PreferenceScope,
  PreferenceService,
  QuickPickItem,
  QuickPickOptions,
  QuickPickService
} from '@theia/core/lib/browser';
import { FrontendApplicationState, FrontendApplicationStateService } from '@theia/core/lib/browser/frontend-application-state';
import { EnvVariablesServer } from '@theia/core/lib/common/env-variables';
import { Deferred } from '@theia/core/lib/common/promise-util';
import URI from '@theia/core/lib/common/uri';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { Emitter } from '@theia/core/shared/vscode-languageserver-protocol';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { isLinux } from '@theia/monaco-editor-core/esm/vs/base/common/platform';
import { ProcessOptions } from '@theia/process/lib/node';
import { TaskEndedInfo, TaskEndedTypes, TaskService } from '@theia/task/lib/browser/task-service';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import { Systeminformation } from 'systeminformation';
import { VesCommonService } from '../../core/browser/ves-common-service';
import { clamp } from '../../editors/browser/components/Common/Utils';
import { VesEmulatorCommands } from '../../emulator/browser/ves-emulator-commands';
import { VesEmulatorPreferenceIds } from '../../emulator/browser/ves-emulator-preferences';
import { VesFlashCartCommands } from '../../flash-cart/browser/ves-flash-cart-commands';
import { VesFlashCartPreferenceIds } from '../../flash-cart/browser/ves-flash-cart-preferences';
import { VesPluginsPathsService } from '../../plugins/browser/ves-plugins-paths-service';
import { VesPluginsService } from '../../plugins/browser/ves-plugins-service';
import { VesProcessWatcher } from '../../process/browser/ves-process-service-watcher';
import { VesProcessService, VesProcessType } from '../../process/common/ves-process-service-protocol';
import { VesBuildCommands } from './ves-build-commands';
import { VesBuildPathsService } from './ves-build-paths-service';
import { VesBuildPreferenceIds } from './ves-build-preferences';
import {
  BuildLogLine,
  BuildLogLineFileLink,
  BuildLogLineType,
  BuildMode,
  BuildResult,
  BuildStatus,
  GccMatchedProblem,
  PrePostBuildTask,
  PrePostBuildTaskType
} from './ves-build-types';

@injectable()
export class VesBuildService {
  @inject(ApplicationShell)
  protected readonly shell: ApplicationShell;
  @inject(CommandRegistry)
  protected readonly commandRegistry: CommandRegistry;
  @inject(CommandService)
  protected readonly commandService: CommandService;
  @inject(EnvVariablesServer)
  protected envVariablesServer: EnvVariablesServer;
  @inject(FileService)
  protected fileService: FileService;
  @inject(FrontendApplicationStateService)
  protected readonly frontendApplicationStateService: FrontendApplicationStateService;
  @inject(LabelProvider)
  protected readonly labelProvider: LabelProvider;
  @inject(LocalStorageService)
  protected readonly localStorageService: LocalStorageService;
  @inject(PreferenceService)
  protected readonly preferenceService: PreferenceService;
  @inject(QuickPickService)
  protected readonly quickPickService: QuickPickService;
  @inject(TaskService)
  protected readonly taskService: TaskService;
  @inject(VesBuildPathsService)
  protected readonly vesBuildPathsService: VesBuildPathsService;
  @inject(VesCommonService)
  protected readonly vesCommonService: VesCommonService;
  @inject(VesPluginsPathsService)
  protected readonly vesPluginsPathsService: VesPluginsPathsService;
  @inject(VesPluginsService)
  protected readonly vesPluginsService: VesPluginsService;
  @inject(VesProcessService)
  protected readonly vesProcessService: VesProcessService;
  @inject(VesProcessWatcher)
  protected readonly vesProcessWatcher: VesProcessWatcher;
  @inject(WorkspaceService)
  protected readonly workspaceService: WorkspaceService;

  protected cpuInfo: Systeminformation.CpuData;

  protected _ready = new Deferred<void>();
  get ready(): Promise<void> {
    return this._ready.promise;
  }

  // last build mode
  protected _lastBuildMode: string | undefined;
  protected readonly onDidChangeLastBuildModeEmitter = new Emitter<string | undefined>();
  readonly onDidChangeLastBuildMode = this.onDidChangeLastBuildModeEmitter.event;
  set lastBuildMode(mode: string | undefined) {
    this._lastBuildMode = mode;
    this.onDidChangeLastBuildModeEmitter.fire(this._lastBuildMode);
    this.localStorageService.setData(this.getLastBuildModeStorageKey(), mode);
  }
  get lastBuildMode(): string | undefined {
    return this._lastBuildMode;
  }

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

  // build mode
  protected readonly onDidChangeBuildModeEmitter = new Emitter<BuildMode>();
  readonly onDidChangeBuildMode = this.onDidChangeBuildModeEmitter.event;

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

  // rom size
  protected _romSize: number = 0;
  protected readonly onDidChangeRomSizeEmitter = new Emitter<number>();
  readonly onDidChangeRomSize = this.onDidChangeRomSizeEmitter.event;
  set romSize(size: number) {
    this._romSize = size;
    this.onDidChangeRomSizeEmitter.fire(this._romSize);
  }
  get romSize(): number {
    return this._romSize;
  }

  // build status
  protected _buildStatus: BuildStatus = {
    active: false,
    stepsTotal: -1,
    stepsDone: -1,
    processManagerId: -1,
    processId: -1,
    progress: -1,
    log: [],
    buildMode: BuildMode.Beta,
    step: '',
    startDate: undefined,
    endDate: undefined,
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

  // events
  protected readonly onDidStartBuildEmitter = new Emitter<void>();
  readonly onDidStartBuild = this.onDidStartBuildEmitter.event;
  protected readonly onDidFailBuildEmitter = new Emitter<void>();
  readonly onDidFailBuild = this.onDidFailBuildEmitter.event;
  protected readonly onDidSucceedBuildEmitter = new Emitter<void>();
  readonly onDidSucceedBuild = this.onDidSucceedBuildEmitter.event;

  async resetBuildStatus(step?: string): Promise<void> {
    const newBuildStatus = {
      ...this.buildStatus,
      active: false,
      endDate: new Date(),
    };

    if (step) {
      newBuildStatus.step = step;
    }

    this.buildStatus = newBuildStatus;
  }

  async afterBuild(step?: string): Promise<void> {
    if (step !== BuildResult.done) {
      this.onDidFailBuildEmitter.fire();
    } else {
      // Wait for up to two seconds for output ROM to have been copied by makefile
      // (The copy command has finished, but the kernel might still be writing out the buffered data.)
      let tries = 0;
      const romExistsCheckInterval = setInterval(async () => {
        if (await this.outputRomExists() || ++tries === 5) {
          clearInterval(romExistsCheckInterval);
          this.onDidSucceedBuildEmitter.fire();
        }
      }, 400);
    }
  }

  pushBuildLogLine(buildLogLine: BuildLogLine): void {
    this._buildStatus.log.push(buildLogLine);
    this.onDidChangeBuildStatusEmitter.fire(this._buildStatus);
  }

  appendBuildLogLine(partialBuildLogLine: Partial<BuildLogLine>): void {
    this._buildStatus.log[this._buildStatus.log.length - 1] = {
      ...this._buildStatus.log[this._buildStatus.log.length - 1],
      ...partialBuildLogLine,
      text: this._buildStatus.log[this._buildStatus.log.length - 1].text + (partialBuildLogLine.text ?? '')
    };
    this.onDidChangeBuildStatusEmitter.fire(this._buildStatus);
  }

  clearLogs(): void {
    this._buildStatus.log = [];
  }

  @postConstruct()
  protected init(): void {
    this.doInit();
  }

  protected async doInit(): Promise<void> {
    this.cpuInfo = await window.electronVesCore.getCpuInformation();
    await this.workspaceService.ready;
    this.lastBuildMode = await this.localStorageService.getData(this.getLastBuildModeStorageKey());
    await this.resetBuildStatus();
    this.bindEvents();
  }

  async doBuild(force: boolean = false): Promise<void> {
    if (!this.workspaceService.opened) {
      return;
    }

    if (this.isQueued) {
      if (!force) {
        this.isQueued = false;
      }
    } else if (this.isCleaning) {
      this.isQueued = true;
    } else if (this.buildStatus.active) {
      if (!force) {
        this.commandService.executeCommand(VesBuildCommands.WIDGET_TOGGLE.id);
      }
    } else {
      await this.build();
      if (this.preferenceService.get(VesEmulatorPreferenceIds.EMULATOR_AUTO_QUEUE)) {
        this.commandService.executeCommand(VesEmulatorCommands.RUN.id);
      }
      if (this.preferenceService.get(VesFlashCartPreferenceIds.FLASH_CARTS_AUTO_QUEUE)) {
        this.commandService.executeCommand(VesFlashCartCommands.FLASH.id);
      }
    }
  }

  getNumberOfWarnings(): number {
    return this.buildStatus.log.filter(
      l => l.type === BuildLogLineType.Warning
    ).length;
  }

  getNumberOfErrors(): number {
    return this.buildStatus.log.filter(
      l => l.type === BuildLogLineType.Error
    ).length;
  }

  async outputRomExists(): Promise<boolean> {
    const romUri = await this.getDefaultRomUri();
    return romUri !== undefined && this.fileService.exists(romUri);
  }

  // TODO: save this in local storage after build instead of determining on each program start
  protected async determineRomSize(): Promise<void> {
    const romUri = await this.getDefaultRomUri();
    if (romUri && await this.fileService.exists(romUri)) {
      const outputRom = await this.fileService.resolve(romUri, { resolveMetadata: true });
      this.romSize = outputRom.size;
    } else {
      this.romSize = 0;
    }

    this._ready.resolve();
  }

  protected printCpuInformation(): void {
    this.pushBuildLogLine({
      type: BuildLogLineType.Headline,
      text: nls.localize('vuengine/build/cpuInformation', 'CPU Information'),
      timestamp: Date.now(),
    });

    this.pushBuildLogLine({
      type: BuildLogLineType.Normal,
      text: `${nls.localize('vuengine/build/model', 'Model')}: ${this.cpuInfo.manufacturer} ${this.cpuInfo.brand}`,
      timestamp: Date.now(),
    });

    this.pushBuildLogLine({
      type: BuildLogLineType.Normal,
      text: `${nls.localize('vuengine/build/physicalCores', 'Physical Cores')}: ${this.cpuInfo.physicalCores}`,
      timestamp: Date.now(),
    });

    this.pushBuildLogLine({
      type: BuildLogLineType.Normal,
      text: `${nls.localize('vuengine/build/logicalCores', 'Logical Cores')}: ${this.cpuInfo.cores}`,
      timestamp: Date.now(),
    });

    this.pushBuildLogLine({
      type: BuildLogLineType.Normal,
      text: `${nls.localize('vuengine/build/performanceCores', 'Performance Cores')}: ${this.cpuInfo.performanceCores}`,
      timestamp: Date.now(),
    });

    this.pushBuildLogLine({
      type: BuildLogLineType.Normal,
      text: `${nls.localize('vuengine/build/efficiencyCores', 'Efficiency Cores')}: ${this.cpuInfo.efficiencyCores}`,
      timestamp: Date.now(),
    });

    this.pushBuildLogLine({
      type: BuildLogLineType.Normal,
      text: '',
      timestamp: Date.now(),
    });
  }

  protected async bindEvents(): Promise<void> {
    // must wait for preference service to be ready, otherwise onPreferenceChanged would fire when preference values are initially set
    await this.preferenceService.ready;

    // init flags
    this.frontendApplicationStateService.onStateChanged(
      async (state: FrontendApplicationState) => {
        if (state === 'ready') {
          await this.determineRomSize();
        }
      }
    );

    // watch for preference changes
    this.preferenceService.onPreferenceChanged(
      ({ preferenceName, newValue, oldValue }) => {
        switch (preferenceName) {
          case VesBuildPreferenceIds.BUILD_MODE:
            if (newValue !== oldValue) {
              this.onDidChangeBuildModeEmitter.fire(newValue);
            }
            break;
        }
      }
    );

    this.vesProcessWatcher.onDidReceiveError(async ({ pId }) => {
      if (this.buildStatus.processManagerId === pId) {
        await this.resetBuildStatus(BuildResult.failed);
        await this.afterBuild(BuildResult.failed);
      }
    });

    this.vesProcessWatcher.onDidExitProcess(async ({ pId, event }) => {
      if (this.buildStatus.processManagerId === pId) {
        const step = event.code === 0
          ? BuildResult.done
          : BuildResult.failed;
        await this.resetBuildStatus(step);
        await this.afterBuild(step);
      }
    });

    // @ts-ignore
    const onData = ({ pId, data }) => {
      if (this.buildStatus.processManagerId === pId) {
        data
          .trim() // remove trailing newline
          .split(/\n/) // split by newline
          .forEach((d: string) => {
            if (!d.includes('(skip)')) {
              this.pushBuildLogLine(this.parseBuildOutput(d));
            }
          });
      }
    };

    this.vesProcessWatcher.onDidReceiveOutputStreamData(onData);
    this.vesProcessWatcher.onDidReceiveErrorStreamData(onData);

    this.onDidStartBuild(async () => {
      if (this.preferenceService.get(VesBuildPreferenceIds.AUTO_CLOSE_WIDGET_ON_BUILD_START)) {
        this.commandService.executeCommand(VesBuildCommands.WIDGET_TOGGLE.id, false);
      }
    });

    this.onDidSucceedBuild(async () => {
      /* await */ this.determineRomSize();
      await this.runPostBuildTasks();

      const numberOfWarnings = this.getNumberOfWarnings();
      if (!numberOfWarnings && this.preferenceService.get(VesBuildPreferenceIds.AUTO_CLOSE_WIDGET_ON_SUCCESS)) {
        this.commandService.executeCommand(VesBuildCommands.WIDGET_TOGGLE.id, false);
      }
    });

    this.onDidFailBuild(async () => {
      this.romSize = 0;
      if (this.preferenceService.get(VesBuildPreferenceIds.AUTO_OPEN_WIDGET_ON_ERROR)) {
        this.commandService.executeCommand(VesBuildCommands.WIDGET_TOGGLE.id, true);
      }
    });

    this.onDidChangeBuildMode(async buildMode => {
      if (!this.workspaceService.opened) {
        return;
      }

      // delete library files to force rebuild
      await this.deleteLibraryFiles();

      // To keep default ROM in sync with the currently selected build mode,
      // delete default ROM and copy over build mode ROM to this location, if it exists.
      await this.deleteRom();
      const defaultRomUri = await this.getDefaultRomUri();
      const modeRomUri = await this.getBuildModeRomUri(buildMode);

      if (defaultRomUri !== undefined && modeRomUri !== undefined) {
        if (await this.fileService.exists(modeRomUri)) {
          await this.fileService.copy(modeRomUri, defaultRomUri);
        }
      }
    });
  }

  // get number of all libraries for which there are no lib*.a files in build folder
  protected async getNumberOfLibrariesToBuild(allPluginNames: string[]): Promise<number> {
    const allLibs = ['core', ...allPluginNames.map(pluginName => pluginName.split('/').pop())];
    const buildPathUri = await this.getBuildPathUri();
    const buildModeLc = (this.preferenceService.get(VesBuildPreferenceIds.BUILD_MODE) as BuildMode).toLowerCase();
    const existingLibFiles = window.electronVesCore.findFiles(buildPathUri.path.fsPath(), [
      `working/libraries/${buildModeLc}/lib*-${buildModeLc}.a`,
      'lib*.a'
    ]);

    return allLibs.filter(libName =>
      !existingLibFiles.includes(`lib${libName}.a`) &&
      !existingLibFiles.includes(`working/libraries/${buildModeLc}/lib${libName}-${buildModeLc}.a`)
    ).length;
  }

  protected async build(): Promise<void> {
    let processManagerId = 0;
    let processId = 0;
    const buildMode = this.preferenceService.get(VesBuildPreferenceIds.BUILD_MODE) as BuildMode;

    const buildAll = this.preferenceService.get(VesBuildPreferenceIds.BUILD_ALL) as boolean;
    const allPluginNames = this.vesPluginsService.getActualUsedPluginNames();
    const libsToBuild = buildAll
      ? allPluginNames.length + 1 // plugins + core
      : await this.getNumberOfLibrariesToBuild(allPluginNames);

    this.buildStatus = {
      active: false,
      stepsTotal: 2 * (libsToBuild + 1), // + game, preprocess & build each
      stepsDone: 0,
      processManagerId,
      processId,
      progress: 0,
      log: [],
      buildMode,
      step: '',
      startDate: new Date(),
      endDate: undefined,
    };

    this.printCpuInformation();

    this.lastBuildMode = buildMode;

    await this.runPreBuildTasks();

    try {
      this.onDidStartBuildEmitter.fire();

      this.buildStatus = {
        ...this.buildStatus,
        active: true,
        step: nls.localize('vuengine/build/building', 'Building'),
      };

      const buildParams = await this.getBuildProcessParams();
      console.info('Starting build with params', buildParams);
      await this.deleteRom();
      ({ processManagerId, processId } = await this.vesProcessService.launchProcess(VesProcessType.Raw, buildParams));

    } catch (e) {
      let error = 'An error occured';

      if (typeof e === 'string') {
        error = e;
      } else if (e instanceof Error) {
        error = e.message;
      }

      this.pushBuildLogLine({
        text: error,
        timestamp: Date.now(),
        type: BuildLogLineType.Error,
      });

      await this.resetBuildStatus(BuildResult.failed);
      await this.afterBuild(BuildResult.failed);

      this.onDidFailBuildEmitter.fire();
    }

    this.buildStatus = {
      ...this.buildStatus,
      processManagerId,
      processId,
    };
  }

  protected async getBuildProcessParams(): Promise<ProcessOptions> {
    await this.workspaceService.ready;
    const useWsl = this.preferenceService.get(VesBuildPreferenceIds.USE_WSL) as boolean;
    const isWslInstalled = useWsl && this.vesCommonService.isWslInstalled;

    const workspaceRootUri = this.workspaceService.tryGetRoots()[0]?.resource;
    const buildMode = (this.preferenceService.get(VesBuildPreferenceIds.BUILD_MODE) as string).toLowerCase();
    const buildAll = this.preferenceService.get(VesBuildPreferenceIds.BUILD_ALL) as boolean;
    const dumpElf = this.preferenceService.get(VesBuildPreferenceIds.DUMP_ELF) as boolean;
    const pedanticWarnings = this.preferenceService.get(VesBuildPreferenceIds.PEDANTIC_WARNINGS) as boolean;
    const engineCoreUri = await this.vesBuildPathsService.getEngineCoreUri();
    const enginePluginsUri = await this.vesPluginsPathsService.getEnginePluginsUri();
    const userPluginsUri = await this.vesPluginsPathsService.getUserPluginsUri();
    const compilerUri = await this.vesBuildPathsService.getCompilerUri(isWslInstalled);
    const makeUri = await this.vesBuildPathsService.getMakeUri(isWslInstalled);
    const makefileUri = await this.getMakefileUri(workspaceRootUri, engineCoreUri);

    // TODO: remove check when https://github.com/VUEngine/VUEngine-Studio/issues/15 is resolved
    await this.checkPathsForSpaces(workspaceRootUri, engineCoreUri, enginePluginsUri, userPluginsUri);

    const pathUris: URI[] = [
      compilerUri.resolve('bin'),
      compilerUri.resolve('libexec').resolve('gcc').resolve('v810').resolve('4.7.4'),
      makeUri,
    ];

    if (isOSX) {
      const sedUri = await this.vesBuildPathsService.getSedUri(isWslInstalled);
      pathUris.push(sedUri);
    }

    if (isWindows) {
      const winPaths = await Promise.all(pathUris.map(async p => this.convertToEnvPath(isWslInstalled, p)));
      const preMakeArgs = [
        'cd', await this.convertToEnvPath(isWslInstalled, workspaceRootUri), '&&',
        'export', `PATH=${winPaths.join(':')}:$PATH`,
        'LC_ALL=C',
        `BUILD_ALL=${buildAll ? 1 : 0}`,
        `MAKE_JOBS=${this.getThreads()}`,
        'PREPROCESSING_WAIT_FOR_LOCK_DELAY_FACTOR=0.0',
        `DUMP_ELF=${dumpElf ? 1 : 0}`,
        `PRINT_PEDANTIC_WARNINGS=${pedanticWarnings ? 1 : 0}`, '&&',
      ];
      const makeArgs = [
        'make', 'all',
        '-e', `TYPE=${buildMode}`,
        `ENGINE_FOLDER=${await this.convertToEnvPath(isWslInstalled, engineCoreUri)}`,
        `PLUGINS_FOLDER=${await this.convertToEnvPath(isWslInstalled, enginePluginsUri)}`,
        `USER_PLUGINS_FOLDER=${await this.convertToEnvPath(isWslInstalled, userPluginsUri)}`,
        '-f', await this.convertToEnvPath(isWslInstalled, makefileUri),
      ];

      if (isWslInstalled) {
        return {
          command: 'wsl.exe',
          args: [
            ...preMakeArgs,
            'taskset',
            this.getProcessorAffinityMask(),
            ...makeArgs,
          ],
          options: {
            cwd: await this.fileService.fsPath(workspaceRootUri)
          },
        };
      } else {
        return {
          command: 'cmd.exe',
          args: [
            '/c', 'start',
            '/affinity', this.getProcessorAffinityMask(),
            '/b',
            '/wait',
            '/realtime',
            await this.fileService.fsPath(await this.vesBuildPathsService.getMsysBashUri()),
            '--login',
            '-c', [
              ...preMakeArgs,
              ...makeArgs,
            ].join(' '),
          ],
          options: {
            cwd: await this.fileService.fsPath(workspaceRootUri),
          }
        };
      }
    }

    const paths = await Promise.all(pathUris.map(async p => this.fileService.fsPath(p)));
    const pathEnvVar = await this.envVariablesServer.getValue('PATH');
    if (pathEnvVar !== undefined) {
      paths.push(pathEnvVar.value!);
    }

    let command = 'make';
    let args = [
      'all',
      '-e', `TYPE=${buildMode}`,
      '-f', await this.convertToEnvPath(isWslInstalled, makefileUri),
      '-C', await this.convertToEnvPath(isWslInstalled, workspaceRootUri),
    ];

    if (isLinux) {
      command = 'taskset';
      args = [
        this.getProcessorAffinityMask(),
        'make',
        ...args,
      ];
    }

    return {
      command,
      args,
      options: {
        cwd: await this.fileService.fsPath(workspaceRootUri),
        env: {
          BUILD_ALL: buildAll ? 1 : 0,
          DUMP_ELF: dumpElf ? 1 : 0,
          ENGINE_FOLDER: await this.convertToEnvPath(isWslInstalled, engineCoreUri),
          LC_ALL: 'C',
          PREPROCESSING_WAIT_FOR_LOCK_DELAY_FACTOR: '0.000',
          MAKE_JOBS: this.getThreads(),
          PATH: paths.join(':'),
          PLUGINS_FOLDER: await this.convertToEnvPath(isWslInstalled, enginePluginsUri),
          USER_PLUGINS_FOLDER: await this.convertToEnvPath(isWslInstalled, userPluginsUri),
          PRINT_PEDANTIC_WARNINGS: pedanticWarnings ? 1 : 0,
        },
      },
    };
  }

  protected async checkPathsForSpaces(workspaceRootUri: URI, engineCoreUri: URI, enginePluginsUri: URI, userPluginsUri: URI): Promise<void> {
    if (/\s/.test(await this.fileService.fsPath(workspaceRootUri))) {
      throw new Error(
        `${nls.localize('vuengine/build/errorProjectPathMustNotContainSpaces', 'Error: Project path must not contain spaces. Your project path:')}\n` +
        this.labelProvider.getLongName(workspaceRootUri));
    } else if (/\s/.test(await this.fileService.fsPath(engineCoreUri))) {
      throw new Error(
        `${nls.localize('vuengine/build/errorEnginePathMustNotContainSpaces', 'Error: Engine path must not contain spaces. Your engine path:')}\n` +
        this.labelProvider.getLongName(engineCoreUri));
    } else if (/\s/.test(await this.fileService.fsPath(enginePluginsUri))) {
      throw new Error(
        `${nls.localize('vuengine/build/errorPluginsPathMustNotContainSpaces', 'Error: Plugins path must not contain spaces. Your plugins path:')}\n` +
        this.labelProvider.getLongName(enginePluginsUri));
    } else if (/\s/.test(await this.fileService.fsPath(userPluginsUri))) {
      throw new Error(
        `${nls.localize('vuengine/build/errorUserPluginsPathMustNotContainSpaces', 'Error: User Plugins path must not contain spaces. Your user plugins path:')}\n` +
        this.labelProvider.getLongName(userPluginsUri));
    }
  }

  protected async deleteRom(): Promise<void> {
    const romUri = await this.getDefaultRomUri();
    if (romUri && await this.fileService.exists(romUri)) {
      await this.fileService.delete(romUri);
    }
  }

  protected async getBuildPathUri(buildMode?: BuildMode): Promise<URI> {
    await this.workspaceService.ready;
    const workspaceRootUri = this.workspaceService.tryGetRoots()[0]?.resource;

    const buildPathUri = workspaceRootUri?.resolve('build');
    if (!buildPathUri) {
      return new URI();
    }

    return buildMode
      ? buildPathUri
        .resolve('working')
        .resolve('objects')
        .resolve(buildMode.toLowerCase())
      : buildPathUri;
  }

  protected parseBuildOutput(data: string): BuildLogLine {
    let text = data.trim();
    this.buildStatus.step = text;
    const textLowerCase = text.toLowerCase();
    let optimizedText;
    let type = BuildLogLineType.Normal;
    let file: BuildLogLineFileLink | undefined;
    let problem;

    if (textLowerCase.startsWith('starting build')) {
      type = BuildLogLineType.Headline;
    } else if (textLowerCase.startsWith('finding ')) {
      type = BuildLogLineType.Headline;
    } else if (textLowerCase.startsWith('build finished')) {
      type = BuildLogLineType.Done;
    } else if (textLowerCase.includes('preprocessing') || textLowerCase.includes('building')) {
      type = BuildLogLineType.Headline;
      this.buildStatus.stepsDone++;
      this.buildStatus.progress = this.computeProgress();
      const stepsDoneLabel = this.buildStatus.stepsDone.toString().padStart(
        this.buildStatus.stepsTotal.toString().length,
        '0'
      );
      text = `(${stepsDoneLabel}/${this.buildStatus.stepsTotal}) ${text}`;
    } else if (textLowerCase.startsWith('build finished')) {
      type = BuildLogLineType.Headline;
      this.buildStatus.progress = 100;
    } else if ((problem = this.matchGccProblem(text)) !== undefined) {
      type = (problem.severity === BuildLogLineType.Warning)
        ? BuildLogLineType.Warning
        : BuildLogLineType.Error;
      file = {
        uri: new URI(problem.file).withScheme('file'),
        line: problem.line,
        column: problem.column,
      };
      // TODO: disabled shortening of error messages and warnings for now.
      // Make sure it works fine in all possible cases!
      /*
        const functionReference = text.split(':')[1].trim();
        const errorMessage = problem.message.split(' [-W')[0].trim();
        optimizedText = `${functionReference}:\n${errorMessage[0].toUpperCase()}${errorMessage.slice(1)}.`;
      */
    } else if (textLowerCase.includes('error: ') ||
      textLowerCase.includes('] error ') ||
      textLowerCase.includes(' not found') ||
      textLowerCase.includes('Invalid argument') ||
      textLowerCase.includes('no such file or directory') ||
      textLowerCase.includes('undefined reference to') ||
      textLowerCase.includes('undefined symbol') ||
      textLowerCase.includes(' no rule to make target') ||
      textLowerCase.includes(' *** ') ||
      textLowerCase.includes(':(.rodata+') ||
      textLowerCase.endsWith(': undefined')) {
      type = BuildLogLineType.Error;
    } else if (textLowerCase.includes('warning: ') ||
      textLowerCase.endsWith(': no such file or directory')) {
      type = BuildLogLineType.Warning;
    }

    return {
      text: this.replaceFunctionNames(text),
      type,
      file,
      timestamp: Date.now(),
      optimizedText: optimizedText && this.replaceFunctionNames(optimizedText),
    };
  }

  protected matchGccProblem(message: string): GccMatchedProblem | undefined {
    const regEx = /^(.*):(\d+):(\d+):\s+(?:fatal\s+)?(warning|error):\s+(.*)$/gmi;
    let matchedProblem: GccMatchedProblem | undefined;

    const match = regEx.exec(message);
    if (match) {
      matchedProblem = {
        file: match[1],
        line: parseInt(match[2]),
        column: parseInt(match[3]),
        severity: match[4],
        message: match[5].trim(),
      };
    }

    return matchedProblem;
  }

  // Converts function names Class_function to Class::function
  protected replaceFunctionNames(name: string): string {
    // TODO: Disabled this because we cannot be sure that what we rename is
    // actually a function name. Find a way to make sure it is!
    // return name.replace(/\'([a-zA-Z0-9]*)_([a-zA-Z0-9]*)\'/g, '"$1::$2"');
    return name;
  }

  protected async getMakefileUri(workspaceRootUri: URI, engineCoreUri: URI): Promise<URI> {
    const gameMakefileUri = workspaceRootUri.resolve('makefile');
    let makefileUri = gameMakefileUri;
    if (!(await this.fileService.exists(makefileUri))) {
      const engineMakefileUri = engineCoreUri.resolve('makefile-game');
      makefileUri = engineMakefileUri;
      if (!(await this.fileService.exists(makefileUri))) {
        throw new Error(`${nls.localize('vuengine/build/errorCouldNotFindMakefile', 'Error: Could not find a makefile. Tried the following locations:')}\n` +
          `1) ${this.labelProvider.getLongName(gameMakefileUri)}\n` +
          `2) ${this.labelProvider.getLongName(engineMakefileUri)}`);
      }
    }

    return makefileUri;
  }

  async abortBuild(): Promise<void> {
    this.vesProcessService.killProcess(this.buildStatus.processManagerId);
    await this.resetBuildStatus(BuildResult.aborted);
  }

  async convertToEnvPath(isWslInstalled: boolean, uri: URI): Promise<string> {
    const path = await this.fileService.fsPath(uri);
    let envPath = path
      .replace(/\\/g, '/')
      .replace(/^[a-zA-Z]:\//, function (x): string {
        return `/${x.substring(0, 1).toLowerCase()}/`;
      });

    if (isWslInstalled) {
      envPath = '/mnt' + envPath;
    }

    return envPath;
  }

  protected getThreads(): number {
    return this.cpuInfo?.physicalCores ?? 1;
  }

  // returns affinity mask to use only performance cores
  protected getProcessorAffinityMask(): string {
    let pCoreMask = 'FFFFFFFF';
    const performanceCores = this.cpuInfo?.performanceCores ?? 0;
    if (performanceCores > 0) {
      const maskValue = Math.pow(2, performanceCores) - 1;
      pCoreMask = maskValue.toString(16).toUpperCase();
    }
    return isWindows ? pCoreMask : `0x${pCoreMask}`;
  }

  protected computeProgress(): number {
    // each headline indicates that a new chunk of work is being _started_, not finishing, hence -1
    return clamp(
      Math.floor((this.buildStatus.stepsDone - 1) * 100 / this.buildStatus.stepsTotal),
      0,
      100,
    );
  }

  bytesToMbit(bytes: number): number {
    return bytes / 1024 / 128;
  }

  async doClean(): Promise<void> {
    if (this.isCleaning || this.buildStatus.active) {
      return;
    }

    const buildMode = this.preferenceService.get(VesBuildPreferenceIds.BUILD_MODE) as BuildMode;

    const container = document.createElement('div');
    container.style.width = '376px';

    const areYouSureElement = document.createElement('p');
    areYouSureElement.style.marginBottom = '30px';
    container.appendChild(areYouSureElement);
    areYouSureElement.textContent = nls.localize(
      'vuengine/build/clean/areYouSure',
      'Are you sure you want to delete all cached object files for the {0} build mode?',
      buildMode
    );

    const fullCleanLabel = document.createElement('label');
    container.appendChild(fullCleanLabel);

    const assetsCheckbox = document.createElement('input');
    assetsCheckbox.type = 'checkbox';
    fullCleanLabel.appendChild(assetsCheckbox);

    const assetsCheckboxLabelElement = document.createElement('span');
    fullCleanLabel.appendChild(assetsCheckboxLabelElement);
    assetsCheckboxLabelElement.textContent = nls.localize(
      'vuengine/build/clean/fullClean',
      'Full clean ({0} to toggle)',
      isOSX ? '⌘' : nls.localize('vuengine/ctrl', 'Ctrl')
    );

    const assetsCheckboxExplanationElement = document.createElement('p');
    container.appendChild(assetsCheckboxExplanationElement);
    assetsCheckboxExplanationElement.textContent = nls.localize(
      'vuengine/build/clean/fullCleanExplanation',
      'Checking this will delete the entire build folder, including object files for all build modes and assets. \
Beware! This is usually not necessary and will result in the next build taking longer due to all assets having to be recompiled.'
    );

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Meta') {
        assetsCheckbox.checked = !assetsCheckbox.checked;
      }
    };
    document.addEventListener('keydown', onKeyDown);

    const dialog = new ConfirmDialog({
      title: nls.localize('vuengine/build/commands/clean', 'Clean Build Folder'),
      msg: container,
    });
    const confirmed = await dialog.open();
    if (confirmed) {
      this.clean(assetsCheckbox.checked, buildMode);
    }
    document.removeEventListener('keydown', onKeyDown);
  }

  protected async runCommand(commandName: string): Promise<void> {
    const command = this.commandRegistry.getCommand(commandName);
    if (!command) {
      return this.pushBuildLogLine({
        type: BuildLogLineType.Error,
        text: nls.localize('vuengine/build/couldNotFindCommand', 'Could not find command {0}.', commandName),
        timestamp: Date.now(),
      });
    }

    this.pushBuildLogLine({
      type: BuildLogLineType.Normal,
      text: nls.localize('vuengine/build/runningCommandX', 'Running command "{0}"...', command?.label) + ' ',
      timestamp: Date.now(),
    });

    await this.commandService.executeCommand(commandName);

    this.appendBuildLogLine({
      text: nls.localize('vuengine/build/completed', 'completed.'),
      timestamp: Date.now(),
    });
  }

  protected async runTask(taskName: string): Promise<void> {
    await this.workspaceService.ready;
    const workspaceRootUri = this.workspaceService.tryGetRoots()[0]?.resource;

    const taskInfo = await this.taskService.runWorkspaceTask(this.taskService.startUserAction(), workspaceRootUri?.toString(), taskName);

    if (!taskInfo) {
      return this.pushBuildLogLine({
        type: BuildLogLineType.Error,
        text: nls.localize('vuengine/build/couldNotRunTask', 'Could not run task {0}.', taskName),
        timestamp: Date.now(),
      });
    }

    this.pushBuildLogLine({
      type: BuildLogLineType.Normal,
      text: nls.localize('vuengine/build/runningTaskX', 'Running task "{0}"...', taskName) + ' ',
      timestamp: Date.now(),
    });

    const getExitCodePromise: Promise<TaskEndedInfo> = this.taskService.getExitCode(taskInfo.taskId).then(result =>
      ({ taskEndedType: TaskEndedTypes.TaskExited, value: result }));
    const isBackgroundTaskEndedPromise: Promise<TaskEndedInfo> = this.taskService.isBackgroundTaskEnded(taskInfo.taskId).then(result =>
      ({ taskEndedType: TaskEndedTypes.BackgroundTaskEnded, value: result }));

    // After start running the task, we wait for the task process to exit and if it is a background task, we also wait for a feedback
    // that a background task is active, as soon as one of the promises fulfills, we can continue and analyze the results.
    const taskEndedInfo: TaskEndedInfo = await Promise.race([getExitCodePromise, isBackgroundTaskEndedPromise]);

    if (taskEndedInfo.taskEndedType === TaskEndedTypes.BackgroundTaskEnded && taskEndedInfo.value) {
      return this.appendBuildLogLine({
        text: nls.localize('vuengine/build/completed', 'completed.'),
        timestamp: Date.now(),
      });
    }
    if (taskEndedInfo.taskEndedType === TaskEndedTypes.TaskExited && taskEndedInfo.value === 0) {
      return this.appendBuildLogLine({
        text: nls.localize('vuengine/build/completed', 'completed.'),
        timestamp: Date.now(),
      });
    } else if (taskEndedInfo.taskEndedType === TaskEndedTypes.TaskExited && taskEndedInfo.value !== undefined) {
      return this.appendBuildLogLine({
        type: BuildLogLineType.Error,
        text: nls.localize('vuengine/build/terminatedWithExitCode', 'terminated with exit code {1}.', taskEndedInfo.value),
        timestamp: Date.now(),
      });
    } else {
      const signal = await this.taskService.getTerminateSignal(taskInfo.taskId);
      if (signal !== undefined) {
        return this.appendBuildLogLine({
          type: BuildLogLineType.Error,
          text: nls.localize('vuengine/build/terminatedBySignal', 'terminated by signal {1}.', signal),
          timestamp: Date.now(),
        });
      } else {
        return this.appendBuildLogLine({
          type: BuildLogLineType.Error,
          text: nls.localize('vuengine/build/terminatedForUnknownReason', 'terminated for unknown reason.'),
          timestamp: Date.now(),
        });
      }
    }
  }

  protected async runTasks(tasks: Array<PrePostBuildTask>): Promise<void> {
    let completed = 0;

    if (!Array.isArray(tasks)) {
      return this.pushBuildLogLine({
        type: BuildLogLineType.Error,
        text: nls.localize('vuengine/build/malformedPreferenceNotAnArray', 'Malformed preference: not an array.'),
        timestamp: Date.now(),
      });
    }

    for (const task of tasks) {
      if (!task.name) {
        return this.pushBuildLogLine({
          type: BuildLogLineType.Error,
          text: nls.localize('vuengine/build/malformedPreferenceMissingTaskName', 'Malformed preference: missing task name.'),
          timestamp: Date.now(),
        });
      }
      if (!task.type) {
        return this.pushBuildLogLine({
          type: BuildLogLineType.Error,
          text: nls.localize('vuengine/build/malformedPreferenceMissingTaskType', 'Malformed preference: missing type for task {0}.', task.name),
          timestamp: Date.now(),
        });
      }

      switch (task.type.toLowerCase()) {
        case PrePostBuildTaskType.Task:
          await this.runTask(task.name);
          completed++;
          break;
        case PrePostBuildTaskType.Command:
          await this.runCommand(task.name);
          completed++;
          break;
      }
    }

    if (!completed) {
      this.pushBuildLogLine({
        type: BuildLogLineType.Normal,
        text: nls.localize('vuengine/build/noTasksFound', 'No tasks found.'),
        timestamp: Date.now(),
      });
    }
  }

  protected async runPreBuildTasks(): Promise<void> {
    this.buildStatus = {
      ...this.buildStatus,
      step: nls.localize('vuengine/build/preBuildTasks', 'Pre-build tasks'),
    };
    this.pushBuildLogLine({
      type: BuildLogLineType.Headline,
      text: nls.localize('vuengine/build/preBuildTasks', 'Pre-build tasks'),
      timestamp: Date.now(),
    });

    const tasks = this.preferenceService.get(VesBuildPreferenceIds.PRE_BUILD_TASKS, []) as Array<PrePostBuildTask>;
    await this.runTasks(tasks);

    this.pushBuildLogLine({
      type: BuildLogLineType.Normal,
      text: '',
      timestamp: Date.now(),
    });
  }

  protected async runPostBuildTasks(): Promise<void> {
    this.buildStatus = {
      ...this.buildStatus,
      step: nls.localize('vuengine/build/postBuildTasks', 'Post-build tasks'),
    };
    this.pushBuildLogLine({
      type: BuildLogLineType.Normal,
      text: '',
      timestamp: Date.now(),
    });

    this.pushBuildLogLine({
      type: BuildLogLineType.Headline,
      text: nls.localize('vuengine/build/postBuildTasks', 'Post-build tasks'),
      timestamp: Date.now(),
    });

    const tasks = this.preferenceService.get(VesBuildPreferenceIds.POST_BUILD_TASKS, []) as Array<PrePostBuildTask>;
    await this.runTasks(tasks);

    this.buildStatus = {
      ...this.buildStatus,
      step: BuildResult.done,
    };
  }

  async buildModeQuickPick(buildMode?: BuildMode): Promise<void> {
    const currentBuildMode = this.preferenceService.get(VesBuildPreferenceIds.BUILD_MODE) as BuildMode;

    const quickPickOptions: QuickPickOptions<QuickPickItem> = {
      title: nls.localize('vuengine/build/setBuildModeTitle', 'Set Build Mode'),
      placeholder: nls.localize('vuengine/build/setBuildModePlaceholder', 'Select which mode to build in'),
    };

    const buildTypes: QuickPickItem[] = [
      {
        label: BuildMode.Release,
        description: nls.localize('vuengine/build/modes/releaseDescription', 'Includes no asserts or debug flags, for shipping only.'),
        iconClasses: ['codicon', (BuildMode.Release === currentBuildMode) ? 'codicon-pass-filled' : 'codicon-circle-large'],
      },
      {
        label: BuildMode.Beta,
        description: nls.localize('vuengine/build/modes/betaDescription', 'Includes selected asserts, for testing on emulators.'),
        iconClasses: ['codicon', (BuildMode.Beta === currentBuildMode) ? 'codicon-pass-filled' : 'codicon-circle-large'],
      },
      {
        label: BuildMode.Tools,
        description: nls.localize('vuengine/build/modes/toolsDescription', 'Includes selected asserts, includes debugging tools.'),
        iconClasses: ['codicon', (BuildMode.Tools === currentBuildMode) ? 'codicon-pass-filled' : 'codicon-circle-large'],
      },
      {
        label: BuildMode.Debug,
        description: nls.localize('vuengine/build/modes/debugDescription', 'Includes all runtime assertions, includes debugging tools.'),
        iconClasses: ['codicon', (BuildMode.Debug === currentBuildMode) ? 'codicon-pass-filled' : 'codicon-circle-large'],
      }
    ];

    const selection = await this.quickPickService.show<QuickPickItem>(buildTypes, quickPickOptions);
    if (!selection) {
      return;
    }
    this.setBuildMode(selection.label as BuildMode);
  }

  async setBuildMode(buildMode: BuildMode): Promise<void> {
    await this.preferenceService.set(VesBuildPreferenceIds.BUILD_MODE, buildMode, PreferenceScope.User);
  }

  async getDefaultRomUri(): Promise<URI> {
    await this.workspaceService.ready;
    const workspaceRootUri = this.workspaceService.tryGetRoots()[0]?.resource;
    if (!workspaceRootUri) {
      return new URI();
    }

    return workspaceRootUri
      ? workspaceRootUri
        .resolve('build')
        .resolve('output.vb')
      : new URI;
  }

  async getBuildModeRomUri(buildMode: BuildMode): Promise<URI> {
    await this.workspaceService.ready;
    const workspaceRootUri = this.workspaceService.tryGetRoots()[0]?.resource;
    if (!workspaceRootUri) {
      return new URI();
    }

    return workspaceRootUri
      .resolve('build')
      .resolve('working')
      .resolve(`output-${buildMode.toLowerCase()}.vb`);
  }

  protected async clean(full: boolean, buildMode: BuildMode): Promise<void> {
    this.isCleaning = true;
    const buildPathUri = await this.getBuildPathUri();

    if (full) {
      if (await this.fileService.exists(buildPathUri)) {
        await this.fileService.delete(buildPathUri, { recursive: true });
      }
    } else {
      const buildPathModeUri = await this.getBuildPathUri(buildMode);
      if (await this.fileService.exists(buildPathModeUri)) {
        await this.fileService.delete(buildPathModeUri, { recursive: true });
      }

      await this.deleteLibraryFiles();
    }

    this.isCleaning = false;

    if (this.isQueued) {
      this.isQueued = false;
      this.commandService.executeCommand(VesBuildCommands.BUILD.id, true);
    }
  }

  protected async deleteLibraryFiles(): Promise<void> {
    const buildPathUri = await this.getBuildPathUri();
    if (await this.fileService.exists(buildPathUri)) {
      const files = await this.fileService.resolve(buildPathUri);
      if (files.children) {
        await Promise.all(files.children.map(async child => {
          if (child.name.endsWith('.a')) {
            await this.fileService.delete(child.resource);
          }
        }));
      }
    }
  }

  protected getLastBuildModeStorageKey(): string {
    const workspaceRoot = this.workspaceService.tryGetRoots()[0];
    const workspacePath = workspaceRoot ? `/${workspaceRoot.resource.path}` : '';
    return `ves-last-build-mode${workspacePath}`;
  }
}
