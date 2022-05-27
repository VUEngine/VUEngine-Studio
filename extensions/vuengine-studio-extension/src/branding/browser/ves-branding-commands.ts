import { Command } from '@theia/core';

export namespace VesBrandingCommands {
    export const REPORT_ISSUE: Command = Command.toLocalizedCommand(
        {
            id: 'ves:general:reportIssue',
            label: 'Report Issue',
            category: 'VUEngine Studio',
        },
        'vuengine/general/commands/reportIssue',
        'vuengine/general/commands/category'
    );
    export const SUPPORT: Command = Command.toLocalizedCommand(
        {
            id: 'ves:general:support',
            label: 'Support VUEngine Studio',
            category: 'VUEngine Studio',
        },
        'vuengine/general/commands/support',
        'vuengine/general/commands/category'
    );
}
