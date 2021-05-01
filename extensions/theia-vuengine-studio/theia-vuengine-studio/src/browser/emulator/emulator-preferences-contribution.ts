import { interfaces } from "inversify";
import {
  createPreferenceProxy,
  PreferenceProxy,
  PreferenceService,
  PreferenceContribution,
  PreferenceSchema,
} from "@theia/core/lib/browser";
import { VesEmulatorPrefs } from "./emulator-preferences";

const VesRunPreferenceSchema: PreferenceSchema = {
  type: "object",
  properties: {
    [VesEmulatorPrefs.EMULATOR_STEREO_MODE.id]: VesEmulatorPrefs.EMULATOR_STEREO_MODE.property,
    [VesEmulatorPrefs.EMULATOR_EMULATION_MODE.id]: VesEmulatorPrefs.EMULATOR_EMULATION_MODE.property,
    [VesEmulatorPrefs.EMULATOR_SCALE.id]: VesEmulatorPrefs.EMULATOR_SCALE.property,
    [VesEmulatorPrefs.EMULATORS.id]: VesEmulatorPrefs.EMULATORS.property,
    [VesEmulatorPrefs.DEFAULT_EMULATOR.id]: VesEmulatorPrefs.DEFAULT_EMULATOR.property,
  },
};

const VesRunPreferences = Symbol("VesRunPreferences");
type VesRunPreferences = PreferenceProxy<any>;

function createNavigatorPreferences(preferences: PreferenceService): VesRunPreferences {
  return createPreferenceProxy(preferences, VesRunPreferenceSchema);
}

export function bindVesRunPreferences(bind: interfaces.Bind): void {
  bind(VesRunPreferences).toDynamicValue((ctx) => {
    const preferences = ctx.container.get<PreferenceService>(PreferenceService);
    return createNavigatorPreferences(preferences);
  });
  bind(PreferenceContribution).toConstantValue({
    schema: VesRunPreferenceSchema,
  });
}
