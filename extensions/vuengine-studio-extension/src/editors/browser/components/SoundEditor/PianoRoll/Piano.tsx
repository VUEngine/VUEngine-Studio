import React from 'react';
import PianoRollKey from './PianoRollKey';
import { NOTES } from '../SoundEditorTypes';
import { StyledPiano } from './StyledComponents';

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
