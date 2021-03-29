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
} from "../../common/functions";
import { VesStateModel } from "../../common/vesStateModel";
import { VesProcessWatcher } from "../../services/process-service/process-watcher";
import { VesBuildOpenWidgetCommand } from "../commands";
import {
  VesBuildDumpElfPreference,
  VesBuildEngineCorePathPreference,
  VesBuildEnginePluginsPathPreference,
  VesBuildModePreference,
  VesBuildPedanticWarningsPreference,
} from "../preferences";
import { BuildLogLineType, BuildMode } from "../types";

export async function buildCommand(
  commandService: CommandService,
  fileService: FileService,
  preferenceService: PreferenceService,
  storageService: StorageService,
  vesProcessService: VesProcessService,
  vesProcessWatcher: VesProcessWatcher,
  vesState: VesStateModel,
  workspaceService: WorkspaceService
) {
  if (!workspaceService.opened) {
    return;
  }

  commandService.executeCommand(
    VesBuildOpenWidgetCommand.id,
    !vesState.buildStatus.active
  );

  if (!vesState.buildStatus.active) {
    build(
      fileService,
      preferenceService,
      storageService,
      vesProcessService,
      vesProcessWatcher,
      vesState
    );
  }
}

async function build(
  fileService: FileService,
  preferenceService: PreferenceService,
  storageService: StorageService,
  vesProcessService: VesProcessService,
  vesProcessWatcher: VesProcessWatcher,
  vesState: VesStateModel
) {
  const workspaceRoot = getWorkspaceRoot();
  const buildMode = preferenceService.get(VesBuildModePreference.id) as string;
  const dumpElf = preferenceService.get(
    VesBuildDumpElfPreference.id
  ) as boolean;
  const pedanticWarnings = preferenceService.get(
    VesBuildPedanticWarningsPreference.id
  ) as boolean;
  const engineCorePath = await getEngineCorePath(
    fileService,
    preferenceService
  );
  const enginePluginsPath = await getEnginePluginsPath(
    fileService,
    preferenceService
  );
  const compilerPath = getCompilerPath();

  let makefile = convertoToEnvPath(
    preferenceService,
    joinPath(workspaceRoot, "makefile")
  );
  if (!(await fileService.exists(new URI(makefile)))) {
    makefile = convertoToEnvPath(
      preferenceService,
      joinPath(engineCorePath, "makefile-game")
    );
  }

  const romUri = new URI(getRomPath());
  if (await fileService.exists(romUri)) {
    fileService.delete(romUri);
  }

  // Support for building through WSL
  // let shellPath = "";
  // let shellArgs = [""];
  // if (isWindows) {
  //   const enableWsl = preferenceService.get(VesBuildEnableWslPreference.id);
  //   if (enableWsl) {
  //     shellPath = process.env.windir + '\\System32\\wsl.exe';
  //   } else {
  //     shellPath = joinPath(getResourcesPath(), "binaries", "vuengine-studio-tools", "win", "msys", "usr", "bin", "bash.exe");
  //     shellArgs = ['--login'];
  //   }
  // }

  // fix permissions
  // TODO: do this only once on app startup
  if (!isWindows) {
    vesProcessService.launchProcess({
      command: "chmod",
      args: ["-R", "a+x", joinPath(compilerPath, "bin")],
    });
    vesProcessService.launchProcess({
      command: "chmod",
      args: [
        "-R",
        "a+x",
        joinPath(engineCorePath, "lib", "compiler", "preprocessor"),
      ],
    });
  }

  // fix line endings of preprocessor scripts
  // note: should no longer be necessary due to .gitattributes directive
  //preCallMake = 'find "' + convertoToEnvPath(engineCorePath) + 'lib/compiler/preprocessor/" -name "*.sh" -exec sed -i -e "s/$(printf \'\\r\')//" {} \\; ';

  const { processManagerId, processId } = await vesProcessService.launchProcess(
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
        convertoToEnvPath(preferenceService, workspaceRoot),
      ],
      options: {
        cwd: workspaceRoot,
        env: {
          DUMP_ELF: dumpElf ? 1 : 0,
          ENGINE_FOLDER: convertoToEnvPath(preferenceService, engineCorePath),
          LC_ALL: "C",
          MAKE_JOBS: getThreads(),
          PLUGINS_FOLDER: convertoToEnvPath(
            preferenceService,
            enginePluginsPath
          ),
          PRINT_PEDANTIC_WARNINGS: pedanticWarnings ? 1 : 0,
        },
      },
    }
  );

  vesProcessWatcher.onError(({ pId }) => {
    if (processManagerId === pId) {
      vesState.resetBuildStatus("failed");
    }
  });

  vesProcessWatcher.onExit(({ pId }) => {
    if (processManagerId === pId) {
      //vesState.resetBuildStatus("done");
    }
  });

  const plugins = await getPlugins(fileService, preferenceService);

  vesState.buildStatus = {
    active: true,
    processManagerId: processManagerId,
    processId: processId,
    progress: 0,
    log: [],
    buildMode: preferenceService.get(VesBuildModePreference.id) as BuildMode,
    step: "Building",
    plugins: plugins.length,
    stepsDone: 0,
  };

  monitorBuild(vesProcessWatcher, vesState);
}

async function monitorBuild(
  vesProcessWatcher: VesProcessWatcher,
  vesState: VesStateModel
) {
  vesProcessWatcher.onData(({ pId, data }) => {
    if (vesState.buildStatus.processManagerId === pId) {
      vesState.pushBuildLogLine({
        ...parseBuildOutput(vesState, data),
        timestamp: Date.now(),
      });
    }
  });
}

function parseBuildOutput(vesState: VesStateModel, data: string) {
  let text = data;
  let type = BuildLogLineType.Normal;

  if (data.startsWith("STARTING BUILD")) {
    type = BuildLogLineType.Headline;
  } else if (data.startsWith("BUILD FINISHED")) {
    type = BuildLogLineType.Headline;
    vesState.buildStatus.progress = 100;
  } else if (
    data.startsWith("Preprocessing ") ||
    data.startsWith("Building ")
  ) {
    type = BuildLogLineType.Headline;
    vesState.buildStatus.step = data.trimEnd();
    vesState.buildStatus.stepsDone++;
    vesState.buildStatus.progress = Math.floor(
      (vesState.buildStatus.stepsDone * 100) /
        (vesState.buildStatus.plugins * 2 + 2)
    );
  } else if (data.startsWith("make") || data.includes(" Error ")) {
    type = BuildLogLineType.Error;
  } else if (data.includes("No such file or directory")) {
    type = BuildLogLineType.Error;
  }

  return { text, type };
}

export function abortBuild(
  vesProcessService: VesProcessService,
  vesState: VesStateModel
) {
  vesProcessService.killProcess(vesState.buildStatus.processManagerId);
  vesState.resetBuildStatus("aborted");
}

async function getEngineCorePath(
  fileService: FileService,
  preferenceService: PreferenceService
) {
  const defaultPath = joinPath(getResourcesPath(), "vuengine", "vuengine-core");
  const customPath = preferenceService.get(
    VesBuildEngineCorePathPreference.id
  ) as string;

  return customPath && (await fileService.exists(new URI(customPath)))
    ? customPath
    : defaultPath;
}

async function getEnginePluginsPath(
  fileService: FileService,
  preferenceService: PreferenceService
) {
  const defaultPath = joinPath(
    getResourcesPath(),
    "vuengine",
    "vuengine-plugins"
  );
  const customPath = preferenceService.get(
    VesBuildEnginePluginsPathPreference.id
  ) as string;

  return customPath && (await fileService.exists(new URI(customPath)))
    ? customPath
    : defaultPath;
}

function getCompilerPath() {
  return joinPath(
    getResourcesPath(),
    "binaries",
    "vuengine-studio-tools",
    getOs(),
    "gcc"
  );
}

// function getMsysPath() {
//   return joinPath(getResourcesPath(), "binaries", "vuengine-studio-tools", "win", "msys");
// }

function getThreads() {
  let threads = cpus().length;
  if (threads > 2) {
    threads--;
  }

  return threads;
}

async function getPlugins(
  fileService: FileService,
  preferenceService: PreferenceService
) {
  let plugins = [];

  // get project's plugins
  try {
    const configFileUri = new URI(
      joinPath(getWorkspaceRoot(), ".vuengine", "plugins.json")
    );
    const configFileContents = await fileService.readFile(configFileUri);
    plugins = JSON.parse(configFileContents.value.toString());
  } catch (e) {}

  // for each of the project's plugins, get it's dependencies
  // TODO: we only search one level deep here, recurse instead
  plugins.map(async (pluginName: string) => {
    const pluginFileUri = new URI(
      joinPath(
        await getEnginePluginsPath(fileService, preferenceService),
        ...pluginName.split("/"),
        ".vuengine",
        "plugins.json"
      )
    );

    try {
      const pluginFileContents = await fileService.readFile(pluginFileUri);
      JSON.parse(pluginFileContents.value.toString()).map((plugin: string) => {
        plugins.push(plugin);
      });
    } catch (e) {}
  });

  // remove duplicates and return
  return [...new Set(plugins)];
}
