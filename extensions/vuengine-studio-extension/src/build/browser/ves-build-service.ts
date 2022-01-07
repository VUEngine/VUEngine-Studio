import { CommandService, isWindows } from '@theia/core';
import { ApplicationShell, LabelProvider, PreferenceService } from '@theia/core/lib/browser';
import { FrontendApplicationState, FrontendApplicationStateService } from '@theia/core/lib/browser/frontend-application-state';
import URI from '@theia/core/lib/common/uri';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { Emitter } from '@theia/core/shared/vscode-languageserver-protocol';
import { FileChangeType } from '@theia/filesystem/lib/browser';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { FileChangesEvent } from '@theia/filesystem/lib/common/files';
import { ProcessOptions } from '@theia/process/lib/node';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import { cpus } from 'os';
import { VesCommonService } from '../../branding/browser/ves-common-service';
import { VesPluginsPathsService } from '../../plugins/browser/ves-plugins-paths-service';
import { VesProcessWatcher } from '../../process/browser/ves-process-service-watcher';
import { VesProcessService, VesProcessType } from '../../process/common/ves-process-service-protocol';
import { VesBuildCommands } from './ves-build-commands';
import { VesBuildPathsService } from './ves-build-paths-service';
import { VesBuildPreferenceIds } from './ves-build-preferences';
import { BuildLogLine, BuildLogLineFileLink, BuildLogLineType, BuildMode, BuildResult, BuildStatus, GccMatchedProblem } from './ves-build-types';

interface BuildFolderFlags {
  [key: string]: boolean;
};

@injectable()
export class VesBuildService {
  @inject(ApplicationShell)
  protected readonly shell: ApplicationShell;
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
  @inject(VesBuildPathsService)
  protected readonly vesBuildPathsService: VesBuildPathsService;
  @inject(VesCommonService)
  protected readonly vesCommonService: VesCommonService;
  @inject(VesProcessService)
  protected readonly vesProcessService: VesProcessService;
  @inject(VesPluginsPathsService)
  protected readonly vesPluginsPathsService: VesPluginsPathsService;
  @inject(VesProcessWatcher)
  protected readonly vesProcessWatcher: VesProcessWatcher;
  @inject(WorkspaceService)
  protected readonly workspaceService: WorkspaceService;

  isWslInstalled: boolean = false;

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
    await this.determineIsWslInstalled();
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
        this.commandService.executeCommand(VesBuildCommands.TOGGLE_WIDGET.id);
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
    await this.workspaceService.ready;
    const workspaceRootUri = this.workspaceService.tryGetRoots()[0].resource;
    const romUri = workspaceRootUri.resolve('build').resolve('output.vb');
    return this.fileService.exists(romUri);
  }

  protected async determineIsWslInstalled(): Promise<void> {
    if (!isWindows) {
      this.isWslInstalled = false;
      return;
    }

    const checkProcess = await this.vesProcessService.launchProcess(VesProcessType.Raw, {
      command: 'wsl.exe',
      args: ['--list', '--verbose']
    });

    await new Promise<void>((resolve, reject) => {
      this.vesProcessWatcher.onDidReceiveOutputStreamData(({ pId, data }) => {
        if (checkProcess.processManagerId === pId) {
          data = data.replace(/\0/g, ''); // clean of NUL characters
          this.isWslInstalled = data.includes('NAME') && data.includes('STATE') && data.includes('VERSION');
          resolve();
        }
      });
      this.vesProcessWatcher.onDidExitProcess(({ pId }) => {
        if (checkProcess.processManagerId === pId) {
          resolve();
        }
      });
    });
  }

  protected async determineRomSize(): Promise<void> {
    await this.workspaceService.ready;
    const workspaceRootUri = this.workspaceService.tryGetRoots()[0].resource;
    const romUri = workspaceRootUri.resolve('build').resolve('output.vb');
    if (await this.fileService.exists(romUri)) {
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
              this.fileService
                .exists(await this.getBuildPathUri(buildMode as BuildMode))
                .then((exists: boolean) => {
                  this.setBuildFolderExists(buildMode, exists);
                });
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
          if (fileChangesEvent.contains(buildPathUri, FileChangeType.ADDED)) {
            this.setBuildFolderExists(buildMode, true);
          } else if (fileChangesEvent.contains(buildPathUri, FileChangeType.DELETED)) {
            this.setBuildFolderExists(buildMode, false);
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
      await this.determineRomSize();
    });

    this.onDidFailBuild(async () => {
      this.romSize = 0;
      this.commandService.executeCommand(VesBuildCommands.TOGGLE_WIDGET.id, true);
    });
  }

  protected async build(): Promise<void> {
    const log: BuildLogLine[] = [];
    let processManagerId = 0;
    let processId = 0;
    let active = false;
    let step = 'Building';
    const startDate = new Date();
    const endDate = undefined;

    try {
      const buildParams = await this.getBuildProcessParams();
      await this.deleteRom();
      await this.fixPermissions();
      ({ processManagerId, processId } = await this.vesProcessService.launchProcess(VesProcessType.Raw, buildParams));
      active = true;
      this.onDidStartBuildEmitter.fire();

    } catch (e) {
      let error = 'An error occured';

      if (typeof e === 'string') {
        error = e;
      } else if (e instanceof Error) {
        error = e.message;
      }

      log.push({
        text: error,
        timestamp: Date.now(),
        type: BuildLogLineType.Error,
      });
      step = 'failed';

      this.onDidFailBuildEmitter.fire();
    }

    this.buildStatus = {
      active,
      processManagerId,
      processId,
      progress: 0,
      log,
      buildMode: this.preferenceService.get(VesBuildPreferenceIds.BUILD_MODE) as BuildMode,
      step,
      startDate,
      endDate,
    };
  }

  protected async getBuildProcessParams(): Promise<ProcessOptions> {
    await this.workspaceService.ready;
    const workspaceRootUri = this.workspaceService.tryGetRoots()[0].resource;
    const buildMode = (this.preferenceService.get(VesBuildPreferenceIds.BUILD_MODE) as string).toLowerCase();
    const dumpElf = this.preferenceService.get(VesBuildPreferenceIds.DUMP_ELF) as boolean;
    const pedanticWarnings = this.preferenceService.get(VesBuildPreferenceIds.PEDANTIC_WARNINGS) as boolean;
    const engineCoreUri = await this.vesBuildPathsService.getEngineCoreUri();
    const enginePluginsUri = await this.vesPluginsPathsService.getEnginePluginsUri();
    const userPluginsUri = await this.vesPluginsPathsService.getUserPluginsUri();
    const compilerUri = await this.vesBuildPathsService.getCompilerUri(this.isWslInstalled);
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

      if (this.isWslInstalled) {

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
      throw new Error(`Error: Workspace path must not contain spaces. Your workspace path:\n${this.labelProvider.getLongName(workspaceRootUri)}`);
    } else if (/\s/.test(await this.fileService.fsPath(engineCoreUri))) {
      throw new Error(`Error: Engine path must not contain spaces. Your engine path:\n${this.labelProvider.getLongName(engineCoreUri)}`);
    } else if (/\s/.test(await this.fileService.fsPath(enginePluginsUri))) {
      throw new Error(`Error: Plugins path must not contain spaces. Your plugins path:\n${this.labelProvider.getLongName(enginePluginsUri)}`);
    } else if (/\s/.test(await this.fileService.fsPath(userPluginsUri))) {
      throw new Error(`Error: User Plugins path must not contain spaces. Your user plugins path:\n${this.labelProvider.getLongName(userPluginsUri)}`);
    }
  }

  protected async deleteRom(): Promise<void> {
    await this.workspaceService.ready;
    const workspaceRootUri = this.workspaceService.tryGetRoots()[0].resource;
    const romUri = workspaceRootUri.resolve('build').resolve('output.vb');
    if (await this.fileService.exists(romUri)) {
      this.fileService.delete(romUri);
    }
  }

  protected async getBuildPathUri(buildMode?: BuildMode): Promise<URI> {
    await this.workspaceService.ready;
    const workspaceRootUri = this.workspaceService.tryGetRoots()[0].resource;
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
        throw new Error('Error: Could not find a makefile. Tried the following locations:\n' +
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

    if (this.isWslInstalled) {
      envPath = '/mnt' + envPath;
    }

    return envPath;
  }

  protected getThreads(): number {
    let threads = cpus().length;
    if (threads > 2) {
      threads--;
    }

    return threads;
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
    if (isWindows && !this.isWslInstalled) {
      return;
    }

    const engineCorePath = await this.vesBuildPathsService.getEngineCoreUri();
    const compilerUri = await this.vesBuildPathsService.getCompilerUri(this.isWslInstalled);

    await Promise.all([
      this.vesProcessService.launchProcess(VesProcessType.Raw, {
        command: 'chmod',
        args: ['-R', 'a+x', await this.fileService.fsPath(compilerUri.resolve('bin'))],
      }),
      this.vesProcessService.launchProcess(VesProcessType.Raw, {
        command: 'chmod',
        args: ['-R', 'a+x', await this.fileService.fsPath(compilerUri.resolve('libexec'))],
      }),
      this.vesProcessService.launchProcess(VesProcessType.Raw, {
        command: 'chmod',
        args: ['-R', 'a+x', await this.fileService.fsPath(compilerUri.resolve('v810').resolve('bin'))],
      }),
      this.vesProcessService.launchProcess(VesProcessType.Raw, {
        command: 'chmod',
        args: ['-R', 'a+x', await this.fileService.fsPath(engineCorePath.resolve('lib').resolve('compiler').resolve('preprocessor'))],
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

  async clean(buildMode: BuildMode): Promise<void> {
    if (!this.buildFolderExists[buildMode]) {
      return;
    }

    this.isCleaning = true;

    const buildModePathUri = await this.getBuildPathUri(buildMode);
    const buildPathUri = await this.getBuildPathUri();

    await this.fileService.delete(buildModePathUri, { recursive: true });
    const files = await this.fileService.resolve(buildPathUri);
    if (files.children) {
      for (const child of files.children) {
        if (child.name.endsWith('.a')) {
          this.fileService.delete(child.resource);
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
}
