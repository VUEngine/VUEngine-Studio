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
import { ProcessOptions } from '@theia/process/lib/node';
import { TaskEndedInfo, TaskEndedTypes, TaskService } from '@theia/task/lib/browser/task-service';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import { VesCommonService } from '../../core/browser/ves-common-service';
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

  clearLogs(): void {
    this._buildStatus.log = [];
  }

  @postConstruct()
  protected init(): void {
    this.bindEvents();
    this.doInit();
  }

  protected async doInit(): Promise<void> {
    await this.workspaceService.ready;
    this.lastBuildMode = await this.localStorageService.getData(this.getLastBuildModeStorageKey());
    await this.resetBuildStatus();
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
      this.build();
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

  protected bindEvents(): void {
    // init flags
    this.frontendApplicationStateService.onStateChanged(
      async (state: FrontendApplicationState) => {
        if (state === 'attached_shell') {
          await this.determineRomSize();
        }
      }
    );

    // watch for preference changes
    this.preferenceService.onPreferenceChanged(
      ({ preferenceName, newValue }) => {
        switch (preferenceName) {
          case VesBuildPreferenceIds.BUILD_MODE:
            this.onDidChangeBuildModeEmitter.fire(newValue);
            break;
        }
      }
    );

    // @ts-ignore
    this.vesProcessWatcher.onDidReceiveError(async ({ pId }) => {
      if (this.buildStatus.processManagerId === pId) {
        await this.resetBuildStatus(BuildResult.failed);
        await this.afterBuild(BuildResult.failed);
      }
    });

    // @ts-ignore
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
          .forEach((d: string) =>
            this.pushBuildLogLine(this.parseBuildOutput(d))
          );
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
  }

  protected async build(): Promise<void> {
    let processManagerId = 0;
    let processId = 0;
    const buildMode = this.preferenceService.get(VesBuildPreferenceIds.BUILD_MODE) as BuildMode;

    this.buildStatus = {
      active: false,
      stepsTotal: 2 * (this.vesPluginsService.getActualUsedPluginNames().length + 2),
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
      await this.deleteRom();
      await this.fixFilePermissions();
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
    const workspaceRootUri = this.workspaceService.tryGetRoots()[0]?.resource;
    const buildMode = (this.preferenceService.get(VesBuildPreferenceIds.BUILD_MODE) as string).toLowerCase();
    const dumpElf = this.preferenceService.get(VesBuildPreferenceIds.DUMP_ELF) as boolean;
    const pedanticWarnings = this.preferenceService.get(VesBuildPreferenceIds.PEDANTIC_WARNINGS) as boolean;
    const engineCoreUri = await this.vesBuildPathsService.getEngineCoreUri();
    const enginePluginsUri = await this.vesPluginsPathsService.getEnginePluginsUri();
    const userPluginsUri = await this.vesPluginsPathsService.getUserPluginsUri();
    const compilerUri = await this.vesBuildPathsService.getCompilerUri(this.vesCommonService.isWslInstalled);
    const makeUri = await this.vesBuildPathsService.getMakeUri(this.vesCommonService.isWslInstalled);
    const makefileUri = await this.getMakefileUri(workspaceRootUri, engineCoreUri);

    // TODO: remove check when https://github.com/VUEngine/VUEngine-Studio/issues/15 is resolved
    await this.checkPathsForSpaces(workspaceRootUri, engineCoreUri, enginePluginsUri, userPluginsUri);

    const pathUris: URI[] = [
      compilerUri.resolve('bin'),
      compilerUri.resolve('libexec').resolve('bin'),
      makeUri,
    ];

    if (isWindows) {
      const args = [
        'cd', await this.convertoToEnvPath(workspaceRootUri), '&&',
        'export', `PATH=${await Promise.all(pathUris.map(async p => this.convertoToEnvPath(p)).join(':'))}:$PATH`,
        'LC_ALL=C',
        `MAKE_JOBS=${this.getThreads()}`,
        'PREPROCESSING_WAIT_FOR_LOCK_DELAY_FACTOR=0.0',
        `DUMP_ELF=${dumpElf ? 1 : 0}`,
        `PRINT_PEDANTIC_WARNINGS=${pedanticWarnings ? 1 : 0}`, '&&',
        'make', 'all',
        '-e', `TYPE=${buildMode}`,
        `ENGINE_FOLDER=${await this.convertoToEnvPath(engineCoreUri)}`,
        `PLUGINS_FOLDER=${await this.convertoToEnvPath(enginePluginsUri)}`,
        `USER_PLUGINS_FOLDER=${await this.convertoToEnvPath(userPluginsUri)}`,
        '-f', await this.convertoToEnvPath(makefileUri),
      ];

      return this.vesCommonService.isWslInstalled
        ? {
          command: 'wsl.exe',
          args: args,
          options: {
            cwd: await this.fileService.fsPath(workspaceRootUri)
          },
        }
        : {
          command: await this.fileService.fsPath(await this.vesBuildPathsService.getMsysBashUri()),
          args: [
            '--login',
            '-c', args.join(' '),
          ],
          options: {
            cwd: await this.fileService.fsPath(workspaceRootUri),
          },
        };
    }

    const paths = await Promise.all(pathUris.map(async p => this.fileService.fsPath(p)));
    const pathEnvVar = await this.envVariablesServer.getValue('PATH');
    if (pathEnvVar !== undefined) {
      paths.push(pathEnvVar.value!);
    }

    return {
      command: 'make',
      args: [
        'all',
        '-e', `TYPE=${buildMode}`,
        '-f', await this.convertoToEnvPath(makefileUri),
        '-C', await this.convertoToEnvPath(workspaceRootUri),
      ],
      options: {
        cwd: await this.fileService.fsPath(workspaceRootUri),
        env: {
          DUMP_ELF: dumpElf ? 1 : 0,
          ENGINE_FOLDER: await this.convertoToEnvPath(engineCoreUri),
          LC_ALL: 'C',
          PREPROCESSING_WAIT_FOR_LOCK_DELAY_FACTOR: '0.000',
          MAKE_JOBS: this.getThreads(),
          PATH: paths.join(':'),
          PLUGINS_FOLDER: await this.convertoToEnvPath(enginePluginsUri),
          USER_PLUGINS_FOLDER: await this.convertoToEnvPath(userPluginsUri),
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

    const buildPathUri = workspaceRootUri.resolve('build');

    return buildMode
      ? buildPathUri
        .resolve('working')
        .resolve('objects')
        .resolve(buildMode.toLowerCase())
      : buildPathUri;
  }

  protected parseBuildOutput(data: string): BuildLogLine {
    let text = data.trim();
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
      this.buildStatus.step = textLowerCase;
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

  async convertoToEnvPath(uri: URI): Promise<string> {
    const path = await this.fileService.fsPath(uri);
    let envPath = path
      .replace(/\\/g, '/')
      .replace(/^[a-zA-Z]:\//, function (x): string {
        return `/${x.substring(0, 1).toLowerCase()}/`;
      });

    if (this.vesCommonService.isWslInstalled) {
      envPath = '/mnt' + envPath;
    }

    return envPath;
  }

  protected getThreads(): number {
    return window.electronVesCore.getPhysicalCpuCount();
  }

  protected computeProgress(): number {
    // each headline indicates that a new chunk of work is being _started_, not finishing, hence -1
    return Math.floor((this.buildStatus.stepsDone - 1) * 100 / this.buildStatus.stepsTotal);
  }

  /**
   * Give executables respective permission on UNIX systems.
   * Must be executed before every build to ensure permissions are right,
   * even right after reconfiguring engine paths.
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

    const engineCorePath = await this.vesBuildPathsService.getEngineCoreUri();
    const compilerUri = await this.vesBuildPathsService.getCompilerUri(this.vesCommonService.isWslInstalled);
    const makeUri = await this.vesBuildPathsService.getMakeUri(this.vesCommonService.isWslInstalled);

    const paths = await Promise.all([
      this.fileService.fsPath(compilerUri.resolve('bin')),
      this.fileService.fsPath(compilerUri.resolve('libexec')),
      this.fileService.fsPath(compilerUri.resolve('v810').resolve('bin')),
      this.fileService.fsPath(engineCorePath.resolve('lib').resolve('compiler').resolve('preprocessor')),
    ]);

    if (!isWindows) {
      paths.push(await this.fileService.fsPath(makeUri));
    }

    console.log('paths', paths);

    paths.map(p => this.vesProcessService.launchProcess(VesProcessType.Raw, {
      command,
      args: args.concat(p),
    }));
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
      // eslint-disable-next-line max-len
      'Checking this will delete the entire build folder, including object files for all build modes and assets. Beware! This is usually not necessary and will result in the next build taking longer due to all assets having to be recompiled.'
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

    await this.commandService.executeCommand(commandName);

    this.pushBuildLogLine({
      type: BuildLogLineType.Normal,
      text: nls.localize('vuengine/build/commandCompleted', 'Command {0} completed.', command?.label),
      timestamp: Date.now(),
    });
  }

  protected async runTask(taskName: string): Promise<void> {
    await this.workspaceService.ready;
    const workspaceRootUri = this.workspaceService.tryGetRoots()[0]?.resource;

    const taskInfo = await this.taskService.runWorkspaceTask(this.taskService.startUserAction(), workspaceRootUri.toString(), taskName);

    if (!taskInfo) {
      return this.pushBuildLogLine({
        type: BuildLogLineType.Error,
        text: nls.localize('vuengine/build/couldNotRunTask', 'Could not run task {0}.', taskName),
        timestamp: Date.now(),
      });
    }

    const getExitCodePromise: Promise<TaskEndedInfo> = this.taskService.getExitCode(taskInfo.taskId).then(result =>
      ({ taskEndedType: TaskEndedTypes.TaskExited, value: result }));
    const isBackgroundTaskEndedPromise: Promise<TaskEndedInfo> = this.taskService.isBackgroundTaskEnded(taskInfo.taskId).then(result =>
      ({ taskEndedType: TaskEndedTypes.BackgroundTaskEnded, value: result }));

    // After start running the task, we wait for the task process to exit and if it is a background task, we also wait for a feedback
    // that a background task is active, as soon as one of the promises fulfills, we can continue and analyze the results.
    const taskEndedInfo: TaskEndedInfo = await Promise.race([getExitCodePromise, isBackgroundTaskEndedPromise]);

    if (taskEndedInfo.taskEndedType === TaskEndedTypes.BackgroundTaskEnded && taskEndedInfo.value) {
      return this.pushBuildLogLine({
        type: BuildLogLineType.Normal,
        text: nls.localize('vuengine/build/taskCompleted', 'Task {0} completed.', taskName),
        timestamp: Date.now(),
      });
    }
    if (taskEndedInfo.taskEndedType === TaskEndedTypes.TaskExited && taskEndedInfo.value === 0) {
      return this.pushBuildLogLine({
        type: BuildLogLineType.Normal,
        text: nls.localize('vuengine/build/taskCompleted', 'Task {0} completed.', taskName),
        timestamp: Date.now(),
      });
    } else if (taskEndedInfo.taskEndedType === TaskEndedTypes.TaskExited && taskEndedInfo.value !== undefined) {
      return this.pushBuildLogLine({
        type: BuildLogLineType.Error,
        text: nls.localize('vuengine/build/taskTerminatedWithExitCode', 'Task {0} terminated with exit code {1}.', taskName, taskEndedInfo.value),
        timestamp: Date.now(),
      });
    } else {
      const signal = await this.taskService.getTerminateSignal(taskInfo.taskId);
      if (signal !== undefined) {
        return this.pushBuildLogLine({
          type: BuildLogLineType.Error,
          text: nls.localize('vuengine/build/taskTerminatedBySignal', 'Task {0} terminated by signal {1}.', taskName, signal),
          timestamp: Date.now(),
        });
      } else {
        return this.pushBuildLogLine({
          type: BuildLogLineType.Error,
          text: nls.localize('vuengine/build/taskTerminatedForUnknownReason', 'Task {0} terminated for unknown reason.', taskName),
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

      switch (task.type) {
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
      step: `${nls.localize('vuengine/build/preBuildTasks', 'Pre-build tasks')}...`,
    };
    this.pushBuildLogLine({
      type: BuildLogLineType.Headline,
      text: `${nls.localize('vuengine/build/runningPreBuildTasks', 'Running pre-build tasks')}...`,
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
      step: `${nls.localize('vuengine/build/postBuildTasks', 'Post-build tasks')}...`,
    };
    this.pushBuildLogLine({
      type: BuildLogLineType.Normal,
      text: '',
      timestamp: Date.now(),
    });

    this.pushBuildLogLine({
      type: BuildLogLineType.Headline,
      text: `${nls.localize('vuengine/build/runningPostBuildTasks', 'Running post-build tasks')}...`,
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
        detail: `   ${nls.localize('vuengine/build/modes/releaseDescription', 'Includes no asserts or debug flags, for shipping only.')}`,
        iconClasses: (BuildMode.Release === currentBuildMode) ? ['fa', 'fa-check-square-o'] : ['fa', 'fa-square-o'],
      },
      {
        label: BuildMode.Beta,
        detail: `   ${nls.localize('vuengine/build/modes/betaDescription', 'Includes selected asserts, for testing on emulators.')}`,
        iconClasses: (BuildMode.Beta === currentBuildMode) ? ['fa', 'fa-check-square-o'] : ['fa', 'fa-square-o'],
      },
      {
        label: BuildMode.Tools,
        detail: `   ${nls.localize('vuengine/build/modes/toolsDescription', 'Includes selected asserts, includes debugging tools.')}`,
        iconClasses: (BuildMode.Tools === currentBuildMode) ? ['fa', 'fa-check-square-o'] : ['fa', 'fa-square-o'],
      },
      {
        label: BuildMode.Debug,
        detail: `   ${nls.localize('vuengine/build/modes/debugDescription', 'Includes all runtime assertions, includes debugging tools.')}`,
        iconClasses: (BuildMode.Debug === currentBuildMode) ? ['fa', 'fa-check-square-o'] : ['fa', 'fa-square-o'],
      }
    ];

    this.quickPickService.show<QuickPickItem>(buildTypes, quickPickOptions).then(selection => {
      if (!selection) {
        return;
      }
      this.setBuildMode(selection.label as BuildMode);
    });
  }

  async setBuildMode(buildMode: BuildMode): Promise<void> {
    this.preferenceService.set(VesBuildPreferenceIds.BUILD_MODE, buildMode, PreferenceScope.User);

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
  }

  async getDefaultRomUri(): Promise<URI> {
    await this.workspaceService.ready;
    const workspaceRootUri = this.workspaceService.tryGetRoots()[0]?.resource;

    return workspaceRootUri
      ? workspaceRootUri
        .resolve('build')
        .resolve('output.vb')
      : new URI;
  }

  async getBuildModeRomUri(buildMode: BuildMode): Promise<URI> {
    await this.workspaceService.ready;
    const workspaceRootUri = this.workspaceService.tryGetRoots()[0]?.resource;

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

      if (await this.fileService.exists(buildPathUri)) {
        const files = await this.fileService.resolve(buildPathUri);
        if (files.children) {
          for (const child of files.children) {
            if (child.name.endsWith('.a')) {
              this.fileService.delete(child.resource);
            }
          }
        }
      }
    }

    this.isCleaning = false;

    if (this.isQueued) {
      this.isQueued = false;
      this.commandService.executeCommand(VesBuildCommands.BUILD.id, true);
    }
  }

  protected getLastBuildModeStorageKey(): string {
    const workspaceRoot = this.workspaceService.tryGetRoots()[0];
    const workspacePath = workspaceRoot ? `/${workspaceRoot.resource.path}` : '';
    return `ves-last-build-mode${workspacePath}`;
  }
}
