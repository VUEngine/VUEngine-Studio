import React from 'react';
import styled from 'styled-components';
import { NOTES_LABELS } from '../SoundEditorTypes';
import PianoRollKey from './PianoRollKey';

// TODO: only show box-shadow if horizontal scroll position is > 0. Also add to sequencer track headers.
const StyledPiano = styled.div`
    border-right: 1px solid rgba(255, 255, 255, .6); 
    box-shadow: 0px 0 10px rgba(0, 0, 0, .3);
    display: flex;
    flex-direction: column;
    left: 0;
    position: sticky;
    z-index: 100;

    body.theia-light &,
    body.theia-hc & {
        border-right-color: rgba(0, 0, 0, .6); 
    }
`;

interface PianoProps {
    playNote: (note: number) => void
    pianoRollNoteHeight: number
}

export default function Piano(props: PianoProps): React.JSX.Element {
    const { playNote, pianoRollNoteHeight } = props;

    return <StyledPiano>
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
