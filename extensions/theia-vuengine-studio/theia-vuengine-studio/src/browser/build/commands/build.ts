import { isWindows } from "@theia/core";
import { PreferenceService } from "@theia/core/lib/browser";
import { TerminalService } from "@theia/terminal/lib/browser/base/terminal-service";
import { TerminalWidgetOptions } from "@theia/terminal/lib/browser/base/terminal-widget";
import { WorkspaceService } from "@theia/workspace/lib/browser";
import { existsSync } from "fs";
import { join as joinPath } from "path";
import {
  convertoToEnvPath,
  getEngineCorePath,
  getEnginePluginsPath,
  getCompilerPath,
  getWorkspaceRoot,
  getThreads,
} from "../../common";

export async function buildCommand(
  preferenceService: PreferenceService,
  terminalService: TerminalService,
  workspaceService: WorkspaceService
) {
  build(preferenceService, terminalService, workspaceService);
}

async function build(
  preferenceService: PreferenceService,
  terminalService: TerminalService,
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
  const v810path = convertoToEnvPath(
    preferenceService,
    joinPath(compilerPath, "bin:$PATH")
  );
  const env = {
    ENGINE_FOLDER: convertoToEnvPath(preferenceService, engineCorePath),
    PLUGINS_FOLDER: convertoToEnvPath(preferenceService, enginePluginsPath),
    MAKE_JOBS: getThreads() + "",
    LC_ALL: "C",
  };
  const preCallMake = "export PATH=" + v810path + " && ";
  const enableWsl = preferenceService.get("build.enableWsl");

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

  const exports = ["-e TYPE=" + buildMode];
  if (dumpElf) {
    exports.push("DUMP_ELF=1");
  }
  if (pedanticWarnings) {
    exports.push("PRINT_PEDANTIC_WARNINGS=1");
  }

  if (isWindows && enableWsl) {
    exports.push("MAKE_JOBS=" + getThreads());
    exports.push("LC_ALL=C");
    exports.push(
      "ENGINE_FOLDER=" + convertoToEnvPath(preferenceService, engineCorePath)
    );
    exports.push(
      "PLUGINS_FOLDER=" +
        convertoToEnvPath(preferenceService, enginePluginsPath)
    );

    // fix line endings of preprocessor scripts
    // note: should no longer be necessary due to .gitattributes directive
    //preCallMake = 'find "' + convertoToEnvPath(engineCorePath) + 'lib/compiler/preprocessor/" -name "*.sh" -exec sed -i -e "s/$(printf \'\\r\')//" {} \\; && ' + preCallMake;
  }

  const terminalWidgetOptions: TerminalWidgetOptions = {
    title: "Build",
    env: env,
  };
  const terminalWidget = await terminalService.newTerminal(
    terminalWidgetOptions
  );
  terminalWidget.start();
  terminalWidget.sendText(
    preCallMake +
      "make all " +
      exports.join(" ") +
      " -f " +
      makefile +
      " -C " +
      workingDir
  );
  terminalService.open(terminalWidget);
}
