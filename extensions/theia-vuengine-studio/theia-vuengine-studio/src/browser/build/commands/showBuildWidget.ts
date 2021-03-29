import { VesBuildWidgetContribution } from "../widget/build-view";

export async function showBuildWidgetCommand(
  forceOpen: boolean,
  vesBuildWidget: VesBuildWidgetContribution
) {
  if (forceOpen) {
    vesBuildWidget.openView({ activate: true, reveal: true });
  } else {
    vesBuildWidget.toggleView();
  }
}
