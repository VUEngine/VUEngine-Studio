import { injectable, inject, postConstruct } from "inversify";
import { cpus } from "os";
import { join as joinPath } from "path";
import { CommandService, isWindows } from "@theia/core";
import { PreferenceService, StorageService } from "@theia/core/lib/browser";
import URI from "@theia/core/lib/common/uri";
import { FileService } from "@theia/filesystem/lib/browser/file-service";
import { WorkspaceService } from "@theia/workspace/lib/browser";
import { VesProcessService } from "../../../common/process-service-protocol";
import { VesCommonFunctions } from "../../common/common-functions";
import { VesState } from "../../common/ves-state";
import { VesProcessWatcher } from "../../services/process-service/process-watcher";
import { VesBuildCommands } from "../build-commands";
import { VesBuildPrefs } from "../build-preferences";
import { BuildLogLineType, BuildMode, BuildResult } from "../build-types";

@injectable()
export class VesBuildBuildCommand {
  @inject(CommandService) protected readonly commandService: CommandService;
  @inject(FileService) protected readonly fileService: FileService;
  @inject(PreferenceService) protected readonly preferenceService: PreferenceService;
  @inject(StorageService) protected readonly storageService: StorageService;
  @inject(VesCommonFunctions) protected readonly commonFunctions: VesCommonFunctions;
  @inject(VesProcessService) protected readonly vesProcessService: VesProcessService;
  @inject(VesProcessWatcher) protected readonly vesProcessWatcher: VesProcessWatcher;
  @inject(VesState) protected readonly vesState: VesState;
  @inject(WorkspaceService) protected readonly workspaceService: WorkspaceService;

  @postConstruct()
  protected init(): void {
    this.bindEvents();
  }

  async execute() {
    if (!this.workspaceService.opened) {
      return;
    }

    if (!this.vesState.buildStatus.active) {
      this.build();
    } else {
      this.commandService.executeCommand(
        VesBuildCommands.OPEN_WIDGET.id,
        !this.vesState.buildStatus.active
      );
    }
  }

  abortBuild() {
    this.vesProcessService.killProcess(this.vesState.buildStatus.processManagerId);
    this.vesState.resetBuildStatus(BuildResult.aborted);
  }

  protected async build() {
    const workspaceRoot = this.commonFunctions.getWorkspaceRoot();
    const buildMode = this.preferenceService.get(VesBuildPrefs.BUILD_MODE.id) as string;
    const dumpElf = this.preferenceService.get(VesBuildPrefs.DUMP_ELF.id) as boolean;
    const pedanticWarnings = this.preferenceService.get(VesBuildPrefs.PEDANTIC_WARNINGS.id) as boolean;
    const engineCorePath = await this.getEngineCorePath();
    const enginePluginsPath = await this.getEnginePluginsPath();
    const compilerPath = this.getCompilerPath();
    const plugins = await this.getPlugins();

    const makefile = await this.getMakefilePath(workspaceRoot, engineCorePath);

    const romUri = new URI(this.commonFunctions.getRomPath());
    if (await this.fileService.exists(romUri)) {
      this.fileService.delete(romUri);
    }

    // Support for building through WSL
    // let shellPath = "";
    // let shellArgs = [""];
    // if (isWindows) {
    //   const enableWsl = this.preferenceService.get(VesBuildEnableWslPreference.id);
    //   if (enableWsl) {
    //     shellPath = process.env.windir + '\\System32\\wsl.exe';
    //   } else {
    //     shellPath = joinPath(getResourcesPath(), "binaries", "vuengine-studio-tools", "win", "msys", "usr", "bin", "bash.exe");
    //     shellArgs = ['--login'];
    //   }
    // }

    await this.fixPermissions();

    const { processManagerId, processId } = await this.vesProcessService.launchProcess({
      command: "make",
      args: [
        "all",
        "-e", `TYPE=${buildMode.toLowerCase()}`,
        "-f", makefile,
        "-C", this.commonFunctions.convertoToEnvPath(workspaceRoot),
      ],
      options: {
        cwd: workspaceRoot,
        env: {
          DUMP_ELF: dumpElf ? 1 : 0,
          ENGINE_FOLDER: this.commonFunctions.convertoToEnvPath(engineCorePath),
          LC_ALL: "C",
          MAKE_JOBS: this.getThreads(),
          PATH:
            process.env.PATH + ":" +
            joinPath(compilerPath, "bin") + ":" +
            joinPath(compilerPath, "libexec", "gcc", "v810", "4.7.4") + ":" +
            joinPath(compilerPath, "v810", "bin"),
          PLUGINS_FOLDER: this.commonFunctions.convertoToEnvPath(enginePluginsPath),
          PRINT_PEDANTIC_WARNINGS: pedanticWarnings ? 1 : 0,
        },
      },
    });

    this.vesState.buildStatus = {
      active: true,
      processManagerId: processManagerId,
      processId: processId,
      progress: 0,
      log: [],
      buildMode: this.preferenceService.get(VesBuildPrefs.BUILD_MODE.id) as BuildMode,
      step: "Building",
      plugins: plugins.length,
      stepsDone: 0,
    };
  }

  protected async getMakefilePath(
    workspaceRoot: string,
    engineCorePath: string
  ) {
    let makefilePath = this.commonFunctions.convertoToEnvPath(
      joinPath(workspaceRoot, "makefile")
    );
    if (!(await this.fileService.exists(new URI(makefilePath)))) {
      makefilePath = this.commonFunctions.convertoToEnvPath(
        joinPath(engineCorePath, "makefile-game")
      );
    }

    return makefilePath;
  }

  protected bindEvents() {
    this.vesProcessWatcher.onError(({ pId }) => {
      if (this.vesState.buildStatus.processManagerId === pId) {
        this.vesState.resetBuildStatus(BuildResult.failed);
      }
    });

    this.vesProcessWatcher.onExit(({ pId, event }) => {
      if (this.vesState.buildStatus.processManagerId === pId) {
        this.vesState.resetBuildStatus(event.code === 0
          ? BuildResult.done
          : BuildResult.failed
        );
      }
    });

    this.vesProcessWatcher.onData(({ pId, data }) => {
      if (this.vesState.buildStatus.processManagerId === pId) {
        this.vesState.pushBuildLogLine({
          ...this.parseBuildOutput(data),
          timestamp: Date.now(),
        });
      }
    });
  }

  /**
   * Give executables respective permission on UNIX systems.
   * Must be executed before every build to ensure permissions are right,
   * even right after reconfiguring engine paths.
   */
  protected async fixPermissions() {
    const engineCorePath = await this.getEngineCorePath();
    const compilerPath = this.getCompilerPath();

    if (!isWindows) {
      await Promise.all([
        this.vesProcessService.launchProcess({
          command: "chmod",
          args: ["-R", "a+x", joinPath(compilerPath, "bin")],
        }),
        this.vesProcessService.launchProcess({
          command: "chmod",
          args: ["-R", "a+x", joinPath(compilerPath, "libexec")],
        }),
        this.vesProcessService.launchProcess({
          command: "chmod",
          args: ["-R", "a+x", joinPath(compilerPath, "v810", "bin")],
        }),
        this.vesProcessService.launchProcess({
          command: "chmod",
          args: ["-R", "a+x", joinPath(engineCorePath, "lib", "compiler", "preprocessor"),
          ],
        }),
      ]);
    }
  }

  protected parseBuildOutput(data: string) {
    const text = data.trim();
    const textLowerCase = text.toLowerCase();
    let type = BuildLogLineType.Normal;

    if (textLowerCase.startsWith("starting build")) {
      type = BuildLogLineType.Headline;
    } else if (textLowerCase.startsWith("build finished")) {
      type = BuildLogLineType.Headline;
      this.vesState.buildStatus.progress = 100;
    } else if (
      textLowerCase.startsWith("preprocessing ") ||
      textLowerCase.startsWith("building ")
    ) {
      type = BuildLogLineType.Headline;
      this.vesState.buildStatus.step = text;
      this.vesState.buildStatus.stepsDone++;
      this.vesState.buildStatus.progress = Math.floor(
        (this.vesState.buildStatus.stepsDone * 100) /
        (this.vesState.buildStatus.plugins * 2 + 2)
      );
    } else if (
      (textLowerCase.startsWith("make") && !textLowerCase.startsWith("make jobs"))
      || textLowerCase.includes("error: ")
    ) {
      type = BuildLogLineType.Error;
    } else if (textLowerCase.includes("no such file or directory")) {
      type = BuildLogLineType.Error;
    } else if (textLowerCase.includes("warning: ")) {
      type = BuildLogLineType.Warning;
    }

    return { text, type };
  }

  protected async getEngineCorePath() {
    const defaultPath = joinPath(
      this.commonFunctions.getResourcesPath(),
      "vuengine",
      "vuengine-core"
    );
    const customPath = this.preferenceService.get(
      VesBuildPrefs.ENGINE_CORE_PATH.id
    ) as string;

    return customPath && (await this.fileService.exists(new URI(customPath)))
      ? customPath
      : defaultPath;
  }

  protected async getEnginePluginsPath() {
    const defaultPath = joinPath(
      this.commonFunctions.getResourcesPath(),
      "vuengine",
      "vuengine-plugins"
    );
    const customPath = this.preferenceService.get(
      VesBuildPrefs.ENGINE_PLUGINS_PATH.id
    ) as string;

    return customPath && (await this.fileService.exists(new URI(customPath)))
      ? customPath
      : defaultPath;
  }

  protected getCompilerPath() {
    return joinPath(
      this.commonFunctions.getResourcesPath(),
      "binaries",
      "vuengine-studio-tools",
      this.commonFunctions.getOs(),
      "gcc"
    );
  }

  // protected getMsysPath() {
  //   return joinPath(getResourcesPath(), "binaries", "vuengine-studio-tools", "win", "msys");
  // }

  protected getThreads() {
    let threads = cpus().length;
    if (threads > 2) {
      threads--;
    }

    return threads;
  }

  protected async getPlugins() {
    let plugins = [];

    // get project's plugins
    try {
      const configFileUri = new URI(
        joinPath(
          this.commonFunctions.getWorkspaceRoot(),
          ".vuengine",
          "plugins.json"
        )
      );
      const configFileContents = await this.fileService.readFile(configFileUri);
      plugins = JSON.parse(configFileContents.value.toString());
    } catch (e) { }

    // for each of the project's plugins, get it's dependencies
    // TODO: we only search one level deep here, recurse instead
    plugins.map(async (pluginName: string) => {
      const pluginFileUri = new URI(
        joinPath(
          await this.getEnginePluginsPath(),
          ...pluginName.split("/"),
          ".vuengine",
          "plugins.json"
        )
      );

      try {
        const pluginFileContents = await this.fileService.readFile(
          pluginFileUri
        );
        JSON.parse(pluginFileContents.value.toString()).map(
          (plugin: string) => {
            plugins.push(plugin);
          }
        );
      } catch (e) { }
    });

    // remove duplicates and return
    return [...new Set(plugins)];
  }
}
