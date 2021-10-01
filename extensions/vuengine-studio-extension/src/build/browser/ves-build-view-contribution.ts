import { inject, injectable } from '@theia/core/shared/inversify';
import { Command, CommandRegistry, CommandService } from '@theia/core';
import { TabBarToolbarContribution, TabBarToolbarRegistry } from '@theia/core/lib/browser/shell/tab-bar-toolbar';
import { ApplicationShell, AbstractViewContribution, FrontendApplication, Widget } from '@theia/core/lib/browser';
import { VesBuildWidget } from './ves-build-widget';
import { VesDocumentationCommands } from '../../documentation/browser/ves-documentation-commands';

export namespace VesBuildViewContributionCommands {
    export const EXPAND: Command = {
        id: `${VesBuildWidget.ID}.expand`,
        label: 'Expand View',
        iconClass: 'codicon codicon-arrow-both',
    };
    export const HELP: Command = {
        id: `${VesBuildWidget.ID}.help`,
        label: 'Show Handbook Page',
        iconClass: 'codicon codicon-book',
    };
    export const SETTINGS: Command = {
        id: `${VesBuildWidget.ID}.settings`,
        label: 'Show Build Settings',
        iconClass: 'codicon codicon-settings-gear',
    };
}

@injectable()
export class VesBuildViewContribution extends AbstractViewContribution<VesBuildWidget> implements TabBarToolbarContribution {
    @inject(ApplicationShell)
    protected readonly applicationShell: ApplicationShell;
    @inject(CommandService)
    private readonly commandService: CommandService;

    constructor() {
        super({
            widgetId: VesBuildWidget.ID,
            widgetName: VesBuildWidget.LABEL,
            defaultWidgetOptions: {
                area: 'right',
                rank: 700,
            },
            // TODO
            // toggleCommandId: 'vesBuild.toggle',
            // toggleKeybinding: 'ctrlcmd+shift+b',
        });
    }

    protected state = {
        isWide: false,
    };

    async initializeLayout(app: FrontendApplication): Promise<void> {
        await this.openView({ activate: false, reveal: false });
    }

    toggleWidgetWidth(widget: Widget): void {
        this.state.isWide = !this.state.isWide;
        const targetWidth = this.state.isWide
            ? Math.round(window.innerWidth * 0.75)
            : 500;
        const widgetArea = this.applicationShell.getAreaFor(widget);
        if (widgetArea) {
            this.applicationShell.resize(targetWidth, widgetArea);
        }
    }

    registerCommands(commandRegistry: CommandRegistry): void {
        commandRegistry.registerCommand(VesBuildViewContributionCommands.EXPAND, {
            isEnabled: () => true,
            isVisible: widget => widget !== undefined &&
                widget.id === VesBuildWidget.ID,
            execute: widget => widget !== undefined &&
                widget.id === VesBuildWidget.ID &&
                this.toggleWidgetWidth(widget),
        });
        commandRegistry.registerCommand(VesBuildViewContributionCommands.HELP, {
            isEnabled: () => true,
            isVisible: widget => widget !== undefined &&
                widget.id === VesBuildWidget.ID,
            execute: () => this.commandService.executeCommand(VesDocumentationCommands.OPEN_HANDBOOK.id, 'user-interface/build-view', false),
        });
        commandRegistry.registerCommand(VesBuildViewContributionCommands.SETTINGS, {
            isEnabled: () => true,
            isVisible: widget => widget !== undefined &&
                widget.id === VesBuildWidget.ID,
            execute: widget => widget !== undefined &&
                widget.id === VesBuildWidget.ID &&
                widget.toggleBuildOptions(),
        });
    }

    registerToolbarItems(toolbar: TabBarToolbarRegistry): void {
        toolbar.registerItem({
            id: VesBuildViewContributionCommands.EXPAND.id,
            command: VesBuildViewContributionCommands.EXPAND.id,
            tooltip: VesBuildViewContributionCommands.EXPAND.label,
            priority: 0,
        });
        toolbar.registerItem({
            id: VesBuildViewContributionCommands.SETTINGS.id,
            command: VesBuildViewContributionCommands.SETTINGS.id,
            tooltip: VesBuildViewContributionCommands.SETTINGS.label,
            priority: 1,
        });
        toolbar.registerItem({
            id: VesBuildViewContributionCommands.HELP.id,
            command: VesBuildViewContributionCommands.HELP.id,
            tooltip: VesBuildViewContributionCommands.HELP.label,
            priority: 2,
        });
    }
}
