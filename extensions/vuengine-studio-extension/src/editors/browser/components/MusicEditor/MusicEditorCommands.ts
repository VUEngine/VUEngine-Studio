import { nls } from '@theia/core';

export const MusicEditorCommands = {
    PLAY_PAUSE: {
        id: 'editors.musicEditor.playPause',
        label: nls.localize('vuengine/editors/commands/musicEditor/playPause', 'Play / Pause'),
        category: nls.localize('vuengine/editors/commands/musicEditor/category', 'Music Editor'),
        keybinding: 'space',
    },
};
