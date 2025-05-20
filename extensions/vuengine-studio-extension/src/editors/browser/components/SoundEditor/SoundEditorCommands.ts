import { nls } from '@theia/core';
import { EditorCommand } from '../../ves-editors-types';

export namespace SoundEditorCommands {
    export const ADD_TRACK: EditorCommand = {
        id: 'editors.soundEditor.addTrack',
        label: nls.localize('vuengine/editors/sound/commands/addTrack', 'Add Track'),
        category: nls.localize('vuengine/editors/sound/commands/category', 'Sound Editor'),
    };
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
    export const TOOL_MARQUEE: EditorCommand = {
        id: 'editors.soundEditor.toolMarquee',
        label: nls.localize('vuengine/editors/sound/commands/toolMarquee', 'Tool: Marquee'),
        category: nls.localize('vuengine/editors/sound/commands/category', 'Sound Editor'),
        keybinding: 'm',
    };
    export const SELECT_TRACK_1: EditorCommand = {
        id: 'editors.soundEditor.selectTrack1',
        label: nls.localize('vuengine/editors/sound/commands/selectTrack1', 'Select Track 1'),
        category: nls.localize('vuengine/editors/sound/commands/category', 'Sound Editor'),
        keybinding: '1',
    };
    export const SELECT_TRACK_2: EditorCommand = {
        id: 'editors.soundEditor.selectTrack2',
        label: nls.localize('vuengine/editors/sound/commands/selectTrack2', 'Select Track 2'),
        category: nls.localize('vuengine/editors/sound/commands/category', 'Sound Editor'),
        keybinding: '2',
    };
    export const SELECT_TRACK_3: EditorCommand = {
        id: 'editors.soundEditor.selectTrack3',
        label: nls.localize('vuengine/editors/sound/commands/selectTrack3', 'Select Track 3'),
        category: nls.localize('vuengine/editors/sound/commands/category', 'Sound Editor'),
        keybinding: '3',
    };
    export const SELECT_TRACK_4: EditorCommand = {
        id: 'editors.soundEditor.selectTrack4',
        label: nls.localize('vuengine/editors/sound/commands/selectTrack4', 'Select Track 4'),
        category: nls.localize('vuengine/editors/sound/commands/category', 'Sound Editor'),
        keybinding: '4',
    };
    export const SELECT_TRACK_5: EditorCommand = {
        id: 'editors.soundEditor.selectTrack5',
        label: nls.localize('vuengine/editors/sound/commands/selectTrack5', 'Select Track 5'),
        category: nls.localize('vuengine/editors/sound/commands/category', 'Sound Editor'),
        keybinding: '5',
    };
    export const SELECT_TRACK_6: EditorCommand = {
        id: 'editors.soundEditor.selectTrack6',
        label: nls.localize('vuengine/editors/sound/commands/selectTrack6', 'Select Track 6'),
        category: nls.localize('vuengine/editors/sound/commands/category', 'Sound Editor'),
        keybinding: '6',
    };
    export const SELECT_NEXT_TRACK: EditorCommand = {
        id: 'editors.soundEditor.nextTrack',
        label: nls.localize('vuengine/editors/sound/commands/nextTrack', 'Select Next Track'),
        category: nls.localize('vuengine/editors/sound/commands/category', 'Sound Editor'),
        keybinding: 'shift+down',
    };
    export const SELECT_PREVIOUS_TRACK: EditorCommand = {
        id: 'editors.soundEditor.previousTrack',
        label: nls.localize('vuengine/editors/sound/commands/previousTrack', 'Select Previous Track'),
        category: nls.localize('vuengine/editors/sound/commands/category', 'Sound Editor'),
        keybinding: 'shift+up',
    };
    export const ADD_PATTERN: EditorCommand = {
        id: 'editors.soundEditor.addPattern',
        label: nls.localize('vuengine/editors/sound/commands/addPattern', 'Add Pattern To Current Track'),
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
    export const PIANO_ROLL_SELECT_NEXT_STEP: EditorCommand = {
        id: 'editors.soundEditor.pianoRollSelectNextStep',
        label: nls.localize('vuengine/editors/sound/commands/pianoRollSelectNextStep', 'Piano Roll: Select Next Step'),
        category: nls.localize('vuengine/editors/sound/commands/category', 'Sound Editor'),
        keybinding: 'right',
    };
    export const PIANO_ROLL_SELECT_PREVIOUS_STEP: EditorCommand = {
        id: 'editors.soundEditor.pianoRollSelectPreviousStep',
        label: nls.localize('vuengine/editors/sound/commands/pianoRollSelectPreviousStep', 'Piano Roll: Select Previous Step'),
        category: nls.localize('vuengine/editors/sound/commands/category', 'Sound Editor'),
        keybinding: 'left',
    };
    export const PIANO_ROLL_SELECT_NEXT_BAR: EditorCommand = {
        id: 'editors.soundEditor.pianoRollSelectNextBar',
        label: nls.localize('vuengine/editors/sound/commands/pianoRollSelectNextBar', 'Piano Roll: Select Next Bar'),
        category: nls.localize('vuengine/editors/sound/commands/category', 'Sound Editor'),
        keybinding: 'shift+right',
    };
    export const PIANO_ROLL_SELECT_PREVIOUS_BAR: EditorCommand = {
        id: 'editors.soundEditor.pianoRollSelectPreviousBar',
        label: nls.localize('vuengine/editors/sound/commands/pianoRollSelectPreviousBar', 'Piano Roll: Select Previous Bar'),
        category: nls.localize('vuengine/editors/sound/commands/category', 'Sound Editor'),
        keybinding: 'shift+left',
    };
    export const NOTE_UP: EditorCommand = {
        id: 'editors.soundEditor.noteUp',
        label: nls.localize('vuengine/editors/sound/commands/noteUp', 'Move Note Up'),
        category: nls.localize('vuengine/editors/sound/commands/category', 'Sound Editor'),
        keybinding: 'up',
    };
    export const NOTE_DOWN: EditorCommand = {
        id: 'editors.soundEditor.noteDown',
        label: nls.localize('vuengine/editors/sound/commands/noteDown', 'Move Note Down'),
        category: nls.localize('vuengine/editors/sound/commands/category', 'Sound Editor'),
        keybinding: 'down',
    };
    export const CURSOR_UP_AN_OCTAVE: EditorCommand = {
        id: 'editors.soundEditor.cursorUpAnOctave',
        label: nls.localize('vuengine/editors/sound/commands/cursorUpAnOctave', 'Move Cursor Up 1 Octave'),
        category: nls.localize('vuengine/editors/sound/commands/category', 'Sound Editor'),
        keybinding: 'shift+up',
    };
    export const CURSOR_DOWN_AN_OCTAVE: EditorCommand = {
        id: 'editors.soundEditor.cursorDownAnOctave',
        label: nls.localize('vuengine/editors/sound/commands/cursorDownAnOctave', 'Move Note Down 1 Octave'),
        category: nls.localize('vuengine/editors/sound/commands/category', 'Sound Editor'),
        keybinding: 'shift+down',
    };
    export const SELECT_PATTERN_AT_CURSOR_POSITION: EditorCommand = {
        id: 'editors.soundEditor.selectPatternAtCursorPosition',
        label: nls.localize('vuengine/editors/sound/commands/selectPatternAtCursorPosition', 'Select Pattern At Cursor Position'),
        category: nls.localize('vuengine/editors/sound/commands/category', 'Sound Editor'),
        keybinding: 'enter',
    };
    export const REMOVE_CURRENT_NOTE: EditorCommand = {
        id: 'editors.soundEditor.removeCurrentNote',
        label: nls.localize('vuengine/editors/sound/commands/removeCurrentNote', 'Remove Current Note'),
        category: nls.localize('vuengine/editors/sound/commands/category', 'Sound Editor'),
        keybinding: 'del',
    };
    export const TOGGLE_NOTE_SNAPPING: EditorCommand = {
        id: 'editors.soundEditor.toggleNoteSnapping',
        label: nls.localize('vuengine/editors/sound/commands/toggleNoteSnapping', 'Toggle Note Snapping'),
        category: nls.localize('vuengine/editors/sound/commands/category', 'Sound Editor'),
        keybinding: 'd',
    };
    export const TOGGLE_EVENT_LIST_VISIBILITY: EditorCommand = {
        id: 'editors.soundEditor.toggleEventListVisibility',
        label: nls.localize('vuengine/editors/sound/commands/toggleEventListVisibility', 'Toggle Event List Visibility'),
        category: nls.localize('vuengine/editors/sound/commands/category', 'Sound Editor'),
        keybinding: 'a',
    };
    export const TOGGLE_SEQUENCER_VISIBILITY: EditorCommand = {
        id: 'editors.soundEditor.toggleSequencerVisibility',
        label: nls.localize('vuengine/editors/sound/commands/toggleSequencerVisibility', 'Toggle Sequencer Visibility'),
        category: nls.localize('vuengine/editors/sound/commands/category', 'Sound Editor'),
        keybinding: 's',
    };
    export const TOGGLE_EFFECTS_VISIBILITY: EditorCommand = {
        id: 'editors.soundEditor.toggleEffectsVisibility',
        label: nls.localize('vuengine/editors/sound/commands/toggleEffectsVisibility', 'Toggle Effects Visibility'),
        category: nls.localize('vuengine/editors/sound/commands/category', 'Sound Editor'),
        keybinding: 'y',
    };
};
