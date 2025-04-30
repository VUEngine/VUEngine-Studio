import React, { Dispatch, SetStateAction } from 'react';
import { SoundEditorTool } from '../SoundEditorTypes';
import PianoRollKey from './PianoRollKey';
import PianoRollNote from './PianoRollNote';
import { StyledPianoRollRow } from './StyledComponents';

interface PianoRollRowProps {
    note: string
    noteId: number
    currentPatternId: number
    setCurrentTick: (note: number) => void
    setNote: (index: number, note: number | undefined) => void
    playNote: (note: number) => void
    tool: SoundEditorTool
    patternSize: number
    lastSetNoteId: number
    setLastSetNoteId: Dispatch<SetStateAction<number>>
    bar: string
}

export default /* memo( */ function PianoRollRow(props: PianoRollRowProps): React.JSX.Element {
    const {
        note,
        noteId,
        setCurrentTick,
        playNote,
        setNote,
        tool,
        patternSize,
    } = props;

    return <StyledPianoRollRow>
        <PianoRollKey
            noteId={noteId}
            note={note}
            playNote={playNote}
        />
        {[...Array(patternSize)].map((x, colIndex) =>
            <PianoRollNote
                key={colIndex}
                index={colIndex}
                noteId={noteId}
                setCurrentTick={setCurrentTick}
                playNote={playNote}
                setNote={setNote}
                tool={tool}
            />
        )}
    </StyledPianoRollRow>;
}
/*
, (oldProps, newProps) => {
    const propsAreEqual =
        oldProps.tool === newProps.tool &&
        oldProps.currentChannelId === newProps.currentChannelId &&
        oldProps.currentPatternId === newProps.currentPatternId &&
        oldProps.bar === newProps.bar &&
        oldProps.noteResolution === newProps.noteResolution &&
        JSON.stringify(oldProps.events) === JSON.stringify(newProps.events);
    //    newProps.notes[newProps.lastSetNoteId] !== newProps.noteId &&
    //    oldProps.notes[newProps.lastSetNoteId] !== newProps.noteId;

    //    // reset last set note id after every check, to not re-render on unrelated changes
    //    newProps.setLastSetNoteId(-1);

    return propsAreEqual;
})
*/;
