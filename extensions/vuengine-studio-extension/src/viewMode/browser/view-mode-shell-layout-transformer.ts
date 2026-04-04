import { ApplicationShell, DockLayout, ShellLayoutTransformer, SidePanel, Widget } from '@theia/core/lib/browser';
import { inject, injectable } from '@theia/core/shared/inversify';
import { ViewModeService } from './view-mode-service';

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
        const { allowList, widgets } = this.viewModeService.getWidgets(viewMode);
        const widgetIds = Object.keys(widgets);

        this.filterConfig(layoutData.mainPanel?.main, widgetIds, allowList);
        this.filterSidePanels(layoutData, widgetIds, allowList);
    }

    protected async filterSidePanels(layoutData: ApplicationShell.LayoutData, widgetIds: string[], allowList: boolean): Promise<void> {
        this.filterSidePanelWidgets(layoutData.leftPanel, widgetIds, allowList);
        this.filterSidePanelWidgets(layoutData.rightPanel, widgetIds, allowList);
    }

    protected isWidgetAllowed(widgetId: string, widgetIds: string[], allowList: boolean): boolean {
        let result = !allowList;
        widgetIds.forEach(aw => {
            if (widgetId.startsWith(aw)) {
                result = allowList;
            }
        });

        return result;
    }

    protected filterConfig(area: DockLayout.AreaConfig | null | undefined, widgetIds: string[], allowList: boolean): void {
        if (area?.type === 'tab-area') {
            this.filterTabConfig(area, widgetIds, allowList);
        } else if (area?.type === 'split-area') {
            this.filterSplitConfig(area, widgetIds, allowList);
        }
    }

    protected filterTabConfig(area: DockLayout.AreaConfig, widgetIds: string[], allowList: boolean): void {
        if (area.type === 'tab-area') {
            area.widgets = area.widgets.filter(widget => this.isWidgetAllowed(widget.id, widgetIds, allowList));
        }
    }

    protected filterSplitConfig(area: DockLayout.AreaConfig, widgetIds: string[], allowList: boolean): void {
        if (area.type === 'split-area') {
            area.children.forEach(c => this.filterConfig(c, widgetIds, allowList));
        }
    }

    protected filterSidePanelWidgets(items: SidePanel.LayoutData | undefined, widgetIds: string[], allowList: boolean): void {
        items?.items?.forEach(widget => {
            let allowed = false;
            if (widget.widget) {
                allowed = this.isWidgetAllowed(widget.widget.id, widgetIds, allowList);
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
