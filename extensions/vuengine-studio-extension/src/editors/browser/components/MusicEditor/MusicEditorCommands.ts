import { nls } from '@theia/core';
import { EditorCommand } from '../../ves-editors-types';

export namespace MusicEditorCommands {
    export const PLAY_PAUSE: EditorCommand = {
        id: 'editors.musicEditor.playPause',
        label: nls.localize('vuengine/editors/music/commands/playPause', 'Play / Pause'),
        category: nls.localize('vuengine/editors/music/commands/category', 'Music Editor'),
        keybinding: 'space',
    };
    export const STOP: EditorCommand = {
        id: 'editors.musicEditor.stop',
        label: nls.localize('vuengine/editors/music/commands/stop', 'Stop'),
        category: nls.localize('vuengine/editors/music/commands/category', 'Music Editor'),
        keybinding: 'esc',
    };
    export const TOOL_PENCIL: EditorCommand = {
        id: 'editors.musicEditor.toolPencil',
        label: nls.localize('vuengine/editors/music/commands/toolPencil', 'Tool: Pencil'),
        category: nls.localize('vuengine/editors/music/commands/category', 'Font Editor'),
        keybinding: 'b',
    };
    export const TOOL_ERASER: EditorCommand = {
        id: 'editors.musicEditor.toolEraser',
        label: nls.localize('vuengine/editors/music/commands/toolEraser', 'Tool: Eraser'),
        category: nls.localize('vuengine/editors/music/commands/category', 'Font Editor'),
        keybinding: 'e',
    };
    export const TOOL_MARQUEE: EditorCommand = {
        id: 'editors.musicEditor.toolMarquee',
        label: nls.localize('vuengine/editors/music/commands/toolMarquee', 'Tool: Marquee'),
        category: nls.localize('vuengine/editors/music/commands/category', 'Font Editor'),
        keybinding: 'm',
    };
};
