import { PreferenceScope, PreferenceService } from "@theia/core/lib/browser";

export async function toggleDumpElf(preferenceService: PreferenceService, enable: boolean) {
    preferenceService.set("build.dumpElf", enable, PreferenceScope.User);
}
