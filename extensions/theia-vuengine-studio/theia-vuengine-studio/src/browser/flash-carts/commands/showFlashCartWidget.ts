import { VesFlashCartWidgetContribution } from "../widget/flash-cart-view";

export async function showFlashCartWidgetCommand(
  forceOpen: boolean,
  vesFlashCartWidget: VesFlashCartWidgetContribution,
) {
  if (forceOpen) {
    vesFlashCartWidget.openView();
  } else {
    vesFlashCartWidget.toggleView();
  }
}