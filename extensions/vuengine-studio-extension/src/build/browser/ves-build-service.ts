import { join as joinPath } from 'path';
import { cpus } from 'os';
import { CommandService, isWindows } from '@theia/core';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { ApplicationShell, PreferenceService } from '@theia/core/lib/browser';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { FrontendApplicationState, FrontendApplicationStateService } from '@theia/core/lib/browser/frontend-application-state';
import URI from '@theia/core/lib/common/uri';
import { Emitter } from '@theia/core/shared/vscode-languageserver-protocol';
import { FileChangeType } from '@theia/filesystem/lib/browser';
import { FileChangesEvent } from '@theia/filesystem/lib/common/files';
import { ProcessOptions } from '@theia/process/lib/node';
import { VesCommonService } from '../../branding/browser/ves-common-service';
import { VesPluginsPathsService } from '../../plugins/browser/ves-plugins-paths-service';
import { VesProcessService, VesProcessType } from '../../process/common/ves-process-service-protocol';
import { VesProcessWatcher } from '../../process/browser/ves-process-service-watcher';
import { BuildLogLine, BuildLogLineFileLink, BuildLogLineType, BuildMode, BuildResult, BuildStatus, GccMatchedProblem } from './ves-build-types';
import { VesBuildPreferenceIds } from './ves-build-preferences';
import { VesBuildCommands } from './ves-build-commands';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import { VesBuildPathsService } from './ves-build-paths-service';

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
  protected readonly onDidBuildStartEmitter = new Emitter<void>();
  readonly onDidBuildStart = this.onDidBuildStartEmitter.event;
  protected readonly onDidBuildFailEmitter = new Emitter<void>();
  readonly onDidBuildFail = this.onDidBuildFailEmitter.event;
  protected readonly onDidBuildSucceedEmitter = new Emitter<void>();
  readonly onDidBuildSucceed = this.onDidBuildSucceedEmitter.event;

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
      this.onDidBuildFailEmitter.fire();
    } else {
      // Wait for up to two seconds for output ROM to have been copied by makefile
      // (The copy command has finished, but the kernel might still be writing out the buffered data.)
      let tries = 0;
      const romExistsCheckInterval = setInterval(async () => {
        if (await this.outputRomExists() || ++tries === 5) {
          clearInterval(romExistsCheckInterval);
          this.onDidBuildSucceedEmitter.fire();
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
    // init flags
    this.frontendApplicationStateService.onStateChanged(
      async (state: FrontendApplicationState) => {
        if (state === 'attached_shell') {
          for (const buildMode in BuildMode) {
            if (BuildMode.hasOwnProperty(buildMode)) {
              this.fileService
                .exists(new URI(this.vesBuildPathsService.getBuildPath(buildMode)))
                .then((exists: boolean) => {
                  this.setBuildFolderExists(buildMode, exists);
                });
            }
          }

          this.determineRomSize();
        }
      }
    );

    await this.resetBuildStatus();

    // watch for file changes
    this.fileService.onDidFilesChange(async (fileChangesEvent: FileChangesEvent) => {
      for (const buildMode in BuildMode) {
        if (BuildMode.hasOwnProperty(buildMode)) {
          const buildPathUri = new URI(this.vesBuildPathsService.getBuildPath(buildMode));
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
    return this.fileService.exists(new URI(this.vesBuildPathsService.getRomPath()));
  }

  protected async determineRomSize(): Promise<void> {
    const romPath = this.vesBuildPathsService.getRomPath();
    const romUri = new URI(romPath);
    if (await this.fileService.exists(romUri)) {
      const outputRom = await this.fileService.resolve(romUri, { resolveMetadata: true });
      this.romSize = outputRom.size;
    } else {
      this.romSize = 0;
    }
  }

  protected bindEvents(): void {
    // @ts-ignore
    this.vesProcessWatcher.onError(async ({ pId }) => {
      if (this.buildStatus.processManagerId === pId) {
        await this.resetBuildStatus(BuildResult.failed);
        this.commandService.executeCommand(VesBuildCommands.TOGGLE_WIDGET.id, true);
      }
    });

    // @ts-ignore
    this.vesProcessWatcher.onExit(async ({ pId, event }) => {
      if (this.buildStatus.processManagerId === pId) {
        await this.resetBuildStatus(event.code === 0
          ? BuildResult.done
          : BuildResult.failed
        );
        if (event.code !== 0) {
          this.commandService.executeCommand(VesBuildCommands.TOGGLE_WIDGET.id, true);
        }
      }
    });

    // @ts-ignore
    const onData = ({ pId, data }) => {
      if (this.buildStatus.processManagerId === pId) {
        this.pushBuildLogLine(this.parseBuildOutput(data));
      }
    };

    this.vesProcessWatcher.onOutputStreamData(onData);
    this.vesProcessWatcher.onErrorStreamData(onData);

    this.onDidBuildSucceed(async () => {
        /* await */ this.determineRomSize();
    });

    this.onDidBuildFail(async () => {
      this.romSize = 0;
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
      this.onDidBuildStartEmitter.fire();

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
    const workspaceRoot = this.vesCommonService.getWorkspaceRoot();
    const buildMode = (this.preferenceService.get(VesBuildPreferenceIds.BUILD_MODE) as string).toLowerCase();
    const dumpElf = this.preferenceService.get(VesBuildPreferenceIds.DUMP_ELF) as boolean;
    const pedanticWarnings = this.preferenceService.get(VesBuildPreferenceIds.PEDANTIC_WARNINGS) as boolean;
    const engineCorePath = await this.vesBuildPathsService.getEngineCorePath();
    const enginePluginsPath = await this.vesPluginsPathsService.getEnginePluginsPath();
    const userPluginsPath = await this.vesPluginsPathsService.getUserPluginsPath();
    const compilerPath = await this.vesBuildPathsService.getCompilerPath();
    const makefile = await this.getMakefilePath(workspaceRoot, engineCorePath);

    // TODO: remove check when https://github.com/VUEngine/VUEngine-Studio/issues/15 is resolved
    this.checkPathsForSpaces(workspaceRoot, engineCorePath, enginePluginsPath);

    if (isWindows) {
      // if (enableWsl) shellPath = process.env.windir + '\\System32\\wsl.exe';

      const args = [
        'cd', this.convertoToEnvPath(workspaceRoot), '&&',
        'export', `PATH=${this.convertoToEnvPath(joinPath(compilerPath, 'bin'))}:$PATH`, '&&',
        'make', 'all',
        '-e', `TYPE=${buildMode}`,
        `ENGINE_FOLDER=${this.convertoToEnvPath(engineCorePath)}`,
        `PLUGINS_FOLDER=${this.convertoToEnvPath(enginePluginsPath)}`,
        `USER_PLUGINS_FOLDER=${this.convertoToEnvPath(userPluginsPath)}`,
        '-f', makefile,
      ];

      return {
        command: await this.vesBuildPathsService.getMsysBashPath(),
        args: [
          '--login',
          '-c', args.join(' '),
        ],
        options: {
          cwd: workspaceRoot,
          env: {
            DUMP_ELF: dumpElf ? 1 : 0,
            LC_ALL: 'C',
            MAKE_JOBS: this.getThreads(),
            PRINT_PEDANTIC_WARNINGS: pedanticWarnings ? 1 : 0,
          },
        },
      };
    }

    return {
      command: 'make',
      args: [
        'all',
        '-e', `TYPE=${buildMode}`,
        '-f', makefile,
        '-C', this.convertoToEnvPath(workspaceRoot),
      ],
      options: {
        cwd: workspaceRoot,
        env: {
          DUMP_ELF: dumpElf ? 1 : 0,
          ENGINE_FOLDER: this.convertoToEnvPath(engineCorePath),
          LC_ALL: 'C',
          MAKE_JOBS: this.getThreads(),
          PATH: [joinPath(compilerPath, 'bin'), process.env.PATH].join(':'),
          PLUGINS_FOLDER: this.convertoToEnvPath(enginePluginsPath),
          USER_PLUGINS_FOLDER: this.convertoToEnvPath(userPluginsPath),
          PRINT_PEDANTIC_WARNINGS: pedanticWarnings ? 1 : 0,
        },
      },
    };
  }

  protected checkPathsForSpaces(workspaceRoot: string, engineCorePath: string, enginePluginsPath: string): void {
    if (workspaceRoot.includes('%20')) {
      throw new Error(`Error: Workspace path must not contain spaces.\nYour workspace path: ${workspaceRoot}`);
    } else if (engineCorePath.includes(' ')) {
      throw new Error(`Error: Engine path must not contain spaces.\nYour engine path: ${engineCorePath}`);
    } else if (enginePluginsPath.includes(' ')) {
      throw new Error(`Error: Plugins path must not contain spaces.\nYour plugins path: ${enginePluginsPath}`);
    }
  }

  protected async deleteRom(): Promise<void> {
    const romUri = new URI(this.vesBuildPathsService.getRomPath());
    if (await this.fileService.exists(romUri)) {
      this.fileService.delete(romUri);
    }
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
        uri: new URI(problem.file),
        line: problem.line,
        column: problem.column,
      };

      const functionReference = text.split(':')[1].trim();
      const errorMessage = problem.message.split(' [-W')[0].trim();
      optimizedText = `${functionReference}:\n${errorMessage[0].toUpperCase()}${errorMessage.slice(1)}.`;
    } else if (textLowerCase.includes('error: ') ||
      textLowerCase.includes('] error ') ||
      textLowerCase.includes(' not found') ||
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
    // GCC problem matcher from https://github.com/microsoft/vscode-cpptools/blob/main/Extension/package.json
    const regEx = /^(.*):(\d+):(\d+):\s+(?:fatal\s+)?(warning|error):\s+(.*)$/gmi;
    let matchedProblem: GccMatchedProblem | undefined;

    const match = regEx.exec(message);
    if (match) {
      matchedProblem = {
        file: match[1],
        line: parseInt(match[2]),
        column: parseInt(match[3]),
        severity: match[4],
        message: match[5],
      };
    }

    return matchedProblem;
  }

  // Converts function names Class_function to Class::function
  protected replaceFunctionNames(name: string): string {
    // TODO: Disabled this because we cannot be sure that what rename is
    // actually a function name. Find a way to make sure it is!
    // return name.replace(/\'([a-zA-Z0-9]*)_([a-zA-Z0-9]*)\'/g, '"$1::$2"');
    return name;
  }

  protected async getMakefilePath(workspaceRoot: string, engineCorePath: string): Promise<string> {
    const gameMakefilePath = this.convertoToEnvPath(joinPath(workspaceRoot, 'makefile'));
    let makefilePath = gameMakefilePath;
    if (!(await this.fileService.exists(new URI(makefilePath)))) {
      const engineMakefilePath = this.convertoToEnvPath(joinPath(engineCorePath, 'makefile-game'));
      makefilePath = engineMakefilePath;
      if (!(await this.fileService.exists(new URI(makefilePath)))) {
        throw new Error(`Error: Could not find a makefile. Tried the following locations:\n1) ${gameMakefilePath}\n2) ${engineMakefilePath}`);
      }
    }

    return makefilePath;
  }

  async abortBuild(): Promise<void> {
    this.vesProcessService.killProcess(this.buildStatus.processManagerId);
    await this.resetBuildStatus(BuildResult.aborted);
  }

  convertoToEnvPath(path: string): string {
    const enableWsl = this.preferenceService.get(VesBuildPreferenceIds.ENABLE_WSL);
    let envPath = path
      .replace(/\\/g, '/')
      .replace(/^[a-zA-Z]:\//, function (x): string {
        return `/${x.substr(0, 1).toLowerCase()}/`;
      });

    if (isWindows && enableWsl) {
      envPath = '/mnt/' + envPath;
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
    if (isWindows) {
      return;
    }

    const engineCorePath = await this.vesBuildPathsService.getEngineCorePath();
    const compilerPath = await this.vesBuildPathsService.getCompilerPath();

    await Promise.all([
      this.vesProcessService.launchProcess(VesProcessType.Raw, {
        command: 'chmod',
        args: ['-R', 'a+x', joinPath(compilerPath, 'bin')],
      }),
      this.vesProcessService.launchProcess(VesProcessType.Raw, {
        command: 'chmod',
        args: ['-R', 'a+x', joinPath(compilerPath, 'libexec')],
      }),
      this.vesProcessService.launchProcess(VesProcessType.Raw, {
        command: 'chmod',
        args: ['-R', 'a+x', joinPath(compilerPath, 'v810', 'bin')],
      }),
      this.vesProcessService.launchProcess(VesProcessType.Raw, {
        command: 'chmod',
        args: ['-R', 'a+x', joinPath(engineCorePath, 'lib', 'compiler', 'preprocessor'),
        ],
      }),
    ]);
  }

  bytesToMbit(bytes: number): number {
    return bytes / 1024 / 128;
  }

  protected getCleanPath(buildMode: BuildMode): string {
    return joinPath(this.vesBuildPathsService.getBuildPath(), buildMode);
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

    const cleanPath = this.getCleanPath(buildMode);
    const buildFolder = this.vesBuildPathsService.getBuildPath();

    await this.fileService.delete(new URI(cleanPath), { recursive: true });
    const files = await this.fileService.resolve(new URI(buildFolder));
    if (files.children) {
      await Promise.all(files.children.map(child => {
        if (child.name.endsWith('.a')) {
          this.fileService.delete(child.resource);
        }
      }));
    }

    this.isCleaning = false;
    this.setBuildFolderExists(buildMode, false);

    if (this.isQueued) {
      this.isQueued = false;
      this.commandService.executeCommand(VesBuildCommands.BUILD.id, true);
    }
  }
}
