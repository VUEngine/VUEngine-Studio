import { PreferenceScope, PreferenceService } from "@theia/core/lib/browser";

export async function togglePedanticWarnings(preferenceService: PreferenceService, enable: boolean) {
    preferenceService.set("build.pedanticWarnings", enable, PreferenceScope.User);
}
