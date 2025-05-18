import React from 'react';
import { NOTES } from '../SoundEditor/SoundEditorTypes';
import PianoKeys from './PianoKeys';

interface PianoProps {
    trackId: number
    setFrequency: (trackId: number, frequency: number) => void
    pianoRollNoteHeight: number
}

export default function Piano(props: PianoProps): React.JSX.Element {
    const { trackId, setFrequency, pianoRollNoteHeight } = props;

    return <div className="pianoRollEditor" style={{
        minWidth: 85,
        opacity: trackId === 0 ? .3 : 1,
        overflowY: 'auto',
        width: 85,
    }}>
        {Object.keys(NOTES).map((note, index) =>
            <PianoKeys
                key={`pianoroll-row-${index}`}
                note={note}
                noteId={index}
                trackId={trackId}
                setFrequency={setFrequency}
                pianoRollNoteHeight={pianoRollNoteHeight}
            />)}
    </div>;
}
