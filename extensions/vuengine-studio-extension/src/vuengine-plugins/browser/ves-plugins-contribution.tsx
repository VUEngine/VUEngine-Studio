import { injectable } from '@theia/core/shared/inversify';
import { CommandContribution, CommandRegistry } from '@theia/core/lib/common/command';

import { VesPluginsCommands } from './ves-plugins-commands';

@injectable()
export class VesPluginsContribution implements CommandContribution {
    registerCommands(commandRegistry: CommandRegistry): void {
        commandRegistry.registerCommand(VesPluginsCommands.NEW, {
            execute: () => console.log('NOOP')
        });
    }
}
