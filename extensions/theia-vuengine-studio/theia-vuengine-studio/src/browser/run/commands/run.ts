import { join as joinPath } from "path";
import { PreferenceService } from "@theia/core/lib/browser";
import { CommandService, isWindows } from "@theia/core/lib/common";
import { TerminalService } from "@theia/terminal/lib/browser/base/terminal-service";
import { VesBuildCommand } from "../../build/commands";
import { getOs, getResourcesPath, getRomPath } from "../../common";
import { VesStateModel } from "../../common/vesStateModel";
import { VesRunDefaultEmulatorPreference, VesRunEmulatorsCustomPreference } from "../preferences";
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

  const fixPermissions = isWindows ? "" : `chmod a+x "${defaultEmulatorConfig.path}" && `;
  const emulatorPath = `"${defaultEmulatorConfig.path}"`;
  const emulatorArgs = ` ${defaultEmulatorConfig.args.replace("%ROM%", `"${getRomPath()}"`)}`;

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
  const defaultEmulatorPath = joinPath(
    getResourcesPath(),
    "binaries",
    "vuengine-studio-tools",
    getOs(),
    "mednafen",
    isWindows ? "mednafen.exe" : "mednafen"
  );

  const emulatorConfigs: EmulatorConfig[] = [
    {
      name: "Mednafen (2D)",
      path: defaultEmulatorPath,
      args: "-'vb.3dmode' 'anaglyph' -'vb.anaglyph.preset' 'disabled' -'vb.anaglyph.lcolor' '0xff0000' -'vb.anaglyph.rcolor' '0x000000' -'vb.xscale' 2 -'vb.yscale' 2 %ROM%",
    },
    {
      name: "Mednafen (Anaglyph)",
      path: defaultEmulatorPath,
      args: "-'vb.3dmode' 'anaglyph' -'vb.anaglyph.preset' 'red_blue' -'vb.anaglyph.lcolor' '0xffba00' -'vb.anaglyph.rcolor' '0x00baff' -'vb.xscale' 2 -'vb.yscale' 2 %ROM%",
    },
  ];

  const userDefinedEmulatorConfigs: EmulatorConfig[] | undefined =
    preferenceService.get(VesRunEmulatorsCustomPreference.id) ?? [];

  return [...emulatorConfigs, ...userDefinedEmulatorConfigs];
}