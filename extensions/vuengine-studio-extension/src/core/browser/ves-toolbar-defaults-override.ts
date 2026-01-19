import { CommonCommands, quickCommand } from '@theia/core/lib/browser';
import { EditorCommands } from '@theia/editor/lib/browser';
import { DeflatedToolbarTree, ToolbarAlignment } from '@theia/toolbar/lib/browser/toolbar-interfaces';
import { VesBuildCommands } from '../../build/browser/ves-build-commands';
import { VesCodeGenCommands } from '../../codegen/browser/ves-codegen-commands';
import { EmulatorCommands } from '../../emulator/browser/ves-emulator-commands';
import { VesExportCommands } from '../../export/browser/ves-export-commands';
import { VesFlashCartCommands } from '../../flash-cart/browser/ves-flash-cart-commands';
import { VesProjectCommands } from '../../project/browser/ves-project-commands';

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
                {
                    'id': VesProjectCommands.DASHBOARD_SHOW.id,
                    'command': VesProjectCommands.DASHBOARD_SHOW.id,
                    'icon': 'codicon codicon-compass'
                },
                {
                    'id': CommonCommands.OPEN_PREFERENCES.id,
                    'command': CommonCommands.OPEN_PREFERENCES.id,
                    'icon': 'codicon codicon-settings'
                },
                {
                    'id': quickCommand.id,
                    'command': quickCommand.id,
                    'icon': 'codicon codicon-terminal',
                    'tooltip': 'Command Palette'
                }
            ]
        ],
        [ToolbarAlignment.RIGHT]: [
            [
                {
                    'id': VesBuildCommands.BUILD.id,
                    'command': VesBuildCommands.BUILD.id,
                    'icon': 'codicon codicon-symbol-property'
                },
                {
                    'id': EmulatorCommands.RUN.id,
                    'command': EmulatorCommands.RUN.id,
                    'icon': 'codicon codicon-run'
                },
                {
                    'id': VesFlashCartCommands.FLASH.id,
                    'command': VesFlashCartCommands.FLASH.id,
                    'icon': 'codicon codicon-empty-window codicon-rotate-180'
                }
            ],
            [
                {
                    'id': VesExportCommands.EXPORT.id,
                    'command': VesExportCommands.EXPORT.id,
                    'icon': 'codicon codicon-desktop-download'
                },
                {
                    'id': VesBuildCommands.CLEAN.id,
                    'command': VesBuildCommands.CLEAN.id,
                    'icon': 'codicon codicon-trash'
                }
            ],
            [
                {
                    'id': VesCodeGenCommands.GENERATE_FILES.id,
                    'command': VesCodeGenCommands.GENERATE_FILES.id,
                    'icon': 'codicon codicon-server-process'
                }
            ]
        ]
    },
});
