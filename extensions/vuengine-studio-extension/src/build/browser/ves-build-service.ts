import { join as joinPath } from 'path';
import { cpus } from 'os';
import { CommandService, isOSX, isWindows } from '@theia/core';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { ApplicationShell, PreferenceService } from '@theia/core/lib/browser';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { FrontendApplicationState, FrontendApplicationStateService } from '@theia/core/lib/browser/frontend-application-state';
import URI from '@theia/core/lib/common/uri';
import { Emitter } from '@theia/core/shared/vscode-languageserver-protocol';
import { FileChangesEvent } from '@theia/filesystem/lib/common/files';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import { ProcessOptions } from '@theia/process/lib/node';
import { EnvVariablesServer } from '@theia/core/lib/common/env-variables';
import { VesProcessService } from '../../process/common/ves-process-service-protocol';
import { VesProcessWatcher } from '../../process/browser/ves-process-service-watcher';
import { VesProjectsService } from '../../projects/browser/ves-projects-service';
import { VesPluginsService } from '../../plugins/browser/ves-plugins-service';
import { BuildLogLine, BuildLogLineType, BuildMode, BuildResult, BuildStatus } from './ves-build-types';
import { VesBuildPreferenceIds } from './ves-build-preferences';
import { VesBuildCommands } from './ves-build-commands';

interface BuildFolderFlags {
  [key: string]: boolean;
};

@injectable()
export class VesBuildService {
  @inject(ApplicationShell)
  protected readonly shell: ApplicationShell;
  @inject(CommandService)
  protected readonly commandService: CommandService;
  @inject(EnvVariablesServer)
  protected readonly envVariablesServer: EnvVariablesServer;
  @inject(FileService)
  protected fileService: FileService;
  @inject(FrontendApplicationStateService)
  protected readonly frontendApplicationStateService: FrontendApplicationStateService;
  @inject(PreferenceService)
  protected readonly preferenceService: PreferenceService;
  @inject(VesProcessService)
  protected readonly vesProcessService: VesProcessService;
  @inject(VesPluginsService)
  protected readonly vesPluginsService: VesPluginsService;
  @inject(VesProcessWatcher)
  protected readonly vesProcessWatcher: VesProcessWatcher;
  @inject(VesProjectsService)
  protected readonly vesProjectsService: VesProjectsService;
  @inject(WorkspaceService)
  protected readonly workspaceService: WorkspaceService;

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

  // output rom exists
  protected readonly onDidChangeOutputRomExistsEmitter = new Emitter<boolean>();
  readonly onDidChangeOutputRomExists = this.onDidChangeOutputRomExistsEmitter.event;
  protected _outputRomExists: boolean = false;
  set outputRomExists(flag: boolean) {
    this._outputRomExists = flag;
    this.onDidChangeOutputRomExistsEmitter.fire(this._outputRomExists);
  }
  get outputRomExists(): boolean {
    return this._outputRomExists;
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

  // build status
  protected _buildStatus: BuildStatus = {
    active: false,
    processManagerId: -1,
    processId: -1,
    progress: -1,
    log: [],
    buildMode: BuildMode.Beta,
    step: '',
    romSize: 0,
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
  async resetBuildStatus(step?: string): Promise<void> {
    const newBuildStatus = {
      ...this.buildStatus,
      active: false,
    };

    if (step) {
      newBuildStatus.step = step;
    }

    this.buildStatus = newBuildStatus;

    if (step !== BuildResult.done) {
      // TODO
      // this.isExportQueued = false;
      // this.isRunQueued = false;
      // this.isFlashQueued = false;
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
                .exists(new URI(this.getBuildPath(buildMode)))
                .then((exists: boolean) => {
                  this.setBuildFolderExists(buildMode, exists);
                });
            }
          }

          // TODO: fileService.exists does not seem to work on Windows
          this.fileService
            .exists(new URI(this.getRomPath()))
            .then((exists: boolean) => {
              this.outputRomExists = exists;
            });
        }
      }
    );

    await this.resetBuildStatus();

    // watch for file changes
    // TODO: watch only respective folders
    // const cleanPath = joinPath(getWorkspaceRoot(), 'build', BuildMode.Release)
    // const test = this.fileService.watch(new URI(cleanPath));
    this.fileService.onDidFilesChange((fileChangesEvent: FileChangesEvent) => {
      for (const buildMode in BuildMode) {
        if (fileChangesEvent.contains(new URI(this.getBuildPath(buildMode)))) {
          this.fileService
            .exists(new URI(this.getBuildPath(buildMode)))
            .then((exists: boolean) => {
              this.setBuildFolderExists(buildMode, exists);
            });
        }
      }

      if (fileChangesEvent.contains(new URI(this.getRomPath()))) {
        this.fileService
          .exists(new URI(this.getRomPath()))
          .then((exists: boolean) => {
            this.outputRomExists = exists;
          });
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

  async doBuild(): Promise<void> {
    if (!this.workspaceService.opened) {
      return;
    }

    if (!this.buildStatus.active) {
      this.build();
    } else {
      this.commandService.executeCommand(VesBuildCommands.TOGGLE_WIDGET.id);
    }
  }

  protected bindEvents(): void {
    // @ts-ignore
    this.vesProcessWatcher.onError(async ({ pId }) => {
      if (this.buildStatus.processManagerId === pId) {
        await this.resetBuildStatus(BuildResult.failed);
      }
    });

    // @ts-ignore
    this.vesProcessWatcher.onExit(async ({ pId, event }) => {
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
        this.pushBuildLogLine({
          ...this.parseBuildOutput(data),
          timestamp: Date.now(),
        });
      }
    };

    this.vesProcessWatcher.onOutputStreamData(onData);
    this.vesProcessWatcher.onErrorStreamData(onData);

    this.onDidChangeOutputRomExists(async outputRomExists => {
      if (outputRomExists) {
        const outputRom = await this.fileService.readFile(new URI(this.getRomPath()));
        this.buildStatus.romSize = outputRom.size;
      } else {
        this.buildStatus.romSize = 0;
      }

      // trigger change event
      this.buildStatus = this.buildStatus;
    });
  }

  protected async build(): Promise<void> {
    const log: BuildLogLine[] = [];
    let processManagerId = 0;
    let processId = 0;
    let active = false;
    let step = 'Building';

    try {

      const buildParams = await this.getBuildProcessParams();
      await this.deleteRom();
      await this.fixPermissions();
      ({ processManagerId, processId } = await this.vesProcessService.launchProcess(buildParams));
      active = true;

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
      romSize: 0,
    };
  }

  protected async getBuildProcessParams(): Promise<ProcessOptions> {
    const workspaceRoot = this.vesProjectsService.getWorkspaceRoot();
    const buildMode = (this.preferenceService.get(VesBuildPreferenceIds.BUILD_MODE) as string).toLowerCase();
    const dumpElf = this.preferenceService.get(VesBuildPreferenceIds.DUMP_ELF) as boolean;
    const pedanticWarnings = this.preferenceService.get(VesBuildPreferenceIds.PEDANTIC_WARNINGS) as boolean;
    const engineCorePath = await this.getEngineCorePath();
    const enginePluginsPath = await this.vesPluginsService.getEnginePluginsPath();
    const compilerPath = await this.getCompilerPath();
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
        '-f', makefile,
      ];

      return {
        command: await this.getMsysBashPath(),
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
          ENGINE_FOLDER: this.convertoToEnvPath(engineCorePath)
            .replace(/\s/g, '\\ '), // escape whitespaces
          LC_ALL: 'C',
          MAKE_JOBS: this.getThreads(),
          PATH: [joinPath(compilerPath, 'bin'), process.env.PATH].join(':'),
          PLUGINS_FOLDER: this.convertoToEnvPath(enginePluginsPath)
            .replace(/\s/g, '\\ '), // escape whitespaces
          PRINT_PEDANTIC_WARNINGS: pedanticWarnings ? 1 : 0,
        },
      },
    };
  }

  protected checkPathsForSpaces(workspaceRoot: string, engineCorePath: string, enginePluginsPath: string): void {
    if (workspaceRoot.includes('%20')) {
      throw new Error('Error: Your workspace path must not contain spaces.');
    } else if (engineCorePath.includes(' ')) {
      throw new Error('Error: Your engine path must not contain spaces.');
    } else if (enginePluginsPath.includes(' ')) {
      throw new Error('Error: Your plugins path must not contain spaces.');
    }
  }

  protected async deleteRom(): Promise<void> {
    const romUri = new URI(this.getRomPath());
    if (await this.fileService.exists(romUri)) {
      this.fileService.delete(romUri);
    }
  }

  protected parseBuildOutput(data: string): { text: string, type: BuildLogLineType } {
    const text = data.trim();
    const textLowerCase = text.toLowerCase();
    let type = BuildLogLineType.Normal;

    const headlineRegex = /\((\d+)\/(\d+)\) (preprocessing (.+)|building (.+))/gi;
    const headlineMatches: string[] = [];
    let m;
    while ((m = headlineRegex.exec(text)) !== null) { /* eslint-disable-line */
      if (m.index === headlineRegex.lastIndex) {
        headlineRegex.lastIndex++;
      }
      m.forEach((match, groupIndex) => {
        headlineMatches[groupIndex] = match;
      });
    }

    if (textLowerCase.startsWith('starting build')) {
      type = BuildLogLineType.Headline;
    } else if (headlineMatches.length) {
      type = BuildLogLineType.Headline;
      this.buildStatus.step = headlineMatches[3] as unknown as string;
      this.buildStatus.progress = this.computeProgress(headlineMatches);
    } else if (textLowerCase.startsWith('build finished')) {
      type = BuildLogLineType.Headline;
      this.buildStatus.progress = 100;
    } else if (textLowerCase.includes('error: ') ||
      textLowerCase.includes('] Error ') ||
      textLowerCase.includes(' not found') ||
      textLowerCase.includes('no such file or directory') ||
      textLowerCase.includes(' No rule to make target')) {
      type = BuildLogLineType.Error;
    } else if (textLowerCase.includes('warning: ')) {
      type = BuildLogLineType.Warning;
    }

    return { text, type };
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

  getBuildFolder(): string {
    return joinPath(this.vesProjectsService.getWorkspaceRoot(), 'build');
  }

  getBuildPath(buildMode?: string): string {
    const buildFolder = this.getBuildFolder();

    return buildMode
      ? joinPath(buildFolder, buildMode.toLowerCase())
      : buildFolder;
  }

  getRomPath(): string {
    return joinPath(this.getBuildPath(), 'output.vb');
  }

  async abortBuild(): Promise<void> {
    this.vesProcessService.killProcess(this.buildStatus.processManagerId);
    await this.resetBuildStatus(BuildResult.aborted);
  }

  protected async getResourcesPath(): Promise<string> {
    const envVar = await this.envVariablesServer.getValue('THEIA_APP_PROJECT_PATH');
    const applicationPath = envVar && envVar.value ? envVar.value : '';
    return applicationPath;
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

  protected async getEngineCorePath(): Promise<string> {
    const defaultPath = joinPath(
      await this.getResourcesPath(),
      'vuengine',
      'vuengine-core'
    );
    const customPath = this.preferenceService.get(
      VesBuildPreferenceIds.ENGINE_CORE_PATH
    ) as string;

    return customPath && (await this.fileService.exists(new URI(customPath)))
      ? customPath
      : defaultPath;
  }

  protected async getCompilerPath(): Promise<string> {
    return joinPath(
      await this.getResourcesPath(),
      'binaries',
      'vuengine-studio-tools',
      this.getOs(),
      'gcc'
    );
  }

  protected async getMsysBashPath(): Promise<string> {
    return joinPath(
      await this.getResourcesPath(),
      'binaries',
      'vuengine-studio-tools',
      this.getOs(),
      'msys',
      'usr',
      'bin',
      'bash.exe'
    );
  }

  protected getOs(): string {
    return isWindows ? 'win' : isOSX ? 'osx' : 'linux';
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

    const engineCorePath = await this.getEngineCorePath();
    const compilerPath = await this.getCompilerPath();

    await Promise.all([
      this.vesProcessService.launchProcess({
        command: 'chmod',
        args: ['-R', 'a+x', joinPath(compilerPath, 'bin')],
      }),
      this.vesProcessService.launchProcess({
        command: 'chmod',
        args: ['-R', 'a+x', joinPath(compilerPath, 'libexec')],
      }),
      this.vesProcessService.launchProcess({
        command: 'chmod',
        args: ['-R', 'a+x', joinPath(compilerPath, 'v810', 'bin')],
      }),
      this.vesProcessService.launchProcess({
        command: 'chmod',
        args: ['-R', 'a+x', joinPath(engineCorePath, 'lib', 'compiler', 'preprocessor'),
        ],
      }),
    ]);
  }

  bytesToMbit(bytes: number): number {
    return bytes / 1024 / 128;
  }
}
