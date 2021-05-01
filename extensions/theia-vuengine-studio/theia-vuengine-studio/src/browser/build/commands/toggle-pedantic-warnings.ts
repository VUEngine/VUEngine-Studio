import { injectable, inject } from "inversify";
import { PreferenceScope, PreferenceService } from "@theia/core/lib/browser";
import { VesBuildPrefs } from "../build-preferences";

@injectable()
export class VesBuildTogglePedanticWarningsCommand {
  @inject(PreferenceService) protected readonly preferenceService: PreferenceService;

  async execute() {
    const current = this.preferenceService.get(VesBuildPrefs.PEDANTIC_WARNINGS.id);
    this.preferenceService.set(VesBuildPrefs.PEDANTIC_WARNINGS.id, !current, PreferenceScope.User);
  }
}
