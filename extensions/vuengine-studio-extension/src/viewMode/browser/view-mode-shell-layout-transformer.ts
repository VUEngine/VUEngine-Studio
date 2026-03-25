import { ApplicationShell, DockLayout, ShellLayoutTransformer, SidePanel, Widget } from '@theia/core/lib/browser';
import { inject, injectable } from '@theia/core/shared/inversify';
import { ViewModeService } from './view-mode-service';
import { VIEW_MODE_WIDGETS } from './view-mode-types';

@injectable()
export class ViewModeShellLayoutTransformer implements ShellLayoutTransformer {
    @inject(ViewModeService)
    protected readonly viewModeService: ViewModeService;

    /**
     * Called when layout is being restored from storage.
     * Filters out widgets that don't belong to the current view mode.
     */
    transformLayoutOnRestore(layoutData: ApplicationShell.LayoutData): void {
        const viewMode = this.viewModeService.getViewMode();
        const allowedWidgets = VIEW_MODE_WIDGETS[viewMode].allow ?? [];

        /**
         * TODO: invert logic for view mode sourceCode, for it to act as fallback
         * for unknown widgets, e.g. from extensions
         */
        this.filterConfig(layoutData.mainPanel?.main, allowedWidgets);
        this.filterSidePanels(layoutData, allowedWidgets);
    }

    protected async filterSidePanels(layoutData: ApplicationShell.LayoutData, allowedWidgets: string[]): Promise<void> {
        this.filterSidePanelWidgets(layoutData.leftPanel, allowedWidgets);
        this.filterSidePanelWidgets(layoutData.rightPanel, allowedWidgets);
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

    protected filterConfig(area: DockLayout.AreaConfig | null | undefined, allowedWidgets: string[]): void {
        if (area?.type === 'tab-area') {
            this.filterTabConfig(area, allowedWidgets);
        } else if (area?.type === 'split-area') {
            this.filterSplitConfig(area, allowedWidgets);
        }
    }

    protected filterTabConfig(area: DockLayout.AreaConfig, allowedWidgets: string[]): void {
        if (area.type === 'tab-area') {
            area.widgets = area.widgets.filter(widget => this.isWidgetAllowed(widget.id, allowedWidgets));
        }
    }

    protected filterSplitConfig(area: DockLayout.AreaConfig, allowedWidgets: string[]): void {
        if (area.type === 'split-area') {
            area.children.forEach(c => this.filterConfig(c, allowedWidgets));
        }
    }

    protected filterSidePanelWidgets(items: SidePanel.LayoutData | undefined, allowedWidgets: string[]): void {
        items?.items?.forEach(widget => {
            let allowed = false;
            if (widget.widget) {
                allowed = this.isWidgetAllowed(widget.widget.id, allowedWidgets);
                if (allowed) {
                    this.showSidePanelWidget(widget.widget);
                } else {
                    this.hideSidePanelWidget(widget.widget);
                }
            }
        });
    }

    protected hideSidePanelWidget(widget: Widget): void {
        widget.title.className += ' otherViewMode';
    }

    protected showSidePanelWidget(widget: Widget): void {
        widget.title.className = widget.title.className.replace(/ otherViewMode/g, '');
    }
}
