import { basename, dirname, sep } from "path";
import { OpenerService, PreferenceService } from "@theia/core/lib/browser";
import { CommandService, isWindows } from "@theia/core/lib/common";
import { VesBuildCommand } from "../../build/commands";
import { getRomPath } from "../../common/functions";
import { VesStateModel } from "../../common/vesStateModel";
import { VesRunDefaultEmulatorPreference, VesRunEmulatorConfigsPreference } from "../preferences";
import { DEFAULT_EMULATOR, EmulatorConfig } from "../types";
import { VesProcessService } from "../../../common/process-service-protocol";
import URI from "@theia/core/lib/common/uri";

export async function runInEmulatorCommand(
  commandService: CommandService,
  openerService: OpenerService,
  preferenceService: PreferenceService,
  vesProcessService: VesProcessService,
  vesState: VesStateModel,
) {
  if (vesState.isRunQueued) {
    vesState.isRunQueued = false;
  } else if (vesState.outputRomExists) {
    run(openerService, preferenceService, vesProcessService);
  } else {
    vesState.onDidChangeOutputRomExists(outputRomExists => {
      if (outputRomExists && vesState.isRunQueued) {
        vesState.isRunQueued = false;
        run(openerService, preferenceService, vesProcessService);
      }
    })
    vesState.isRunQueued = true;
    commandService.executeCommand(VesBuildCommand.id);
  }
}

async function run(
  openerService: OpenerService,
  preferenceService: PreferenceService,
  vesProcessService: VesProcessService,
) {
  const defaultEmulatorConfig = getDefaultEmulatorConfig(preferenceService);

  if (defaultEmulatorConfig === DEFAULT_EMULATOR) {
    const romUri = new URI(getRomPath());
    const opener = await openerService.getOpener(romUri);
    await opener.open(romUri);
    console.log(opener);
  } else {
    const emulatorPath = defaultEmulatorConfig.path;
    const emulatorArgs = defaultEmulatorConfig.args.replace("%ROM%", getRomPath()).split(" ");

    if (!isWindows) {
      vesProcessService.launchProcess({
        command: "chmod",
        args: ["a+x", emulatorPath]
      });
    }

    await vesProcessService.launchProcess({
      command: "." + sep + basename(emulatorPath),
      args: emulatorArgs,
      options: {
        cwd: dirname(emulatorPath),
      },
    });
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