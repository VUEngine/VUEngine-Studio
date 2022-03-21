import { inject, injectable } from '@theia/core/shared/inversify';
import { TabBarToolbarContribution, TabBarToolbarRegistry } from '@theia/core/lib/browser/shell/tab-bar-toolbar';
import { AbstractViewContribution, CommonCommands, FrontendApplication } from '@theia/core/lib/browser';
import { VesFlashCartWidget } from './ves-flash-cart-widget';
import { VesFlashCartCommands } from './ves-flash-cart-commands';
import { Command, CommandRegistry, CommandService } from '@theia/core';
import { VesFlashCartService } from './ves-flash-cart-service';
import { VesDocumentationCommands } from '../../documentation/browser/ves-documentation-commands';

export namespace VesFlashCartViewContributionCommands {
    export const EXPAND: Command = {
        id: `${VesFlashCartWidget.ID}.expand`,
        label: 'Toggle Maximized',
        iconClass: 'codicon codicon-arrow-both',
    };
    export const HELP: Command = {
        id: `${VesFlashCartWidget.ID}.help`,
        label: 'Show Handbook Page',
        iconClass: 'codicon codicon-book',
    };
    export const REFRESH: Command = {
        id: `${VesFlashCartWidget.ID}.refresh`,
        label: VesFlashCartCommands.DETECT.label,
        iconClass: 'codicon codicon-refresh',
    };
    export const SETTINGS: Command = {
        id: `${VesFlashCartWidget.ID}.settings`,
        label: 'Show Flash Carts Preferences',
        iconClass: 'codicon codicon-settings',
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
            // TODO
            // toggleCommandId: `${VesFlashCartWidget.ID}.toggle`,
            // toggleKeybinding: 'ctrlcmd+shift+k',
        });
    }

    async initializeLayout(app: FrontendApplication): Promise<void> {
        await this.openView({ activate: false, reveal: false });
    }

    registerCommands(commandRegistry: CommandRegistry): void {
        commandRegistry.registerCommand(VesFlashCartViewContributionCommands.EXPAND, {
            isEnabled: () => true,
            isVisible: widget => widget !== undefined &&
                widget.id === VesFlashCartWidget.ID,
            execute: async widget => widget !== undefined &&
                widget.id === VesFlashCartWidget.ID &&
                await this.openView({ activate: true, reveal: true }) &&
                this.commandService.executeCommand(CommonCommands.TOGGLE_MAXIMIZED.id)
        });
        commandRegistry.registerCommand(VesFlashCartViewContributionCommands.HELP, {
            isEnabled: () => true,
            isVisible: widget => widget !== undefined &&
                widget.id !== undefined &&
                widget.id === VesFlashCartWidget.ID,
            execute: () => this.commandService.executeCommand(VesDocumentationCommands.OPEN_HANDBOOK.id, 'user-guide/flash-carts', false),
        });
        commandRegistry.registerCommand(VesFlashCartViewContributionCommands.REFRESH, {
            isEnabled: () => true,
            isVisible: widget => widget !== undefined &&
                widget.id !== undefined &&
                widget.id === VesFlashCartWidget.ID,
            execute: () => this.vesFlashCartService.detectConnectedFlashCarts(),
        });
        commandRegistry.registerCommand(VesFlashCartViewContributionCommands.SETTINGS, {
            isEnabled: () => true,
            isVisible: widget => widget !== undefined &&
                widget.id === VesFlashCartWidget.ID,
            execute: () => this.commandService.executeCommand(CommonCommands.OPEN_PREFERENCES.id, 'flash carts'),
        });
    }

    registerToolbarItems(toolbar: TabBarToolbarRegistry): void {
        toolbar.registerItem({
            id: VesFlashCartViewContributionCommands.EXPAND.id,
            command: VesFlashCartViewContributionCommands.EXPAND.id,
            tooltip: VesFlashCartViewContributionCommands.EXPAND.label,
            priority: 1,
        });
        toolbar.registerItem({
            id: VesFlashCartViewContributionCommands.SETTINGS.id,
            command: VesFlashCartViewContributionCommands.SETTINGS.id,
            tooltip: VesFlashCartViewContributionCommands.SETTINGS.label,
            priority: 2,
        });
        toolbar.registerItem({
            id: VesFlashCartViewContributionCommands.HELP.id,
            command: VesFlashCartViewContributionCommands.HELP.id,
            tooltip: VesFlashCartViewContributionCommands.HELP.label,
            priority: 3,
        });
        toolbar.registerItem({
            id: VesFlashCartViewContributionCommands.REFRESH.id,
            command: VesFlashCartViewContributionCommands.REFRESH.id,
            tooltip: VesFlashCartViewContributionCommands.REFRESH.label,
            priority: 4,
        });
    }
}
