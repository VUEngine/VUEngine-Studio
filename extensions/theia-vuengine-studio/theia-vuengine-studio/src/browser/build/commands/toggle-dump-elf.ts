import { PreferenceScope, PreferenceService } from "@theia/core/lib/browser";
import { VesBuildPrefs } from "../build-preferences";

export async function toggleDumpElf(preferenceService: PreferenceService) {
  const current = preferenceService.get(VesBuildPrefs.DUMP_ELF.id);
  preferenceService.set(VesBuildPrefs.DUMP_ELF.id, !current, PreferenceScope.User);
}
