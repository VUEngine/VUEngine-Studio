import { CommandRegistry, CommandService, isWindows, nls } from '@theia/core';
import { ApplicationShell, LabelProvider, PreferenceScope, PreferenceService, QuickPickItem, QuickPickOptions, QuickPickService } from '@theia/core/lib/browser';
import { FrontendApplicationState, FrontendApplicationStateService } from '@theia/core/lib/browser/frontend-application-state';
import URI from '@theia/core/lib/common/uri';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { Emitter } from '@theia/core/shared/vscode-languageserver-protocol';
import { FileChangeType } from '@theia/filesystem/lib/common/files';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { FileChangesEvent } from '@theia/filesystem/lib/common/files';
import { ProcessOptions } from '@theia/process/lib/node';
import { TaskEndedInfo, TaskEndedTypes, TaskService } from '@theia/task/lib/browser/task-service';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import { VesCommonService } from '../../core/browser/ves-common-service';
import { VesPluginsPathsService } from '../../plugins/browser/ves-plugins-paths-service';
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

interface BuildFolderFlags {
  [key: string]: boolean;
};

@injectable()
export class VesBuildService {
  @inject(ApplicationShell)
  protected readonly shell: ApplicationShell;
  @inject(CommandRegistry)
  protected readonly commandRegistry: CommandRegistry;
  @inject(CommandService)
  protected readonly commandService: CommandService;
  @inject(FileService)
  protected fileService: FileService;
  @inject(FrontendApplicationStateService)
  protected readonly frontendApplicationStateService: FrontendApplicationStateService;
  @inject(LabelProvider)
  protected readonly labelProvider: LabelProvider;
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
  @inject(VesProcessService)
  protected readonly vesProcessService: VesProcessService;
  @inject(VesProcessWatcher)
  protected readonly vesProcessWatcher: VesProcessWatcher;
  @inject(WorkspaceService)
  protected readonly workspaceService: WorkspaceService;

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

  // build folder
  protected readonly onDidChangeBuildFolderEmitter = new Emitter<BuildFolderFlags>();
  readonly onDidChangeBuildFolder = this.onDidChangeBuildFolderEmitter.event;
  protected _buildFolderExists: BuildFolderFlags = {};
  setBuildFolderExists(buildMode: string, flag: boolean): void {
    this._buildFolderExists[buildMode] = flag;
    this.onDidChangeBuildFolderEmitter.fire(this._buildFolderExists);
  }
  get buildFolderExists(): BuildFolderFlags {
    return this._buildFolderExists;
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

  @postConstruct()
  protected async init(): Promise<void> {
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
      this.build();
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

  protected async determineRomSize(): Promise<void> {
    const romUri = await this.getDefaultRomUri();
    if (romUri && await this.fileService.exists(romUri)) {
      const outputRom = await this.fileService.resolve(romUri, { resolveMetadata: true });
      this.romSize = outputRom.size;
    } else {
      this.romSize = 0;
    }
  }

  protected bindEvents(): void {
    // init flags
    this.frontendApplicationStateService.onStateChanged(
      async (state: FrontendApplicationState) => {
        if (state === 'attached_shell') {
          for (const buildMode in BuildMode) {
            if (BuildMode.hasOwnProperty(buildMode)) {
              const buildPathUri = await this.getBuildPathUri(buildMode as BuildMode);
              if (buildPathUri) {
                this.fileService
                  .exists(buildPathUri)
                  .then((exists: boolean) => {
                    this.setBuildFolderExists(buildMode, exists);
                  });
              }
            }
          }

          await this.determineRomSize();
        }
      }
    );

    // watch for file changes
    this.fileService.onDidFilesChange(async (fileChangesEvent: FileChangesEvent) => {
      for (const buildMode in BuildMode) {
        if (BuildMode.hasOwnProperty(buildMode)) {
          const buildPathUri = await this.getBuildPathUri(buildMode as BuildMode);
          if (buildPathUri) {
            if (fileChangesEvent.contains(buildPathUri, FileChangeType.ADDED)) {
              this.setBuildFolderExists(buildMode, true);
            } else if (fileChangesEvent.contains(buildPathUri, FileChangeType.DELETED)) {
              this.setBuildFolderExists(buildMode, false);
            }
          }
        }
      }
    });

    // watch for preference changes
    this.preferenceService.onPreferenceChanged(
      ({ preferenceName, newValue }) => {
        switch (preferenceName) {
          case VesBuildPreferenceIds.BUILD_MODE:
            this.onDidChangeBuildModeEmitter.fire(newValue);
            this.onDidChangeBuildFolderEmitter.fire(this._buildFolderExists);
            break;
        }
      }
    );

    // @ts-ignore
    this.vesProcessWatcher.onDidReceiveError(async ({ pId }) => {
      if (this.buildStatus.processManagerId === pId) {
        await this.resetBuildStatus(BuildResult.failed);
      }
    });

    // @ts-ignore
    this.vesProcessWatcher.onDidExitProcess(async ({ pId, event }) => {
      if (this.buildStatus.processManagerId === pId) {
        await this.resetBuildStatus(event.code === 0
          ? BuildResult.done
          : BuildResult.failed
        );
      }
    });

    // @ts-ignore
    const onData = ({ pId, data }) => {
      if (this.buildStatus.processManagerId === pId) {
        this.pushBuildLogLine(this.parseBuildOutput(data));
      }
    };

    this.vesProcessWatcher.onDidReceiveOutputStreamData(onData);
    this.vesProcessWatcher.onDidReceiveErrorStreamData(onData);

    this.onDidSucceedBuild(async () => {
      /* await */ this.determineRomSize();
      await this.runPostBuildTasks();
    });

    this.onDidFailBuild(async () => {
      this.romSize = 0;
      this.commandService.executeCommand(VesBuildCommands.WIDGET_TOGGLE.id, true);
    });
  }

  protected async build(): Promise<void> {
    let processManagerId = 0;
    let processId = 0;

    this.buildStatus = {
      active: false,
      processManagerId,
      processId,
      progress: 0,
      log: [],
      buildMode: this.preferenceService.get(VesBuildPreferenceIds.BUILD_MODE) as BuildMode,
      step: '',
      startDate: new Date(),
      endDate: undefined,
    };

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
      await this.fixPermissions();
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
    const makefileUri = await this.getMakefileUri(workspaceRootUri, engineCoreUri);

    // TODO: remove check when https://github.com/VUEngine/VUEngine-Studio/issues/15 is resolved
    await this.checkPathsForSpaces(workspaceRootUri, engineCoreUri, enginePluginsUri, userPluginsUri);

    if (isWindows) {
      const args = [
        'cd', await this.convertoToEnvPath(workspaceRootUri), '&&',
        'export', `PATH=${await this.convertoToEnvPath(compilerUri.resolve('bin'))}:$PATH`,
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

      if (this.vesCommonService.isWslInstalled) {

        /* const winDir = await this.envVariablesServer.getValue('winDir');
        if (!winDir || !winDir.value) {
          return;
        }

        const winDirUri = new URI(winDir.value).withScheme('file');
        const wslExeUri = winDirUri
          .resolve('System32')
          .resolve('wsl.exe');
        */

        return {
          command: 'wsl.exe',
          args: args,
          options: {
            cwd: await this.fileService.fsPath(workspaceRootUri)
          },
        };
      } else {
        return {
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
          PATH: [await this.fileService.fsPath(compilerUri.resolve('bin')), process.env.PATH].join(':'),
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

  protected async getBuildPathUri(buildMode?: BuildMode): Promise<URI | undefined> {
    await this.workspaceService.ready;
    const workspaceRootUri = this.workspaceService.tryGetRoots()[0]?.resource;
    if (!workspaceRootUri) {
      return;
    }

    const buildPathUri = workspaceRootUri.resolve('build');

    return buildMode
      ? buildPathUri.resolve(buildMode.toLowerCase())
      : buildPathUri;
  }

  protected parseBuildOutput(data: string): BuildLogLine {
    const text = data.trim();
    const textLowerCase = text.toLowerCase();
    let optimizedText;
    let type = BuildLogLineType.Normal;
    let file: BuildLogLineFileLink | undefined;
    let headlineMatches;
    let problem;

    if (textLowerCase.startsWith('starting build')) {
      type = BuildLogLineType.Headline;
    } else if (textLowerCase.startsWith('finding ')) {
      type = BuildLogLineType.Headline;
    } else if (textLowerCase.startsWith('build finished')) {
      type = BuildLogLineType.Done;
    } else if ((headlineMatches = this.matchHeadlines(text)).length) {
      type = BuildLogLineType.Headline;
      this.buildStatus.step = headlineMatches[3] as unknown as string;
      this.buildStatus.progress = this.computeProgress(headlineMatches);
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

  protected matchHeadlines(message: string): string[] {
    const regEx = /\((\d+)\/(\d+)\) (preprocessing (.+)|building (.+))/gi;
    const headlineMatches: string[] = [];

    let m;
    while (m = regEx.exec(message)) {
      // Avoid infinite loops with zero-width matches
      if (m.index === regEx.lastIndex) {
        regEx.lastIndex++;
      }

      m.forEach((match, groupIndex) => {
        headlineMatches[groupIndex] = match;
      });
    }

    return headlineMatches;
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
    return require('physical-cpu-count');
  }

  protected computeProgress(matches: string[]): number {
    const stepsDone = parseInt(matches[1]) ?? 0;
    const stepsTotal = parseInt(matches[2]) ?? 1;

    // each headline indicates that a new chunk of work is being _started_, not finishing, hence -1
    return Math.floor((stepsDone - 1) * 100 / stepsTotal);
  }

  /**
   * Give executables respective permission on UNIX systems.
   * Must be executed before every build to ensure permissions are right,
   * even right after reconfiguring engine paths.
   */
  protected async fixPermissions(): Promise<void> {
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

    await Promise.all([
      this.vesProcessService.launchProcess(VesProcessType.Raw, {
        command,
        args: args.concat(await this.fileService.fsPath(compilerUri.resolve('bin'))),
      }),
      this.vesProcessService.launchProcess(VesProcessType.Raw, {
        command,
        args: args.concat(await this.fileService.fsPath(compilerUri.resolve('libexec'))),
      }),
      this.vesProcessService.launchProcess(VesProcessType.Raw, {
        command,
        args: args.concat(await this.fileService.fsPath(compilerUri.resolve('v810').resolve('bin'))),
      }),
      this.vesProcessService.launchProcess(VesProcessType.Raw, {
        command,
        args: args.concat(await this.fileService.fsPath(engineCorePath.resolve('lib').resolve('compiler').resolve('preprocessor'))),
      }),
    ]);
  }

  bytesToMbit(bytes: number): number {
    return bytes / 1024 / 128;
  }

  async doClean(): Promise<void> {
    if (this.isCleaning || this.buildStatus.active) {
      return;
    }

    const buildMode = this.preferenceService.get(VesBuildPreferenceIds.BUILD_MODE) as BuildMode;

    if (this.buildFolderExists[buildMode]) {
      this.clean(buildMode);
    }
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
      step: nls.localize('vuengine/build/done', 'Done'),
    };
  }

  async clean(buildMode: BuildMode): Promise<void> {
    if (!this.buildFolderExists[buildMode]) {
      return;
    }

    this.isCleaning = true;

    const buildModePathUri = await this.getBuildPathUri(buildMode);
    const buildPathUri = await this.getBuildPathUri();

    if (buildModePathUri) {
      await this.fileService.delete(buildModePathUri, { recursive: true });
    }

    if (buildPathUri) {
      const files = await this.fileService.resolve(buildPathUri);
      if (files.children) {
        for (const child of files.children) {
          if (child.name.endsWith('.a')) {
            this.fileService.delete(child.resource);
          }
        }
      }
    }

    this.isCleaning = false;
    this.setBuildFolderExists(buildMode, false);

    if (this.isQueued) {
      this.isQueued = false;
      this.commandService.executeCommand(VesBuildCommands.BUILD.id, true);
    }
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
        detail: `   ${nls.localize('vuengine/build/modes/betaDescription', 'Includes selected asserts, for testing the performance on hardware.')}`,
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

  async getDefaultRomUri(): Promise<URI | undefined> {
    await this.workspaceService.ready;
    const workspaceRootUri = this.workspaceService.tryGetRoots()[0]?.resource;
    if (!workspaceRootUri) {
      return;
    }

    return workspaceRootUri
      .resolve('build')
      .resolve('output.vb');
  }

  async getBuildModeRomUri(buildMode: BuildMode): Promise<URI | undefined> {
    await this.workspaceService.ready;
    const workspaceRootUri = this.workspaceService.tryGetRoots()[0]?.resource;
    if (!workspaceRootUri) {
      return;
    }

    return workspaceRootUri
      .resolve('build')
      .resolve(buildMode.toLowerCase())
      .resolve(`output-${buildMode.toLowerCase()}.vb`);
  }
}
