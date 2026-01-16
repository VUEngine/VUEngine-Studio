import { CommandRegistry } from '@theia/core';
import { injectable } from '@theia/core/shared/inversify';
import { KeymapsCommands, KeymapsFrontendContribution } from '@theia/keymaps/lib/browser';
import { VesKeybindingWidget } from './ves-keybindings-widget';

@injectable()
export class VesKeymapsFrontendContribution extends KeymapsFrontendContribution {
    override registerCommands(commands: CommandRegistry): void {
        super.registerCommands(commands);

        commands.unregisterCommand(KeymapsCommands.OPEN_KEYMAPS.id);
        commands.registerCommand(KeymapsCommands.OPEN_KEYMAPS, {
            isEnabled: () => true,
            execute: async (q?: string) => {
                const widget = await this.openView({ activate: true });
                if (q) {
                    (widget as VesKeybindingWidget)?.search(q);
                }
            }
        });
    }
}
