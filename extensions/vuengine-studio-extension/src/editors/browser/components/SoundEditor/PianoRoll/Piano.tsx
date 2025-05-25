import React from 'react';
import styled from 'styled-components';
import { NOTES_LABELS, ScrollWindow } from '../SoundEditorTypes';
import PianoRollKey from './PianoRollKey';

// TODO: also add '.scrolled' behavior to sequencer track headers
const StyledPiano = styled.div`
    border-left: 1px solid rgba(255, 255, 255, .6); 
    border-right: 1px solid rgba(255, 255, 255, .6); 
    display: flex;
    flex-direction: column;
    left: 0;
    position: sticky;
    z-index: 100;

    body.theia-light &,
    body.theia-hc & {
        border-color: rgba(0, 0, 0, .6); 
    }

    &.scrolled {
        box-shadow: 0px 0 10px rgba(0, 0, 0, .3);
    }
`;

interface PianoProps {
    playNote: (note: number) => void
    pianoRollNoteHeight: number
    pianoRollScrollWindow: ScrollWindow
}

export default function Piano(props: PianoProps): React.JSX.Element {
    const { playNote, pianoRollNoteHeight, pianoRollScrollWindow } = props;

    return <StyledPiano
        className={pianoRollScrollWindow.x > 0 ? 'scrolled' : undefined}
    >
        {NOTES_LABELS.map((note, index) =>
            <PianoRollKey
                key={index}
                noteId={index}
                note={note}
                playNote={playNote}
                pianoRollNoteHeight={pianoRollNoteHeight}
            />
        )}
    </StyledPiano>;
};
