import React from 'react';
import styled from 'styled-components';
import { NOTES } from '../SoundEditorTypes';
import PianoRollKey from './PianoRollKey';

const StyledPiano = styled.div`
    border-left: 1px solid rgba(0, 0, 0, .6);
    border-right: 1px solid rgba(0, 0, 0, .6);
    display: flex;
    flex-direction: column;
    left: 0;
    position: sticky;
    z-index: 100;
`;

interface PianoProps {
    playNote: (note: number) => void
}

export default function Piano(props: PianoProps): React.JSX.Element {
    const {
        playNote,
    } = props;

    return <StyledPiano>
        {Object.keys(NOTES).map((note, index) =>
            <PianoRollKey
                key={index}
                noteId={index}
                note={note}
                playNote={playNote}
            />
        )}
    </StyledPiano>;
};
