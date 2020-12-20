import { PreferenceService } from "@theia/core/lib/browser";
import { CommandService, isWindows } from "@theia/core/lib/common";
import { TerminalService } from "@theia/terminal/lib/browser/base/terminal-service";
import { WorkspaceService } from "@theia/workspace/lib/browser";
import { existsSync } from "fs";
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
  const romPath = getRomPath(workspaceService);
  if (existsSync(romPath)) {
    run(preferenceService, terminalService, workspaceService);
  } else {
    commandService.executeCommand(VesBuildCommand.id);
    // TODO: use FileWatcher instead?
    vesState.enqueueRun(setInterval(() => {
      if (existsSync(getRomPath(workspaceService))) {
        vesState.unqueueRun();
        run(preferenceService, terminalService, workspaceService);
      }
    }, 500));
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
