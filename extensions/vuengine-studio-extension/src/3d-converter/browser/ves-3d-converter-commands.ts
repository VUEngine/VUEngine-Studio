import { Command } from '@theia/core';

export namespace Ves3dConverterCommands {
    export const WIDGET_OPEN: Command = Command.toLocalizedCommand(
        {
            id: 'ves:3dConverter:openWidget',
            label: 'Open 3D Converter',
            category: 'Tools',
        },
        'vuengine/3dConverter/commands/openWidget',
        'vuengine/3dConverter/commands/category'
    );

    export const WIDGET_EXPAND: Command = Command.toLocalizedCommand(
        {
            id: 'ves:3dConverter:expand',
            label: 'Toggle Maximized',
            iconClass: 'codicon codicon-arrow-both',
        },
        'vuengine/3dConverter/commands/expand',
        'vuengine/3dConverter/commands/category'
    );

    export const WIDGET_HELP: Command = Command.toLocalizedCommand(
        {
            id: 'ves:3dConverter:help',
            label: 'Show Handbook Page',
            iconClass: 'codicon codicon-book',
        },
        'vuengine/3dConverter/commands/help',
        'vuengine/3dConverter/commands/category'
    );
};
