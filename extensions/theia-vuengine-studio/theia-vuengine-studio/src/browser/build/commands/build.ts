import { isWindows } from "@theia/core";
import { PreferenceService } from "@theia/core/lib/browser";
import URI from "@theia/core/lib/common/uri";
import { FileService } from "@theia/filesystem/lib/browser/file-service";
import { TerminalService } from "@theia/terminal/lib/browser/base/terminal-service";
import { cpus } from "os";
import { join as joinPath } from "path";
import { VesProcessService } from "../../../common/process-service-protocol";
import { convertoToEnvPath, getOs, getResourcesPath, getRomPath, getWorkspaceRoot } from "../../common/functions";
import { VesStateModel } from "../../common/vesStateModel";
import { VesProcessWatcher } from "../../services/process-service/process-watcher";
import { VesBuildDumpElfPreference, VesBuildEnableWslPreference, VesBuildEngineCorePathPreference, VesBuildEnginePluginsPathPreference, VesBuildModePreference, VesBuildPedanticWarningsPreference } from "../preferences";

export async function buildCommand(
  fileService: FileService,
  preferenceService: PreferenceService,
  terminalService: TerminalService,
  vesProcessService: VesProcessService,
  vesProcessWatcher: VesProcessWatcher,
  vesState: VesStateModel
) {
  if (vesState.isBuilding) {
    vesProcessService.killProcess(vesState.isBuilding);
  } else {
    build(fileService, preferenceService, terminalService, vesProcessService, vesProcessWatcher, vesState);
  }
}

async function build(
  fileService: FileService,
  preferenceService: PreferenceService,
  terminalService: TerminalService,
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

  fileService.delete(new URI(getRomPath()));

  // Support for building through WSL
  let shellPath = "";
  let shellArgs = [""];
  if (isWindows) {
    const enableWsl = preferenceService.get(VesBuildEnableWslPreference.id);
    if (enableWsl) {
      shellPath = process.env.windir + '\\System32\\wsl.exe';
    } else {
      shellPath = joinPath(getResourcesPath(), "binaries", "vuengine-studio-tools", "win", "msys", "usr", "bin", "bash.exe");
      shellArgs = ['--login'];
    }
  }

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

  const { terminalProcessId, processManagerId } = await vesProcessService.launchProcess({
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

  const terminalWidget = terminalService.getById(getTerminalId()) || await terminalService.newTerminal({
    title: "Build",
    id: getTerminalId(),
    shellPath,
    shellArgs,
  });
  await terminalWidget.start(terminalProcessId);
  terminalWidget.clearOutput();
  terminalWidget.onTerminalDidClose(() => {
    // TODO: kill process (if necessary?)
  });
  terminalService.open(terminalWidget);

  vesProcessWatcher.onExit(({ pId }) => {
    if (processManagerId === pId) {
      vesState.isBuilding = 0;
    }
  });

  vesProcessWatcher.onData(({ pId, data }) => {
    if (processManagerId === pId) {
      console.log(data);
    }
  });

  vesState.isBuilding = processManagerId;
}

function getTerminalId(): string {
  return "ves-build";
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