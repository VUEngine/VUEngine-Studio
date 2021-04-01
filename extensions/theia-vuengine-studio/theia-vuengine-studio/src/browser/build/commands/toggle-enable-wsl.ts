import { PreferenceScope, PreferenceService } from "@theia/core/lib/browser";
import { VesBuildEnableWslPreference } from "../build-preferences";

export async function toggleEnableWsl(preferenceService: PreferenceService) {
  const current = preferenceService.get(VesBuildEnableWslPreference.id);
  preferenceService.set(VesBuildEnableWslPreference.id, !current, PreferenceScope.User);
}
