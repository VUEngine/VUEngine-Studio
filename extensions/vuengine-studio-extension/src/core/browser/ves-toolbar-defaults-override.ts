import { DeflatedToolbarTree, ToolbarAlignment } from '@theia/toolbar/lib/browser/toolbar-interfaces';

export const VesToolbarDefaultsOverride: () => DeflatedToolbarTree = () => ({
    items: {
        [ToolbarAlignment.LEFT]: [
            [
                {
                    'id': 'workspace:openWorkspace',
                    'command': 'workspace:openWorkspace',
                    'icon': 'codicon codicon-file-code'
                },
                {
                    'id': 'workspace:openRecent',
                    'command': 'workspace:openRecent',
                    'icon': 'codicon codicon-list-unordered'
                }
            ],
            [
                {
                    'id': 'core.undo',
                    'command': 'core.undo',
                    'icon': 'codicon codicon-discard'
                },
                {
                    'id': 'core.redo',
                    'command': 'core.redo',
                    'icon': 'codicon codicon-redo'
                },
                {
                    'id': 'core.saveAll',
                    'command': 'core.saveAll',
                    'icon': 'codicon codicon-save-all'
                }
            ],
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
                    'id': 'toolbar.add.command',
                    'command': 'toolbar.add.command',
                    'icon': 'codicon codicon-plus'
                }
            ]
        ],
        [ToolbarAlignment.CENTER]: [
        ],
        [ToolbarAlignment.RIGHT]: [
            [
                {
                    'id': 'workbench.action.showCommands',
                    'command': 'workbench.action.showCommands',
                    'icon': 'codicon codicon-terminal',
                },
                /*
                {
                    'id': 'ves:build:build',
                    'command': 'ves:build:build',
                    'icon': 'codicon codicon-wrench'
                },
                {
                    'id': 'ves:emulator:run',
                    'command': 'ves:emulator:run',
                    'icon': 'codicon codicon-run'
                },
                {
                    'id': 'ves:flashCarts:flash',
                    'command': 'ves:flashCarts:flash',
                    'icon': 'fa fa-microchip'
                },
                {
                    'id': 'ves:export:export',
                    'command': 'ves:export:export',
                    'icon': 'codicon codicon-desktop-download'
                },
                {
                    'id': 'ves:build:clean',
                    'command': 'ves:build:clean',
                    'icon': 'codicon codicon-trash'
                }
                */
            ]
        ]
    },
});
