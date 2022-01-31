import { Command, CommandRegistry, MenuModelRegistry } from '@theia/core';
import { AbstractViewContribution, CommonMenus, FrontendApplication, FrontendApplicationContribution, PreferenceService } from '@theia/core/lib/browser';
import { FrontendApplicationStateService } from '@theia/core/lib/browser/frontend-application-state';
import { inject, injectable } from '@theia/core/shared/inversify';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import { VesGettingStartedWidget } from './ves-branding-getting-started-widget';
import { VesBrandingPreferenceIds } from './ves-branding-preferences';

export namespace VesGettingStartedCommands {
    export const SHOW: Command = {
        id: VesGettingStartedWidget.ID,
        label: VesGettingStartedWidget.LABEL
    };
}

@injectable()
export class VesGettingStartedViewContribution extends AbstractViewContribution<VesGettingStartedWidget> implements FrontendApplicationContribution {
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
                    const showWelcomePage: boolean = this.preferenceService.get(VesBrandingPreferenceIds.ALWAYS_SHOW_WELCOME_PAGE, true);
                    if (showWelcomePage) {
                        this.openView({ reveal: showWelcomePage });
                    }
                })
            );
        }
    }

    registerCommands(registry: CommandRegistry): void {
        registry.registerCommand(VesGettingStartedCommands.SHOW, {
            execute: () => this.openView({ reveal: true }),
        });
    }

    registerMenus(menus: MenuModelRegistry): void {
        menus.registerMenuAction(CommonMenus.HELP, {
            commandId: VesGettingStartedCommands.SHOW.id,
            label: VesGettingStartedCommands.SHOW.label,
            order: 'a10'
        });
    }
}
