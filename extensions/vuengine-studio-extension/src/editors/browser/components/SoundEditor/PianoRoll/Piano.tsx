import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';
import { NOTE_PLAY_STOP_DELAY, NOTES_LABELS } from '../SoundEditorTypes';
import PianoRollKey from './PianoRollKey';

const StyledPiano = styled.div`
    background-color: #eee;
    border-left: 1px solid rgba(255, 255, 255, .6); 
    border-right: 1px solid rgba(255, 255, 255, .6); 
    display: flex;
    flex-direction: column;
    left: 0;
    position: sticky;
    z-index: 150;

    body.theia-light &,
    body.theia-hc & {
        border-color: rgba(0, 0, 0, .6); 
    }
`;

interface PianoProps {
    playNote: (note: string, instrumentId?: string) => void
    pianoRollNoteHeight: number
}

export default function Piano(props: PianoProps): React.JSX.Element {
    const { playNote, pianoRollNoteHeight } = props;
    const playNoteRef = useRef(playNote);
    playNoteRef.current = playNote;

    // a key's note stops wherever the mouse button gets released, not only on the key
    const stopNote = useRef(() => setTimeout(() => playNoteRef.current(''), NOTE_PLAY_STOP_DELAY)).current;
    const playKeyNote = (note: string) => {
        playNote(note);
        // the same listener is only added once, however many keys get played while the button is held
        document.addEventListener('mouseup', stopNote, { once: true });
    };

    useEffect(() => () => document.removeEventListener('mouseup', stopNote), []);

    return <StyledPiano>
        {NOTES_LABELS.map((note, index) =>
            <PianoRollKey
                key={index}
                noteId={index}
                note={note}
                playNote={playKeyNote}
                pianoRollNoteHeight={pianoRollNoteHeight}
            />
        )}
    </StyledPiano>;
};
