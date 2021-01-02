import { injectable, inject } from "inversify";
import { Command, CommandRegistry, MenuModelRegistry } from "@theia/core/lib/common";
import { CommonMenus, AbstractViewContribution, FrontendApplicationContribution, FrontendApplication } from "@theia/core/lib/browser";
import { WelcomeWidget } from "./welcome-widget";
import { FrontendApplicationStateService } from "@theia/core/lib/browser/frontend-application-state";
import { WorkspaceService } from "@theia/workspace/lib/browser";

export const WelcomeCommand: Command = {
    id: WelcomeWidget.ID,
    label: WelcomeWidget.LABEL,
    category: "Help"
};

@injectable()
export class WelcomeContribution extends AbstractViewContribution<WelcomeWidget> implements FrontendApplicationContribution {

    @inject(FrontendApplicationStateService) protected readonly frontendApplicationStateService: FrontendApplicationStateService;
    @inject(WorkspaceService) protected readonly workspaceService: WorkspaceService;

    constructor() {
        super({
            widgetId: WelcomeWidget.ID,
            widgetName: WelcomeWidget.LABEL,
            defaultWidgetOptions: {
                area: "main",
            }
        });
    }

    async onStart(app: FrontendApplication): Promise<void> {
        if (!this.workspaceService.opened) {
            this.frontendApplicationStateService.reachedState("ready").then(
                () => this.openView({ reveal: true })
            );
        }
    }

    registerCommands(registry: CommandRegistry): void {
        registry.registerCommand(WelcomeCommand, {
            execute: () => this.openView({ reveal: true }),
        });
    }

    registerMenus(menus: MenuModelRegistry): void {
        menus.registerMenuAction(CommonMenus.HELP, {
            commandId: WelcomeCommand.id,
            label: WelcomeCommand.label,
            order: "0"
        });
    }
}
