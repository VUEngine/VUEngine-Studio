import React from 'react';
import { NOTES } from '../SoundEditor/SoundEditorTypes';
import PianoKeys from './PianoKeys';

interface PianoProps {
    channel: number
    setFrequency: (channel: number, frequency: number) => void
    pianoRollNoteHeight: number
}

export default function Piano(props: PianoProps): React.JSX.Element {
    const { channel, setFrequency, pianoRollNoteHeight } = props;

    return <div className="pianoRollEditor" style={{
        minWidth: 85,
        opacity: channel === 0 ? .3 : 1,
        overflowY: 'auto',
        width: 85,
    }}>
        {Object.keys(NOTES).map((note, index) =>
            <PianoKeys
                key={`pianoroll-row-${index}`}
                note={note}
                noteId={index}
                channel={channel}
                setFrequency={setFrequency}
                pianoRollNoteHeight={pianoRollNoteHeight}
            />)}
    </div>;
}
