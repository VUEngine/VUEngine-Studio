import { PreferenceScope, PreferenceService } from "@theia/core/lib/browser";
import { QuickPickItem, QuickPickOptions, QuickPickService } from "@theia/core/lib/common/quick-pick-service";
import { VesRunDefaultEmulatorPreference } from "../preferences";
import { getEmulatorConfigs } from "./run";

export async function selectEmulatorCommand(
  preferenceService: PreferenceService,
  quickPickService: QuickPickService,
) {
  selectEmulator(preferenceService, quickPickService);
}

async function selectEmulator(
  preferenceService: PreferenceService,
  quickPickService: QuickPickService,
) {
  const quickPickOptions: QuickPickOptions = {
    title: "Select default emulator",
    placeholder: "Which of the configured emulators do you want to use to run compiled projects?",
    value: preferenceService.get(VesRunDefaultEmulatorPreference.id),
  };
  const quickPickItems: QuickPickItem<string>[] = [{
    label: "First in list",
    description: " (default)",
    value: "",
  }];

  const emulatorConfigs = getEmulatorConfigs(preferenceService);

  for (const emulatorConfig of emulatorConfigs) {
    quickPickItems.push({
      label: emulatorConfig.name,
      value: emulatorConfig.name,
      description: `(${emulatorConfig.path})`,
      detail: emulatorConfig.args,
    });
  }

  quickPickService.show<string>(quickPickItems, quickPickOptions).then(selection => {
    if (!selection && selection !== "") {
      return;
    }

    preferenceService.set(VesRunDefaultEmulatorPreference.id, selection, PreferenceScope.User);
  });
}
