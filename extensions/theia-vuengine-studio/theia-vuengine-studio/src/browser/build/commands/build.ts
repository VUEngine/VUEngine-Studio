import { PreferenceService } from "@theia/core/lib/browser";
import URI from "@theia/core/lib/common/uri";
import { FileService } from "@theia/filesystem/lib/browser/file-service";
import { TerminalService } from "@theia/terminal/lib/browser/base/terminal-service";
import { cpus } from "os";
import { join as joinPath } from "path";
import { VesProcessService } from "../../../common/process-service-protocol";
import { convertoToEnvPath, getOs, getResourcesPath, getWorkspaceRoot } from "../../common";
import { VesStateModel } from "../../common/vesStateModel";
import { VesBuildDumpElfPreference, VesBuildEngineCorePathPreference, VesBuildEnginePluginsPathPreference, VesBuildModePreference, VesBuildPedanticWarningsPreference } from "../preferences";

export async function buildCommand(
  fileService: FileService,
  preferenceService: PreferenceService,
  terminalService: TerminalService,
  vesProcessService: VesProcessService,
  vesState: VesStateModel
) {
  if (!vesState.isBuilding) {
    build(fileService, preferenceService, terminalService, vesState);
  }
}

async function build(
  fileService: FileService,
  preferenceService: PreferenceService,
  terminalService: TerminalService,
  vesState: VesStateModel
) {
  const buildMode = preferenceService.get(VesBuildModePreference.id) as string;
  const dumpElf = preferenceService.get(VesBuildDumpElfPreference.id) as boolean;
  const pedanticWarnings = preferenceService.get(VesBuildPedanticWarningsPreference.id) as boolean;
  const engineCorePath = await getEngineCorePath(fileService, preferenceService);
  const enginePluginsPath = await getEnginePluginsPath(fileService, preferenceService);
  const compilerPath = getCompilerPath();
  const workingDir = convertoToEnvPath(
    preferenceService,
    getWorkspaceRoot()
  );
  const v810path = convertoToEnvPath(preferenceService, joinPath(compilerPath, "bin"));
  const workspaceRoot = getWorkspaceRoot()

  let makefile = convertoToEnvPath(
    preferenceService,
    joinPath(getWorkspaceRoot(), "makefile")
  );
  if (!await fileService.exists(new URI(makefile))) {
    makefile = convertoToEnvPath(
      preferenceService,
      joinPath(engineCorePath, "makefile-game")
    );
  }

  const exports = [`-e TYPE=${buildMode.toLowerCase()}`];
  if (dumpElf) {
    exports.push("DUMP_ELF=1");
  }
  if (pedanticWarnings) {
    exports.push("PRINT_PEDANTIC_WARNINGS=1");
  }

  exports.push(`MAKE_JOBS=${getThreads()}`);
  exports.push("LC_ALL=C");
  exports.push(`ENGINE_FOLDER="${convertoToEnvPath(preferenceService, engineCorePath)}"`);
  exports.push(`PLUGINS_FOLDER="${convertoToEnvPath(preferenceService, enginePluginsPath)}"`);

  // fix line endings of preprocessor scripts
  // note: should no longer be necessary due to .gitattributes directive
  //preCallMake = 'find "' + convertoToEnvPath(engineCorePath) + 'lib/compiler/preprocessor/" -name "*.sh" -exec sed -i -e "s/$(printf \'\\r\')//" {} \\; && ' + preCallMake;

  vesState.isBuilding = true;

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

  const terminalId = "vuengine-build";
  const terminalWidget = terminalService.getById(terminalId) || await terminalService.newTerminal({
    title: "Build",
    id: terminalId,
    //shellPath,
    //shellArgs,
  });
  await terminalWidget.start();
  terminalWidget.clearOutput();
  //await new Promise(resolve => setTimeout(resolve, 1000));
  terminalWidget.sendText(`cd "${workspaceRoot}" && export PATH="${v810path}":$PATH && make all ${exports.join(" ")} -f "${makefile}" -C "${workingDir}" \n`);
  terminalService.open(terminalWidget);
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
  return joinPath(getResourcesPath(), "binaries", getOs(), "gcc");
}

// function getMsysPath() {
//   return joinPath(getResourcesPath(), "binaries", "win", "msys");
// }

function getThreads() {
  let threads = cpus().length;
  if (threads > 2) {
    threads--;
  }

  return threads;
}