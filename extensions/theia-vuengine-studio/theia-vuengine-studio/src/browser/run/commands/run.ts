import { PreferenceService } from "@theia/core/lib/browser";
import { CommandService, isWindows } from "@theia/core/lib/common";
import { TerminalService } from "@theia/terminal/lib/browser/base/terminal-service";
import { WorkspaceService } from "@theia/workspace/lib/browser";
import { join as joinPath } from "path";
import { VesBuildCommand } from "../../build/commands";
import { getOs, getResourcesPath, getRomPath } from "../../common";
import { VesStateModel } from "../../common/vesStateModel";

type EmulatorConfig = {
  name: string;
  path: string;
  args: string;
};

export async function runCommand(
  commandService: CommandService,
  preferenceService: PreferenceService,
  terminalService: TerminalService,
  vesState: VesStateModel,
  workspaceService: WorkspaceService
) {
  vesState.onDidChangeOutputRomExists(outputRomExists => {
    if (outputRomExists && vesState.isRunQueued) {
      vesState.isRunQueued = false;
      run(preferenceService, terminalService, workspaceService);
    }
  })

  if (vesState.outputRomExists) {
    run(preferenceService, terminalService, workspaceService);
  } else {
    commandService.executeCommand(VesBuildCommand.id);
    vesState.isRunQueued = true;
  }
}

async function run(
  preferenceService: PreferenceService,
  terminalService: TerminalService,
  workspaceService: WorkspaceService
) {
  const emulatorConfigs: EmulatorConfig[] = preferenceService.get("emulators.emulators") ?? [];

  // TODO: choose user selected emulator (or first one if none or no valid one selected)
  const defaultEmulator: EmulatorConfig = {
    ...emulatorConfigs[0],
    path: emulatorConfigs[0].path.replace("%MEDNAFEN%", joinPath(
      getResourcesPath(),
      "binaries",
      "vuengine-studio-tools",
      getOs(),
      "mednafen",
      isWindows ? "mednafen.exe" : "mednafen"
    )),
    args: emulatorConfigs[0].args.replace("%ROM%", `"${getRomPath(workspaceService)}"`),
  };

  const fixPermissions = isWindows ? "" : `chmod a+x "${defaultEmulator.path}" && `;

  const terminalId = "vuengine-run";
  const terminalWidget = terminalService.getById(terminalId) || await terminalService.newTerminal({
    title: "Run",
    id: terminalId
  });
  await terminalWidget.start();
  terminalWidget.clearOutput();
  //await new Promise(resolve => setTimeout(resolve, 1000));
  terminalWidget.sendText(`${fixPermissions}"${defaultEmulator.path}" ${defaultEmulator.args}\n`);
  terminalService.open(terminalWidget);
}
