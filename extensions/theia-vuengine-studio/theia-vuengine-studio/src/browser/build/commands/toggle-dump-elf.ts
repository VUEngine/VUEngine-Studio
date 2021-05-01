import { injectable, inject } from "inversify";
import { PreferenceScope, PreferenceService } from "@theia/core/lib/browser";
import { VesBuildPrefs } from "../build-preferences";

@injectable()
export class VesBuildToggleDumpElfCommand {
  @inject(PreferenceService) protected readonly preferenceService: PreferenceService;

  async execute() {
    const current = this.preferenceService.get(VesBuildPrefs.DUMP_ELF.id);
    this.preferenceService.set(VesBuildPrefs.DUMP_ELF.id, !current, PreferenceScope.User);
  }
}
