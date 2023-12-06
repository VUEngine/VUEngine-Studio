import { DeflatedToolbarTree, ToolbarAlignment } from '@theia/toolbar/lib/browser/toolbar-interfaces';

export const VesToolbarDefaultsOverride: () => DeflatedToolbarTree = () => ({
    items: {
        [ToolbarAlignment.LEFT]: [
            [
                {
                    'id': 'textEditor.commands.go.back',
                    'command': 'textEditor.commands.go.back',
                    'icon': 'codicon codicon-arrow-left'
                },
                {
                    'id': 'textEditor.commands.go.forward',
                    'command': 'textEditor.commands.go.forward',
                    'icon': 'codicon codicon-arrow-right'
                }
            ]
        ],
        [ToolbarAlignment.CENTER]: [
        ],
        [ToolbarAlignment.RIGHT]: [
            [
                {
                    'id': 'ves:build:build',
                    'command': 'ves:build:build',
                    'icon': 'codicon codicon-tools'
                },
                {
                    'id': 'ves:emulator:run',
                    'command': 'ves:emulator:run',
                    'icon': 'codicon codicon-run'
                },
                {
                    'id': 'ves:flashCarts:flash',
                    'command': 'ves:flashCarts:flash',
                    'icon': 'codicon codicon-layout-statusbar'
                },
                {
                    'id': 'ves:codegen:generateFiles',
                    'command': 'ves:codegen:generateFiles',
                    'icon': 'codicon codicon-server-process'
                }
            ]
        ]
    },
});
