import { interfaces } from "inversify";
import {
  createPreferenceProxy,
  PreferenceProxy,
  PreferenceService,
  PreferenceContribution,
  PreferenceSchema,
} from "@theia/core/lib/browser";
import { VesProjectsBaseFolderPreference, VesProjectsMakerCodePreference } from "./preferences";

const VesProjectsPreferenceSchema: PreferenceSchema = {
  type: "object",
  properties: {
    [VesProjectsBaseFolderPreference.id]: VesProjectsBaseFolderPreference.property,
    [VesProjectsMakerCodePreference.id]: VesProjectsMakerCodePreference.property,
  }
};

const VesProjectsPreferences = Symbol("VesProjectsPreferences");
type VesProjectsPreferences = PreferenceProxy<any>;

function createNavigatorPreferences(preferences: PreferenceService): VesProjectsPreferences {
  return createPreferenceProxy(preferences, VesProjectsPreferenceSchema);
}

export function bindVesProjectsPreferences(bind: interfaces.Bind): void {
  bind(VesProjectsPreferences).toDynamicValue((ctx) => {
    const preferences = ctx.container.get<PreferenceService>(PreferenceService);
    return createNavigatorPreferences(preferences);
  });
  bind(PreferenceContribution).toConstantValue({
    schema: VesProjectsPreferenceSchema,
  });
}
