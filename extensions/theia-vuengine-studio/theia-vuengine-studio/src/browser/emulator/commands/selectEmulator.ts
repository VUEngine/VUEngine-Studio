import { injectable, inject } from "inversify";
import { PreferenceScope, PreferenceService } from "@theia/core/lib/browser";
import { QuickPickItem, QuickPickOptions, QuickPickService } from "@theia/core/lib/common/quick-pick-service";
import { getDefaultEmulatorConfig, getEmulatorConfigs } from "../emulator-functions";
import { VesEmulatorPrefs } from "../emulator-preferences";
import { VesEmulatorRunCommand } from "./runInEmulator";

@injectable()
export class VesEmulatorSelectCommand {
  @inject(PreferenceService) protected readonly preferenceService: PreferenceService;
  @inject(QuickPickService) protected readonly quickPickService: QuickPickService;
  @inject(VesEmulatorRunCommand) protected readonly runCommand: VesEmulatorRunCommand;

  async execute() {
    this.selectEmulator();
  }

  protected async selectEmulator() {
    const quickPickOptions: QuickPickOptions = {
      title: "Select default emulator configuration",
      placeholder: "Which emulator configuration should be used to run compiled projects?",
    };
    const quickPickItems: QuickPickItem<string>[] = [];

    const defaultEmulator = getDefaultEmulatorConfig(this.preferenceService).name;
    const emulatorConfigs = getEmulatorConfigs(this.preferenceService);

    for (const emulatorConfig of emulatorConfigs) {
      quickPickItems.push({
        label: emulatorConfig.name,
        value: emulatorConfig.name,
        description: emulatorConfig.path,
        detail: this.shorten(emulatorConfig.args, 98),
        iconClass: (emulatorConfig.name === defaultEmulator) ? "fa fa-check" : "",
      });
    }

    this.quickPickService.show<string>(quickPickItems, quickPickOptions).then(selection => {
      if (!selection) {
        return;
      }

      const selectedEmulator = (selection === emulatorConfigs[0].name) ? "" : selection;

      this.preferenceService.set(VesEmulatorPrefs.DEFAULT_EMULATOR.id, selectedEmulator, PreferenceScope.User);
    });
  }

  protected shorten(word: string, length: number) {
    if (word.length <= length) return word;

    return word.slice(0, length) + "…";
  }
}
