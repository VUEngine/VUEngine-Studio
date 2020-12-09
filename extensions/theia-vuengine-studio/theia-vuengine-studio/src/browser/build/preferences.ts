import { interfaces } from "inversify";
import { isWindows } from "@theia/core";
import {
  createPreferenceProxy,
  PreferenceProxy,
  PreferenceService,
  PreferenceContribution,
  PreferenceSchema,
} from "@theia/core/lib/browser";
import { BuildMode } from "./commands/setMode";

const VesBuildPreferenceSchema: PreferenceSchema = {
  type: "object",
  properties: {
    "build.dumpElf": {
      type: "boolean",
      description: "Dump assembly code and memory sections",
      default: false,
    },
    "build.pedanticWarnings": {
      type: "boolean",
      description: "Enable pedantic compiler warnigns",
      default: false,
    },
    "build.buildMode": {
      type: "string",
      default: BuildMode.release,
      enum: [
        BuildMode.release,
        BuildMode.beta,
        BuildMode.tools,
        BuildMode.debug,
        BuildMode.preprocessor
      ]
    }
  },
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
