import { interfaces } from "inversify";
import {
  createPreferenceProxy,
  PreferenceProxy,
  PreferenceService,
  PreferenceContribution,
  PreferenceSchema,
} from "@theia/core/lib/browser";
import { VesFlashCartsCustomPreference } from "./preferences";

const VesFlashCartsPreferenceSchema: PreferenceSchema = {
  type: "object",
  properties: {
    [VesFlashCartsCustomPreference.id]: VesFlashCartsCustomPreference.property,
  },
};

const VesFlashCartsPreferences = Symbol("VesFlashCartsPreferences");
type VesFlashCartsPreferences = PreferenceProxy<any>;

function createNavigatorPreferences(preferences: PreferenceService): VesFlashCartsPreferences {
  return createPreferenceProxy(preferences, VesFlashCartsPreferenceSchema);
}

export function bindVesFlashCartsPreferences(bind: interfaces.Bind): void {
  bind(VesFlashCartsPreferences).toDynamicValue((ctx) => {
    const preferences = ctx.container.get<PreferenceService>(PreferenceService);
    return createNavigatorPreferences(preferences);
  });
  bind(PreferenceContribution).toConstantValue({
    schema: VesFlashCartsPreferenceSchema,
  });
}
