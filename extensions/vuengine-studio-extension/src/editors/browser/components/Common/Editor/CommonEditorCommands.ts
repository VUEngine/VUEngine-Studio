import { nls } from '@theia/core';
import { EditorCommand } from '../../../ves-editors-types';

export namespace CommonEditorCommands {
    export const CENTER: EditorCommand = {
        id: 'editors.common.center',
        label: nls.localize('vuengine/editors/general/commands/center', 'Center'),
        category: nls.localize('vuengine/editors/general/commands/category', 'Actor Editor'),
    };
    export const ZOOM_IN: EditorCommand = {
        id: 'editors.common.zoomIn',
        label: nls.localize('vuengine/editors/general/commands/zoomIn', 'Zoom In'),
        category: nls.localize('vuengine/editors/general/commands/category', 'Actor Editor'),
    };
    export const ZOOM_OUT: EditorCommand = {
        id: 'editors.common.zoomOut',
        label: nls.localize('vuengine/editors/general/commands/zoomOut', 'Zoom Out'),
        category: nls.localize('vuengine/editors/general/commands/category', 'Actor Editor'),
    };
    export const ZOOM_RESET: EditorCommand = {
        id: 'editors.common.zoomReset',
        label: nls.localize('vuengine/editors/general/commands/zoomReset', 'Reset Zoom'),
        category: nls.localize('vuengine/editors/general/commands/category', 'Actor Editor'),
    };
};
