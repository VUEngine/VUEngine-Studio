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
            ],
            [
                {
                    'id': 'core.save',
                    'command': 'core.save',
                    'icon': 'codicon codicon-save'
                },
                {
                    'id': 'core.undo',
                    'command': 'core.undo',
                    'icon': 'codicon codicon-discard'
                },
                {
                    'id': 'core.redo',
                    'command': 'core.redo',
                    'icon': 'codicon codicon-redo'
                }
            ],
            [
                {
                    'id': 'workbench.action.showCommands',
                    'command': 'workbench.action.showCommands',
                    'icon': 'codicon codicon-terminal',
                    'tooltip': 'Command Palette'
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
                }
            ],
            [
                {
                    'id': 'ves:codegen:generateFiles',
                    'command': 'ves:codegen:generateFiles',
                    'icon': 'codicon codicon-server-process'
                }
            ]
        ]
    },
});
