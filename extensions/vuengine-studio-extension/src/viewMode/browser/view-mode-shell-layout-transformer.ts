import { ApplicationShell, DockLayout, ShellLayoutTransformer, SidePanel } from '@theia/core/lib/browser';
import { inject, injectable } from '@theia/core/shared/inversify';
import { PROBLEMS_WIDGET_ID } from '@theia/markers/lib/browser/problem/problem-widget';
import { EXPLORER_VIEW_CONTAINER_ID } from '@theia/navigator/lib/browser/navigator-widget-factory';
import { OUTLINE_WIDGET_FACTORY_ID } from '@theia/outline-view/lib/browser/outline-view-contribution';
import { PreferencesSearchbarWidget } from '@theia/preferences/lib/browser/views/preference-searchbar-widget';
import { SCM_VIEW_CONTAINER_ID } from '@theia/scm/lib/browser/scm-contribution';
import { SEARCH_VIEW_CONTAINER_ID } from '@theia/search-in-workspace/lib/browser/search-in-workspace-factory';
import { VSXExtensionsViewContainer } from '@theia/vsx-registry/lib/browser/vsx-extensions-view-container';
import { VesBuildWidget } from '../../build/browser/ves-build-widget';
import { VesEditorsWidget } from '../../editors/browser/ves-editors-widget';
import { VesEmulatorSidebarWidget } from '../../emulator/browser/ves-emulator-sidebar-widget';
import { VesEmulatorWidget } from '../../emulator/browser/ves-emulator-widget';
import { VesFlashCartWidget } from '../../flash-cart/browser/ves-flash-cart-widget';
import { VesPluginsViewContainer } from '../../plugins/browser/ves-plugins-view-container';
import { ActorAssetsBrowserWidget } from '../../project/browser/assets-browser/actor-assets-browser-widget';
import { BrightnessRepeatAssetsBrowserWidget } from '../../project/browser/assets-browser/brightness-repeat-assets-browser-widget';
import { ColumnTableAssetsBrowserWidget } from '../../project/browser/assets-browser/column-table-assets-browser-widget';
import { FontAssetsBrowserWidget } from '../../project/browser/assets-browser/font-assets-browser-widget';
import { ImageAssetsBrowserWidget } from '../../project/browser/assets-browser/image-assets-browser-widget';
import { LogicAssetsBrowserWidget } from '../../project/browser/assets-browser/logic-assets-browser-widget';
import { RumbleEffectAssetsBrowserWidget } from '../../project/browser/assets-browser/rumble-effect-assets-browser-widget';
import { SoundAssetsBrowserWidget } from '../../project/browser/assets-browser/sound-assets-browser-widget';
import { StageAssetsBrowserWidget } from '../../project/browser/assets-browser/stage-assets-browser-widget';
import { VesProjectDashboardWidget } from '../../project/browser/ves-project-dashboard-widget';
import { VesProjectSidebarWidget } from '../../project/browser/ves-project-sidebar-widget';
import { ViewModeService } from './view-mode-service';
import { ViewMode } from './view-mode-types';

@injectable()
export class ViewModeShellLayoutTransformer implements ShellLayoutTransformer {
    @inject(ViewModeService)
    protected readonly viewModeService: ViewModeService;

    /**
     * Define which widgets belong to each view mode.
     * This ensures only relevant widgets are shown/restored.
     */
    protected readonly allowedWidgetsByViewMode: Record<ViewMode, string[]> = {
        [ViewMode.actors]: [
            ActorAssetsBrowserWidget.ID,
            ImageAssetsBrowserWidget.ID,
            VesEditorsWidget.ID,
        ],
        [ViewMode.assets]: [
            BrightnessRepeatAssetsBrowserWidget.ID,
            ColumnTableAssetsBrowserWidget.ID,
            RumbleEffectAssetsBrowserWidget.ID,
            VesEditorsWidget.ID,
        ],
        [ViewMode.build]: [
            VesBuildWidget.ID,
        ],
        [ViewMode.emulator]: [
            VesEmulatorSidebarWidget.ID,
            VesEmulatorWidget.ID,
        ],
        [ViewMode.flashCarts]: [
            VesFlashCartWidget.ID,
        ],
        [ViewMode.fonts]: [
            FontAssetsBrowserWidget.ID,
            VesEditorsWidget.ID,
        ],
        [ViewMode.localization]: [
            VesEditorsWidget.ID,
        ],
        [ViewMode.logic]: [
            LogicAssetsBrowserWidget.ID,
            VesEditorsWidget.ID,
        ],
        [ViewMode.sound]: [
            SoundAssetsBrowserWidget.ID,
            VesEditorsWidget.ID,
        ],
        [ViewMode.settings]: [
            PreferencesSearchbarWidget.ID,
            VesProjectSidebarWidget.ID,
            VesEditorsWidget.ID,
        ],
        [ViewMode.sourceCode]: [
            'code-editor-opener',
            'ves-plugins-search-bar',
            EXPLORER_VIEW_CONTAINER_ID,
            OUTLINE_WIDGET_FACTORY_ID,
            PROBLEMS_WIDGET_ID,
            SCM_VIEW_CONTAINER_ID,
            SEARCH_VIEW_CONTAINER_ID,
            VesPluginsViewContainer.ID,
            VSXExtensionsViewContainer.ID,
        ],
        [ViewMode.stages]: [
            StageAssetsBrowserWidget.ID,
            VesProjectDashboardWidget.ID,
            VesEditorsWidget.ID,
        ],
    };

    /**
     * Called when layout is being restored from storage.
     * Filters out widgets that don't belong to the current view mode.
     */
    transformLayoutOnRestore(layoutData: ApplicationShell.LayoutData): void {
        const viewMode = this.viewModeService.getViewMode();
        const allowedWidgets = this.allowedWidgetsByViewMode[viewMode];

        if (!allowedWidgets) {
            return;
        }

        this.pruneConfig(layoutData.mainPanel?.main, allowedWidgets);
        this.pruneSidePanel(layoutData.leftPanel, allowedWidgets);
        this.pruneSidePanel(layoutData.rightPanel, allowedWidgets);

        console.log('pruned layoutData', layoutData);
    }

    protected isWidgetAllowed(widgetId: string, allowedWidgets: string[]): boolean {
        let result = false;
        allowedWidgets.forEach(aw => {
            if (widgetId.startsWith(aw)) {
                result = true;
            }
        });

        return result;
    }

    protected pruneConfig(area: DockLayout.AreaConfig | null | undefined, allowedWidgets: string[]): void {
        if (area?.type === 'tab-area') {
            this.pruneTabConfig(area, allowedWidgets);
        } else if (area?.type === 'split-area') {
            this.pruneSplitConfig(area, allowedWidgets);
        }
    }

    protected pruneTabConfig(area: DockLayout.AreaConfig, allowedWidgets: string[]): void {
        if (area.type === 'tab-area') {
            area.widgets = area.widgets.filter(widget => this.isWidgetAllowed(widget.id, allowedWidgets));
        }
    }

    protected pruneSplitConfig(area: DockLayout.AreaConfig, allowedWidgets: string[]): void {
        if (area.type === 'split-area') {
            area.children.forEach(c => this.pruneConfig(c, allowedWidgets));
        }
    }

    protected pruneSidePanel(items: SidePanel.LayoutData | undefined, allowedWidgets: string[]): void {
        if (items) {
            items.items = items.items?.filter(widget => {
                const allowed = this.isWidgetAllowed(widget.widget?.id ?? 'none', allowedWidgets);
                if (!allowed) {
                    // widget.widget?.close();
                }
                return allowed;
            });
        }
    }
}
