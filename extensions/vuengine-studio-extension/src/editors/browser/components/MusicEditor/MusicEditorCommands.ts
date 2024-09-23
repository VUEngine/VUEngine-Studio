import { nls } from '@theia/core';
import { EditorCommands } from '../../ves-editors-types';

export const MusicEditorCommands: EditorCommands = {
    PLAY_PAUSE: {
        id: 'editors.musicEditor.playPause',
        label: nls.localize('vuengine/editors/commands/musicEditor/playPause', 'Play / Pause'),
        category: nls.localize('vuengine/editors/commands/musicEditor/category', 'Music Editor'),
        keybinding: 'space',
    },
    STOP: {
        id: 'editors.musicEditor.stop',
        label: nls.localize('vuengine/editors/commands/musicEditor/stop', 'Stop'),
        category: nls.localize('vuengine/editors/commands/musicEditor/category', 'Music Editor'),
        keybinding: 'esc',
    },
    TOOL_PENCIL: {
        id: 'editors.musicEditor.toolPencil',
        label: nls.localize('vuengine/editors/commands/musicEditor/toolPencil', 'Tool: Pencil'),
        category: nls.localize('vuengine/editors/commands/musicEditor/category', 'Font Editor'),
        keybinding: 'b',
    },
    TOOL_ERASER: {
        id: 'editors.musicEditor.toolEraser',
        label: nls.localize('vuengine/editors/commands/musicEditor/toolEraser', 'Tool: Eraser'),
        category: nls.localize('vuengine/editors/commands/musicEditor/category', 'Font Editor'),
        keybinding: 'e',
    },
    TOOL_MARQUEE: {
        id: 'editors.musicEditor.toolMarquee',
        label: nls.localize('vuengine/editors/commands/musicEditor/toolMarquee', 'Tool: Marquee'),
        category: nls.localize('vuengine/editors/commands/musicEditor/category', 'Font Editor'),
        keybinding: 'm',
    },
};
