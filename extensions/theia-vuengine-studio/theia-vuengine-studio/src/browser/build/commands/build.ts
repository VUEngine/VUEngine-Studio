import { isWindows } from "@theia/core";
import { PreferenceService, StorageService } from "@theia/core/lib/browser";
import URI from "@theia/core/lib/common/uri";
import { FileService } from "@theia/filesystem/lib/browser/file-service";
import { WorkspaceService } from "@theia/workspace/lib/browser";
import { cpus } from "os";
import { join as joinPath } from "path";
import { VesProcessService } from "../../../common/process-service-protocol";
import { convertoToEnvPath, getOs, getResourcesPath, getRomPath, getWorkspaceRoot } from "../../common/functions";
import { VesStateModel } from "../../common/vesStateModel";
import { VesProcessWatcher } from "../../services/process-service/process-watcher";
import { VesBuildDumpElfPreference, VesBuildEngineCorePathPreference, VesBuildEnginePluginsPathPreference, VesBuildModePreference, VesBuildPedanticWarningsPreference } from "../preferences";

export async function buildCommand(
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

  if (vesState.buildStatus.active) {
    vesProcessService.killProcess(vesState.buildStatus.processId);
  } else {
    build(fileService, preferenceService, storageService, vesProcessService, vesProcessWatcher, vesState);
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
  const workspaceRoot = getWorkspaceRoot()
  const buildMode = preferenceService.get(VesBuildModePreference.id) as string;
  const dumpElf = preferenceService.get(VesBuildDumpElfPreference.id) as boolean;
  const pedanticWarnings = preferenceService.get(VesBuildPedanticWarningsPreference.id) as boolean;
  const engineCorePath = await getEngineCorePath(fileService, preferenceService);
  const enginePluginsPath = await getEnginePluginsPath(fileService, preferenceService);
  const compilerPath = getCompilerPath();

  let makefile = convertoToEnvPath(preferenceService, joinPath(workspaceRoot, "makefile"));
  if (!await fileService.exists(new URI(makefile))) {
    makefile = convertoToEnvPath(preferenceService, joinPath(engineCorePath, "makefile-game"));
  }

  const romUri = new URI(getRomPath());
  if (fileService.exists(romUri)) {
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
      args: ["-R", "a+x", joinPath(compilerPath, "bin")]
    });
    vesProcessService.launchProcess({
      command: "chmod",
      args: ["-R", "a+x", joinPath(engineCorePath, "lib", "compiler", "preprocessor")]
    });
  }

  // fix line endings of preprocessor scripts
  // note: should no longer be necessary due to .gitattributes directive
  //preCallMake = 'find "' + convertoToEnvPath(engineCorePath) + 'lib/compiler/preprocessor/" -name "*.sh" -exec sed -i -e "s/$(printf \'\\r\')//" {} \\; ';

  const { processManagerId } = await vesProcessService.launchProcess({
    command: "make",
    args: [
      "all",
      "-e", `TYPE=${buildMode.toLowerCase()}`,
      "-e", `PATH=${joinPath(compilerPath, "bin")}:${process.env.PATH}`,
      "-f", makefile,
      "-C", convertoToEnvPath(preferenceService, workspaceRoot),
    ],
    options: {
      cwd: workspaceRoot,
      env: {
        "DUMP_ELF": dumpElf ? 1 : 0,
        "ENGINE_FOLDER": convertoToEnvPath(preferenceService, engineCorePath),
        "LC_ALL": "C",
        "MAKE_JOBS": getThreads(),
        "PLUGINS_FOLDER": convertoToEnvPath(preferenceService, enginePluginsPath),
        "PRINT_PEDANTIC_WARNINGS": pedanticWarnings ? 1 : 0,
      }
    },
  });

  vesProcessWatcher.onExit(({ pId }) => {
    if (processManagerId === pId) {
      vesState.resetBuildStatus();
    }
  });

  vesState.buildStatus = {
    active: true,
    processId: processManagerId,
    progress: 0,
    log: {
      startTimestamp: Date.now(),
      log: [],
    },
  };

  monitorBuild(vesProcessWatcher, vesState);
}

async function monitorBuild(
  vesProcessWatcher: VesProcessWatcher,
  vesState: VesStateModel
) {
  vesProcessWatcher.onData(({ pId, data }) => {
    if (vesState.buildStatus.processId === pId) {
      vesState.pushBuildLogLine({
        text: data,
        timestamp: Date.now(),
      });
    }
  });
}

export function abortBuild(vesProcessService: VesProcessService, vesState: VesStateModel) {
  vesProcessService.killProcess(vesState.buildStatus.processId);
  vesState.resetBuildStatus();
}

async function getEngineCorePath(fileService: FileService, preferenceService: PreferenceService) {
  const defaultPath = joinPath(getResourcesPath(), "vuengine", "vuengine-core");
  const customPath = preferenceService.get(VesBuildEngineCorePathPreference.id) as string;

  return customPath && await fileService.exists(new URI(customPath))
    ? customPath
    : defaultPath;
}

async function getEnginePluginsPath(fileService: FileService, preferenceService: PreferenceService) {
  const defaultPath = joinPath(getResourcesPath(), "vuengine", "vuengine-plugins");
  const customPath = preferenceService.get(VesBuildEnginePluginsPathPreference.id) as string;

  return customPath && await fileService.exists(new URI(customPath))
    ? customPath
    : defaultPath;
}

function getCompilerPath() {
  return joinPath(getResourcesPath(), "binaries", "vuengine-studio-tools", getOs(), "gcc");
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