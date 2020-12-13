import { PreferenceScope, PreferenceService } from "@theia/core/lib/browser";

export enum BuildMode {
  release = "release",
  beta = "beta",
  tools = "tools",
  debug = "debug",
  preprocessor = "preprocessor",
}

export async function setModeCommand(
  preferenceService: PreferenceService,
  buildMode: BuildMode
) {
  preferenceService.set(
    "build.buildMode",
    buildMode,
    PreferenceScope.User
  );
}
