import { join as joinPath } from "path";
import { PreferenceService } from "@theia/core/lib/browser";
import { CommandService, isWindows } from "@theia/core/lib/common";
import { TerminalService } from "@theia/terminal/lib/browser/base/terminal-service";
import { VesBuildCommand } from "../../build/commands";
import { getOs, getResourcesPath, getRomPath } from "../../common";
import { VesStateModel } from "../../common/vesStateModel";
import { VesRunDefaultEmulatorPreference, VesRunEmulatorConfigsPreference } from "../preferences";
import { EmulatorConfig } from "../types";

export async function runCommand(
  commandService: CommandService,
  preferenceService: PreferenceService,
  terminalService: TerminalService,
  vesState: VesStateModel
) {
  if (vesState.isRunQueued) {
    vesState.isRunQueued = false;
    return;
  }

  vesState.onDidChangeOutputRomExists(outputRomExists => {
    if (outputRomExists && vesState.isRunQueued) {
      vesState.isRunQueued = false;
      run(preferenceService, terminalService);
    }
  })

  if (vesState.outputRomExists) {
    run(preferenceService, terminalService);
  } else {
    commandService.executeCommand(VesBuildCommand.id);
    vesState.isRunQueued = true;
  }
}

async function run(
  preferenceService: PreferenceService,
  terminalService: TerminalService
) {
  const defaultEmulatorConfig = getDefaultEmulatorConfig(preferenceService);
  if (!defaultEmulatorConfig) return;

  const emulatorPath = `"${defaultEmulatorConfig.path.replace("%MEDNAFEN%", joinPath(
    getResourcesPath(),
    "binaries",
    "vuengine-studio-tools",
    getOs(),
    "mednafen",
    isWindows ? "mednafen.exe" : "mednafen"
  ))}"`;
  const emulatorArgs = ` ${defaultEmulatorConfig.args.replace("%ROM%", `"${getRomPath()}"`)}`;
  const fixPermissions = isWindows ? "" : `chmod a+x "${emulatorPath}" && `;

  const terminalId = "vuengine-run";
  const terminalWidget = terminalService.getById(terminalId) || await terminalService.newTerminal({
    title: "Run",
    id: terminalId
  });
  await terminalWidget.start();
  terminalWidget.clearOutput();
  //await new Promise(resolve => setTimeout(resolve, 1000));
  terminalWidget.sendText(`${fixPermissions}${emulatorPath}${emulatorArgs}\n`);
  terminalService.open(terminalWidget);
}

export function getDefaultEmulatorConfig(preferenceService: PreferenceService): EmulatorConfig {
  const emulatorConfigs: EmulatorConfig[] = getEmulatorConfigs(preferenceService);
  const defaultEmulatorName: string = preferenceService.get(VesRunDefaultEmulatorPreference.id) as string;

  let defaultEmulatorConfig = emulatorConfigs[0];
  for (const emulatorConfig of emulatorConfigs) {
    if (emulatorConfig.name === defaultEmulatorName) {
      defaultEmulatorConfig = emulatorConfig;
    }
  }

  return defaultEmulatorConfig;
}

export function getEmulatorConfigs(preferenceService: PreferenceService) {
  const emulatorConfigs: EmulatorConfig[] | undefined =
    preferenceService.get(VesRunEmulatorConfigsPreference.id) ?? [];

  return emulatorConfigs.length > 0
    ? emulatorConfigs
    : VesRunEmulatorConfigsPreference.property.default
}