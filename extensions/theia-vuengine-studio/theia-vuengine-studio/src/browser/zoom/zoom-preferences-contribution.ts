import { interfaces } from "inversify";
import {
  createPreferenceProxy,
  PreferenceProxy,
  PreferenceService,
  PreferenceContribution,
  PreferenceSchema,
} from "@theia/core/lib/browser";
import { VesZoomPreferences as Prefs } from "./zoom-preferences";

const VesZoomPreferenceSchema: PreferenceSchema = {
  type: "object",
  properties: {
    [Prefs.ZOOM_FACTOR.id]: Prefs.ZOOM_FACTOR.property,
  },
};

const VesZoomPreferences = Symbol("VesZoomPreferences");
type VesZoomPreferences = PreferenceProxy<any>;

function createNavigatorPreferences(preferences: PreferenceService): VesZoomPreferences {
  return createPreferenceProxy(preferences, VesZoomPreferenceSchema);
}

export function bindVesZoomPreferences(bind: interfaces.Bind): void {
  bind(VesZoomPreferences).toDynamicValue((ctx) => {
    const preferences = ctx.container.get<PreferenceService>(PreferenceService);
    return createNavigatorPreferences(preferences);
  });
  bind(PreferenceContribution).toConstantValue({
    schema: VesZoomPreferenceSchema,
  });
}
