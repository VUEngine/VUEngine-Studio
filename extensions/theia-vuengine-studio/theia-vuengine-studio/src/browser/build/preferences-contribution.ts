import { interfaces } from "inversify";
import { isWindows } from "@theia/core";
import {
  createPreferenceProxy,
  PreferenceProxy,
  PreferenceService,
  PreferenceContribution,
  PreferenceSchema,
} from "@theia/core/lib/browser";
import { VesBuildDumpElfPreference, VesBuildEnableWslPreference, VesBuildEngineCorePathPreference, VesBuildEnginePluginsPathPreference, VesBuildModePreference, VesBuildPedanticWarningsPreference } from "./preferences";

const VesBuildPreferenceSchema: PreferenceSchema = {
  type: "object",
  properties: {
    [VesBuildModePreference.id]: VesBuildModePreference.property,
    [VesBuildDumpElfPreference.id]: VesBuildDumpElfPreference.property,
    [VesBuildPedanticWarningsPreference.id]: VesBuildPedanticWarningsPreference.property,
    [VesBuildEngineCorePathPreference.id]: VesBuildEngineCorePathPreference.property,
    [VesBuildEnginePluginsPathPreference.id]: VesBuildEnginePluginsPathPreference.property,
  }
};

if (isWindows) {
  VesBuildPreferenceSchema.properties[VesBuildEnableWslPreference.id] = VesBuildEnableWslPreference.property;
}

const VesBuildPreferences = Symbol("VesBuildPreferences");
type VesBuildPreferences = PreferenceProxy<any>;

function createNavigatorPreferences(preferences: PreferenceService): VesBuildPreferences {
  return createPreferenceProxy(preferences, VesBuildPreferenceSchema);
}

export function bindVesBuildPreferences(bind: interfaces.Bind): void {
  bind(VesBuildPreferences).toDynamicValue((ctx) => {
    const preferences = ctx.container.get<PreferenceService>(PreferenceService);
    return createNavigatorPreferences(preferences);
  });
  bind(PreferenceContribution).toConstantValue({
    schema: VesBuildPreferenceSchema,
  });
}
