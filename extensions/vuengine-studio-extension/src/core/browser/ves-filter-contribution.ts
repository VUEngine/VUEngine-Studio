import { CommandContribution, ContributionFilterRegistry, FilterContribution, MenuContribution, PreferenceContribution } from '@theia/core';
import { FrontendApplicationContribution, KeybindingContribution, LabelProviderContribution } from '@theia/core/lib/browser';
import { ColorContribution } from '@theia/core/lib/browser/color-application-contribution';
import { TabBarToolbarContribution } from '@theia/core/lib/browser/shell/tab-bar-toolbar';
import { injectable } from '@theia/core/shared/inversify';
import { NotebookActionsContribution } from '@theia/notebook/lib/browser/contributions/notebook-actions-contribution';
import { NotebookCellActionContribution } from '@theia/notebook/lib/browser/contributions/notebook-cell-actions-contribution';
import { NotebookColorContribution } from '@theia/notebook/lib/browser/contributions/notebook-color-contribution';
import { NotebookLabelProviderContribution } from '@theia/notebook/lib/browser/contributions/notebook-label-provider-contribution';
import { NotebookOutlineContribution } from '@theia/notebook/lib/browser/contributions/notebook-outline-contribution';
import { NotebookOutputActionContribution } from '@theia/notebook/lib/browser/contributions/notebook-output-action-contribution';
import { NotebookStatusBarContribution } from '@theia/notebook/lib/browser/contributions/notebook-status-bar-contribution';

@injectable()
export class VesFilterContribution implements FilterContribution {
  registerContributionFilters(registry: ContributionFilterRegistry): void {
    registry.addFilters([
      PreferenceContribution
    ], [
      (contrib: PreferenceContribution) =>
        contrib.schema?.properties === undefined ||
        (
          // filter test extension properties
          contrib.schema?.properties['testing.openTesting'] === undefined &&
          // filter debug extension properties
          contrib.schema?.properties['debug.trace'] === undefined &&
          // filter notebook extension properties
          contrib.schema?.properties['notebook.lineNumbers'] === undefined
        )
    ]);
    registry.addFilters([
      ColorContribution,
      CommandContribution,
      FrontendApplicationContribution,
      KeybindingContribution,
      LabelProviderContribution,
      MenuContribution,
      TabBarToolbarContribution,
    ], [
      contrib =>
        !(contrib instanceof NotebookActionsContribution) &&
        !(contrib instanceof NotebookCellActionContribution) &&
        !(contrib instanceof NotebookColorContribution) &&
        !(contrib instanceof NotebookOutputActionContribution) &&
        !(contrib instanceof NotebookOutlineContribution) &&
        !(contrib instanceof NotebookLabelProviderContribution) &&
        !(contrib instanceof NotebookStatusBarContribution)
    ]);
  }
}
