import { VesFlashCartsWidgetContribution } from "../widget/flash-carts-view";

export async function showFlashCartsWidgetCommand(
  forceOpen: boolean,
  vesFlashCartsWidget: VesFlashCartsWidgetContribution
) {
  if (forceOpen) {
    vesFlashCartsWidget.openView({ activate: true, reveal: true });
  } else {
    vesFlashCartsWidget.toggleView();
  }
}
