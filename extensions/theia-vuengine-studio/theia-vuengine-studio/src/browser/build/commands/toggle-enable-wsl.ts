import { injectable, inject } from "inversify";
import { PreferenceScope, PreferenceService } from "@theia/core/lib/browser";
import { VesBuildPrefs } from "../build-preferences";

@injectable()
export class VesBuildToggleEnableWslCommand {
  @inject(PreferenceService) protected readonly preferenceService: PreferenceService;

  async execute() {
    const current = this.preferenceService.get(VesBuildPrefs.ENABLE_WSL.id);
    this.preferenceService.set(VesBuildPrefs.ENABLE_WSL.id, !current, PreferenceScope.User);
  }
}
