import { PreferenceScope, PreferenceService } from "@theia/core/lib/browser";

export async function togglePedanticWarnings(preferenceService: PreferenceService) {
  const current = preferenceService.get("build.pedanticWarnings");
  preferenceService.set("build.pedanticWarnings", !current, PreferenceScope.User);
}
