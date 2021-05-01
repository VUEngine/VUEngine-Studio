import { injectable, inject, postConstruct } from "inversify";
import { cpus } from "os";
import { join as joinPath } from "path";
import { CommandService, isWindows } from "@theia/core";
import { PreferenceService, StorageService } from "@theia/core/lib/browser";
import URI from "@theia/core/lib/common/uri";
import { FileService } from "@theia/filesystem/lib/browser/file-service";
import { WorkspaceService } from "@theia/workspace/lib/browser";
import { VesProcessService } from "../../../common/process-service-protocol";
import {
  convertoToEnvPath,
  getOs,
  getResourcesPath,
  getRomPath,
  getWorkspaceRoot,
} from "../../common/common-functions";
import { VesState } from "../../common/ves-state";
import { VesProcessWatcher } from "../../services/process-service/process-watcher";
import { VesBuildCommands } from "../build-commands";
import { VesBuildPrefs } from "../build-preferences";
import { BuildLogLineType, BuildMode } from "../build-types";

@injectable()
export class VesBuildBuildCommand {
  @inject(CommandService) protected readonly commandService: CommandService;
  @inject(FileService) protected readonly fileService: FileService;
  @inject(PreferenceService) protected readonly preferenceService: PreferenceService;
  @inject(StorageService) protected readonly storageService: StorageService;
  @inject(VesProcessService) protected readonly vesProcessService: VesProcessService;
  @inject(VesProcessWatcher) protected readonly vesProcessWatcher: VesProcessWatcher;
  @inject(VesState) protected readonly vesState: VesState;
  @inject(WorkspaceService) protected readonly workspaceService: WorkspaceService;

  @postConstruct()
  protected init(): void {
    this.bindEvents();
    this.fixPermissions();
  }

  async execute() {
    if (!this.workspaceService.opened) {
      return;
    }

    this.commandService.executeCommand(
      VesBuildCommands.OPEN_WIDGET.id,
      !this.vesState.buildStatus.active
    );

    if (!this.vesState.buildStatus.active) {
      this.build();
    }
  }

  abortBuild() {
    this.vesProcessService.killProcess(this.vesState.buildStatus.processManagerId);
    this.vesState.resetBuildStatus("aborted");
  }

  protected async build() {
    const workspaceRoot = getWorkspaceRoot();
    const buildMode = this.preferenceService.get(VesBuildPrefs.BUILD_MODE.id) as string;
    const dumpElf = this.preferenceService.get(VesBuildPrefs.DUMP_ELF.id) as boolean;
    const pedanticWarnings = this.preferenceService.get(VesBuildPrefs.PEDANTIC_WARNINGS.id) as boolean;
    const engineCorePath = await this.getEngineCorePath();
    const enginePluginsPath = await this.getEnginePluginsPath();
    const compilerPath = this.getCompilerPath();
    const plugins = await this.getPlugins();

    let makefile = convertoToEnvPath(
      this.preferenceService,
      joinPath(workspaceRoot, "makefile")
    );
    if (!(await this.fileService.exists(new URI(makefile)))) {
      makefile = convertoToEnvPath(
        this.preferenceService,
        joinPath(engineCorePath, "makefile-game")
      );
    }

    const romUri = new URI(getRomPath());
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

    // fix line endings of preprocessor scripts
    // note: should no longer be necessary due to .gitattributes directive
    //preCallMake = 'find "' + convertoToEnvPath(engineCorePath) + 'lib/compiler/preprocessor/" -name "*.sh" -exec sed -i -e "s/$(printf \'\\r\')//" {} \\; ';

    const { processManagerId, processId } = await this.vesProcessService.launchProcess(
      {
        command: "make",
        args: [
          "all",
          "-e",
          `TYPE=${buildMode.toLowerCase()}`,
          "-e",
          `PATH=${joinPath(compilerPath, "bin")}:${process.env.PATH}`,
          "-f",
          makefile,
          "-C",
          convertoToEnvPath(this.preferenceService, workspaceRoot),
        ],
        options: {
          cwd: workspaceRoot,
          env: {
            DUMP_ELF: dumpElf ? 1 : 0,
            ENGINE_FOLDER: convertoToEnvPath(this.preferenceService, engineCorePath),
            LC_ALL: "C",
            MAKE_JOBS: this.getThreads(),
            PLUGINS_FOLDER: convertoToEnvPath(
              this.preferenceService,
              enginePluginsPath
            ),
            PRINT_PEDANTIC_WARNINGS: pedanticWarnings ? 1 : 0,
          },
        },
      }
    );

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

  protected bindEvents() {
    this.vesProcessWatcher.onError(({ pId }) => {
      if (this.vesState.buildStatus.processManagerId === pId) {
        this.vesState.resetBuildStatus("failed");
      }
    });

    this.vesProcessWatcher.onExit(({ pId }) => {
      if (this.vesState.buildStatus.processManagerId === pId) {
        //this.vesState.resetBuildStatus("done");
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

  protected async fixPermissions() {
    const engineCorePath = await this.getEngineCorePath();
    const compilerPath = this.getCompilerPath();

    if (!isWindows) {
      this.vesProcessService.launchProcess({
        command: "chmod",
        args: ["-R", "a+x", joinPath(compilerPath, "bin")],
      });
      this.vesProcessService.launchProcess({
        command: "chmod",
        args: [
          "-R",
          "a+x",
          joinPath(engineCorePath, "lib", "compiler", "preprocessor"),
        ],
      });
    }
  }

  protected parseBuildOutput(data: string) {
    let text = data;
    let type = BuildLogLineType.Normal;

    if (data.startsWith("STARTING BUILD")) {
      type = BuildLogLineType.Headline;
    } else if (data.startsWith("BUILD FINISHED")) {
      type = BuildLogLineType.Headline;
      this.vesState.buildStatus.progress = 100;
    } else if (
      data.startsWith("Preprocessing ") ||
      data.startsWith("Building ")
    ) {
      type = BuildLogLineType.Headline;
      this.vesState.buildStatus.step = data.trimEnd();
      this.vesState.buildStatus.stepsDone++;
      this.vesState.buildStatus.progress = Math.floor(
        (this.vesState.buildStatus.stepsDone * 100) /
        (this.vesState.buildStatus.plugins * 2 + 2)
      );
    } else if (data.startsWith("make") || data.includes(" Error ")) {
      type = BuildLogLineType.Error;
    } else if (data.includes("No such file or directory")) {
      type = BuildLogLineType.Error;
    }

    return { text, type };
  }

  protected async getEngineCorePath() {
    const defaultPath = joinPath(getResourcesPath(), "vuengine", "vuengine-core");
    const customPath = this.preferenceService.get(
      VesBuildPrefs.ENGINE_CORE_PATH.id
    ) as string;

    return customPath && (await this.fileService.exists(new URI(customPath)))
      ? customPath
      : defaultPath;
  }

  protected async getEnginePluginsPath() {
    const defaultPath = joinPath(
      getResourcesPath(),
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
      getResourcesPath(),
      "binaries",
      "vuengine-studio-tools",
      getOs(),
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
        joinPath(getWorkspaceRoot(), ".vuengine", "plugins.json")
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
        const pluginFileContents = await this.fileService.readFile(pluginFileUri);
        JSON.parse(pluginFileContents.value.toString()).map((plugin: string) => {
          plugins.push(plugin);
        });
      } catch (e) { }
    });

    // remove duplicates and return
    return [...new Set(plugins)];
  }
}
