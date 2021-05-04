import { inject, injectable, interfaces } from 'inversify';
import { TabBarToolbarContribution, TabBarToolbarRegistry } from '@theia/core/lib/browser/shell/tab-bar-toolbar';
import { AbstractViewContribution, bindViewContribution, FrontendApplication, FrontendApplicationContribution, WidgetFactory } from '@theia/core/lib/browser';
import { VesFlashCartsWidget } from './flash-carts-widget';
import { VesFlashCartsCommands } from "../flash-carts-commands";
import { Command, CommandRegistry } from '@theia/core';
import { VesFlashCartsDetectCommand } from '../commands/detect-connected-flash-carts';

export namespace VesFlashCartsWidgetContributionCommands {
    export const REFRESH: Command = {
        id: `${VesFlashCartsWidget.ID}.refresh`,
        label: VesFlashCartsCommands.DETECT.label,
        iconClass: "refresh",
    };
}

@injectable()
export class VesFlashCartsWidgetContribution extends AbstractViewContribution<VesFlashCartsWidget> implements TabBarToolbarContribution {
    @inject(VesFlashCartsDetectCommand) private readonly detectCommand: VesFlashCartsDetectCommand;

    constructor() {
        super({
            widgetId: VesFlashCartsWidget.ID,
            widgetName: VesFlashCartsWidget.LABEL,
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
        commandRegistry.registerCommand(VesFlashCartsWidgetContributionCommands.REFRESH, {
            isEnabled: widget => widget !== undefined &&
                widget.id !== undefined &&
                widget.id === VesFlashCartsWidget.ID,
            isVisible: widget => widget !== undefined &&
                widget.id !== undefined &&
                widget.id === VesFlashCartsWidget.ID,
            execute: () => this.detectCommand.execute(),
        });
    }

    registerToolbarItems(toolbar: TabBarToolbarRegistry): void {
        toolbar.registerItem({
            id: VesFlashCartsWidgetContributionCommands.REFRESH.id,
            command: VesFlashCartsWidgetContributionCommands.REFRESH.id,
            tooltip: VesFlashCartsWidgetContributionCommands.REFRESH.label,
            priority: 0,
        });
    }
}

export function bindVesFlashCartsView(bind: interfaces.Bind): void {
    bindViewContribution(bind, VesFlashCartsWidgetContribution);
    bind(FrontendApplicationContribution).toService(
        VesFlashCartsWidgetContribution
    );
    bind(TabBarToolbarContribution).toService(VesFlashCartsWidgetContribution);
    bind(VesFlashCartsWidget).toSelf();
    bind(WidgetFactory)
        .toDynamicValue((ctx) => ({
            id: VesFlashCartsWidget.ID,
            createWidget: () =>
                ctx.container.get<VesFlashCartsWidget>(
                    VesFlashCartsWidget
                ),
        }))
        .inSingletonScope();
}
