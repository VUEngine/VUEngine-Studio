import { PreferenceScope, PreferenceService } from "@theia/core/lib/browser";

export async function toggleDumpElf(preferenceService: PreferenceService) {
  const current = preferenceService.get("build.dumpElf");
  preferenceService.set("build.dumpElf", !current, PreferenceScope.User);
}
