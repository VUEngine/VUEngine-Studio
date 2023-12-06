import { Command } from '@theia/core';

export namespace VesEditorsCommands {
    export const GENERATE: Command = Command.toLocalizedCommand(
        {
            id: 'ves:editors:generate',
            label: 'Generate File(s)',
            category: 'Editor',
            iconClass: 'codicon codicon-server-process',
        },
        'vuengine/editors/generate',
        'vuengine/editors/commands/category'
    );
    export const OPEN_IN_EDITOR: Command = Command.toLocalizedCommand(
        {
            id: 'ves:editors:openInEditor',
            label: 'Open in graphical editor',
            category: 'Editor',
            iconClass: 'codicon codicon-preview',
        },
        'vuengine/editors/openInEditor',
        'vuengine/editors/commands/category'
    );
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
