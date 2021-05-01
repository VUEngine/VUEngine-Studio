import { injectable, inject } from "inversify";
import { VesFlashCartsWidgetContribution } from "../widget/flash-carts-view";

@injectable()
export class VesFlashCartsOpenWidgetCommand {
  @inject(VesFlashCartsWidgetContribution) protected readonly vesFlashCartsWidget: VesFlashCartsWidgetContribution;

  async execute(
    forceOpen: boolean
  ) {
    if (forceOpen) {
      this.vesFlashCartsWidget.openView({ activate: true, reveal: true });
    } else {
      this.vesFlashCartsWidget.toggleView();
    }
  }
}