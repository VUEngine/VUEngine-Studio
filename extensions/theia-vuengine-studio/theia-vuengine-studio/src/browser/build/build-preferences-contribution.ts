import { interfaces } from "inversify";
import { isWindows } from "@theia/core";
import {
  createPreferenceProxy,
  PreferenceProxy,
  PreferenceService,
  PreferenceContribution,
  PreferenceSchema,
} from "@theia/core/lib/browser";
import { VesBuildPrefs } from "./build-preferences";

const VesBuildPreferenceSchema: PreferenceSchema = {
  type: "object",
  properties: {
    [VesBuildPrefs.BUILD_MODE.id]: VesBuildPrefs.BUILD_MODE.property,
    [VesBuildPrefs.DUMP_ELF.id]: VesBuildPrefs.DUMP_ELF.property,
    [VesBuildPrefs.PEDANTIC_WARNINGS.id]: VesBuildPrefs.PEDANTIC_WARNINGS.property,
    [VesBuildPrefs.ENGINE_CORE_PATH.id]: VesBuildPrefs.ENGINE_CORE_PATH.property,
    [VesBuildPrefs.ENGINE_PLUGINS_PATH.id]: VesBuildPrefs.ENGINE_PLUGINS_PATH.property,
  }
};

if (isWindows) {
  VesBuildPreferenceSchema.properties[VesBuildPrefs.ENABLE_WSL.id] = VesBuildPrefs.ENABLE_WSL.property;
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
