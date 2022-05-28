import { CommandRegistry, CommandService, MenuModelRegistry } from '@theia/core';
import { AbstractViewContribution, CommonMenus, FrontendApplication, FrontendApplicationContribution, PreferenceService } from '@theia/core/lib/browser';
import { FrontendApplicationStateService } from '@theia/core/lib/browser/frontend-application-state';
import { TabBarToolbarRegistry } from '@theia/core/lib/browser/shell/tab-bar-toolbar';
import { inject, injectable } from '@theia/core/shared/inversify';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import { VesDocumentationCommands } from '../../documentation/browser/ves-documentation-commands';
import { VesGettingStartedCommands } from './ves-getting-started-commands';
import { VesGettingStartedPreferenceIds } from './ves-getting-started-preferences';
import { VesGettingStartedWidget } from './ves-getting-started-widget';

@injectable()
export class VesGettingStartedViewContribution extends AbstractViewContribution<VesGettingStartedWidget> implements FrontendApplicationContribution {
    @inject(CommandService)
    private readonly commandService: CommandService;
    @inject(FrontendApplicationStateService)
    protected readonly stateService: FrontendApplicationStateService;
    @inject(PreferenceService)
    protected readonly preferenceService: PreferenceService;
    @inject(WorkspaceService)
    protected readonly workspaceService: WorkspaceService;

    constructor() {
        super({
            widgetId: VesGettingStartedWidget.ID,
            widgetName: VesGettingStartedWidget.LABEL,
            defaultWidgetOptions: {
                area: 'main',
            }
        });
    }

    async onStart(app: FrontendApplication): Promise<void> {
        if (!this.workspaceService.opened) {
            this.stateService.reachedState('ready').then(
                () => this.preferenceService.ready.then(() => {
                    const showWelcomePage: boolean = this.preferenceService.get(VesGettingStartedPreferenceIds.ALWAYS_SHOW_WELCOME_PAGE, true);
                    if (showWelcomePage) {
                        this.openView({ reveal: true, activate: true });
                    }
                })
            );
        }
    }

    registerCommands(commandRegistry: CommandRegistry): void {
        commandRegistry.registerCommand(VesGettingStartedCommands.WIDGET_SHOW, {
            execute: () => this.openView({ reveal: true, activate: true }),
        });
        commandRegistry.registerCommand(VesGettingStartedCommands.HELP, {
            isEnabled: () => true,
            isVisible: widget => widget !== undefined &&
                widget.id === VesGettingStartedWidget.ID,
            execute: () => this.commandService.executeCommand(VesDocumentationCommands.OPEN_HANDBOOK.id, 'setup/getting-started', false),
        });
    }

    registerMenus(menus: MenuModelRegistry): void {
        menus.registerMenuAction(CommonMenus.HELP, {
            commandId: VesGettingStartedCommands.WIDGET_SHOW.id,
            label: VesGettingStartedCommands.WIDGET_SHOW.label,
            order: 'a10'
        });
    }

    registerToolbarItems(toolbar: TabBarToolbarRegistry): void {
        toolbar.registerItem({
            id: VesGettingStartedCommands.HELP.id,
            command: VesGettingStartedCommands.HELP.id,
            tooltip: VesGettingStartedCommands.HELP.label,
            priority: 1,
        });
    }
}
