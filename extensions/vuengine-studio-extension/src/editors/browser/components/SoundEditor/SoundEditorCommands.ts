import { nls } from '@theia/core';
import { EditorCommand } from '../../ves-editors-types';

export namespace SoundEditorCommands {
    export const PLAY_PAUSE: EditorCommand = {
        id: 'editors.soundEditor.playPause',
        label: nls.localize('vuengine/editors/sound/commands/playPause', 'Play / Pause'),
        category: nls.localize('vuengine/editors/sound/commands/category', 'Sound Editor'),
        keybinding: 'space',
    };
    export const STOP: EditorCommand = {
        id: 'editors.soundEditor.stop',
        label: nls.localize('vuengine/editors/sound/commands/stop', 'Stop'),
        category: nls.localize('vuengine/editors/sound/commands/category', 'Sound Editor'),
        keybinding: 'shift+space',
    };
    export const TOOL_PENCIL: EditorCommand = {
        id: 'editors.soundEditor.toolPencil',
        label: nls.localize('vuengine/editors/sound/commands/toolPencil', 'Tool: Pencil'),
        category: nls.localize('vuengine/editors/sound/commands/category', 'Sound Editor'),
        keybinding: 'b',
    };
    export const TOOL_ERASER: EditorCommand = {
        id: 'editors.soundEditor.toolEraser',
        label: nls.localize('vuengine/editors/sound/commands/toolEraser', 'Tool: Eraser'),
        category: nls.localize('vuengine/editors/sound/commands/category', 'Sound Editor'),
        keybinding: 'e',
    };
    export const TOOL_MARQUEE: EditorCommand = {
        id: 'editors.soundEditor.toolMarquee',
        label: nls.localize('vuengine/editors/sound/commands/toolMarquee', 'Tool: Marquee'),
        category: nls.localize('vuengine/editors/sound/commands/category', 'Sound Editor'),
        keybinding: 'm',
    };
    export const SELECT_CHANNEL_1: EditorCommand = {
        id: 'editors.soundEditor.selectChannel1',
        label: nls.localize('vuengine/editors/sound/commands/selectChannel1', 'Select Channel 1'),
        category: nls.localize('vuengine/editors/sound/commands/category', 'Sound Editor'),
        keybinding: '1',
    };
    export const SELECT_CHANNEL_2: EditorCommand = {
        id: 'editors.soundEditor.selectChannel2',
        label: nls.localize('vuengine/editors/sound/commands/selectChannel2', 'Select Channel 2'),
        category: nls.localize('vuengine/editors/sound/commands/category', 'Sound Editor'),
        keybinding: '2',
    };
    export const SELECT_CHANNEL_3: EditorCommand = {
        id: 'editors.soundEditor.selectChannel3',
        label: nls.localize('vuengine/editors/sound/commands/selectChannel3', 'Select Channel 1'),
        category: nls.localize('vuengine/editors/sound/commands/category', 'Sound Editor'),
        keybinding: '3',
    };
    export const SELECT_CHANNEL_4: EditorCommand = {
        id: 'editors.soundEditor.selectChannel4',
        label: nls.localize('vuengine/editors/sound/commands/selectChannel4', 'Select Channel 1'),
        category: nls.localize('vuengine/editors/sound/commands/category', 'Sound Editor'),
        keybinding: '4',
    };
    export const SELECT_CHANNEL_5: EditorCommand = {
        id: 'editors.soundEditor.selectChannel5',
        label: nls.localize('vuengine/editors/sound/commands/selectChannel5', 'Select Channel 1'),
        category: nls.localize('vuengine/editors/sound/commands/category', 'Sound Editor'),
        keybinding: '5',
    };
    export const SELECT_CHANNEL_6: EditorCommand = {
        id: 'editors.soundEditor.selectChannel6',
        label: nls.localize('vuengine/editors/sound/commands/selectChannel6', 'Select Channel 1'),
        category: nls.localize('vuengine/editors/sound/commands/category', 'Sound Editor'),
        keybinding: '6',
    };
    export const SELECT_NEXT_CHANNEL: EditorCommand = {
        id: 'editors.soundEditor.nextSequenceIndex',
        label: nls.localize('vuengine/editors/sound/commands/nextSequenceIndex', 'Select Next Sequence Index'),
        category: nls.localize('vuengine/editors/sound/commands/category', 'Sound Editor'),
        keybinding: 'shift+down',
    };
    export const SELECT_PREVIOUS_CHANNEL: EditorCommand = {
        id: 'editors.soundEditor.previousSequenceIndex',
        label: nls.localize('vuengine/editors/sound/commands/previousSequenceIndex', 'Select Previous Sequence Index'),
        category: nls.localize('vuengine/editors/sound/commands/category', 'Sound Editor'),
        keybinding: 'shift+up',
    };
    export const ADD_PATTERN: EditorCommand = {
        id: 'editors.soundEditor.addPattern',
        label: nls.localize('vuengine/editors/sound/commands/addPattern', 'Add Pattern To Current Channel'),
        category: nls.localize('vuengine/editors/sound/commands/category', 'Sound Editor'),
        keybinding: ['shift+add', 'shift+plus'],
    };
    export const REMOVE_CURRENT_PATTERN: EditorCommand = {
        id: 'editors.soundEditor.removeCurrentPattern',
        label: nls.localize('vuengine/editors/sound/commands/removeCurrentPattern', 'Remove Current Pattern From Sequence'),
        category: nls.localize('vuengine/editors/sound/commands/category', 'Sound Editor'),
        keybinding: 'shift+del',
    };
    export const SELECT_NEXT_SEQUENCE_INDEX: EditorCommand = {
        id: 'editors.soundEditor.selectNextSequenceIndex',
        label: nls.localize('vuengine/editors/sound/commands/selectNextSequenceIndex', 'Select Next Sequence Index'),
        category: nls.localize('vuengine/editors/sound/commands/category', 'Sound Editor'),
        keybinding: 'shift+right',
    };
    export const SELECT_PREVIOUS_SEQUENCE_INDEX: EditorCommand = {
        id: 'editors.soundEditor.selectPreviousSequenceIndex',
        label: nls.localize('vuengine/editors/sound/commands/selectPreviousSequenceIndex', 'Select Previous Sequence Index'),
        category: nls.localize('vuengine/editors/sound/commands/category', 'Sound Editor'),
        keybinding: 'shift+left',
    };
    export const ADD_NOTE: EditorCommand = {
        id: 'editors.soundEditor.addNote',
        label: nls.localize('vuengine/editors/sound/commands/addNote', 'Add Note'),
        category: nls.localize('vuengine/editors/sound/commands/category', 'Sound Editor'),
        keybinding: 'n',
    };
    export const ADD_EFFECT: EditorCommand = {
        id: 'editors.soundEditor.addEffect',
        label: nls.localize('vuengine/editors/sound/commands/addEffect', 'Add Effect'),
        category: nls.localize('vuengine/editors/sound/commands/category', 'Sound Editor'),
        keybinding: 'f',
    };
    export const PIANO_ROLL_SELECT_NEXT_TICK: EditorCommand = {
        id: 'editors.soundEditor.pianoRollSelectNextTick',
        label: nls.localize('vuengine/editors/sound/commands/pianoRollSelectNextTick', 'Piano Roll: Select Next Tick'),
        category: nls.localize('vuengine/editors/sound/commands/category', 'Sound Editor'),
        keybinding: 'right',
    };
    export const PIANO_ROLL_SELECT_PREVIOUS_TICK: EditorCommand = {
        id: 'editors.soundEditor.pianoRollSelectPreviousTick',
        label: nls.localize('vuengine/editors/sound/commands/pianoRollSelectPreviousTick', 'Piano Roll: Select Previous Tick'),
        category: nls.localize('vuengine/editors/sound/commands/category', 'Sound Editor'),
        keybinding: 'left',
    };
    export const REMOVE_CURRENT_NOTE: EditorCommand = {
        id: 'editors.soundEditor.removeCurrentNote',
        label: nls.localize('vuengine/editors/sound/commands/removeCurrentNote', 'Remove Current Note'),
        category: nls.localize('vuengine/editors/sound/commands/category', 'Sound Editor'),
        keybinding: 'del',
    };
};
