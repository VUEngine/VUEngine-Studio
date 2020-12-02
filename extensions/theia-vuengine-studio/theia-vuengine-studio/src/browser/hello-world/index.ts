import { injectable, inject } from "inversify";
import { CommandContribution, CommandRegistry, MenuContribution, MenuModelRegistry, MessageService } from "@theia/core/lib/common";
import { CommonMenus } from "@theia/core/lib/browser";
export const TheiaHelloWorldExtensionCommand = {
    id: 'TheiaHelloWorldExtension.command',
    label: "Say Hello"
};

@injectable()
export class TheiaHelloWorldExtensionCommandContribution implements CommandContribution {

    constructor(
        @inject(MessageService) private readonly messageService: MessageService,
    ) { }

    registerCommands(registry: CommandRegistry): void {
        registry.registerCommand(TheiaHelloWorldExtensionCommand, {
            execute: () => this.messageService.info('Hello World!')
        });
    }
}

@injectable()
export class TheiaHelloWorldExtensionMenuContribution implements MenuContribution {
    registerMenus(menus: MenuModelRegistry): void {
        menus.registerMenuAction(CommonMenus.EDIT_FIND, {
            commandId: TheiaHelloWorldExtensionCommand.id,
            label: TheiaHelloWorldExtensionCommand.label
        });
    }
}