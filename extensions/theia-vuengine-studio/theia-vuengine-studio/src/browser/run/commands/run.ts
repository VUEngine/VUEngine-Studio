import { basename, dirname, join as joinPath, sep } from "path";
import { PreferenceService } from "@theia/core/lib/browser";
import { CommandService, isWindows } from "@theia/core/lib/common";
import { TerminalService } from "@theia/terminal/lib/browser/base/terminal-service";
import { VesBuildCommand } from "../../build/commands";
import { getOs, getResourcesPath, getRomPath } from "../../common/functions";
import { VesStateModel } from "../../common/vesStateModel";
import { VesRunDefaultEmulatorPreference, VesRunEmulatorConfigsPreference } from "../preferences";
import { EmulatorConfig } from "../types";
import { VesProcessService } from "../../../common/process-service-protocol";
import { VesProcessWatcher } from "../../services/process-service/process-watcher";
import { VesEmulatorContribution } from "../widget/emulator-view";

export async function runCommand(
  commandService: CommandService,
  preferenceService: PreferenceService,
  terminalService: TerminalService,
  vesEmulator: VesEmulatorContribution,
  vesProcessService: VesProcessService,
  vesProcessWatcher: VesProcessWatcher,
  vesState: VesStateModel,
) {
  if (vesState.isRunQueued) {
    vesState.isRunQueued = false;
    return;
  } else if (vesState.isRunning) {
    vesEmulator.openView({ activate: true, reveal: true });
    return;
  }

  vesState.onDidChangeOutputRomExists(outputRomExists => {
    if (outputRomExists && vesState.isRunQueued) {
      vesState.isRunQueued = false;
      vesEmulator.openView({ activate: true, reveal: true });
      return;
      run(preferenceService, terminalService, vesProcessService, vesProcessWatcher, vesState);
    }
  })

  if (vesState.outputRomExists) {
    vesEmulator.openView({ activate: true, reveal: true });
    return;
    run(preferenceService, terminalService, vesProcessService, vesProcessWatcher, vesState);
  } else {
    commandService.executeCommand(VesBuildCommand.id);
    vesState.isRunQueued = true;
  }
}

async function run(
  preferenceService: PreferenceService,
  terminalService: TerminalService,
  vesProcessService: VesProcessService,
  vesProcessWatcher: VesProcessWatcher,
  vesState: VesStateModel,
) {
  const defaultEmulatorConfig = getDefaultEmulatorConfig(preferenceService);
  if (!defaultEmulatorConfig) return;

  const emulatorPath = defaultEmulatorConfig.path;
  const emulatorArgs = defaultEmulatorConfig.args.replace("%ROM%", getRomPath()).split(" ");

  // fix permissions
  // TODO: do this only once on app startup
  if (!isWindows) {
    vesProcessService.launchProcess({
      command: "chmod",
      args: ["a+x", emulatorPath]
    });
  }

  const { terminalProcessId, processManagerId } = await vesProcessService.launchProcess({
    command: "." + sep + basename(emulatorPath),
    args: emulatorArgs,
    options: {
      cwd: dirname(emulatorPath),
    },
  });

  const terminalWidget = terminalService.getById(getTerminalId()) || await terminalService.newTerminal({
    title: "Run",
    id: getTerminalId(),
  });
  await terminalWidget.start(terminalProcessId);
  terminalWidget.clearOutput();

  vesProcessWatcher.onExit(({ pId }) => {
    if (processManagerId === pId) {
      vesState.isRunning = 0;
    }
  });

  vesState.isRunning = processManagerId;
}

function getTerminalId(): string {
  return "ves-run";
}

// function openTerminal(terminalService: TerminalService) {
//   const terminalWidget = terminalService.getById(getTerminalId())
//   if (terminalWidget) terminalService.open(terminalWidget);
// }

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
  const emulatorConfigs: EmulatorConfig[] = preferenceService.get(VesRunEmulatorConfigsPreference.id) ?? [];

  const effectiveEmulatorConfigs = emulatorConfigs.length > 0
    ? emulatorConfigs
    : VesRunEmulatorConfigsPreference.property.default;

  return effectiveEmulatorConfigs.map((emulatorConfig: EmulatorConfig) => {
    return {
      ...emulatorConfig,
      path: emulatorConfig.path
        .replace("%MEDNAFEN%", joinPath(
          getResourcesPath(),
          "binaries",
          "vuengine-studio-tools",
          getOs(),
          "mednafen",
          isWindows ? "mednafen.exe" : "mednafen"
        )),
    };
  });
}