import { PreferenceScope, PreferenceService } from "@theia/core/lib/browser";
import { VesBuildPrefs } from "../build-preferences";

export async function toggleEnableWsl(preferenceService: PreferenceService) {
  const current = preferenceService.get(VesBuildPrefs.ENABLE_WSL.id);
  preferenceService.set(VesBuildPrefs.ENABLE_WSL.id, !current, PreferenceScope.User);
}
