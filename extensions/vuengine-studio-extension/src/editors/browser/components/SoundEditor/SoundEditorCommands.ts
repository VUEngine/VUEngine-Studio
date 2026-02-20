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
    export const TOOL_EDIT: EditorCommand = {
        id: 'editors.soundEditor.toolEdit',
        label: nls.localize('vuengine/editors/sound/commands/toolEdit', 'Tool: Edit'),
        category: nls.localize('vuengine/editors/sound/commands/category', 'Sound Editor'),
        keybinding: 'b',
    };
    export const TOOL_ERASER: EditorCommand = {
        id: 'editors.soundEditor.toolEraser',
        label: nls.localize('vuengine/editors/sound/commands/toolEraser', 'Tool: Eraser'),
        category: nls.localize('vuengine/editors/sound/commands/category', 'Sound Editor'),
        keybinding: 'e',
    };
    export const TOOL_DRAG: EditorCommand = {
        id: 'editors.soundEditor.toolDrag',
        label: nls.localize('vuengine/editors/sound/commands/toolDrag', 'Tool: Drag'),
        category: nls.localize('vuengine/editors/sound/commands/category', 'Sound Editor'),
        keybinding: 'g',
    };
    export const TOOL_MARQUEE: EditorCommand = {
        id: 'editors.soundEditor.toolMarquee',
        label: nls.localize('vuengine/editors/sound/commands/toolMarquee', 'Tool: Marquee'),
        category: nls.localize('vuengine/editors/sound/commands/category', 'Sound Editor'),
        keybinding: 'm',
    };
    export const TOOL_MARQUEE_MODE_REPLACE: EditorCommand = {
        id: 'editors.soundEditor.toolMarqueeModeReplace',
        label: nls.localize('vuengine/editors/sound/commands/toolMarqueeModeReplace', 'Marquee Mode: Replace Selection'),
        category: nls.localize('vuengine/editors/sound/commands/category', 'Sound Editor'),
        keybinding: 'j',
    };
    export const TOOL_MARQUEE_MODE_ADD: EditorCommand = {
        id: 'editors.soundEditor.toolMarqueeModeAdd',
        label: nls.localize('vuengine/editors/sound/commands/toolMarqueeModeAdd', 'Marquee Mode: Add To Selection'),
        category: nls.localize('vuengine/editors/sound/commands/category', 'Sound Editor'),
        keybinding: 'k',
    };
    export const TOOL_MARQUEE_MODE_SUBTRACT: EditorCommand = {
        id: 'editors.soundEditor.toolMarqueeModeSubtract',
        label: nls.localize('vuengine/editors/sound/commands/toolMarqueeModeSubtract', 'Marquee Mode: Subtract From Selection'),
        category: nls.localize('vuengine/editors/sound/commands/category', 'Sound Editor'),
        keybinding: 'l',
    };
    export const ADD_TRACK: EditorCommand = {
        id: 'editors.soundEditor.addTrack',
        label: nls.localize('vuengine/editors/sound/commands/addTrack', 'Add Track'),
        category: nls.localize('vuengine/editors/sound/commands/category', 'Sound Editor'),
    };
    export const SELECT_TRACK_1: EditorCommand = {
        id: 'editors.soundEditor.selectTrack1',
        label: nls.localize('vuengine/editors/sound/commands/selectTrack1', 'Select Track 1'),
        category: nls.localize('vuengine/editors/sound/commands/category', 'Sound Editor'),
        keybinding: 'shift+1',
    };
    export const SELECT_TRACK_2: EditorCommand = {
        id: 'editors.soundEditor.selectTrack2',
        label: nls.localize('vuengine/editors/sound/commands/selectTrack2', 'Select Track 2'),
        category: nls.localize('vuengine/editors/sound/commands/category', 'Sound Editor'),
        keybinding: 'shift+2',
    };
    export const SELECT_TRACK_3: EditorCommand = {
        id: 'editors.soundEditor.selectTrack3',
        label: nls.localize('vuengine/editors/sound/commands/selectTrack3', 'Select Track 3'),
        category: nls.localize('vuengine/editors/sound/commands/category', 'Sound Editor'),
        keybinding: 'shift+3',
    };
    export const SELECT_TRACK_4: EditorCommand = {
        id: 'editors.soundEditor.selectTrack4',
        label: nls.localize('vuengine/editors/sound/commands/selectTrack4', 'Select Track 4'),
        category: nls.localize('vuengine/editors/sound/commands/category', 'Sound Editor'),
        keybinding: 'shift+4',
    };
    export const SELECT_TRACK_5: EditorCommand = {
        id: 'editors.soundEditor.selectTrack5',
        label: nls.localize('vuengine/editors/sound/commands/selectTrack5', 'Select Track 5'),
        category: nls.localize('vuengine/editors/sound/commands/category', 'Sound Editor'),
        keybinding: 'shift+5',
    };
    export const SELECT_TRACK_6: EditorCommand = {
        id: 'editors.soundEditor.selectTrack6',
        label: nls.localize('vuengine/editors/sound/commands/selectTrack6', 'Select Track 6'),
        category: nls.localize('vuengine/editors/sound/commands/category', 'Sound Editor'),
        keybinding: 'shift+6',
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
    export const SELECT_NEXT_PATTERN: EditorCommand = {
        id: 'editors.soundEditor.nextPattern',
        label: nls.localize('vuengine/editors/sound/commands/nextPattern', 'Select Next Pattern'),
        category: nls.localize('vuengine/editors/sound/commands/category', 'Sound Editor'),
        keybinding: 'shift+right',
    };
    export const SELECT_PREVIOUS_PATTERN: EditorCommand = {
        id: 'editors.soundEditor.previousPattern',
        label: nls.localize('vuengine/editors/sound/commands/previousPattern', 'Select Previous Pattern'),
        category: nls.localize('vuengine/editors/sound/commands/category', 'Sound Editor'),
        keybinding: 'shift+left',
    };
    export const ADD_PATTERN: EditorCommand = {
        id: 'editors.soundEditor.addPattern',
        label: nls.localize('vuengine/editors/sound/commands/addPattern', 'Add Pattern To Current Track'),
        category: nls.localize('vuengine/editors/sound/commands/category', 'Sound Editor'),
        keybinding: ['shift+add', 'shift+plus'],
    };
    export const SEQUENCER_VERTICAL_SCALE_REDUCE: EditorCommand = {
        id: 'editors.soundEditor.sequencerVerticalScaleReduce',
        label: nls.localize('vuengine/editors/sound/commands/sequencerVerticalScaleReduce', 'Reduce Vertical Scale'),
        category: nls.localize('vuengine/editors/sound/commands/category', 'Sound Editor Sequencer')
    };
    export const SEQUENCER_VERTICAL_SCALE_INCREASE: EditorCommand = {
        id: 'editors.soundEditor.sequencerVerticalScaleIncrease',
        label: nls.localize('vuengine/editors/sound/commands/sequencerVerticalScaleIncrease', 'Increase Vertical Scale'),
        category: nls.localize('vuengine/editors/sound/commands/category', 'Sound Editor Sequencer')
    };
    export const SEQUENCER_VERTICAL_SCALE_RESET: EditorCommand = {
        id: 'editors.soundEditor.sequencerVerticalScaleReset',
        label: nls.localize('vuengine/editors/sound/commands/sequencerVerticalScaleReset', 'Reset Vertical Scale'),
        category: nls.localize('vuengine/editors/sound/commands/category', 'Sound Editor Sequencer')
    };
    export const SEQUENCER_HORIZONTAL_SCALE_REDUCE: EditorCommand = {
        id: 'editors.soundEditor.sequencerHorizontalScaleReduce',
        label: nls.localize('vuengine/editors/sound/commands/sequencerHorizontalScaleReduce', 'Reduce Horizontal Scale'),
        category: nls.localize('vuengine/editors/sound/commands/category', 'Sound Editor Sequencer')
    };
    export const SEQUENCER_HORIZONTAL_SCALE_INCREASE: EditorCommand = {
        id: 'editors.soundEditor.sequencerHorizontalScaleIncrease',
        label: nls.localize('vuengine/editors/sound/commands/sequencerHorizontalScaleIncrease', 'Increase Horizontal Scale'),
        category: nls.localize('vuengine/editors/sound/commands/category', 'Sound Editor Sequencer')
    };
    export const SEQUENCER_HORIZONTAL_SCALE_RESET: EditorCommand = {
        id: 'editors.soundEditor.sequencerHorizontalScaleReset',
        label: nls.localize('vuengine/editors/sound/commands/sequencerHorizontalScaleReset', 'Reset Horizontal Scale'),
        category: nls.localize('vuengine/editors/sound/commands/category', 'Sound Editor Sequencer')
    };
    export const PIANO_ROLL_SELECT_NEXT_STEP: EditorCommand = {
        id: 'editors.soundEditor.pianoRollSelectNextStep',
        label: nls.localize('vuengine/editors/sound/commands/pianoRollSelectNextStep', 'Select Next Step'),
        category: nls.localize('vuengine/editors/sound/commands/category', 'Sound Editor'),
        keybinding: 'right',
    };
    export const PIANO_ROLL_SELECT_PREVIOUS_STEP: EditorCommand = {
        id: 'editors.soundEditor.pianoRollSelectPreviousStep',
        label: nls.localize('vuengine/editors/sound/commands/pianoRollSelectPreviousStep', 'Select Previous Step'),
        category: nls.localize('vuengine/editors/sound/commands/category', 'Sound Editor'),
        keybinding: 'left',
    };
    export const PIANO_ROLL_SELECT_NEXT_NOTE: EditorCommand = {
        id: 'editors.soundEditor.pianoRollSelectNextNote',
        label: nls.localize('vuengine/editors/sound/commands/pianoRollSelectNextNote', 'Select Next Note'),
        category: nls.localize('vuengine/editors/sound/commands/category', 'Sound Editor'),
        keybinding: 'down',
    };
    export const PIANO_ROLL_SELECT_PREVIOUS_NOTE: EditorCommand = {
        id: 'editors.soundEditor.pianoRollSelectPreviousNote',
        label: nls.localize('vuengine/editors/sound/commands/pianoRollSelectPreviousNote', 'Select Previous Note'),
        category: nls.localize('vuengine/editors/sound/commands/category', 'Sound Editor'),
        keybinding: 'up',
    };
    export const PIANO_ROLL_VERTICAL_SCALE_REDUCE: EditorCommand = {
        id: 'editors.soundEditor.pianoRollVerticalScaleReduce',
        label: nls.localize('vuengine/editors/sound/commands/pianoRollVerticalScaleReduce', 'Reduce Vertical Scale'),
        category: nls.localize('vuengine/editors/sound/commands/category', 'Sound Editor Piano Roll')
    };
    export const PIANO_ROLL_VERTICAL_SCALE_INCREASE: EditorCommand = {
        id: 'editors.soundEditor.pianoRollVerticalScaleIncrease',
        label: nls.localize('vuengine/editors/sound/commands/pianoRollVerticalScaleIncrease', 'Increase Vertical Scale'),
        category: nls.localize('vuengine/editors/sound/commands/category', 'Sound Editor Piano Roll')
    };
    export const PIANO_ROLL_VERTICAL_SCALE_RESET: EditorCommand = {
        id: 'editors.soundEditor.pianoRollVerticalScaleReset',
        label: nls.localize('vuengine/editors/sound/commands/pianoRollVerticalScaleReset', 'Reset Vertical Scale'),
        category: nls.localize('vuengine/editors/sound/commands/category', 'Sound Editor Piano Roll')
    };
    export const PIANO_ROLL_HORIZONTAL_SCALE_REDUCE: EditorCommand = {
        id: 'editors.soundEditor.pianoRollHorizontalScaleReduce',
        label: nls.localize('vuengine/editors/sound/commands/pianoRollHorizontalScaleReduce', 'Reduce Horizontal Scale'),
        category: nls.localize('vuengine/editors/sound/commands/category', 'Sound Editor Piano Roll')
    };
    export const PIANO_ROLL_HORIZONTAL_SCALE_INCREASE: EditorCommand = {
        id: 'editors.soundEditor.pianoRollHorizontalScaleIncrease',
        label: nls.localize('vuengine/editors/sound/commands/pianoRollHorizontalScaleIncrease', 'Increase Horizontal Scale'),
        category: nls.localize('vuengine/editors/sound/commands/category', 'Sound Editor Piano Roll')
    };
    export const PIANO_ROLL_HORIZONTAL_SCALE_RESET: EditorCommand = {
        id: 'editors.soundEditor.pianoRollHorizontalScaleReset',
        label: nls.localize('vuengine/editors/sound/commands/pianoRollHorizontalScaleReset', 'Reset Horizontal Scale'),
        category: nls.localize('vuengine/editors/sound/commands/category', 'Sound Editor Piano Roll')
    };
    export const NOTES_UP: EditorCommand = {
        id: 'editors.soundEditor.notesUp',
        label: nls.localize('vuengine/editors/sound/commands/notesUp', 'Move Selected Note Up'),
        category: nls.localize('vuengine/editors/sound/commands/category', 'Sound Editor'),
        keybinding: 'ctrlcmd+up',
    };
    export const NOTES_DOWN: EditorCommand = {
        id: 'editors.soundEditor.notesDown',
        label: nls.localize('vuengine/editors/sound/commands/notesDown', 'Move Selected Note Down'),
        category: nls.localize('vuengine/editors/sound/commands/category', 'Sound Editor'),
        keybinding: 'ctrlcmd+down',
    };
    export const NOTES_UP_AN_OCTAVE: EditorCommand = {
        id: 'editors.soundEditor.notesUpAnOctave',
        label: nls.localize('vuengine/editors/sound/commands/notesUpAnOctave', 'Move Selected Notes Up 1 Octave'),
        category: nls.localize('vuengine/editors/sound/commands/category', 'Sound Editor'),
        keybinding: 'ctrlcmd+shift+up',
    };
    export const NOTES_DOWN_AN_OCTAVE: EditorCommand = {
        id: 'editors.soundEditor.notesDownAnOctave',
        label: nls.localize('vuengine/editors/sound/commands/notesDownAnOctave', 'Move Selected Notes Down 1 Octave'),
        category: nls.localize('vuengine/editors/sound/commands/category', 'Sound Editor'),
        keybinding: 'ctrlcmd+shift+down',
    };
    export const SELECT_AT_CURSOR_POSITION: EditorCommand = {
        id: 'editors.soundEditor.selectAtCursorPosition',
        label: nls.localize('vuengine/editors/sound/commands/selectAtCursorPosition', 'Select Note At Cursor Position'),
        category: nls.localize('vuengine/editors/sound/commands/category', 'Sound Editor'),
        keybinding: 'enter',
    };
    export const ADD_AT_CURSOR_POSITION: EditorCommand = {
        id: 'editors.soundEditor.addAtCursorPosition',
        label: nls.localize('vuengine/editors/sound/commands/addAtCursorPosition', 'Add Note At Cursor Position To Selection'),
        category: nls.localize('vuengine/editors/sound/commands/category', 'Sound Editor'),
        keybinding: 'ctrlcmd+enter',
    };
    export const REMOVE_SELECTED_NOTES_OR_PATTERNS: EditorCommand = {
        id: 'editors.soundEditor.removeSelectedNotesOrPatterns',
        label: nls.localize('vuengine/editors/sound/commands/removeSelectedNotesOrPatterns', 'Remove Selected Notes/Patterns'),
        category: nls.localize('vuengine/editors/sound/commands/category', 'Sound Editor'),
        keybinding: ['backspace', 'delete'],
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
        keybinding: 'w',
    };
    export const TOGGLE_EFFECTS_PANEL_VISIBILITY: EditorCommand = {
        id: 'editors.soundEditor.toggleEffectsPanelVisibility',
        label: nls.localize('vuengine/editors/sound/commands/toggleEffectsPanelVisibility', 'Toggle Effects Panel Visibility'),
        category: nls.localize('vuengine/editors/sound/commands/category', 'Sound Editor'),
        keybinding: 'f',
    };
    export const TOGGLE_SIDEBAR_VISIBILITY: EditorCommand = {
        id: 'editors.soundEditor.toggleSidebarVisibility',
        label: nls.localize('vuengine/editors/sound/commands/toggleSidebarVisibility', 'Toggle Sidebar Visibility'),
        category: nls.localize('vuengine/editors/sound/commands/category', 'Sound Editor'),
        keybinding: 's',
    };
    export const OPEN_INSTRUMENT_EDITOR: EditorCommand = {
        id: 'editors.soundEditor.openInstrumentEditor',
        label: nls.localize('vuengine/editors/sound/commands/openInstrumentEditor', 'Open Instrument Editor'),
        category: nls.localize('vuengine/editors/sound/commands/category', 'Sound Editor'),
        keybinding: 'i',
    };
    export const TRANSPOSE: EditorCommand = {
        id: 'editors.soundEditor.transpose',
        label: nls.localize('vuengine/editors/sound/commands/transpose', 'Transpose'),
        category: nls.localize('vuengine/editors/sound/commands/category', 'Sound Editor'),
        keybinding: 't',
    };
    export const REMOVE_UNUSED_PATTERNS: EditorCommand = {
        id: 'editors.soundEditor.removeUnusedPatterns',
        label: nls.localize('vuengine/editors/sound/commands/removeUnusedPatterns', 'Remove Unused Patterns'),
        category: nls.localize('vuengine/editors/sound/commands/category', 'Sound Editor'),
    };
    export const REMOVE_UNUSED_INSTRUMENTS: EditorCommand = {
        id: 'editors.soundEditor.removeUnusedInstruments',
        label: nls.localize('vuengine/editors/sound/commands/removeUnusedInstruments', 'Remove Unused Instruments'),
        category: nls.localize('vuengine/editors/sound/commands/category', 'Sound Editor'),
    };
    export const CLEAN_DUPLICATE_PATTERNS: EditorCommand = {
        id: 'editors.soundEditor.cleanDuplicatePatterns',
        label: nls.localize('vuengine/editors/sound/commands/cleanDuplicatePatterns', 'Clean Duplicate Patterns'),
        category: nls.localize('vuengine/editors/sound/commands/category', 'Sound Editor'),
    };
    export const IMPORT: EditorCommand = {
        id: 'editors.soundEditor.import',
        label: nls.localize('vuengine/editors/sound/commands/import', 'Import'),
        category: nls.localize('vuengine/editors/sound/commands/category', 'Sound Editor'),
    };
    export const EXPORT: EditorCommand = {
        id: 'editors.soundEditor.export',
        label: nls.localize('vuengine/editors/sound/commands/export', 'Export'),
        category: nls.localize('vuengine/editors/sound/commands/category', 'Sound Editor'),
    };
    export const SELECT_ALL_NOTES: EditorCommand = {
        id: 'editors.soundEditor.selectAllNotes',
        label: nls.localize('vuengine/editors/sound/commands/selectAllNotes', 'Select All Notes (In Current Pattern)'),
        category: nls.localize('vuengine/editors/sound/commands/category', 'Sound Editor'),
        keybinding: 'ctrlcmd+a',
    };
    export const COPY_SELECTED_NOTES: EditorCommand = {
        id: 'editors.soundEditor.copySelectedNotes',
        label: nls.localize('vuengine/editors/sound/commands/copySelectedNotes', 'Copy Selected Notes'),
        category: nls.localize('vuengine/editors/sound/commands/category', 'Sound Editor'),
        keybinding: 'ctrlcmd+c',
    };
    export const CUT_SELECTED_NOTES: EditorCommand = {
        id: 'editors.soundEditor.cutSelectedNotes',
        label: nls.localize('vuengine/editors/sound/commands/cutSelectedNotes', 'Cut Selected Notes'),
        category: nls.localize('vuengine/editors/sound/commands/category', 'Sound Editor'),
        keybinding: 'ctrlcmd+x',
    };
    export const PASTE_SELECTED_NOTES: EditorCommand = {
        id: 'editors.soundEditor.pasteSelectedNotes',
        label: nls.localize('vuengine/editors/sound/commands/pasteSelectedNotes', 'Paste Selected Notes'),
        category: nls.localize('vuengine/editors/sound/commands/category', 'Sound Editor'),
        keybinding: 'ctrlcmd+v',
    };
    export const SET_NOTE_LENGTH_1: EditorCommand = {
        id: 'editors.soundEditor.setNoteLength1',
        label: nls.localize('vuengine/editors/sound/commands/setNoteLength1', 'Set Note Length: 1'),
        category: nls.localize('vuengine/editors/sound/commands/category', 'Sound Editor'),
        keybinding: '1',
    };
    export const SET_NOTE_LENGTH_2: EditorCommand = {
        id: 'editors.soundEditor.setNoteLength2',
        label: nls.localize('vuengine/editors/sound/commands/setNoteLength2', 'Set Note Length: 1/2'),
        category: nls.localize('vuengine/editors/sound/commands/category', 'Sound Editor'),
        keybinding: '2',
    };
    export const SET_NOTE_LENGTH_4: EditorCommand = {
        id: 'editors.soundEditor.setNoteLength4',
        label: nls.localize('vuengine/editors/sound/commands/setNoteLength4', 'Set Note Length: 1/4'),
        category: nls.localize('vuengine/editors/sound/commands/category', 'Sound Editor'),
        keybinding: '4',
    };
    export const SET_NOTE_LENGTH_8: EditorCommand = {
        id: 'editors.soundEditor.setNoteLength8',
        label: nls.localize('vuengine/editors/sound/commands/setNoteLength8', 'Set Note Length: 1/8'),
        category: nls.localize('vuengine/editors/sound/commands/category', 'Sound Editor'),
        keybinding: '8',
    };
    export const SET_NOTE_LENGTH_16: EditorCommand = {
        id: 'editors.soundEditor.setNoteLength16',
        label: nls.localize('vuengine/editors/sound/commands/setNoteLength16', 'Set Note Length: 1/16'),
        category: nls.localize('vuengine/editors/sound/commands/category', 'Sound Editor'),
        keybinding: ['0', '6'],
    };
};
