import React from 'react';
import PianoRollKey from '../MusicEditor/PianoRoll/PianoRollKey';
import { NOTES } from '../MusicEditor/MusicEditorTypes';

interface PianoKeysProps {
    note: string
    noteId: number
    channel: number
    setFrequency: (channel: number, frequency: number) => void
}

export default function PianoKeys(props: PianoKeysProps): React.JSX.Element {
    const { note, noteId, channel, setFrequency } = props;

    return <div>
        <PianoRollKey
            noteId={noteId}
            note={note}
            playNote={() => setFrequency(channel - 1, NOTES[note])}
        />
    </div>;
}
