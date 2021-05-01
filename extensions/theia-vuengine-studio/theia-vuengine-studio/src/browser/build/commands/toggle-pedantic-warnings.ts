import { PreferenceScope, PreferenceService } from "@theia/core/lib/browser";
import { VesBuildPrefs } from "../build-preferences";

export async function togglePedanticWarnings(preferenceService: PreferenceService) {
  const current = preferenceService.get(VesBuildPrefs.PEDANTIC_WARNINGS.id);
  preferenceService.set(VesBuildPrefs.PEDANTIC_WARNINGS.id, !current, PreferenceScope.User);
}
