import { PreferenceService } from "@theia/core/lib/browser";
import { TerminalService } from "@theia/terminal/lib/browser/base/terminal-service";
import { WorkspaceService } from "@theia/workspace/lib/browser";
import { existsSync } from "fs";
import { cpus } from "os";
import { join as joinPath } from "path";
import { convertoToEnvPath, getOs, getResourcesPath, getWorkspaceRoot } from "../../common";
import { VesStateModel } from "../../common/vesStateModel";

export async function buildCommand(
  preferenceService: PreferenceService,
  terminalService: TerminalService,
  vesStateModel: VesStateModel,
  workspaceService: WorkspaceService
) {
  if (!vesStateModel.isBuilding) {
    build(preferenceService, terminalService, vesStateModel, workspaceService);
  }
}

async function build(
  preferenceService: PreferenceService,
  terminalService: TerminalService,
  vesStateModel: VesStateModel,
  workspaceService: WorkspaceService
) {
  const buildMode = preferenceService.get("build.buildMode");
  const dumpElf = preferenceService.get("build.dumpElf");
  const pedanticWarnings = preferenceService.get("build.pedanticWarnings");
  const engineCorePath = getEngineCorePath();
  const enginePluginsPath = getEnginePluginsPath();
  const compilerPath = getCompilerPath();
  const workingDir = convertoToEnvPath(
    preferenceService,
    getWorkspaceRoot(workspaceService)
  );
  const v810path = convertoToEnvPath(preferenceService, joinPath(compilerPath, "bin"));
  const workspaceRoot = getWorkspaceRoot(workspaceService)

  let makefile = convertoToEnvPath(
    preferenceService,
    joinPath(getWorkspaceRoot(workspaceService), "makefile")
  );
  if (!existsSync(makefile)) {
    makefile = convertoToEnvPath(
      preferenceService,
      joinPath(engineCorePath, "makefile-game")
    );
  }

  const exports = [`-e TYPE=${buildMode}`];
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

  vesStateModel.isBuilding = true;

  const terminalId = "vuengine-build";
  const terminalWidget = terminalService.getById(terminalId) || await terminalService.newTerminal({
    title: "Build",
    id: terminalId
  });
  await terminalWidget.start();
  terminalWidget.clearOutput();
  //await new Promise(resolve => setTimeout(resolve, 1000));
  terminalWidget.sendText(`cd "${workspaceRoot}" && export PATH="${v810path}":$PATH && make all ${exports.join(" ")} -f "${makefile}" -C "${workingDir}" \n`);
  terminalService.open(terminalWidget);
}

function getEngineCorePath() {
  return joinPath(getResourcesPath(), "vuengine", "vuengine-core");
}

function getEnginePluginsPath() {
  return joinPath(getResourcesPath(), "vuengine", "vuengine-plugins");
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