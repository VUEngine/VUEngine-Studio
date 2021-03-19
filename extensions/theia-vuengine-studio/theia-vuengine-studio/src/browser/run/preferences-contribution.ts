import { interfaces } from "inversify";
import {
  createPreferenceProxy,
  PreferenceProxy,
  PreferenceService,
  PreferenceContribution,
  PreferenceSchema,
} from "@theia/core/lib/browser";
import { VesRunDefaultEmulatorPreference, VesRunEmulatorConfigsPreference, VesRunEmulatorEmulationModePreference, VesRunEmulatorScalePreference, VesRunEmulatorStereoModePreference } from "./preferences";

const VesRunPreferenceSchema: PreferenceSchema = {
  type: "object",
  properties: {
    [VesRunEmulatorStereoModePreference.id]: VesRunEmulatorStereoModePreference.property,
    [VesRunEmulatorEmulationModePreference.id]: VesRunEmulatorEmulationModePreference.property,
    [VesRunEmulatorScalePreference.id]: VesRunEmulatorScalePreference.property,
    [VesRunEmulatorConfigsPreference.id]: VesRunEmulatorConfigsPreference.property,
    [VesRunDefaultEmulatorPreference.id]: VesRunDefaultEmulatorPreference.property,
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
