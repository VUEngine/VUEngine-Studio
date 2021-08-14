import { inject, injectable } from '@theia/core/shared/inversify';
import { TabBarToolbarContribution, TabBarToolbarRegistry } from '@theia/core/lib/browser/shell/tab-bar-toolbar';
import { AbstractViewContribution, FrontendApplication } from '@theia/core/lib/browser';
import { VesFlashCartWidget } from './ves-flash-cart-widget';
import { VesFlashCartCommands } from './ves-flash-cart-commands';
import { Command, CommandRegistry, CommandService } from '@theia/core';
import { VesFlashCartService } from './ves-flash-cart-service';
import { VesDocumentationCommands } from '../../documentation/browser/ves-documentation-commands';

export namespace VesFlashCartViewContributionCommands {
    export const HELP: Command = {
        id: `${VesFlashCartWidget.ID}.help`,
        label: 'Show Handbook Page',
        iconClass: 'fa fa-book',
    };
    export const REFRESH: Command = {
        id: `${VesFlashCartWidget.ID}.refresh`,
        label: VesFlashCartCommands.DETECT.label,
        iconClass: 'refresh',
    };
}

@injectable()
export class VesFlashCartViewContribution extends AbstractViewContribution<VesFlashCartWidget> implements TabBarToolbarContribution {
    @inject(CommandService)
    private readonly commandService: CommandService;
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
            // toggleCommandId: 'vesFlashCart.toggle',
        });
    }

    async initializeLayout(app: FrontendApplication): Promise<void> {
        await this.openView({ activate: false, reveal: false });
    }

    registerCommands(commandRegistry: CommandRegistry): void {
        commandRegistry.registerCommand(VesFlashCartViewContributionCommands.HELP, {
            isEnabled: () => true,
            isVisible: widget => widget !== undefined &&
                widget.id !== undefined &&
                widget.id === VesFlashCartWidget.ID,
            // TODO: link correct handbook page
            execute: () => this.commandService.executeCommand(VesDocumentationCommands.OPEN_HANDBOOK.id, 'engine/post-processing', false),
        });
        commandRegistry.registerCommand(VesFlashCartViewContributionCommands.REFRESH, {
            isEnabled: () => true,
            isVisible: widget => widget !== undefined &&
                widget.id !== undefined &&
                widget.id === VesFlashCartWidget.ID,
            execute: () => this.vesFlashCartService.detectConnectedFlashCarts(),
        });
    }

    registerToolbarItems(toolbar: TabBarToolbarRegistry): void {
        toolbar.registerItem({
            id: VesFlashCartViewContributionCommands.HELP.id,
            command: VesFlashCartViewContributionCommands.HELP.id,
            tooltip: VesFlashCartViewContributionCommands.HELP.label,
            priority: 0,
        });
        toolbar.registerItem({
            id: VesFlashCartViewContributionCommands.REFRESH.id,
            command: VesFlashCartViewContributionCommands.REFRESH.id,
            tooltip: VesFlashCartViewContributionCommands.REFRESH.label,
            priority: 0,
        });
    }
}
