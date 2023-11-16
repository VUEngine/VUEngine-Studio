import { Command } from '@theia/core';

export namespace VesEditorsCommands {
    export const OPEN_SOURCE: Command = Command.toLocalizedCommand(
        {
            id: 'ves:editors:showSource',
            label: 'Show Source',
            category: 'Editor',
            iconClass: 'codicon codicon-json',
        },
        'vuengine/editors/showSource',
        'vuengine/editors/commands/category'
    );
};
