import { Command } from '@theia/core';

export namespace VesCoreCommands {
    export const REPORT_ISSUE: Command = Command.toLocalizedCommand(
        {
            id: 'ves.reportIssue',
            label: 'Report Issue',
            category: 'VUEngine Studio',
        },
        'vuengine/general/commands/reportIssue',
        'vuengine/general/commands/category'
    );
    export const SUPPORT: Command = Command.toLocalizedCommand(
        {
            id: 'ves.support',
            label: 'Support Us',
            category: 'VUEngine Studio',
        },
        'vuengine/general/commands/support',
        'vuengine/general/commands/category'
    );
    export const OPEN_DOCUMENTATION: Command = Command.toLocalizedCommand(
        {
            id: 'ves.openDocumentation',
            label: 'Open Documentation',
            category: 'VUEngine Studio',
        },
        'vuengine/documentation/commands/openDocumentation',
        'vuengine/documentation/commands/category'
    );
}
