import React from 'react';
import PianoRollKey from '../SoundEditor/PianoRoll/PianoRollKey';
import { NOTES } from '../SoundEditor/SoundEditorTypes';

interface PianoKeysProps {
    note: string
    noteId: number
    trackId: number
    setFrequency: (trackId: number, frequency: number) => void
    pianoRollNoteHeight: number
}

export default function PianoKeys(props: PianoKeysProps): React.JSX.Element {
    const { note, noteId, trackId, setFrequency, pianoRollNoteHeight } = props;

    return <div>
        <PianoRollKey
            noteId={noteId}
            note={note}
            playNote={() => setFrequency(trackId - 1, NOTES[note])}
            pianoRollNoteHeight={pianoRollNoteHeight}
        />
    </div>;
}
