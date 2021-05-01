import { PreferenceScope, PreferenceService } from "@theia/core/lib/browser";
import { QuickPickItem, QuickPickOptions, QuickPickService } from "@theia/core/lib/common/quick-pick-service";
import { VesRunDefaultEmulatorPreference } from "../emulator-preferences";
import { getDefaultEmulatorConfig, getEmulatorConfigs } from "./runInEmulator";

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
    title: "Select default emulator configuration",
    placeholder: "Which emulator configuration should be used to run compiled projects?",
  };
  const quickPickItems: QuickPickItem<string>[] = [];

  const defaultEmulator = getDefaultEmulatorConfig(preferenceService).name;
  const emulatorConfigs = getEmulatorConfigs(preferenceService);

  for (const emulatorConfig of emulatorConfigs) {
    quickPickItems.push({
      label: emulatorConfig.name,
      value: emulatorConfig.name,
      description: emulatorConfig.path,
      detail: shorten(emulatorConfig.args, 98),
      iconClass: (emulatorConfig.name === defaultEmulator) ? "fa fa-check" : "",
    });
  }

  quickPickService.show<string>(quickPickItems, quickPickOptions).then(selection => {
    if (!selection) {
      return;
    }

    const selectedEmulator = (selection === emulatorConfigs[0].name) ? "" : selection;

    preferenceService.set(VesRunDefaultEmulatorPreference.id, selectedEmulator, PreferenceScope.User);
  });
}

function shorten(word: string, length: number) {
  if (word.length <= length) return word;

  return word.slice(0, length) + "…";
}
