import { inject, injectable } from '@theia/core/shared/inversify';
import { TabBarToolbarContribution, TabBarToolbarRegistry } from '@theia/core/lib/browser/shell/tab-bar-toolbar';
import { AbstractViewContribution, FrontendApplication } from '@theia/core/lib/browser';

import { VesFlashCartWidget } from './ves-flash-cart-widget';
import { VesFlashCartCommands } from './ves-flash-cart-commands';
import { Command, CommandRegistry } from '@theia/core';
import { VesFlashCartService } from './ves-flash-cart-service';

export namespace VesFlashCartViewContributionCommands {
    export const REFRESH: Command = {
        id: `${VesFlashCartWidget.ID}.refresh`,
        label: VesFlashCartCommands.DETECT.label,
        iconClass: 'refresh',
    };
}

@injectable()
export class VesFlashCartViewContribution extends AbstractViewContribution<VesFlashCartWidget> implements TabBarToolbarContribution {
    @inject(VesFlashCartService)
    private readonly vesFlashCartService: VesFlashCartService;

    constructor() {
        super({
            widgetId: VesFlashCartWidget.ID,
            widgetName: VesFlashCartWidget.LABEL,
            defaultWidgetOptions: {
                area: 'right',
                rank: 800,
            },
        });
    }

    async initializeLayout(app: FrontendApplication): Promise<void> {
        await this.openView();
    }

    registerCommands(commandRegistry: CommandRegistry): void {
        commandRegistry.registerCommand(VesFlashCartViewContributionCommands.REFRESH, {
            isEnabled: widget => widget !== undefined &&
                widget.id !== undefined &&
                widget.id === VesFlashCartWidget.ID,
            isVisible: widget => widget !== undefined &&
                widget.id !== undefined &&
                widget.id === VesFlashCartWidget.ID,
            execute: () => this.vesFlashCartService.detectConnectedFlashCarts(),
        });
    }

    registerToolbarItems(toolbar: TabBarToolbarRegistry): void {
        toolbar.registerItem({
            id: VesFlashCartViewContributionCommands.REFRESH.id,
            command: VesFlashCartViewContributionCommands.REFRESH.id,
            tooltip: VesFlashCartViewContributionCommands.REFRESH.label,
            priority: 0,
        });
    }
}
