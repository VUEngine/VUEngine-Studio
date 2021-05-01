import { interfaces } from "inversify";
import {
  createPreferenceProxy,
  PreferenceProxy,
  PreferenceService,
  PreferenceContribution,
  PreferenceSchema,
} from "@theia/core/lib/browser";
import { VesProjectsPrefs } from "./projects-preferences";

const VesProjectsPreferenceSchema: PreferenceSchema = {
  type: "object",
  properties: {
    [VesProjectsPrefs.BASE_FOLDER.id]: VesProjectsPrefs.BASE_FOLDER.property,
    [VesProjectsPrefs.MAKER_CODE.id]: VesProjectsPrefs.MAKER_CODE.property,
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
