import { nls } from '@theia/core';
import { EditorCommand } from '../../ves-editors-types';

export namespace SoundEditorCommands {
    export const ADD_CHANNEL: EditorCommand = {
        id: 'editors.soundEditor.addChannel',
        label: nls.localize('vuengine/editors/sound/commands/addChannel', 'Add Channel'),
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
        label: nls.localize('vuengine/editors/sound/commands/selectChannel3', 'Select Channel 3'),
        category: nls.localize('vuengine/editors/sound/commands/category', 'Sound Editor'),
        keybinding: '3',
    };
    export const SELECT_CHANNEL_4: EditorCommand = {
        id: 'editors.soundEditor.selectChannel4',
        label: nls.localize('vuengine/editors/sound/commands/selectChannel4', 'Select Channel 4'),
        category: nls.localize('vuengine/editors/sound/commands/category', 'Sound Editor'),
        keybinding: '4',
    };
    export const SELECT_CHANNEL_5: EditorCommand = {
        id: 'editors.soundEditor.selectChannel5',
        label: nls.localize('vuengine/editors/sound/commands/selectChannel5', 'Select Channel 5'),
        category: nls.localize('vuengine/editors/sound/commands/category', 'Sound Editor'),
        keybinding: '5',
    };
    export const SELECT_CHANNEL_6: EditorCommand = {
        id: 'editors.soundEditor.selectChannel6',
        label: nls.localize('vuengine/editors/sound/commands/selectChannel6', 'Select Channel 6'),
        category: nls.localize('vuengine/editors/sound/commands/category', 'Sound Editor'),
        keybinding: '6',
    };
    export const SELECT_NEXT_CHANNEL: EditorCommand = {
        id: 'editors.soundEditor.nextChannel',
        label: nls.localize('vuengine/editors/sound/commands/nextChannel', 'Select Next Channel'),
        category: nls.localize('vuengine/editors/sound/commands/category', 'Sound Editor'),
        keybinding: 'shift+down',
    };
    export const SELECT_PREVIOUS_CHANNEL: EditorCommand = {
        id: 'editors.soundEditor.previousChannel',
        label: nls.localize('vuengine/editors/sound/commands/previousChannel', 'Select Previous Channel'),
        category: nls.localize('vuengine/editors/sound/commands/category', 'Sound Editor'),
        keybinding: 'shift+up',
    };
    export const SHOW_SEQUENCER_VIEW: EditorCommand = {
        id: 'editors.soundEditor.showSequencerView',
        label: nls.localize('vuengine/editors/sound/commands/showSequencerView', 'Show Sequencer View'),
        category: nls.localize('vuengine/editors/sound/commands/category', 'Sound Editor'),
        keybinding: '7',
    };
    export const SHOW_INSTRUMENTS_VIEW: EditorCommand = {
        id: 'editors.soundEditor.showInstrumentsView',
        label: nls.localize('vuengine/editors/sound/commands/showInstrumentsView', 'Show Instruments View'),
        category: nls.localize('vuengine/editors/sound/commands/category', 'Sound Editor'),
        keybinding: '8',
    };
    export const SHOW_SETTINGS_VIEW: EditorCommand = {
        id: 'editors.soundEditor.showSettingsView',
        label: nls.localize('vuengine/editors/sound/commands/showSettingsView', 'Show Settings View'),
        category: nls.localize('vuengine/editors/sound/commands/category', 'Sound Editor'),
        keybinding: '9',
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
    export const PIANO_ROLL_NOTE_UP: EditorCommand = {
        id: 'editors.soundEditor.pianoRollNoteUp',
        label: nls.localize('vuengine/editors/sound/commands/pianoRollNoteUp', 'Piano Roll: Move Note Up'),
        category: nls.localize('vuengine/editors/sound/commands/category', 'Sound Editor'),
        keybinding: 'up',
    };
    export const PIANO_ROLL_NOTE_DOWN: EditorCommand = {
        id: 'editors.soundEditor.pianoRollNoteDown',
        label: nls.localize('vuengine/editors/sound/commands/pianoRollNoteDown', 'Piano Roll: Move Note Down'),
        category: nls.localize('vuengine/editors/sound/commands/category', 'Sound Editor'),
        keybinding: 'down',
    };
    export const PIANO_ROLL_NOTE_UP_AN_OCTAVE: EditorCommand = {
        id: 'editors.soundEditor.pianoRollNoteUpAnOctave',
        label: nls.localize('vuengine/editors/sound/commands/pianoRollNoteUpAnOctave', 'Piano Roll: Move Note Up 1 Octave'),
        category: nls.localize('vuengine/editors/sound/commands/category', 'Sound Editor'),
        keybinding: 'shift+up',
    };
    export const PIANO_ROLL_NOTE_DOWN_AN_OCTAVE: EditorCommand = {
        id: 'editors.soundEditor.pianoRollNoteDownAnOctave',
        label: nls.localize('vuengine/editors/sound/commands/pianoRollNoteDownAnOctave', 'Piano Roll: Move Note Down 1 Octave'),
        category: nls.localize('vuengine/editors/sound/commands/category', 'Sound Editor'),
        keybinding: 'shift+down',
    };
    export const REMOVE_CURRENT_NOTE: EditorCommand = {
        id: 'editors.soundEditor.removeCurrentNote',
        label: nls.localize('vuengine/editors/sound/commands/removeCurrentNote', 'Remove Current Note'),
        category: nls.localize('vuengine/editors/sound/commands/category', 'Sound Editor'),
        keybinding: 'del',
    };
    export const TOGGLE_SEQUENCER_VISIBILITY: EditorCommand = {
        id: 'editors.soundEditor.toggleSequencerVisibility',
        label: nls.localize('vuengine/editors/sound/commands/toggleSequencerVisibility', 'Toggle Sequencer Visibility'),
        category: nls.localize('vuengine/editors/sound/commands/category', 'Sound Editor'),
        keybinding: 'a',
    };
    export const TOGGLE_EFFECTS_VISIBILITY: EditorCommand = {
        id: 'editors.soundEditor.toggleEffectsVisibility',
        label: nls.localize('vuengine/editors/sound/commands/toggleEffectsVisibility', 'Toggle Effects Visibility'),
        category: nls.localize('vuengine/editors/sound/commands/category', 'Sound Editor'),
        keybinding: 'y',
    };
};
