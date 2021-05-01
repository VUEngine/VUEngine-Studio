import { injectable, inject } from "inversify";
import { VesBuildWidgetContribution } from "../widget/build-view";

@injectable()
export class VesBuildOpenWidgetCommand {
  @inject(VesBuildWidgetContribution) protected readonly vesBuildWidget: VesBuildWidgetContribution;

  async execute(forceOpen: boolean) {
    if (forceOpen) {
      this.vesBuildWidget.openView({ activate: true, reveal: true });
    } else {
      this.vesBuildWidget.toggleView();
    }
  }
}
