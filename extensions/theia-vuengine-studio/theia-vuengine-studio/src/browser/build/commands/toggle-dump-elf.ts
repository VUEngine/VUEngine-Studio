import { PreferenceScope, PreferenceService } from "@theia/core/lib/browser";
import { VesBuildDumpElfPreference } from "../build-preferences";

export async function toggleDumpElf(preferenceService: PreferenceService) {
  const current = preferenceService.get(VesBuildDumpElfPreference.id);
  preferenceService.set(VesBuildDumpElfPreference.id, !current, PreferenceScope.User);
}
