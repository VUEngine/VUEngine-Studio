import { PreferenceService } from "@theia/core/lib/browser";
import { VesEmulatorPrefs } from "./emulator-preferences";
import { DEFAULT_EMULATOR, EmulatorConfig } from "./emulator-types";

export function getDefaultEmulatorConfig(preferenceService: PreferenceService): EmulatorConfig {
    const emulatorConfigs: EmulatorConfig[] = getEmulatorConfigs(preferenceService);
    const defaultEmulatorName: string = preferenceService.get(VesEmulatorPrefs.DEFAULT_EMULATOR.id) as string;

    let defaultEmulatorConfig = DEFAULT_EMULATOR;
    for (const emulatorConfig of emulatorConfigs) {
        if (emulatorConfig.name === defaultEmulatorName) {
            defaultEmulatorConfig = emulatorConfig;
        }
    }

    return defaultEmulatorConfig;
}

export function getEmulatorConfigs(preferenceService: PreferenceService) {
    const customEmulatorConfigs: EmulatorConfig[] = preferenceService.get(VesEmulatorPrefs.EMULATORS.id) ?? [];

    const emulatorConfigs = [
        DEFAULT_EMULATOR,
        ...customEmulatorConfigs,
    ]

    return emulatorConfigs;
}