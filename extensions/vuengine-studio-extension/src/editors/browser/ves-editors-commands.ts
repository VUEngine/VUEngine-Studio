import { Command } from '@theia/core';

export namespace VesEditorsCommands {
    export const GENERATE: Command = Command.toLocalizedCommand(
        {
            id: 'ves:editors:generate',
            label: 'Generate File(s)',
            category: 'Editor',
            iconClass: 'codicon codicon-server-process',
        },
        'vuengine/editors/commands/generate',
        'vuengine/editors/commands/category'
    );
    export const OPEN_IN_EDITOR: Command = Command.toLocalizedCommand(
        {
            id: 'ves:editors:openInEditor',
            label: 'Open in graphical editor',
            category: 'Editor',
            iconClass: 'codicon codicon-preview',
        },
        'vuengine/editors/commands/openInEditor',
        'vuengine/editors/commands/category'
    );
    export const OPEN_SOURCE: Command = Command.toLocalizedCommand(
        {
            id: 'ves:editors:showSource',
            label: 'Show Source',
            category: 'Editor',
            iconClass: 'codicon codicon-json',
        },
        'vuengine/editors/commands/showSource',
        'vuengine/editors/commands/category'
    );

    export const GENERATE_ID: Command = Command.toLocalizedCommand(
        {
            id: 'ves:editors:generateId',
            label: 'Generate new item ID',
            category: 'Editor',
            iconClass: 'codicon codicon-gear'
        },
        'vuengine/editors/commands/generateId',
        'vuengine/editors/commands/category'
    );
};
