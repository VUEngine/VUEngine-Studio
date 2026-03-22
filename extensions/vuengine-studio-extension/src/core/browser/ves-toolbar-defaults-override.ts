import { CommonCommands, quickCommand } from '@theia/core/lib/browser';
import { EditorCommands } from '@theia/editor/lib/browser';
import { DeflatedToolbarTree, ToolbarAlignment } from '@theia/toolbar/lib/browser/toolbar-interfaces';
import { VesCodeGenCommands } from '../../codegen/browser/ves-codegen-commands';

export const VesToolbarDefaultsOverride: () => DeflatedToolbarTree = () => ({
    items: {
        [ToolbarAlignment.LEFT]: [
            [
                {
                    'id': EditorCommands.GO_BACK.id,
                    'command': EditorCommands.GO_BACK.id,
                    'icon': 'codicon codicon-arrow-left'
                },
                {
                    'id': EditorCommands.GO_FORWARD.id,
                    'command': EditorCommands.GO_FORWARD.id,
                    'icon': 'codicon codicon-arrow-right'
                }
            ],
            [
                {
                    'id': CommonCommands.SAVE.id,
                    'command': CommonCommands.SAVE.id,
                    'icon': 'codicon codicon-save'
                },
                {
                    'id': CommonCommands.UNDO.id,
                    'command': CommonCommands.UNDO.id,
                    'icon': 'codicon codicon-discard'
                },
                {
                    'id': CommonCommands.REDO.id,
                    'command': CommonCommands.REDO.id,
                    'icon': 'codicon codicon-redo'
                }
            ]
        ],
        [ToolbarAlignment.CENTER]: [
            [
            ]
        ],
        [ToolbarAlignment.RIGHT]: [
            [
                {
                    'id': quickCommand.id,
                    'command': quickCommand.id,
                    'icon': 'codicon codicon-terminal',
                    'tooltip': 'Command Palette'
                },
                {
                    'id': VesCodeGenCommands.GENERATE_FILES.id,
                    'command': VesCodeGenCommands.GENERATE_FILES.id,
                    'icon': 'codicon codicon-server-process'
                }
            ]
        ]
    },
});
