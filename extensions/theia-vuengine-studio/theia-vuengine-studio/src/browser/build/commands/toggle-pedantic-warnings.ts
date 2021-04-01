import { PreferenceScope, PreferenceService } from "@theia/core/lib/browser";
import { VesBuildPedanticWarningsPreference } from "../build-preferences";

export async function togglePedanticWarnings(preferenceService: PreferenceService) {
  const current = preferenceService.get(VesBuildPedanticWarningsPreference.id);
  preferenceService.set(VesBuildPedanticWarningsPreference.id, !current, PreferenceScope.User);
}
