import { PreferenceScope, PreferenceService } from "@theia/core/lib/browser";

export async function toggleEnableWsl(preferenceService: PreferenceService) {
  const current = preferenceService.get("build.enableWsl");
  preferenceService.set("build.enableWsl", !current, PreferenceScope.User);
}
