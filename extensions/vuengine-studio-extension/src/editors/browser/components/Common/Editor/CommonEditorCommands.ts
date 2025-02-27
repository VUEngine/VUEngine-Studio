import { nls } from '@theia/core';
import { EditorCommands } from '../../../ves-editors-types';

export const CommonEditorCommands: EditorCommands = {
    CENTER: {
        id: 'editors.common.center',
        label: nls.localize('vuengine/editors/general/commands/center', 'Center'),
        category: nls.localize('vuengine/editors/general/commands/category', 'Actor Editor'),
    },
    ZOOM_IN: {
        id: 'editors.common.zoomIn',
        label: nls.localize('vuengine/editors/general/commands/zoomIn', 'Zoom In'),
        category: nls.localize('vuengine/editors/general/commands/category', 'Actor Editor'),
    },
    ZOOM_OUT: {
        id: 'editors.common.zoomOut',
        label: nls.localize('vuengine/editors/general/commands/zoomOut', 'Zoom Out'),
        category: nls.localize('vuengine/editors/general/commands/category', 'Actor Editor'),
    },
    ZOOM_RESET: {
        id: 'editors.common.zoomReset',
        label: nls.localize('vuengine/editors/general/commands/zoomReset', 'Reset Zoom'),
        category: nls.localize('vuengine/editors/general/commands/category', 'Actor Editor'),
    },
};
