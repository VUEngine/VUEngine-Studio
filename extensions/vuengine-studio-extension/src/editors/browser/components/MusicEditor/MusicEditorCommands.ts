import { nls } from '@theia/core';
import { EditorCommands } from '../../ves-editors-types';

export const MusicEditorCommands: EditorCommands = {
    PLAY_PAUSE: {
        id: 'editors.musicEditor.playPause',
        label: nls.localize('vuengine/editors/commands/musicEditor/playPause', 'Play / Pause'),
        category: nls.localize('vuengine/editors/commands/musicEditor/category', 'Music Editor'),
        keybinding: 'space',
    },
};
