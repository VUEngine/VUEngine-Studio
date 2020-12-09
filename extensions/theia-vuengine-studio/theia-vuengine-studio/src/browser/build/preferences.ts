import { interfaces } from "inversify";
import {
  createPreferenceProxy,
  PreferenceProxy,
  PreferenceService,
  PreferenceContribution,
  PreferenceSchema,
} from "@theia/core/lib/browser";
import { isWindows } from "@theia/core";

const VesBuildPreferenceSchema: PreferenceSchema = {
  type: "object",
  properties: {},
};

if (isWindows) {
  VesBuildPreferenceSchema.properties["build.enableWsl"] = {
    type: "boolean",
    description: "Build in WSL for faster compilation times",
    default: false,
  };
}

const VesBuildPreferences = Symbol("VesBuildPreferences");
type VesBuildPreferences = PreferenceProxy<any>;

function createNavigatorPreferences(
  preferences: PreferenceService
): VesBuildPreferences {
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
