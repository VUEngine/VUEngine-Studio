import React, { Dispatch, memo, SetStateAction } from 'react';
import { MusicEditorTool } from '../MusicEditorTypes';
import PianoRollKey from './PianoRollKey';
import PianoRollNote from './PianoRollNote';
import { StyledPianoRollRow } from './StyledComponents';

interface PianoRollRowProps {
    note: string
    noteId: number
    currentChannelId: number
    currentPatternId: number
    setCurrentNote: (note: number) => void
    channelsNotes: { [noteId: string]: number[] }[]
    setNote: (index: number, note: number | undefined) => void
    playNote: (note: number) => void
    tool: MusicEditorTool
    patternSize: number
    notes: (number | undefined)[]
    lastSetNoteId: number
    setLastSetNoteId: Dispatch<SetStateAction<number>>
    noteResolution: number
    bar: string
}

export default memo(function PianoRollRow(props: PianoRollRowProps): React.JSX.Element {
    const {
        note,
        noteId,
        currentChannelId,
        channelsNotes,
        setCurrentNote,
        playNote,
        setNote,
        tool,
        patternSize,
        notes,
    } = props;

    const noteIdStr = noteId.toString();

    return <StyledPianoRollRow>
        <PianoRollKey
            noteId={noteId}
            note={note}
            playNote={playNote}
        />
        {[...Array(patternSize)].map((x, lineIndex) => {
            const channelsIndex = Object.keys(channelsNotes[lineIndex] ?? {}).find(key => key === noteIdStr);
            const channelNotes = channelsIndex ? channelsNotes[lineIndex][channelsIndex] : [];
            return (
                <PianoRollNote
                    key={lineIndex}
                    index={lineIndex}
                    noteId={noteId}
                    set={notes[lineIndex] === noteId}
                    currentChannelId={currentChannelId}
                    channelNotes={channelNotes}
                    setCurrentNote={setCurrentNote}
                    playNote={playNote}
                    setNote={setNote}
                    tool={tool}
                />);
        })}
    </StyledPianoRollRow>;
}, (oldProps, newProps) => {
    const propsAreEqual =
        oldProps.tool === newProps.tool &&
        oldProps.currentChannelId === newProps.currentChannelId &&
        oldProps.currentPatternId === newProps.currentPatternId &&
        oldProps.bar === newProps.bar &&
        oldProps.noteResolution === newProps.noteResolution &&
        JSON.stringify(oldProps.notes) === JSON.stringify(newProps.notes);
    /*
    newProps.notes[newProps.lastSetNoteId] !== newProps.noteId &&
    oldProps.notes[newProps.lastSetNoteId] !== newProps.noteId;

    // reset last set note id after every check, to not re-render on unrelated changes
    newProps.setLastSetNoteId(-1);
    */

    return propsAreEqual;
});
