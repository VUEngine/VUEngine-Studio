import { DeflatedToolbarTree, ToolbarAlignment } from '@theia/toolbar/lib/browser/toolbar-interfaces';

export const VesToolbarDefaultsOverride: () => DeflatedToolbarTree = () => ({
    items: {
        [ToolbarAlignment.LEFT]: [
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
            ]
        ],
        [ToolbarAlignment.RIGHT]: [
            [
                {
                    'id': 'VesBuild.commands.build',
                    'command': 'VesBuild.commands.build',
                    'icon': 'codicon codicon-wrench'
                },
                {
                    'id': 'VesEmulator.commands.run',
                    'command': 'VesEmulator.commands.run',
                    'icon': 'codicon codicon-run'
                },
                {
                    'id': 'vesFlashCart.commands.flash',
                    'command': 'vesFlashCart.commands.flash',
                    'icon': 'fa fa-microchip'
                },
                {
                    'id': 'VesExport.commands.export',
                    'command': 'VesExport.commands.export',
                    'icon': 'codicon codicon-desktop-download'
                },
                {
                    'id': 'VesBuild.commands.clean',
                    'command': 'VesBuild.commands.clean',
                    'icon': 'codicon codicon-trash'
                }
            ]
        ]
    },
});
