import { ApplicationShell, Panel, Widget } from '@theia/core/lib/browser';
import { TheiaDockPanel } from '@theia/core/lib/browser/shell/theia-dock-panel';
import { injectable } from '@theia/core/shared/inversify';

@injectable()
export class VesApplicationShell extends ApplicationShell {

    canToggleMaximized(widget: Widget | undefined = this.currentWidget): boolean {
        const area = widget && this.getAreaFor(widget);

        return area === 'main' || area === 'bottom' ||
            area === 'left' || area === 'right'; // addition to allow left and right panel widgets to be maximized
    }

    toggleMaximized(widget: Widget | undefined = this.currentWidget): void {
        const area = widget && this.getAreaPanelFor(widget);
        if (area instanceof TheiaDockPanel &&
            (area === this.mainPanel || area === this.bottomPanel ||
                area === this.leftPanelHandler.dockPanel || area === this.rightPanelHandler.dockPanel) // addition to allow left and right panel widgets to be maximized
        ) {
            area.toggleMaximized();
            this.revealWidget(widget!.id);
        }
    }

    protected createTopPanel(): Panel {
        const topPanel = super.createTopPanel();
        // show the top panel
        topPanel.show();
        return topPanel;
    }

    protected setTopPanelVisibility(preference: string): void {
        // always show the top panel
        this.topPanel.show();
    }
}
