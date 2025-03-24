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
        keybinding: 'shift+space',
    };
    export const TOOL_PENCIL: EditorCommand = {
        id: 'editors.musicEditor.toolPencil',
        label: nls.localize('vuengine/editors/music/commands/toolPencil', 'Tool: Pencil'),
        category: nls.localize('vuengine/editors/music/commands/category', 'Music Editor'),
        keybinding: 'b',
    };
    export const TOOL_ERASER: EditorCommand = {
        id: 'editors.musicEditor.toolEraser',
        label: nls.localize('vuengine/editors/music/commands/toolEraser', 'Tool: Eraser'),
        category: nls.localize('vuengine/editors/music/commands/category', 'Music Editor'),
        keybinding: 'e',
    };
    export const TOOL_MARQUEE: EditorCommand = {
        id: 'editors.musicEditor.toolMarquee',
        label: nls.localize('vuengine/editors/music/commands/toolMarquee', 'Tool: Marquee'),
        category: nls.localize('vuengine/editors/music/commands/category', 'Music Editor'),
        keybinding: 'm',
    };
    export const SELECT_CHANNEL_1: EditorCommand = {
        id: 'editors.musicEditor.selectChannel1',
        label: nls.localize('vuengine/editors/music/commands/selectChannel1', 'Select Channel 1'),
        category: nls.localize('vuengine/editors/music/commands/category', 'Music Editor'),
        keybinding: '1',
    };
    export const SELECT_CHANNEL_2: EditorCommand = {
        id: 'editors.musicEditor.selectChannel2',
        label: nls.localize('vuengine/editors/music/commands/selectChannel2', 'Select Channel 2'),
        category: nls.localize('vuengine/editors/music/commands/category', 'Music Editor'),
        keybinding: '2',
    };
    export const SELECT_CHANNEL_3: EditorCommand = {
        id: 'editors.musicEditor.selectChannel3',
        label: nls.localize('vuengine/editors/music/commands/selectChannel3', 'Select Channel 1'),
        category: nls.localize('vuengine/editors/music/commands/category', 'Music Editor'),
        keybinding: '3',
    };
    export const SELECT_CHANNEL_4: EditorCommand = {
        id: 'editors.musicEditor.selectChannel4',
        label: nls.localize('vuengine/editors/music/commands/selectChannel4', 'Select Channel 1'),
        category: nls.localize('vuengine/editors/music/commands/category', 'Music Editor'),
        keybinding: '4',
    };
    export const SELECT_CHANNEL_5: EditorCommand = {
        id: 'editors.musicEditor.selectChannel5',
        label: nls.localize('vuengine/editors/music/commands/selectChannel5', 'Select Channel 1'),
        category: nls.localize('vuengine/editors/music/commands/category', 'Music Editor'),
        keybinding: '5',
    };
    export const SELECT_CHANNEL_6: EditorCommand = {
        id: 'editors.musicEditor.selectChannel6',
        label: nls.localize('vuengine/editors/music/commands/selectChannel6', 'Select Channel 1'),
        category: nls.localize('vuengine/editors/music/commands/category', 'Music Editor'),
        keybinding: '6',
    };
    export const SELECT_NEXT_CHANNEL: EditorCommand = {
        id: 'editors.musicEditor.nextSequenceIndex',
        label: nls.localize('vuengine/editors/music/commands/nextSequenceIndex', 'Select Next Sequence Index'),
        category: nls.localize('vuengine/editors/music/commands/category', 'Music Editor'),
        keybinding: 'shift+down',
    };
    export const SELECT_PREVIOUS_CHANNEL: EditorCommand = {
        id: 'editors.musicEditor.previousSequenceIndex',
        label: nls.localize('vuengine/editors/music/commands/previousSequenceIndex', 'Select Previous Sequence Index'),
        category: nls.localize('vuengine/editors/music/commands/category', 'Music Editor'),
        keybinding: 'shift+up',
    };
    export const ADD_PATTERN: EditorCommand = {
        id: 'editors.musicEditor.addPattern',
        label: nls.localize('vuengine/editors/music/commands/addPattern', 'Add Pattern To Current Channel'),
        category: nls.localize('vuengine/editors/music/commands/category', 'Music Editor'),
        keybinding: ['shift+add', 'shift+plus'],
    };
    export const REMOVE_CURRENT_PATTERN: EditorCommand = {
        id: 'editors.musicEditor.removeCurrentPattern',
        label: nls.localize('vuengine/editors/music/commands/removeCurrentPattern', 'Remove Current Pattern From Sequence'),
        category: nls.localize('vuengine/editors/music/commands/category', 'Music Editor'),
        keybinding: 'shift+del',
    };
    export const SELECT_NEXT_SEQUENCE_INDEX: EditorCommand = {
        id: 'editors.musicEditor.selectNextSequenceIndex',
        label: nls.localize('vuengine/editors/music/commands/selectNextSequenceIndex', 'Select Next Sequence Index'),
        category: nls.localize('vuengine/editors/music/commands/category', 'Music Editor'),
        keybinding: 'shift+right',
    };
    export const SELECT_PREVIOUS_SEQUENCE_INDEX: EditorCommand = {
        id: 'editors.musicEditor.selectPreviousSequenceIndex',
        label: nls.localize('vuengine/editors/music/commands/selectPreviousSequenceIndex', 'Select Previous Sequence Index'),
        category: nls.localize('vuengine/editors/music/commands/category', 'Music Editor'),
        keybinding: 'shift+left',
    };
    export const ADD_NOTE: EditorCommand = {
        id: 'editors.musicEditor.addNote',
        label: nls.localize('vuengine/editors/music/commands/addNote', 'Add Note'),
        category: nls.localize('vuengine/editors/music/commands/category', 'Music Editor'),
        keybinding: 'n',
    };
    export const ADD_EFFECT: EditorCommand = {
        id: 'editors.musicEditor.addEffect',
        label: nls.localize('vuengine/editors/music/commands/addEffect', 'Add Effect'),
        category: nls.localize('vuengine/editors/music/commands/category', 'Music Editor'),
        keybinding: 'f',
    };
    export const PIANO_ROLL_SELECT_NEXT_TICK: EditorCommand = {
        id: 'editors.musicEditor.pianoRollSelectNextTick',
        label: nls.localize('vuengine/editors/music/commands/pianoRollSelectNextTick', 'Piano Roll: Select Next Tick'),
        category: nls.localize('vuengine/editors/music/commands/category', 'Music Editor'),
        keybinding: 'right',
    };
    export const PIANO_ROLL_SELECT_PREVIOUS_TICK: EditorCommand = {
        id: 'editors.musicEditor.pianoRollSelectPreviousTick',
        label: nls.localize('vuengine/editors/music/commands/pianoRollSelectPreviousTick', 'Piano Roll: Select Previous Tick'),
        category: nls.localize('vuengine/editors/music/commands/category', 'Music Editor'),
        keybinding: 'left',
    };
    export const REMOVE_CURRENT_NOTE: EditorCommand = {
        id: 'editors.musicEditor.removeCurrentNote',
        label: nls.localize('vuengine/editors/music/commands/removeCurrentNote', 'Remove Current Note'),
        category: nls.localize('vuengine/editors/music/commands/category', 'Music Editor'),
        keybinding: 'del',
    };
};
