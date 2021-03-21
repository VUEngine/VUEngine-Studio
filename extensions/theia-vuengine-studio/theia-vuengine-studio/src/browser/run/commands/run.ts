import { basename, dirname, sep } from "path";
import { PreferenceService } from "@theia/core/lib/browser";
import { CommandService, isWindows } from "@theia/core/lib/common";
import { VesBuildCommand } from "../../build/commands";
import { getRomPath } from "../../common/functions";
import { VesStateModel } from "../../common/vesStateModel";
import { VesRunDefaultEmulatorPreference, VesRunEmulatorConfigsPreference } from "../preferences";
import { DEFAULT_EMULATOR, EmulatorConfig } from "../types";
import { VesProcessService } from "../../../common/process-service-protocol";
import { VesProcessWatcher } from "../../services/process-service/process-watcher";
import { VesEmulatorContribution } from "../widget/emulator-view";

export async function runCommand(
  commandService: CommandService,
  preferenceService: PreferenceService,
  vesEmulator: VesEmulatorContribution,
  vesProcessService: VesProcessService,
  vesProcessWatcher: VesProcessWatcher,
  vesState: VesStateModel,
) {
  if (vesState.isRunQueued) {
    vesState.isRunQueued = false;
    return;
  } else if (vesState.isRunning) {
    run(preferenceService, vesEmulator, vesProcessService, vesProcessWatcher, vesState);
    return;
  }

  vesState.onDidChangeOutputRomExists(outputRomExists => {
    if (outputRomExists && vesState.isRunQueued) {
      vesState.isRunQueued = false;
      run(preferenceService, vesEmulator, vesProcessService, vesProcessWatcher, vesState);
    }
  })

  if (vesState.outputRomExists) {
    run(preferenceService, vesEmulator, vesProcessService, vesProcessWatcher, vesState);
  } else {
    commandService.executeCommand(VesBuildCommand.id);
    vesState.isRunQueued = true;
  }
}

async function run(
  preferenceService: PreferenceService,
  vesEmulator: VesEmulatorContribution,
  vesProcessService: VesProcessService,
  vesProcessWatcher: VesProcessWatcher,
  vesState: VesStateModel,
) {
  const defaultEmulatorConfig = getDefaultEmulatorConfig(preferenceService);

  if (defaultEmulatorConfig === DEFAULT_EMULATOR) {
    vesEmulator.openView({ activate: true, reveal: true });
  } else {
    const emulatorPath = defaultEmulatorConfig.path;
    const emulatorArgs = defaultEmulatorConfig.args.replace("%ROM%", getRomPath()).split(" ");

    if (!isWindows) {
      vesProcessService.launchProcess({
        command: "chmod",
        args: ["a+x", emulatorPath]
      });
    }

    const { processManagerId } = await vesProcessService.launchProcess({
      command: "." + sep + basename(emulatorPath),
      args: emulatorArgs,
      options: {
        cwd: dirname(emulatorPath),
      },
    });

    vesProcessWatcher.onExit(({ pId }) => {
      if (processManagerId === pId) {
        vesState.isRunning = 0;
      }
    });

    vesState.isRunning = processManagerId;
  }
}

export function getDefaultEmulatorConfig(preferenceService: PreferenceService): EmulatorConfig {
  const emulatorConfigs: EmulatorConfig[] = getEmulatorConfigs(preferenceService);
  const defaultEmulatorName: string = preferenceService.get(VesRunDefaultEmulatorPreference.id) as string;

  let defaultEmulatorConfig = DEFAULT_EMULATOR;
  for (const emulatorConfig of emulatorConfigs) {
    if (emulatorConfig.name === defaultEmulatorName) {
      defaultEmulatorConfig = emulatorConfig;
    }
  }

  return defaultEmulatorConfig;
}

export function getEmulatorConfigs(preferenceService: PreferenceService) {
  const customEmulatorConfigs: EmulatorConfig[] = preferenceService.get(VesRunEmulatorConfigsPreference.id) ?? [];

  const emulatorConfigs = [
    DEFAULT_EMULATOR,
    ...customEmulatorConfigs,
  ]

  return emulatorConfigs;
}